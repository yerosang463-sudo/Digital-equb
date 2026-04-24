const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const {
  createNotification,
  deriveDisplayStatus,
  ensureCycleTotalRounds,
  ensureCurrentRound,
  ensureRoundPaymentsForMembers,
  getCurrentRound,
  getGroupById,
  getGroupMembers,
  createRound,
  selectWinnerForRound,
  sendRoundReminders,
  closeCurrentRound,
} = require('../utils/equb');
const { canViewGroup, canJoinGroup } = require('../utils/groupAccess');

function normalizeGroup(group) {
  const memberCount = Number(group.member_count ?? group.current_members ?? 0);
  const currentRound = Number(group.current_round_number || 0);
  const totalRounds = Number(group.cycle_total_rounds || group.max_members || memberCount || 0);

  return {
    ...group,
    member_count: memberCount,
    total_rounds: totalRounds,
    current_round_number: currentRound,
    progress_percentage: totalRounds > 0 ? Math.min(100, Math.round((currentRound / totalRounds) * 100)) : 0,
    display_status: deriveDisplayStatus({ ...group, member_count: memberCount }),
    is_public: group.is_public ? true : false,
    is_member: group.is_member ? true : false,
  };
}

async function checkAdmin(groupId, userId) {
  const [rows] = await pool.query(
    `SELECT user_id
     FROM group_members
     WHERE group_id = ? AND user_id = ? AND role = 'admin'`,
    [groupId, userId]
  );

  return rows.length > 0;
}

