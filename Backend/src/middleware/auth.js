const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { getJwtSecret } = require('../utils/authTokens');
require('../config/env');

function getBearerToken(req) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.trim().split(/\s+/);

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

async function getRolesAndPermissions(userId) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        r.name as role_name,
        r.permissions as role_permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]);

    const roles = rows.map((row) => row.role_name);
    const permissions = [];

    rows.forEach((row) => {
      try {
        const rolePermissions = typeof row.role_permissions === 'string'
          ? JSON.parse(row.role_permissions)
          : row.role_permissions;
        if (Array.isArray(rolePermissions)) {
          permissions.push(...rolePermissions);
        }
      } catch (error) {
        console.error('Error parsing permissions JSON:', error);
      }
    });

    return {
      roles,
      permissions: [...new Set(permissions)],
    };
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('RBAC tables are missing; continuing with no roles for user:', userId);
      return { roles: [], permissions: [] };
    }

    throw error;
  }
}

const authenticate = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header must be Bearer <token>',
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    if (err.message === 'JWT_SECRET is not configured') {
      console.error('[Auth] JWT_SECRET missing in environment');
      err.status = 500;
      return next(err);
    }

    console.error(`[Auth] Verification failed: ${err.name} - ${err.message}`);
    
    const message = err.name === 'TokenExpiredError'
      ? 'Your session has expired. Please login again.'
      : 'Invalid session token. Please login again.';

    const error = new Error(message);
    error.status = 401;
    error.name = err.name;
    return next(error);
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, full_name, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User account is not active' });
    }

    const access = await getRolesAndPermissions(decoded.id);

    req.user = {
      ...decoded,
      id: users[0].id,
      email: users[0].email,
      full_name: users[0].full_name,
      roles: access.roles,
      permissions: access.permissions,
      isAdmin: access.roles.includes('admin'),
    };

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { authenticate, getRolesAndPermissions };
