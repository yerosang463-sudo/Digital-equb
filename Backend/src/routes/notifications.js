const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications - list notifications for authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { is_read, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT n.*, g.name AS group_name
      FROM notifications n
      LEFT JOIN equb_groups g ON n.related_group_id = g.id
      WHERE n.user_id = ?
    `;
    const params = [req.user.id];

    if (is_read !== undefined) {
      query += ' AND n.is_read = ?';
      params.push(parseInt(is_read));
    }

    query += ' ORDER BY n.created_at DESC LIMIT ' + parseInt(limit) + ' OFFSET ' + offset;

    const [rows] = await pool.query(query, params);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({
      success: true,
      notifications: rows,
      unread_count: countResult[0].unread,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read - mark a notification as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all - mark all notifications as read
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id - delete a notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
