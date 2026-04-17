const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/groups - list all groups (with optional filters)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, frequency, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT g.*, u.full_name AS creator_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
      FROM equb_groups g
      JOIN users u ON g.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

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
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) AS total FROM equb_groups WHERE 1=1' +
        (status ? ' AND status = ?' : '') +
        (frequency ? ' AND frequency = ?' : '') +
        (search ? ' AND (name LIKE ? OR description LIKE ?)' : ''),
      [...(status ? [status] : []), ...(frequency ? [frequency] : []), ...(search ? [`%${search}%`, `%${search}%`] : [])]
    );

    res.json({
      success: true,
      groups: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / parseInt(limit)),
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
      `SELECT g.*, gm.role, gm.payout_order, gm.has_received_payout, gm.joined_at,
         u.full_name AS creator_name,
         (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS member_count
       FROM equb_groups g
       JOIN group_members gm ON gm.group_id = g.id
       JOIN users u ON g.created_by = u.id
       WHERE gm.user_id = ?
       ORDER BY gm.joined_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, groups: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id - get single group with details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [groups] = await pool.query(
      `SELECT g.*, u.full_name AS creator_name,
         (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
       FROM equb_groups g
       JOIN users u ON g.created_by = u.id
       WHERE g.id = ?`,
      [req.params.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const [members] = await pool.query(
      `SELECT gm.*, u.full_name, u.email, u.avatar_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.payout_order ASC`,
      [req.params.id]
    );

    const [payouts] = await pool.query(
      `SELECT p.*, u.full_name AS recipient_name
       FROM payouts p
       JOIN users u ON p.recipient_id = u.id
       WHERE p.group_id = ?
       ORDER BY p.round_number ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      group: groups[0],
      members,
      payouts,
    });
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
    body('contribution_amount').isFloat({ min: 1 }).withMessage('Contribution amount must be a positive number'),
    body('max_members').isInt({ min: 2 }).withMessage('Max members must be at least 2'),
    body('frequency').isIn(['weekly', 'biweekly', 'monthly']).withMessage('Invalid frequency'),
    body('description').optional().trim(),
    body('start_date').optional().isDate().withMessage('Invalid start date'),
    body('end_date').optional().isDate().withMessage('Invalid end date'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, contribution_amount, frequency, max_members, start_date, end_date } = req.body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO equb_groups (name, description, contribution_amount, frequency, max_members, current_members, status, start_date, end_date, created_by)
         VALUES (?, ?, ?, ?, ?, 1, 'open', ?, ?, ?)`,
        [name, description || null, contribution_amount, frequency, max_members, start_date || null, end_date || null, req.user.id]
      );

      const groupId = result.insertId;

      await conn.query(
        `INSERT INTO group_members (group_id, user_id, role, payout_order) VALUES (?, ?, 'admin', 1)`,
        [groupId, req.user.id]
      );

      await conn.commit();

      const [groups] = await pool.query(
        'SELECT g.*, u.full_name AS creator_name FROM equb_groups g JOIN users u ON g.created_by = u.id WHERE g.id = ?',
        [groupId]
      );

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        group: groups[0],
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
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const [member] = await pool.query(
        "SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'admin'",
        [req.params.id, req.user.id]
      );

      if (member.length === 0) {
        return res.status(403).json({ success: false, message: 'Only group admins can update the group' });
      }

      const { name, description, status, start_date, end_date } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (status !== undefined) updates.status = status;
      if (start_date !== undefined) updates.start_date = start_date;
      if (end_date !== undefined) updates.end_date = end_date;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      await pool.query(`UPDATE equb_groups SET ${fields} WHERE id = ?`, [...Object.values(updates), req.params.id]);

      const [groups] = await pool.query(
        'SELECT g.*, u.full_name AS creator_name FROM equb_groups g JOIN users u ON g.created_by = u.id WHERE g.id = ?',
        [req.params.id]
      );

      res.json({ success: true, message: 'Group updated successfully', group: groups[0] });
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

    const [groups] = await conn.query("SELECT * FROM equb_groups WHERE id = ? AND status = 'open'", [req.params.id]);
    if (groups.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Group not found or not open for new members' });
    }

    const group = groups[0];

    const [existing] = await conn.query('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'You are already a member of this group' });
    }

    const [countResult] = await conn.query(
      'SELECT COUNT(*) AS count FROM group_members WHERE group_id = ?',
      [req.params.id]
    );
    const currentCount = countResult[0].count;

    if (currentCount >= group.max_members) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Group is full' });
    }

    const nextOrder = currentCount + 1;
    await conn.query(
      'INSERT INTO group_members (group_id, user_id, role, payout_order) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, 'member', nextOrder]
    );

    await conn.query(
      'UPDATE equb_groups SET current_members = current_members + 1 WHERE id = ?',
      [req.params.id]
    );

    if (currentCount + 1 >= group.max_members) {
      await conn.query("UPDATE equb_groups SET status = 'active' WHERE id = ?", [req.params.id]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Successfully joined the group' });
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

    if (member.length === 0) {
      return res.status(404).json({ success: false, message: 'You are not a member of this group' });
    }

    if (member[0].role === 'admin') {
      return res.status(400).json({ success: false, message: 'Group admin cannot leave the group. Transfer admin role first.' });
    }

    await pool.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    await pool.query('UPDATE equb_groups SET current_members = GREATEST(current_members - 1, 0) WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Successfully left the group' });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id/members - list members
router.get('/:id/members', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT gm.id, gm.role, gm.payout_order, gm.has_received_payout, gm.payout_date, gm.joined_at,
         u.id AS user_id, u.full_name, u.email, u.avatar_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.payout_order ASC`,
      [req.params.id]
    );

    res.json({ success: true, members: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
