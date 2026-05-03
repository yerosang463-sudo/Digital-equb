const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getGoogleClientIds, signAuthToken } = require('../utils/authTokens');
require('../config/env');

const SAFE_USER_FIELDS = `
  id, full_name, email, phone, avatar_url, bio, auth_provider, email_verified, created_at
`;

function removePassword(user) {
  if (!user) {
    return user;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('full_name').notEmpty().trim().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { full_name, email, password, phone } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        `INSERT INTO users
          (full_name, email, phone, password_hash, auth_provider, email_verified, created_at)
         VALUES (?, ?, ?, ?, 'local', 0, NOW())`,
        [full_name, email, phone || null, password_hash]
      );

      const userId = result.insertId;
      const token = signAuthToken({ id: userId, email });

      const [rows] = await pool.query(
        `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
        [userId]
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: rows[0],
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const user = rows[0];
      if (!user.password_hash || user.auth_provider === 'google') {
        return res.status(401).json({
          success: false,
          message: 'This account uses Google sign-in. Please continue with Google.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = signAuthToken(user);
      const safeUser = removePassword(user);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: safeUser,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  const idToken = req.body?.credential || req.body?.idToken;

  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Google credential token is required',
    });
  }

  const googleClientIds = getGoogleClientIds();
  if (googleClientIds.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth is not configured on the server',
    });
  }

  try {
    const client = new OAuth2Client(googleClientIds[0]);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientIds,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: 'Google account email is not verified',
      });
    }

    const {
      email,
      name,
      picture,
      sub: googleId,
    } = payload;

    const normalizedEmail = email.toLowerCase().trim();

    // Search for existing user by googleId or email (regardless of is_active status)
    let [rows] = await pool.query(
      `SELECT *
       FROM users
       WHERE google_id = ? OR email = ?
       ORDER BY (google_id = ?) DESC
       LIMIT 1`,
      [googleId, normalizedEmail, googleId]
    );

    let user;
    let createdAccount = false;

    if (rows.length === 0) {
      // New user registration via Google
      createdAccount = true;
      const unusablePasswordHash = await bcrypt.hash(
        crypto.randomBytes(32).toString('hex'),
        10
      );

      const [result] = await pool.query(
        `INSERT INTO users
          (full_name, email, password_hash, avatar_url, google_id, auth_provider, email_verified, created_at)
         VALUES (?, ?, ?, ?, ?, 'google', 1, NOW())`,
        [name || normalizedEmail, normalizedEmail, unusablePasswordHash, picture || null, googleId]
      );

      const [newRows] = await pool.query(
        `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
        [result.insertId]
      );
      user = newRows[0];
    } else {
      // Existing user - link Google ID if not already linked
      user = rows[0];

      // Check if account is active
      if (user.is_active === 0) {
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated. Please contact support.',
        });
      }

      // Update existing user with Google info
      // NOTE: We don't change auth_provider if it's already 'local' to avoid breaking password login
      await pool.query(
        `UPDATE users
         SET avatar_url = COALESCE(?, avatar_url),
             google_id = COALESCE(google_id, ?),
             email_verified = 1
         WHERE id = ?`,
        [picture || null, googleId, user.id]
      );

      const [updatedRows] = await pool.query(
        `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
        [user.id]
      );
      user = updatedRows[0];
    }

    const token = signAuthToken(user);

    res.json({
      success: true,
      message: createdAccount ? 'Account created via Google' : 'Login successful',
      token,
      user: removePassword(user),
    });
  } catch (err) {
    console.error('Google verification failed detail:', err);
    console.error('Google verification error message:', err.message);
    
    if (err.message === 'JWT_SECRET is not configured') {
      return next(Object.assign(err, { status: 500 }));
    }

    if (err.code || err.errno || err.sqlMessage) {
      return next(err);
    }

    // Return more specific error message if available from the library
    const errorMessage = err.message && err.message.includes('Token used too late') 
      ? 'Google token expired' 
      : 'Invalid Google token';

    return res.status(401).json({ 
      success: false, 
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production' ? { detail: err.message } : {})
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ? AND is_active = 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = {
      ...rows[0],
      roles: req.user.roles || [],
      permissions: req.user.permissions || [],
      isAdmin: Boolean(req.user.isAdmin),
    };

    res.json({ success: true, user: userData });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