async function fetchGroupDetails(groupId, userId) {
  const [groups] = await pool.query(
    `SELECT
        g.*,
        creator.full_name AS creator_name,
        admin_user.full_name AS admin_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
        current_round.id AS current_round_id,
        current_round.round_number AS current_round_number,
        current_round.due_date AS next_payment_date,
        current_round.status AS current_round_status,
        current_round.selection_method AS current_round_selection_method,
        current_round.winner_id AS current_winner_id,
        winner.full_name AS current_winner_name,
        latest_payout.round_number AS latest_winner_round_number,
        latest_winner.full_name AS latest_winner_name,
        my_member.role AS my_role,
        CASE WHEN my_member.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_member
      FROM equb_groups g
      JOIN users creator ON creator.id = g.created_by
      LEFT JOIN group_members admin_member ON admin_member.group_id = g.id AND admin_member.role = 'admin'
      LEFT JOIN users admin_user ON admin_user.id = admin_member.user_id
      LEFT JOIN equb_rounds current_round ON current_round.id = (
        SELECT r.id
        FROM equb_rounds r
        WHERE r.group_id = g.id AND r.status IN ('collecting', 'winner_selected')
        ORDER BY r.round_number DESC
        LIMIT 1
      )
      LEFT JOIN users winner ON winner.id = current_round.winner_id
      LEFT JOIN payouts latest_payout ON latest_payout.id = (
        SELECT p.id
        FROM payouts p
        WHERE p.group_id = g.id
        ORDER BY p.round_number DESC
        LIMIT 1
      )
      LEFT JOIN users latest_winner ON latest_winner.id = latest_payout.recipient_id
      LEFT JOIN group_members my_member ON my_member.group_id = g.id AND my_member.user_id = ?
      WHERE g.id = ?`,
    [userId, groupId]
  );

  if (!groups.length) {
    return null;
  }

  if (groups[0].current_round_id && !groups[0].cycle_total_rounds) {
    const syncedGroup = await ensureCycleTotalRounds(pool, groupId);
    groups[0].cycle_total_rounds = syncedGroup?.cycle_total_rounds || groups[0].member_count;
  }

  const group = normalizeGroup(groups[0]);
  const members = await getGroupMembers(pool, groupId);
  let currentRound = null;

  if (group.status === 'active') {
    currentRound = await ensureCurrentRound(pool, groupId);
  } else if (group.current_round_id) {
    currentRound = await getCurrentRound(pool, groupId);
  } else {
    // Open group: find the round even if current_round_id isn't set in the main query
    currentRound = await getCurrentRound(pool, groupId);
  }

  if (currentRound) {
    group.current_round_id = currentRound.id;
    group.current_round_number = currentRound.round_number;
    group.next_payment_date = currentRound.due_date;
    group.current_round_status = currentRound.status;
    group.current_winner_id = currentRound.winner_id;
    group.current_winner_name = currentRound.winner_name || group.current_winner_name || null;
    group.progress_percentage = group.total_rounds > 0
      ? Math.min(100, Math.round((currentRound.round_number / group.total_rounds) * 100))
      : 0;

    await ensureRoundPaymentsForMembers(pool, group, {
      roundId: currentRound.id,
      roundNumber: currentRound.round_number,
      dueDate: currentRound.due_date,
    });
  }

  let payments = [];
  if (currentRound) {
    const [paymentRows] = await pool.query(
      `SELECT p.id, p.payer_id, p.status, p.amount, p.due_date, p.paid_at
       FROM payments p
       WHERE p.group_id = ? AND p.round_id = ?`,
      [groupId, currentRound.id]
    );
    payments = paymentRows;
  }

  const memberPayments = new Map(payments.map((payment) => [payment.payer_id, payment]));
  const hydratedMembers = members.map((member) => ({
    ...member,
    has_paid_current_round: memberPayments.get(member.user_id)?.status === 'completed',
    current_payment_id: memberPayments.get(member.user_id)?.id || null,
    current_payment_status: memberPayments.get(member.user_id)?.status || null,
  }));

  const [payouts] = await pool.query(
    `SELECT p.*, u.full_name AS recipient_name
     FROM payouts p
     JOIN users u ON u.id = p.recipient_id
     WHERE p.group_id = ?
     ORDER BY p.round_number ASC`,
    [groupId]
  );

  const [reportRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = ?) AS member_count,
        (SELECT COUNT(*) FROM payments pay WHERE pay.group_id = ? AND pay.status = 'completed') AS completed_payments,
        (SELECT COUNT(*) FROM payments pay WHERE pay.group_id = ? AND pay.status = 'pending') AS pending_payments,
        (SELECT COALESCE(SUM(pay.amount), 0) FROM payments pay WHERE pay.group_id = ? AND pay.status = 'completed') AS total_collected,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payouts p WHERE p.group_id = ? AND p.status = 'paid') AS total_paid_out`,
    [groupId, groupId, groupId, groupId, groupId]
  );

  return {
    group,
    current_round: currentRound,
    members: hydratedMembers,
    payouts,
    report: reportRows[0],
  };
}

// GET /api/groups - list all groups
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, frequency, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = `
      SELECT
        g.*,
        creator.full_name AS creator_name,
        admin_user.full_name AS admin_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
        current_round.round_number AS current_round_number,
        current_round.due_date AS next_payment_date,
        winner.full_name AS current_winner_name,
        g.is_public,
        CASE WHEN my_member.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_member,
        my_member.role = 'admin' AS is_admin
      FROM equb_groups g
      JOIN users creator ON creator.id = g.created_by
      LEFT JOIN group_members admin_member ON admin_member.group_id = g.id AND admin_member.role = 'admin'
      LEFT JOIN users admin_user ON admin_user.id = admin_member.user_id
      LEFT JOIN equb_rounds current_round ON current_round.id = (
        SELECT r.id
        FROM equb_rounds r
        WHERE r.group_id = g.id AND r.status IN ('collecting', 'winner_selected')
        ORDER BY r.round_number DESC
        LIMIT 1
      )
      LEFT JOIN users winner ON winner.id = current_round.winner_id
      LEFT JOIN group_members my_member ON my_member.group_id = g.id AND my_member.user_id = ?
      WHERE 1 = 1
    `;

    const params = [req.user.id];

    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    }

    if (frequency) {
      query += ' AND g.frequency = ?';
      params.push(frequency);
    }

    if (search) {
      query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), offset);

    const [rows] = await pool.query(query, params);

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM equb_groups g
       WHERE 1 = 1
         ${status ? ' AND g.status = ?' : ''}
         ${frequency ? ' AND g.frequency = ?' : ''}
         ${search ? ' AND (g.name LIKE ? OR g.description LIKE ?)' : ''}`,
      [
        ...(status ? [status] : []),
        ...(frequency ? [frequency] : []),
        ...(search ? [`%${search}%`, `%${search}%`] : []),
      ]
    );

    res.json({
      success: true,
      groups: rows.map(normalizeGroup),
      pagination: {
        total: countResult[0].total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/my - groups the authenticated user belongs to
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        g.*,
        gm.role,
        gm.payout_order,
        gm.has_received_payout,
        gm.payout_date,
        gm.joined_at,
        creator.full_name AS creator_name,
        admin_user.full_name AS admin_name,
        (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS member_count,
        current_round.round_number AS current_round_number,
        current_round.due_date AS next_payment_date,
        winner.full_name AS current_winner_name
       FROM equb_groups g
       JOIN group_members gm ON gm.group_id = g.id
       JOIN users creator ON creator.id = g.created_by
       LEFT JOIN group_members admin_member ON admin_member.group_id = g.id AND admin_member.role = 'admin'
       LEFT JOIN users admin_user ON admin_user.id = admin_member.user_id
       LEFT JOIN equb_rounds current_round ON current_round.id = (
         SELECT r.id
         FROM equb_rounds r
         WHERE r.group_id = g.id AND r.status IN ('collecting', 'winner_selected')
         ORDER BY r.round_number DESC
         LIMIT 1
       )
       LEFT JOIN users winner ON winner.id = current_round.winner_id
       WHERE gm.user_id = ?
       ORDER BY gm.joined_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, groups: rows.map(normalizeGroup) });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id - get single group with details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const details = await fetchGroupDetails(req.params.id, req.user.id);

    if (!details) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!canViewGroup(req.user, details.group)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this group' });
    }

    res.json({ success: true, ...details });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups - create a new equb group
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().trim().withMessage('Group name is required'),
    body('description').optional().trim(),
    body('contribution_amount').isFloat({ min: 1 }).withMessage('Contribution amount must be a positive number'),
    body('max_members').isInt({ min: 2 }).withMessage('Max members must be at least 2'),
    body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
    body('start_date').optional().isDate().withMessage('Invalid start date'),
    body('end_date').optional().isDate().withMessage('Invalid end date'),
    body('winner_selection_mode').optional().isIn(['manual', 'random']),
    body('auto_select_winner').optional().isBoolean(),
    body('is_public').optional().isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      description,
      contribution_amount,
      frequency,
      max_members,
      start_date,
      end_date,
      winner_selection_mode = 'random',
      auto_select_winner = winner_selection_mode === 'random',
      is_public = false,
    } = req.body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO equb_groups (
          name,
          description,
          contribution_amount,
          frequency,
          max_members,
          current_members,
          cycle_total_rounds,
          status,
          start_date,
          end_date,
          winner_selection_mode,
          auto_select_winner,
          is_public,
          created_by
        )
         VALUES (?, ?, ?, ?, ?, 1, ?, 'open', ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || null,
          contribution_amount,
          frequency,
          max_members,
          max_members,
          start_date || null,
          end_date || null,
          winner_selection_mode,
          auto_select_winner ? 1 : 0,
          is_public ? 1 : 0,
          req.user.id,
        ]
      );

      await conn.query(
        `INSERT INTO group_members (group_id, user_id, role, payout_order)
         VALUES (?, ?, 'admin', 1)`,
        [result.insertId, req.user.id]
      );

      const groupDataForRound = await getGroupById(conn, result.insertId);
      await createRound(conn, groupDataForRound, 1);

      await conn.commit();

      const details = await fetchGroupDetails(result.insertId, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        ...details,
      });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  }
);

