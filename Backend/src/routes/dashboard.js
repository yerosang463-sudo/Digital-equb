const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats - overview stats for authenticated user
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [groupStats] = await pool.query(
      `SELECT
         COUNT(*) AS total_groups,
         SUM(CASE WHEN g.status = 'active' THEN 1 ELSE 0 END) AS active_groups,
         SUM(CASE WHEN gm.role = 'admin' THEN 1 ELSE 0 END) AS groups_as_admin
       FROM group_members gm
       JOIN equb_groups g ON gm.group_id = g.id
       WHERE gm.user_id = ?`,
      [userId]
    );

    const [paymentStats] = await pool.query(
      `SELECT
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_contributed,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_payments
       FROM payments WHERE payer_id = ?`,
      [userId]
    );

    const [payoutStats] = await pool.query(
      `SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_received,
         SUM(CASE WHEN status = 'scheduled' THEN amount ELSE 0 END) AS upcoming_payout,
         COUNT(CASE WHEN status = 'scheduled' THEN 1 END) AS scheduled_payouts
       FROM payouts WHERE recipient_id = ?`,
      [userId]
    );

    const [unreadNotifs] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      stats: {
        groups: groupStats[0],
        payments: paymentStats[0],
        payouts: payoutStats[0],
        unread_notifications: unreadNotifs[0].count,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/recent-activity - recent payments and group activity
router.get('/recent-activity', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [recentPayments] = await pool.query(
      `SELECT p.id, p.amount, p.status, p.paid_at, p.created_at, g.name AS group_name, 'payment' AS type
       FROM payments p
       JOIN equb_groups g ON p.group_id = g.id
       WHERE p.payer_id = ?
       ORDER BY p.created_at DESC LIMIT 5`,
      [userId]
    );

    const [recentPayouts] = await pool.query(
      `SELECT po.id, po.amount, po.status, po.paid_at, po.scheduled_date, g.name AS group_name, 'payout' AS type
       FROM payouts po
       JOIN equb_groups g ON po.group_id = g.id
       WHERE po.recipient_id = ?
       ORDER BY po.scheduled_date DESC LIMIT 5`,
      [userId]
    );

    const [myGroups] = await pool.query(
      `SELECT g.id, g.name, g.status, g.contribution_amount, g.frequency, gm.role,
         (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS member_count,
         g.max_members
       FROM group_members gm
       JOIN equb_groups g ON gm.group_id = g.id
       WHERE gm.user_id = ?
       ORDER BY gm.joined_at DESC LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      recent_payments: recentPayments,
      recent_payouts: recentPayouts,
      my_groups: myGroups,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
