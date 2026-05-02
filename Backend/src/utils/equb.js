function addFrequency(dateValue, frequency, steps = 1) {
  const date = new Date(dateValue);

  if (frequency === "daily") {
    date.setDate(date.getDate() + steps);
    return date;
  }

  if (frequency === "weekly") {
    date.setDate(date.getDate() + (7 * steps));
    return date;
  }

  date.setMonth(date.getMonth() + steps);
  return date;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function buildRoundDueDate(group, roundNumber) {
  const startDate = group.start_date || new Date();
  const dueDate = addFrequency(startDate, group.frequency, Math.max(roundNumber - 1, 0));
  return formatDate(dueDate);
}

function buildTransactionReference(prefix = "TB") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

async function createNotification(
  conn,
  { userId, title, message, type = "system", relatedGroupId = null, relatedPaymentId = null }
) {
  await conn.query(
    `INSERT INTO notifications (user_id, title, message, type, related_group_id, related_payment_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, title, message, type, relatedGroupId, relatedPaymentId]
  );
}

async function createNotificationsForUsers(conn, userIds, payload) {
  if (!userIds.length) {
    return;
  }

  for (const userId of userIds) {
    await createNotification(conn, { ...payload, userId });
  }
}

async function getGroupById(conn, groupId) {
  const [rows] = await conn.query(
    `SELECT g.*,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
     FROM equb_groups g
     WHERE g.id = ?`,
    [groupId]
  );

  return rows[0] || null;
}

async function ensureCycleTotalRounds(conn, groupId) {
  const group = await getGroupById(conn, groupId);
  if (!group) {
    return null;
  }

  if (group.cycle_total_rounds) {
    return group;
  }

  await conn.query(
    `UPDATE equb_groups
     SET cycle_total_rounds = ?
     WHERE id = ?`,
    [group.member_count, groupId]
  );

  return getGroupById(conn, groupId);
}

async function getGroupMembers(conn, groupId) {
  const [rows] = await conn.query(
    `SELECT gm.*, u.full_name, u.email, u.phone, u.avatar_url
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?
     ORDER BY gm.payout_order ASC, gm.joined_at ASC`,
    [groupId]
  );

  return rows;
}

async function getCurrentRound(conn, groupId) {
  try {
    console.log('Getting current round for group:', groupId);
    
    const [rows] = await conn.query(
      `SELECT r.*, u.full_name AS winner_name
       FROM equb_rounds r
       LEFT JOIN users u ON u.id = r.winner_id
       WHERE r.group_id = ? AND r.status IN ('collecting', 'winner_selected')
       ORDER BY r.round_number DESC
       LIMIT 1`,
      [groupId]
    );

    console.log('Current round query result:', rows);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getCurrentRound:', error);
    throw error;
  }
}

async function getRoundById(conn, roundId) {
  const [rows] = await conn.query(
    `SELECT r.*, u.full_name AS winner_name
     FROM equb_rounds r
     LEFT JOIN users u ON u.id = r.winner_id
     WHERE r.id = ?`,
    [roundId]
  );

  return rows[0] || null;
}

async function createRound(conn, group, roundNumber) {
  const dueDate = buildRoundDueDate(group, roundNumber);

  const [result] = await conn.query(
    `INSERT INTO equb_rounds (group_id, round_number, due_date, status)
     VALUES (?, ?, ?, 'collecting')`,
    [group.id, roundNumber, dueDate]
  );

  const roundId = result.insertId;
  await ensureRoundPaymentsForMembers(conn, group, {
    roundId,
    roundNumber,
    dueDate,
  });

  return getRoundById(conn, roundId);
}

async function ensureCurrentRound(conn, groupId) {
  try {
    console.log('Ensuring current round for group:', groupId);
    
    let group = await getGroupById(conn, groupId);
    if (!group) {
      console.error('Group not found:', groupId);
      return null;
    }
    
    if (group.status !== "active" && group.status !== "open") {
      console.error('Group is not active or open:', group.status);
      return null;
    }

    console.log('Group status:', group.status);
    console.log('Current round number:', group.current_round_number);

    const round = await getCurrentRound(conn, groupId);
    if (!round) {
      console.log('No active round found, creating new round');
      const newRound = await createRound(conn, group, (group.current_round_number || 0) + 1);
      return newRound;
    }

    console.log('Current round found:', round);
    return round;
  } catch (error) {
    console.error('Error in ensureCurrentRound:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

async function ensureRoundPaymentsForMembers(
  conn,
  group,
  { roundId, roundNumber, dueDate, onlyUserId = null }
) {
  const members = await getGroupMembers(conn, group.id);

  for (const member of members) {
    if (onlyUserId && Number(member.user_id) !== Number(onlyUserId)) {
      continue;
    }

    const [existing] = await conn.query(
      `SELECT id
       FROM payments
       WHERE group_id = ? AND payer_id = ? AND round_id = ?
       LIMIT 1`,
      [group.id, member.user_id, roundId]
    );

    if (existing.length > 0) {
      continue;
    }

    await conn.query(
      `INSERT INTO payments (
        group_id,
        payer_id,
        round_id,
        round_number,
        amount,
        status,
        payment_method,
        due_date,
        simulation_status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, 'pending', 'telebirr', ?, 'initiated', NOW())`,
      [group.id, member.user_id, roundId, roundNumber, group.contribution_amount, dueDate]
    );
  }
}

async function getEligibleWinnerIds(conn, groupId) {
  try {
    console.log('Getting eligible winner IDs for group:', groupId);
    
    // Get all previous winners from this group
    const [previousWinners] = await conn.query(
      `SELECT DISTINCT winner_id FROM equb_rounds WHERE group_id = ? AND winner_id IS NOT NULL`,
      [groupId]
    );
    const previousWinnerIdsStr = previousWinners.map(r => String(r.winner_id));
    
    // Get all members who have paid for the current round
    // Try to use has_paid_current_round if column exists
    let rows;
    try {
      [rows] = await conn.query(
        `SELECT user_id FROM group_members WHERE group_id = ? AND has_paid_current_round = 1`,
        [groupId]
      );
    } catch (err) {
      // Fallback: use payment status
      [rows] = await conn.query(
        `SELECT DISTINCT payer_id as user_id FROM payments WHERE group_id = ? AND status = 'completed'`,
        [groupId]
      );
    }
    
    // Filter out members who already won in previous rounds
    const eligibleIds = rows
      .filter(r => !previousWinnerIdsStr.includes(String(r.user_id)))
      .map(r => r.user_id);
      
    console.log('Eligible winner IDs:', eligibleIds);
    return eligibleIds;
  } catch (error) {
    console.error('Error in getEligibleWinnerIds:', error);
    throw error;
  }
}

async function selectWinnerForRound(
  conn,
  { groupId, selectedByUserId, recipientId = null, selectionMethod = "random" }
) {
  const group = await ensureCycleTotalRounds(conn, groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.status = 404;
    throw error;
  }

  const round = await ensureCurrentRound(conn, groupId);
  if (!round) {
    const error = new Error("There is no active round for this group");
    error.status = 400;
    throw error;
  }

  if (round.winner_id) {
    const error = new Error("Winner already selected for the current round");
    error.status = 400;
    throw error;
  }

  // Check if all members have paid for current round
  // Check if column exists first
  const [columnCheck] = await conn.query(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'group_members'
     AND COLUMN_NAME = 'has_paid_current_round'`
  );

  const columnExists = columnCheck[0].count > 0;
  console.log('has_paid_current_round column exists:', columnExists);

  let memberPaymentStatus;
  if (columnExists) {
    [memberPaymentStatus] = await conn.query(
      `SELECT
         COUNT(*) AS total_members,
         SUM(CASE WHEN gm.has_paid_current_round = 1 THEN 1 ELSE 0 END) AS paid_members
       FROM group_members gm
       WHERE gm.group_id = ?`,
      [groupId]
    );
  } else {
    // Fallback: use payment status instead
    console.log('Using payment status fallback for member payment check');
    [memberPaymentStatus] = await conn.query(
      `SELECT
         COUNT(DISTINCT gm.user_id) AS total_members,
         COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN gm.user_id END) AS paid_members
       FROM group_members gm
       LEFT JOIN payments p ON p.payer_id = gm.user_id AND p.group_id = gm.group_id
       WHERE gm.group_id = ?`,
      [groupId]
    );
  }

  const totalMembers = Number(memberPaymentStatus[0].total_members || 0);
  const paidMembers = Number(memberPaymentStatus[0].paid_members || 0);

  console.log('Payment status check:');
  console.log('- Total members:', totalMembers);
  console.log('- Paid members:', paidMembers);
  console.log('- All members paid check:', totalMembers > 0 && paidMembers === totalMembers);

  if (totalMembers === 0 || paidMembers < totalMembers) {
    const error = new Error("All members must complete payment before selecting a winner");
    error.status = 400;
    throw error;
  }

  const eligibleWinnerIds = await getEligibleWinnerIds(conn, groupId);
  console.log('Eligible winner IDs:', eligibleWinnerIds);
  
  if (!eligibleWinnerIds.length) {
    const error = new Error("All group members have already received a payout");
    error.status = 400;
    throw error;
  }

  let winnerId = recipientId;
  let method = selectionMethod;

  if (winnerId) {
    console.log('Manual winner selection - recipient ID:', winnerId);
    console.log('Is recipient eligible:', eligibleWinnerIds.includes(Number(winnerId)));
    
    if (!eligibleWinnerIds.includes(Number(winnerId))) {
      const error = new Error("Selected user is not eligible for this round");
      error.status = 400;
      throw error;
    }
    method = "manual";
  } else {
    const randomIndex = Math.floor(Math.random() * eligibleWinnerIds.length);
    winnerId = eligibleWinnerIds[randomIndex];
    method = selectionMethod === "auto" ? "auto" : "random";
    console.log('Random winner selected - ID:', winnerId, 'Index:', randomIndex);
  }

  const amount = Number(group.contribution_amount) * Number(group.member_count || group.current_members || 0);

  await conn.query(
    `INSERT INTO payouts (
      group_id,
      round_id,
      recipient_id,
      round_number,
      amount,
      status,
      scheduled_date,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, 'scheduled', ?, NOW())`,
    [groupId, round.id, winnerId, round.round_number, amount, round.due_date]
  );

  await conn.query(
    `UPDATE equb_rounds
     SET winner_id = ?, winner_selected_by = ?, selection_method = ?, status = 'winner_selected'
     WHERE id = ?`,
    [winnerId, selectedByUserId, method, round.id]
  );

  await conn.query(
    `UPDATE group_members
     SET has_received_payout = 1, payout_date = CURDATE()
     WHERE group_id = ? AND user_id = ?`,
    [groupId, winnerId]
  );

  const members = await getGroupMembers(conn, groupId);
  const winner = members.find((member) => member.user_id === Number(winnerId));

  await createNotificationsForUsers(
    conn,
    members.map((member) => member.user_id),
    {
      title: `Round ${round.round_number} winner selected`,
      message: `${winner?.full_name || "A group member"} won round ${round.round_number} in ${group.name}.`,
      type: "payout",
      relatedGroupId: groupId,
    }
  );

  return getCurrentRound(conn, groupId);
}

async function sendRoundReminders(conn, groupId, adminUserId) {
  const round = await ensureCurrentRound(conn, groupId);
  if (!round) {
    const error = new Error("There is no active round for this group");
    error.status = 400;
    throw error;
  }

  const [pendingPayments] = await conn.query(
    `SELECT p.id, p.payer_id, u.full_name, g.name AS group_name
     FROM payments p
     JOIN users u ON u.id = p.payer_id
     JOIN equb_groups g ON g.id = p.group_id
     WHERE p.group_id = ? AND p.round_id = ? AND p.status = 'pending'`,
    [groupId, round.id]
  );

  for (const payment of pendingPayments) {
    await createNotification(conn, {
      userId: payment.payer_id,
      title: "Payment reminder",
      message: `Your round ${round.round_number} contribution for ${payment.group_name} is still pending.`,
      type: "payment_due",
      relatedGroupId: groupId,
      relatedPaymentId: payment.id,
    });
  }

  await createNotification(conn, {
    userId: adminUserId,
    title: "Reminders sent",
    message: `${pendingPayments.length} reminder notification(s) were sent for round ${round.round_number}.`,
    type: "group_update",
    relatedGroupId: groupId,
  });

  return pendingPayments.length;
}

async function closeCurrentRound(conn, { groupId, adminUserId }) {
  const group = await ensureCycleTotalRounds(conn, groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.status = 404;
    throw error;
  }

  const round = await getCurrentRound(conn, groupId);
  if (!round) {
    const error = new Error("No open round found for this group");
    error.status = 400;
    throw error;
  }

  if (!round.winner_id) {
    const error = new Error("Select a winner before closing the round");
    error.status = 400;
    throw error;
  }

  await conn.query(
    `UPDATE payouts
     SET status = 'paid', paid_at = NOW()
     WHERE group_id = ? AND round_id = ? AND recipient_id = ?`,
    [groupId, round.id, round.winner_id]
  );

  await conn.query(
    "UPDATE equb_rounds SET status = 'closed', closed_at = NOW() WHERE id = ?",
    [round.id]
  );

  await createNotification(conn, {
    userId: adminUserId,
    title: "Round closed",
    message: `Round ${round.round_number} for ${group.name} has been closed successfully.`,
    type: "group_update",
    relatedGroupId: groupId,
  });

  const eligibleWinnerIds = await getEligibleWinnerIds(conn, groupId);
  if (
    !eligibleWinnerIds.length ||
    Number(round.round_number) >= Number(group.cycle_total_rounds || group.member_count || 0)
  ) {
    await conn.query("UPDATE equb_groups SET status = 'completed' WHERE id = ?", [groupId]);
    return { closedRound: round, nextRound: null, groupStatus: "completed" };
  }

  await conn.query(
    `UPDATE equb_groups
     SET status = 'active'
     WHERE id = ?`,
    [groupId]
  );

  const nextRound = await createRound(conn, group, round.round_number + 1);


  return {
    closedRound: round,
    nextRound,
    groupStatus: "active",
  };
}

function deriveDisplayStatus(group) {
  const memberCount = Number(group.member_count ?? group.current_members ?? 0);
  const maxMembers = Number(group.max_members || 0);
  const isFull = memberCount >= maxMembers && maxMembers > 0;

  if (group.status === 'completed') return 'completed';
  if (isFull && (group.status === 'open' || group.status === 'active')) return 'full';
  if (group.status === 'active') return 'active';
  if (group.status === 'open') return 'open';
  return group.status;
}

module.exports = {
  buildRoundDueDate,
  buildTransactionReference,
  createNotification,
  createNotificationsForUsers,
  createRound,
  ensureCycleTotalRounds,
  ensureRoundPaymentsForMembers,
  ensureCurrentRound,
  getCurrentRound,
  getGroupById,
  getGroupMembers,
  selectWinnerForRound,
  sendRoundReminders,
  closeCurrentRound,
  deriveDisplayStatus,
};