// PUT /api/groups/:id - update group info (admin only)
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().notEmpty().trim().withMessage('Group name cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(['open', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('start_date').optional().isDate(),
    body('end_date').optional().isDate(),
    body('winner_selection_mode').optional().isIn(['manual', 'random']),
    body('auto_select_winner').optional().isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const isAdmin = await checkAdmin(req.params.id, req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Only group admins can update the group' });
      }

      const updates = {};
      for (const field of ['name', 'description', 'status', 'start_date', 'end_date', 'winner_selection_mode']) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (req.body.auto_select_winner !== undefined) {
        updates.auto_select_winner = req.body.auto_select_winner ? 1 : 0;
      }

      if (!Object.keys(updates).length) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      const fields = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
      await pool.query(
        `UPDATE equb_groups SET ${fields} WHERE id = ?`,
        [...Object.values(updates), req.params.id]
      );

      if (req.body.status === 'active') {
        await ensureCurrentRound(pool, req.params.id);
      }

      const details = await fetchGroupDetails(req.params.id, req.user.id);
      res.json({ success: true, message: 'Group updated successfully', ...details });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/groups/:id/join - join an equb group
router.post('/:id/join', authenticate, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const group = await getGroupById(conn, req.params.id);
    if (!group) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Group not found or not open for new members' });
    }

    const [existing] = await conn.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    const joinCheck = canJoinGroup(req.user, { ...group, is_member: existing.length > 0 });
    if (!joinCheck.allowed) {
      await conn.rollback();
      if (joinCheck.reason === 'already_member') {
        return res.status(409).json({ success: false, message: 'You are already a member of this group' });
      }
      if (joinCheck.reason === 'not_open') {
        return res.status(400).json({ success: false, message: 'Group is not open for new members' });
      }
      if (joinCheck.reason === 'full') {
        return res.status(400).json({ success: false, message: 'Group is full' });
      }
      return res.status(400).json({ success: false, message: 'Cannot join this group' });
    }

    const nextOrder = Number(group.member_count) + 1;

    await conn.query(
      `INSERT INTO group_members (group_id, user_id, role, payout_order)
       VALUES (?, ?, 'member', ?)`,
      [req.params.id, req.user.id, nextOrder]
    );

    const nextCount = Number(group.member_count) + 1;
    const nextStatus = nextCount >= Number(group.max_members) ? 'active' : 'open';

    // After join: ensure the new member has a payment record for the current round
    // If group just became active, upgrade the existing open round's status and snapshot member count
    const currentRound = await getCurrentRound(conn, req.params.id);

    if (nextStatus === 'active') {
      // Group is now full: update members, status, and lock in total rounds in one query
      await conn.query(
        `UPDATE equb_groups SET current_members = ?, status = 'active', cycle_total_rounds = ? WHERE id = ?`,
        [nextCount, nextCount, req.params.id]
      );

      if (!currentRound) {
        // No open round yet (edge case) — create round 1
        const freshGroup = await getGroupById(conn, req.params.id);
        await createRound(conn, freshGroup, 1);
      } else {
        // Round 1 already exists — just ensure all members have a payment record
        const freshGroup = await getGroupById(conn, req.params.id);
        await ensureRoundPaymentsForMembers(conn, freshGroup, {
          roundId: currentRound.id,
          roundNumber: currentRound.round_number,
          dueDate: currentRound.due_date,
        });
      }
    } else if (currentRound) {
      // Group still open — just add a payment record for this specific new member
      const freshGroup = await getGroupById(conn, req.params.id);
      await ensureRoundPaymentsForMembers(conn, freshGroup, {
        roundId: currentRound.id,
        roundNumber: currentRound.round_number,
        dueDate: currentRound.due_date,
        onlyUserId: req.user.id,
      });
    }

    const [admins] = await conn.query(
      `SELECT user_id
       FROM group_members
       WHERE group_id = ? AND role = 'admin'`,
      [req.params.id]
    );

    for (const admin of admins) {
      await createNotification(conn, {
        userId: admin.user_id,
        title: 'New member joined',
        message: 'A new member joined your group.',
        type: 'group_update',
        relatedGroupId: req.params.id,
      });
    }

    await conn.commit();

    const details = await fetchGroupDetails(req.params.id, req.user.id);
    res.json({ success: true, message: 'Successfully joined the group', ...details });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE /api/groups/:id/leave - leave a group
router.delete('/:id/leave', authenticate, async (req, res, next) => {
  try {
    const [member] = await pool.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!member.length) {
      return res.status(404).json({ success: false, message: 'You are not a member of this group' });
    }

    if (member[0].role === 'admin') {
      return res.status(400).json({ success: false, message: 'Group admin cannot leave the group. Transfer admin role first.' });
    }

    await pool.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    await pool.query(
      `UPDATE equb_groups
       SET current_members = GREATEST(current_members - 1, 0),
           status = CASE WHEN current_members - 1 < max_members THEN 'open' ELSE status END
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: 'Successfully left the group' });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id/members - list members
router.get('/:id/members', authenticate, async (req, res, next) => {
  try {
    const members = await getGroupMembers(pool, req.params.id);
    res.json({ success: true, members });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const isAdmin = await checkAdmin(req.params.id, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can remove members' });
    }

    const [memberRows] = await pool.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );

    if (!memberRows.length) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (memberRows[0].role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin cannot be removed from the group' });
    }

    await pool.query(
      'DELETE FROM payments WHERE group_id = ? AND payer_id = ? AND status = \'pending\'',
      [req.params.id, req.params.userId]
    );
    await pool.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );
    await pool.query(
      `UPDATE equb_groups
       SET current_members = GREATEST(current_members - 1, 0),
           status = CASE WHEN current_members - 1 < max_members THEN 'open' ELSE status END
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/winner/select - admin selects a winner or runs random selection
router.post(
  '/:id/winner/select',
  authenticate,
  [body('recipient_id').optional().isInt({ min: 1 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const isAdmin = await checkAdmin(req.params.id, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can select winners' });
    }

    console.log('Winner selection request:');
    console.log('- Group ID:', req.params.id);
    console.log('- User ID:', req.user.id);
    console.log('- Recipient ID:', req.body.recipient_id);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let round = await selectWinnerForRound(conn, {
        groupId: req.params.id,
        selectedByUserId: req.user.id,
        recipientId: req.body.recipient_id ? Number(req.body.recipient_id) : null,
      });

      console.log('Round selected:', round);
      console.log('Eligible winner IDs will be checked...');

      let closeResult = await closeCurrentRound(conn, {
        groupId: req.params.id,
        adminUserId: req.user.id,
      });

      console.log('Round closed result:', closeResult);



      await conn.commit();

      const details = await fetchGroupDetails(req.params.id, req.user.id);
      res.json({
        success: true,
        message:
          closeResult.groupStatus === 'completed'
            ? `Round ${round.round_number} winner selected. Group completed.`
            : `Round ${round.round_number} winner selected and next round started.`,
        selected_round: round,
        next_round: closeResult.nextRound,
        ...details,
      });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  }
);

// POST /api/groups/:id/reminders - send reminders for pending payments
router.post('/:id/reminders', authenticate, async (req, res, next) => {
  const isAdmin = await checkAdmin(req.params.id, req.user.id);
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Only group admins can send reminders' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const count = await sendRoundReminders(conn, req.params.id, req.user.id);
    await conn.commit();

    res.json({
      success: true,
      message: `Reminder sent to ${count} member(s) with pending payments`,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/groups/:id/round/close - close current round and prepare the next one
router.post('/:id/round/close', authenticate, async (req, res, next) => {
  const isAdmin = await checkAdmin(req.params.id, req.user.id);
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Only group admins can close rounds' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await closeCurrentRound(conn, {
      groupId: req.params.id,
      adminUserId: req.user.id,
    });
    await conn.commit();

    const details = await fetchGroupDetails(req.params.id, req.user.id);
    res.json({
      success: true,
      message: result.groupStatus === 'completed' ? 'Final round closed. Group completed.' : 'Round closed successfully',
      ...details,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/groups/:id/payments/simulate-all - system helper to auto-pay all pending members (Admin only)
router.post('/:id/payments/simulate-all', authenticate, async (req, res, next) => {
  const isAdmin = await checkAdmin(req.params.id, req.user.id);
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Only group admins can use system auto-pay' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const round = await getCurrentRound(conn, req.params.id);
    if (!round) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No active round found to simulate payments for' });
    }

    await conn.query(
      `UPDATE payments
       SET status = 'completed', paid_at = NOW(), payment_method = 'system_auto', notes = 'System admin auto-simulated'
       WHERE group_id = ? AND round_id = ? AND status = 'pending'`,
      [req.params.id, round.id]
    );

    await conn.commit();
    const details = await fetchGroupDetails(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'All pending members have been marked as paid.',
      ...details,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/groups/:id/restart-cycle - admin restarts a completed group from Round 1
router.post('/:id/restart-cycle', authenticate, async (req, res, next) => {
  const isAdmin = await checkAdmin(req.params.id, req.user.id);
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Only group admins can restart a cycle' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [groupRows] = await conn.query('SELECT * FROM equb_groups WHERE id = ?', [req.params.id]);
    const group = groupRows[0];
    if (!group) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.status !== 'completed') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Only completed groups can be restarted' });
    }

    // 1. Delete all history for this group (Rounds, Payments, Payouts)
    // This allows us to reuse round numbers like "1" for the new cycle
    await conn.query(`DELETE FROM equb_rounds WHERE group_id = ?`, [req.params.id]);
    await conn.query(`DELETE FROM payments WHERE group_id = ?`, [req.params.id]);
    await conn.query(`DELETE FROM payouts WHERE group_id = ?`, [req.params.id]);
    await conn.query(`DELETE FROM notifications WHERE related_group_id = ?`, [req.params.id]);

    // 2. Reset member payout flags so everyone is eligible again
    await conn.query(
      `UPDATE group_members SET has_received_payout = 0, payout_date = NULL WHERE group_id = ?`,
      [req.params.id]
    );

    // 3. Reset the group to active with a fresh cycle
    await conn.query(
      `UPDATE equb_groups
       SET status = 'active', cycle_total_rounds = current_members
       WHERE id = ?`,
      [req.params.id]
    );

    // 4. Create fresh Round 1 with pending payments for all members
    const freshGroup = await getGroupById(conn, req.params.id);
    await createRound(conn, freshGroup, 1);

    // Notify all members
    const members = await getGroupMembers(conn, req.params.id);
    for (const member of members) {
      await createNotification(conn, {
        userId: member.user_id,
        title: 'New cycle started!',
        message: `The admin has restarted ${group.name}. Round 1 is now open — please make your payment.`,
        type: 'group_update',
        relatedGroupId: req.params.id,
      });
    }

    await conn.commit();
    const details = await fetchGroupDetails(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Group cycle restarted. Round 1 is now open for payments.',
      ...details,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/groups/:id/close - admin permanently closes a completed group
router.post('/:id/close', authenticate, async (req, res, next) => {
  const isAdmin = await checkAdmin(req.params.id, req.user.id);
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Only group admins can close a group' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [groupRows] = await conn.query('SELECT status FROM equb_groups WHERE id = ?', [req.params.id]);
    const group = groupRows[0];
    if (!group) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.status !== 'completed') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Only completed groups can be permanently closed' });
    }

    await conn.query(`UPDATE equb_groups SET status = 'cancelled' WHERE id = ?`, [req.params.id]);

    // Notify all members
    const members = await getGroupMembers(conn, req.params.id);
    for (const member of members) {
      await createNotification(conn, {
        userId: member.user_id,
        title: 'Group closed',
        message: `The Equb group has been permanently closed by the admin. Thank you for participating!`,
        type: 'group_update',
        relatedGroupId: req.params.id,
      });
    }

    await conn.commit();
    const details = await fetchGroupDetails(req.params.id, req.user.id);
    res.json({ success: true, message: 'Group permanently closed.', ...details });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/groups/:id/report - summary report for a group
router.get('/:id/report', authenticate, async (req, res, next) => {
  try {
    const details = await fetchGroupDetails(req.params.id, req.user.id);

    if (!details) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({
      success: true,
      report: {
        ...details.report,
        current_round: details.current_round,
        payouts: details.payouts,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
