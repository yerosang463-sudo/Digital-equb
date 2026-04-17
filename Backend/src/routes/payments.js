const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/payments - list payments for authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, group_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, g.name AS group_name, u.full_name AS payer_name
      FROM payments p
      JOIN equb_groups g ON p.group_id = g.id
      JOIN users u ON p.payer_id = u.id
      WHERE p.payer_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (group_id) {
      query += ' AND p.group_id = ?';
      params.push(group_id);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    res.json({ success: true, payments: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/group/:groupId - list all payments for a group
router.get('/group/:groupId', authenticate, async (req, res, next) => {
  try {
    const [member] = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.groupId, req.user.id]
    );

    if (member.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, u.full_name AS payer_name, u.avatar_url AS payer_avatar
      FROM payments p
      JOIN users u ON p.payer_id = u.id
      WHERE p.group_id = ?
    `;
    const params = [req.params.groupId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    res.json({ success: true, payments: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/:id - get single payment
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, g.name AS group_name, u.full_name AS payer_name
       FROM payments p
       JOIN equb_groups g ON p.group_id = g.id
       JOIN users u ON p.payer_id = u.id
       WHERE p.id = ? AND p.payer_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, payment: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments - create a payment record
router.post(
  '/',
  authenticate,
  [
    body('group_id').isInt({ min: 1 }).withMessage('Valid group ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('payment_method').isIn(['bank_transfer', 'mobile_money', 'cash', 'other']).withMessage('Invalid payment method'),
    body('due_date').optional().isDate().withMessage('Invalid due date'),
    body('transaction_ref').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { group_id, amount, payment_method, due_date, transaction_ref, notes } = req.body;

    try {
      const [member] = await pool.query(
        'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
        [group_id, req.user.id]
      );

      if (member.length === 0) {
        return res.status(403).json({ success: false, message: 'You are not a member of this group' });
      }

      const [result] = await pool.query(
        `INSERT INTO payments (group_id, payer_id, amount, status, payment_method, due_date, transaction_ref, notes)
         VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [group_id, req.user.id, amount, payment_method, due_date || null, transaction_ref || null, notes || null]
      );

      const [rows] = await pool.query(
        `SELECT p.*, g.name AS group_name
         FROM payments p JOIN equb_groups g ON p.group_id = g.id
         WHERE p.id = ?`,
        [result.insertId]
      );

      res.status(201).json({ success: true, message: 'Payment recorded', payment: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/payments/:id/confirm - confirm/complete a payment (admin)
router.put('/:id/confirm', authenticate, async (req, res, next) => {
  try {
    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const payment = payments[0];

    const [admin] = await pool.query(
      "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'admin'",
      [payment.group_id, req.user.id]
    );

    if (admin.length === 0 && payment.payer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this payment' });
    }

    await pool.query(
      "UPDATE payments SET status = 'completed', paid_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    const [rows] = await pool.query(
      `SELECT p.*, g.name AS group_name, u.full_name AS payer_name
       FROM payments p
       JOIN equb_groups g ON p.group_id = g.id
       JOIN users u ON p.payer_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: 'Payment confirmed', payment: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/summary/me - payment stats for the authenticated user
router.get('/summary/me', authenticate, async (req, res, next) => {
  try {
    const [stats] = await pool.query(
      `SELECT
         COUNT(*) AS total_payments,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_paid,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS total_pending
       FROM payments WHERE payer_id = ?`,
      [req.user.id]
    );

    res.json({ success: true, summary: stats[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
