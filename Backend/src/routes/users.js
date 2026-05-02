const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.bio, u.created_at,
        u.auth_provider, u.email_verified,
        u.notify_payment_reminders, u.notify_winner_announcements, u.notify_new_member_alerts, u.notify_email_updates,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.user_id = u.id) AS groups_count,
        (SELECT COUNT(*) FROM payments p WHERE p.payer_id = u.id AND p.status = 'completed') AS completed_payments
       FROM users u WHERE u.id = ? AND u.is_active = 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile
router.put(
  '/profile',
  authenticate,
  [
    body('full_name').optional().notEmpty().trim().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Email must be valid'),
    body('phone').optional().trim(),
    body('bio').optional().trim(),
    body('avatar_url').optional().trim().isURL().withMessage('Avatar URL must be a valid URL'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { full_name, email, phone, bio, avatar_url } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    try {
      if (email !== undefined) {
        const [existing] = await pool.query(
          'SELECT id FROM users WHERE email = ? AND id <> ?',
          [email, req.user.id]
        );

        if (existing.length > 0) {
          return res.status(409).json({ success: false, message: 'Email already in use' });
        }
      }

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), req.user.id];
      await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, values);

      const [rows] = await pool.query(
        `SELECT id, full_name, email, phone, avatar_url, bio, created_at,
          auth_provider, email_verified,
          notify_payment_reminders, notify_winner_announcements, notify_new_member_alerts, notify_email_updates
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      res.json({ success: true, message: 'Profile updated successfully', user: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/profile/preferences
router.put(
  '/profile/preferences',
  authenticate,
  [
    body('notify_payment_reminders').optional().isBoolean(),
    body('notify_winner_announcements').optional().isBoolean(),
    body('notify_new_member_alerts').optional().isBoolean(),
    body('notify_email_updates').optional().isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      notify_payment_reminders,
      notify_winner_announcements,
      notify_new_member_alerts,
      notify_email_updates,
    } = req.body;

    const updates = {};
    if (notify_payment_reminders !== undefined) updates.notify_payment_reminders = notify_payment_reminders ? 1 : 0;
    if (notify_winner_announcements !== undefined) updates.notify_winner_announcements = notify_winner_announcements ? 1 : 0;
    if (notify_new_member_alerts !== undefined) updates.notify_new_member_alerts = notify_new_member_alerts ? 1 : 0;
    if (notify_email_updates !== undefined) updates.notify_email_updates = notify_email_updates ? 1 : 0;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No preferences to update' });
    }

    try {
      const fields = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
      await pool.query(
        `UPDATE users SET ${fields} WHERE id = ?`,
        [...Object.values(updates), req.user.id]
      );

      const [rows] = await pool.query(
        `SELECT id, notify_payment_reminders, notify_winner_announcements, notify_new_member_alerts, notify_email_updates
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: rows[0],
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    try {
      const [rows] = await pool.query(
        'SELECT password_hash, auth_provider FROM users WHERE id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (rows[0].auth_provider === 'google') {
        return res.status(400).json({
          success: false,
          message: 'This account uses Google sign-in and does not have a password to change',
        });
      }

      const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      const new_hash = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [new_hash, req.user.id]);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/:id (public profile)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, avatar_url, bio, created_at FROM users WHERE id = ? AND is_active = 1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/users
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT id, full_name, email, phone, avatar_url, created_at FROM users WHERE is_active = 1';
    const params = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY full_name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE is_active = 1' + (search ? ' AND (full_name LIKE ? OR email LIKE ?)' : ''),
      search ? [`%${search}%`, `%${search}%`] : []
    );

    res.json({
      success: true,
      users: rows,
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

module.exports = router;
