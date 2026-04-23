const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('../config/env');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user roles and permissions from database
    const [rows] = await pool.execute(`
      SELECT 
        r.name as role_name,
        r.permissions as role_permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [decoded.id]);
    
    // Extract roles and aggregate permissions
    const roles = rows.map(row => row.role_name);
    const permissions = [];
    
    // Aggregate permissions from all roles
    rows.forEach(row => {
      try {
        const rolePermissions = typeof row.role_permissions === 'string'
          ? JSON.parse(row.role_permissions)
          : row.role_permissions;
        if (Array.isArray(rolePermissions)) {
          permissions.push(...rolePermissions);
        }
      } catch (e) {
        console.error('Error parsing permissions JSON:', e);
      }
    });
    
    // Remove duplicate permissions
    const uniquePermissions = [...new Set(permissions)];
    
    // Add roles and permissions to user object
    req.user = {
      ...decoded,
      roles,
      permissions: uniquePermissions,
      isAdmin: roles.includes('admin')
    };
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
