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
    `INSERT INTO notifications (user_id, title, message, type, related_group_id, related_payment_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
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
  const [rows] = await conn.query(
    `SELECT r.*, u.full_name AS winner_name
     FROM equb_rounds r
     LEFT JOIN users u ON u.id = r.winner_id
     WHERE r.group_id = ? AND r.status IN ('collecting', 'winner_selected')
     ORDER BY r.round_number DESC
     LIMIT 1`,
    [groupId]
  );

  return rows[0] || null;
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
  let group = await getGroupById(conn, groupId);
  if (!group || (group.status !== "active" && group.status !== "open")) {
    return null;
  }

  group = await ensureCycleTotalRounds(conn, groupId);

  const existingRound = await getCurrentRound(conn, groupId);
  if (existingRound) {
    await ensureRoundPaymentsForMembers(conn, group, {
      roundId: existingRound.id,
      roundNumber: existingRound.round_number,
      dueDate: existingRound.due_date,
    });
    return existingRound;
  }

  const [closedRounds] = await conn.query(
    "SELECT COUNT(*) AS total FROM equb_rounds WHERE group_id = ?",
    [groupId]
  );

  return createRound(conn, group, closedRounds[0].total + 1);
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
        simulation_status
      )
      VALUES (?, ?, ?, ?, ?, 'pending', 'telebirr', ?, 'initiated')`,
      [group.id, member.user_id, roundId, roundNumber, group.contribution_amount, dueDate]
    );
  }
}

async function getEligibleWinnerIds(conn, groupId) {
  const [rows] = await conn.query(
    `SELECT gm.user_id
     FROM group_members gm
     WHERE gm.group_id = ?
       AND gm.user_id NOT IN (
         SELECT p.recipient_id
         FROM payouts p
         WHERE p.group_id = ? AND p.status IN ('scheduled', 'paid')
       )
     ORDER BY gm.payout_order ASC`,
    [groupId, groupId]
  );

  return rows.map((row) => row.user_id);
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

  const [paymentSummary] = await conn.query(
    `SELECT
       COUNT(*) AS total_payments,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_payments
     FROM payments
     WHERE group_id = ? AND round_id = ?`,
    [groupId, round.id]
  );

  if (
    Number(paymentSummary[0].total_payments || 0) === 0 ||
    Number(paymentSummary[0].completed_payments || 0) !== Number(paymentSummary[0].total_payments || 0)
  ) {
    const error = new Error("All members must complete payment before selecting a winner");
    error.status = 400;
    throw error;
  }

  const eligibleWinnerIds = await getEligibleWinnerIds(conn, groupId);
  if (!eligibleWinnerIds.length) {
    const error = new Error("All group members have already received a payout");
    error.status = 400;
    throw error;
  }

  let winnerId = recipientId;
  let method = selectionMethod;

  if (winnerId) {
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
      scheduled_date
    )
    VALUES (?, ?, ?, ?, ?, 'scheduled', ?)`,
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
  const isFull = memberCount >= Number(group.max_members || 0);

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
