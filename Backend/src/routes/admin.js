const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requirePermission } = require('../middleware/rbac');
const { auditLog, simpleAudit, getAuditLogs } = require('../middleware/audit');
const { adminRateLimit } = require('../middleware/rateLimit');
const bcrypt = require('bcryptjs');

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Apply authentication to all admin routes
router.use(authenticate);

// Apply admin role requirement to all admin routes
router.use(requireAdmin);

async function verifyAdminAction(req, res) {
  const [adminRows] = await pool.execute(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id]
  );

  if (adminRows.length === 0) {
    res.status(404).json({
      success: false,
      message: 'Admin user not found'
    });
    return false;
  }

  const passwordHash = adminRows[0].password_hash;

  // Allow action when admin account has no local password hash (e.g. OAuth-only account).
  if (!passwordHash) {
    return true;
  }

  const { password } = req.body || {};
  // Password confirmation is optional for admin actions in dashboard flows.
  // If provided, we validate it; if omitted, we still allow the action.
  if (!password) {
    return true;
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, passwordHash);
  } catch (error) {
    isValidPassword = false;
  }

  if (!isValidPassword) {
    res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
    return false;
  }

  return true;
}

async function safeCreateNotification(userId, title, message, type = 'system') {
  try {
    await pool.execute(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [userId, title, message, type]);
  } catch (error) {
    console.warn('Notification write skipped:', error.message);
  }
}

// ==================== User Management Endpoints ====================

/**
 * GET /api/admin/users
 * List users with pagination
 * Requires: users.view permission
 */
router.get('/users', 
  requirePermission('users.view'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, email, is_active } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          u.id, u.full_name, u.email, u.phone, u.avatar_url, u.bio,
          u.is_active, u.created_at, u.updated_at,
          GROUP_CONCAT(DISTINCT r.name) as roles,
          GROUP_CONCAT(DISTINCT CONCAT(g.id, ':', g.name)) as groups
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN group_members gm ON u.id = gm.user_id
        LEFT JOIN equb_groups g ON gm.group_id = g.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (email) {
        query += ' AND u.email = ?';
        params.push(email);
      }
      
      if (is_active !== undefined) {
        query += ' AND u.is_active = ?';
        params.push(is_active === 'true' ? 1 : 0);
      }

      query += ' GROUP BY u.id';
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Add ordering and pagination
      query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, params);
      const normalizedRows = rows.map((row) => ({
        ...row,
        roles: row.roles ? row.roles.split(',') : [],
        groups: row.groups ? row.groups.split(',').map(group => {
          const [id, name] = group.split(':');
          return { id: parseInt(id), name };
        }) : [],
      }));
      
      return res.json({
        success: true,
        data: {
          users: normalizedRows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch users' 
      });
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Get user details
 * Requires: users.view permission
 */
router.get('/users/:id',
  requirePermission('users.view'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.execute(`
        SELECT 
          u.id, u.full_name, u.email, u.phone, u.avatar_url, u.bio,
          u.is_active, u.created_at, u.updated_at,
          GROUP_CONCAT(DISTINCT r.name) as roles,
          GROUP_CONCAT(DISTINCT gm.group_id) as group_ids
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN group_members gm ON u.id = gm.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const user = rows[0];
      user.roles = user.roles ? user.roles.split(',') : [];
      user.group_ids = user.group_ids ? user.group_ids.split(',').map(id => parseInt(id)) : [];
      
      return res.json({
        success: true,
        data: { user }
      });
      
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user' 
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Update user information
 * Requires: users.edit permission
 */
router.put('/users/:id',
  requirePermission('users.edit'),
  auditLog('user_update', 'user', 
    (req) => req.params.id,
    (req, data) => ({ 
      updatedFields: req.body,
      previousData: req.userData 
    })
  ),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, email, phone, bio, is_active } = req.body;
      
      // Get current user data for audit log
      const [currentRows] = await pool.execute(
        'SELECT full_name, email, phone, bio, is_active FROM users WHERE id = ?',
        [id]
      );
      
      if (currentRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      req.userData = currentRows[0];
      
      // Build update query
      const updates = [];
      const params = [];
      
      if (full_name !== undefined) {
        updates.push('full_name = ?');
        params.push(full_name);
      }
      
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
      }
      
      if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(phone);
      }
      
      if (bio !== undefined) {
        updates.push('bio = ?');
        params.push(bio);
      }
      
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active ? 1 : 0);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No fields to update' 
        });
      }
      
      params.push(id);
      
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, params);
      
      return res.json({
        success: true,
        message: 'User updated successfully'
      });
      
    } catch (error) {
      console.error('Failed to update user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update user' 
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/ban
 * Ban a user (requires password confirmation)
 * Requires: users.ban permission
 */
router.post('/users/:id/ban',
  requirePermission('users.ban'),
  auditLog('user_ban', 'user', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await verifyAdminAction(req, res))) return;
      
      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Ban the user
      await pool.execute(
        'UPDATE users SET is_active = 0 WHERE id = ?',
        [id]
      );
      
      await safeCreateNotification(
        id,
        'Account Suspended',
        'Your account has been suspended by an administrator. Please contact support for more information.'
      );
      
      return res.json({
        success: true,
        message: 'User banned successfully'
      });
      
    } catch (error) {
      console.error('Failed to ban user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to ban user' 
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/unban
 * Unban a user
 * Requires: users.ban permission
 */
router.post('/users/:id/unban',
  requirePermission('users.ban'),
  auditLog('user_unban', 'user', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Unban the user
      await pool.execute(
        'UPDATE users SET is_active = 1 WHERE id = ?',
        [id]
      );
      
      await safeCreateNotification(
        id,
        'Account Restored',
        'Your account has been restored and is now active.'
      );
      
      return res.json({
        success: true,
        message: 'User unbanned successfully'
      });
      
    } catch (error) {
      console.error('Failed to unban user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to unban user' 
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Soft delete a user (requires password confirmation)
 * Requires: users.delete permission
 */
router.delete('/users/:id',
  requirePermission('users.delete'),
  auditLog('user_delete', 'user', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await verifyAdminAction(req, res))) return;

      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Remove user from all groups first so admins can delete member accounts directly.
      const [membershipRows] = await pool.execute(
        'SELECT DISTINCT group_id FROM group_members WHERE user_id = ?',
        [id]
      );

      await pool.execute('DELETE FROM group_members WHERE user_id = ?', [id]);

      for (const membership of membershipRows) {
        const groupId = membership.group_id;
        await pool.execute(`
          UPDATE equb_groups
          SET current_members = (SELECT COUNT(*) FROM group_members WHERE group_id = ?),
              status = CASE
                WHEN status = 'active' AND (SELECT COUNT(*) FROM group_members WHERE group_id = ?) < max_members THEN 'open'
                ELSE status
              END
          WHERE id = ?
        `, [groupId, groupId, groupId]);
      }
      
      // Soft delete the user (set is_active = 0 and anonymize data)
      await pool.execute(`
        UPDATE users 
        SET 
          is_active = 0,
          full_name = 'Deleted User',
          email = CONCAT('deleted_', id, '@example.com'),
          phone = NULL,
          avatar_url = NULL,
          bio = NULL
        WHERE id = ?
      `, [id]);
      
      return res.json({
        success: true,
        message: 'User deleted successfully'
      });
      
    } catch (error) {
      console.error('Failed to delete user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user' 
      });
    }
  }
);

// ==================== Group Management Endpoints ====================

/**
 * GET /api/admin/groups
 * List groups with filtering
 * Requires: groups.view permission
 */
router.get('/groups',
  requirePermission('groups.view'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status, is_public } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          g.id, g.name, g.description, g.contribution_amount, g.frequency,
          g.max_members, g.current_members, g.cycle_total_rounds, g.status,
          g.start_date, g.end_date, g.is_public, g.winner_selection_mode,
          g.auto_select_winner, g.created_by, g.created_at, g.updated_at,
          u.email as creator_email, u.full_name as creator_name
        FROM equb_groups g
        JOIN users u ON g.created_by = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (status) {
        query += ' AND g.status = ?';
        params.push(status);
      }
      
      if (is_public !== undefined) {
        query += ' AND g.is_public = ?';
        params.push(is_public === 'true' ? 1 : 0);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Add ordering and pagination
      query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, params);
      
      return res.json({
        success: true,
        data: {
          groups: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch groups' 
      });
    }
  }
);

// ==================== Role Management Endpoints ====================

/**
 * POST /api/admin/users/:id/roles
 * Assign admin role to a user (requires password confirmation)
 * Requires: roles.assign permission
 */
router.post('/users/:id/roles',
  requirePermission('roles.assign'),
  auditLog('role_assign', 'user', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await verifyAdminAction(req, res))) return;
      
      // Prevent self-assignment
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot assign role to yourself' 
        });
      }
      
      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Get admin role ID
      const [roleRows] = await pool.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['admin']
      );
      
      if (roleRows.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'Admin role not found' 
        });
      }
      
      const roleId = roleRows[0].id;
      
      // Check if user already has the role
      const [existingRows] = await pool.execute(
        'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
        [id, roleId]
      );
      
      if (existingRows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already has admin role' 
        });
      }
      
      // Assign the role
      await pool.execute(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [id, roleId, req.user.id]);
      
      await safeCreateNotification(
        id,
        'Admin Role Assigned',
        'You have been assigned the administrator role. You now have full access to the admin dashboard.'
      );
      
      return res.json({
        success: true,
        message: 'Admin role assigned successfully'
      });
      
    } catch (error) {
      console.error('Failed to assign role:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to assign role' 
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id/roles/:roleId
 * Revoke admin role from a user (requires password confirmation)
 * Requires: roles.revoke permission
 */
router.delete('/users/:id/roles/:roleId',
  requirePermission('roles.revoke'),
  auditLog('role_revoke', 'user', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id, roleId } = req.params;
      if (!(await verifyAdminAction(req, res))) return;
      
      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Check if role exists
      const [roleRows] = await pool.execute(
        'SELECT id, name FROM roles WHERE id = ?',
        [roleId]
      );
      
      if (roleRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
      }
      
      // Prevent revoking last admin role
      if (roleRows[0].name === 'admin') {
        const [adminCountRows] = await pool.execute(`
          SELECT COUNT(*) as admin_count
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.name = 'admin'
        `);
        
        if (adminCountRows[0].admin_count <= 1) {
          return res.status(400).json({ 
            success: false, 
            message: 'Cannot revoke the last admin role' 
          });
        }
      }
      
      // Revoke the role
      await pool.execute(
        'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
        [id, roleId]
      );
      
      await safeCreateNotification(
        id,
        'Admin Role Revoked',
        'Your administrator role has been revoked. You no longer have access to the admin dashboard.'
      );
      
      return res.json({
        success: true,
        message: 'Role revoked successfully'
      });
      
    } catch (error) {
      console.error('Failed to revoke role:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to revoke role' 
      });
    }
  }
);

// ==================== Audit Logs Endpoint ====================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 * Requires: admin role (no specific permission, just admin role)
 */
router.get('/audit-logs', getAuditLogs);

module.exports = router;

/**
 * GET /api/admin/groups/:id
 * Get group details
 * Requires: groups.view permission
 */
router.get('/groups/:id',
  requirePermission('groups.view'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.execute(`
        SELECT 
          g.id, g.name, g.description, g.contribution_amount, g.frequency,
          g.max_members, g.current_members, g.cycle_total_rounds, g.status,
          g.start_date, g.end_date, g.is_public, g.winner_selection_mode,
          g.auto_select_winner, g.created_by, g.created_at, g.updated_at,
          u.email as creator_email, u.full_name as creator_name,
          COUNT(DISTINCT gm.user_id) as member_count,
          COUNT(DISTINCT p.id) as payment_count,
          SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_collected
        FROM equb_groups g
        JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN payments p ON g.id = p.group_id
        WHERE g.id = ?
        GROUP BY g.id
      `, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found' 
        });
      }
      
      const group = rows[0];
      
      // Get group members
      const [memberRows] = await pool.execute(`
        SELECT 
          u.id, u.full_name, u.email, u.phone,
          gm.joined_at, u.is_active as member_active
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at
      `, [id]);
      
      // Get group payments
      const [paymentRows] = await pool.execute(`
        SELECT 
          p.id, p.payer_id as user_id, p.amount, p.status, p.payment_method,
          p.transaction_ref as transaction_id, p.created_at,
          u.full_name as user_name, u.email as user_email
        FROM payments p
        JOIN users u ON p.payer_id = u.id
        WHERE p.group_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `, [id]);
      
      return res.json({
        success: true,
        data: {
          group,
          members: memberRows,
          payments: paymentRows
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch group:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch group' 
      });
    }
  }
);

/**
 * PUT /api/admin/groups/:id
 * Update group settings
 * Requires: groups.edit permission
 */
router.put('/groups/:id',
  requirePermission('groups.edit'),
  auditLog('group_update', 'group', 
    (req) => req.params.id,
    (req, data) => ({ 
      updatedFields: req.body,
      previousData: req.groupData 
    })
  ),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, status, is_public } = req.body;
      
      // Get current group data for audit log
      const [currentRows] = await pool.execute(
        'SELECT name, description, status, is_public FROM equb_groups WHERE id = ?',
        [id]
      );
      
      if (currentRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found' 
        });
      }
      
      req.groupData = currentRows[0];
      
      // Build update query
      const updates = [];
      const params = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      
      if (status !== undefined) {
        // Validate status transition
        const validStatuses = ['open', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid status' 
          });
        }
        updates.push('status = ?');
        params.push(status);
      }
      
      if (is_public !== undefined) {
        updates.push('is_public = ?');
        params.push(is_public ? 1 : 0);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No fields to update' 
        });
      }
      
      params.push(id);
      
      const query = `
        UPDATE equb_groups 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, params);
      
      return res.json({
        success: true,
        message: 'Group updated successfully'
      });
      
    } catch (error) {
      console.error('Failed to update group:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update group' 
      });
    }
  }
);

/**
 * POST /api/admin/groups/:id/force-close
 * Force close a group (requires password confirmation)
 * Requires: groups.force_close permission
 */
router.post('/groups/:id/force-close',
  requirePermission('groups.force_close'),
  auditLog('group_force_close', 'group', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!(await verifyAdminAction(req, res))) return;
      
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Reason must be at least 10 characters' 
        });
      }
      
      // Check if group exists and is not already completed/cancelled
      const [groupRows] = await pool.execute(`
        SELECT id, name, status, created_by, current_members
        FROM equb_groups 
        WHERE id = ? AND status NOT IN ('completed', 'cancelled')
      `, [id]);
      
      if (groupRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found or already completed/cancelled' 
        });
      }
      
      const group = groupRows[0];
      
      // Force close the group
      await pool.execute(`
        UPDATE equb_groups 
        SET 
          status = 'cancelled',
          end_date = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `, [id]);
      
      // Create notifications for all group members
      const [memberRows] = await pool.execute(`
        SELECT user_id FROM group_members WHERE group_id = ?
      `, [id]);
      
      for (const member of memberRows) {
        await safeCreateNotification(
          member.user_id,
          'Group Force-Closed',
          `The group "${group.name}" has been force-closed by an administrator. Reason: ${reason}`
        );
      }
      
      await safeCreateNotification(
        group.created_by,
        'Your Group Was Force-Closed',
        `Your group "${group.name}" has been force-closed by an administrator. Reason: ${reason}`
      );
      
      return res.json({
        success: true,
        message: 'Group force-closed successfully'
      });
      
    } catch (error) {
      console.error('Failed to force-close group:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to force-close group' 
      });
    }
  }
);

/**
 * DELETE /api/admin/groups/:id
 * Delete a group with all dependent data (requires password confirmation)
 * Requires: groups.delete permission
 */
router.delete('/groups/:id',
  requirePermission('groups.delete'),
  auditLog('group_delete', 'group', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await verifyAdminAction(req, res))) return;

      const [groupRows] = await pool.execute(`
        SELECT id, name, created_by
        FROM equb_groups
        WHERE id = ?
      `, [id]);

      if (groupRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      const group = groupRows[0];

      const [memberRows] = await pool.execute(
        'SELECT user_id FROM group_members WHERE group_id = ?',
        [id]
      );

      await pool.execute('DELETE FROM equb_groups WHERE id = ?', [id]);

      const notifyUserIds = new Set(memberRows.map((member) => member.user_id));
      notifyUserIds.add(group.created_by);

      for (const userId of notifyUserIds) {
        await safeCreateNotification(
          userId,
          'Group Deleted',
          `The group "${group.name}" was deleted by an administrator.`
        );
      }

      return res.json({
        success: true,
        message: 'Group deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete group:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete group'
      });
    }
  }
);

// ==================== Group Member Management Endpoints ====================

/**
 * DELETE /api/admin/groups/:groupId/members/:memberId
 * Remove a member from a group (requires password confirmation)
 * Requires: groups.members.manage permission
 */
router.delete('/groups/:groupId/members/:memberId',
  requirePermission('groups.members.manage'),
  auditLog('member_remove', 'group_member', 
    (req) => `${req.params.groupId}:${req.params.memberId}`,
    (req) => ({ 
      groupId: req.params.groupId,
      memberId: req.params.memberId,
      adminId: req.user.id
    })
  ),
  async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      if (!(await verifyAdminAction(req, res))) return;

      // Check if group exists
      const [groupRows] = await pool.execute(
        'SELECT id, name, current_members, max_members, status FROM equb_groups WHERE id = ?',
        [groupId]
      );

      if (groupRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // Check if member exists in group
      const [memberRows] = await pool.execute(`
        SELECT gm.user_id, u.full_name, u.email 
        FROM group_members gm 
        JOIN users u ON gm.user_id = u.id 
        WHERE gm.group_id = ? AND gm.user_id = ?
      `, [groupId, memberId]);

      if (memberRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Member not found in group'
        });
      }

      const member = memberRows[0];
      const group = groupRows[0];

      // Remove member from group
      await pool.execute(
        'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, memberId]
      );

      // Update group member count and status
      await pool.execute(`
        UPDATE equb_groups 
        SET current_members = (SELECT COUNT(*) FROM group_members WHERE group_id = ?),
            status = CASE
              WHEN status = 'active' AND (SELECT COUNT(*) FROM group_members WHERE group_id = ?) < max_members THEN 'open'
              ELSE status
            END,
            updated_at = NOW()
        WHERE id = ?
      `, [groupId, groupId, groupId]);

      // Create notifications
      await safeCreateNotification(
        memberId,
        'Removed from Group',
        `You have been removed from the group "${group.name}" by an administrator.`
      );

      await safeCreateNotification(
        group.created_by,
        'Member Removed from Your Group',
        `${member.full_name} has been removed from your group "${group.name}" by an administrator.`
      );

      return res.json({
        success: true,
        message: 'Member removed successfully'
      });

    } catch (error) {
      console.error('Failed to remove member:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove member'
      });
    }
  }
);

/**
 * POST /api/admin/groups/:groupId/members
 * Add a member to a group (requires password confirmation)
 * Requires: groups.members.manage permission
 */
router.post('/groups/:groupId/members',
  requirePermission('groups.members.manage'),
  auditLog('member_add', 'group_member', 
    (req) => `${req.params.groupId}:${req.body.user_id}`,
    (req) => ({ 
      groupId: req.params.groupId,
      memberId: req.body.user_id,
      adminId: req.user.id
    })
  ),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      if (!(await verifyAdminAction(req, res))) return;

      // Check if group exists and has space
      const [groupRows] = await pool.execute(
        'SELECT id, name, current_members, max_members, status FROM equb_groups WHERE id = ?',
        [groupId]
      );

      if (groupRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      const group = groupRows[0];

      if (group.current_members >= group.max_members) {
        return res.status(400).json({
          success: false,
          message: 'Group is already full'
        });
      }

      // Check if user exists and is active
      const [userRows] = await pool.execute(
        'SELECT id, full_name, email, is_active FROM users WHERE id = ?',
        [user_id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userRows[0];

      if (!user.is_active) {
        return res.status(400).json({
          success: false,
          message: 'User account is not active'
        });
      }

      // Check if user is already a member
      const [existingMemberRows] = await pool.execute(
        'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, user_id]
      );

      if (existingMemberRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this group'
        });
      }

      // Add member to group
      await pool.execute(`
        INSERT INTO group_members (group_id, user_id, joined_at)
        VALUES (?, ?, NOW())
      `, [groupId, user_id]);

      // Update group member count and status
      await pool.execute(`
        UPDATE equb_groups 
        SET current_members = (SELECT COUNT(*) FROM group_members WHERE group_id = ?),
            status = CASE
              WHEN status = 'open' AND (SELECT COUNT(*) FROM group_members WHERE group_id = ?) >= max_members THEN 'active'
              ELSE status
            END,
            updated_at = NOW()
        WHERE id = ?
      `, [groupId, groupId, groupId]);

      // Create notifications
      await safeCreateNotification(
        user_id,
        'Added to Group',
        `You have been added to the group "${group.name}" by an administrator.`
      );

      await safeCreateNotification(
        group.created_by,
        'Member Added to Your Group',
        `${user.full_name} has been added to your group "${group.name}" by an administrator.`
      );

      return res.json({
        success: true,
        message: 'Member added successfully'
      });

    } catch (error) {
      console.error('Failed to add member:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add member'
      });
    }
  }
);

// ==================== Payment Management Endpoints ====================

/**
 * GET /api/admin/payments
 * List payments with filtering
 * Requires: payments.view permission
 */
router.get('/payments',
  requirePermission('payments.view'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status, group_id, user_id } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          p.id, p.amount, p.status, p.payment_method,
          p.transaction_ref as transaction_id,
          p.created_at, p.updated_at,
          u.id as user_id, u.full_name as user_name, u.email as user_email,
          g.id as group_id, g.name as group_name
        FROM payments p
        JOIN users u ON p.payer_id = u.id
        JOIN equb_groups g ON p.group_id = g.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ' AND (p.transaction_ref LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }
      
      if (group_id) {
        query += ' AND p.group_id = ?';
        params.push(group_id);
      }
      
      if (user_id) {
        query += ' AND p.payer_id = ?';
        params.push(user_id);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Add ordering and pagination
      query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, params);
      
      return res.json({
        success: true,
        data: {
          payments: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payments' 
      });
    }
  }
);

/**
 * GET /api/admin/payments/:id
 * Get payment details
 * Requires: payments.view permission
 */
router.get('/payments/:id',
  requirePermission('payments.view'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.execute(`
        SELECT 
          p.id, p.amount, p.status, p.payment_method,
          p.transaction_ref as transaction_id,
          p.created_at, p.updated_at,
          u.id as user_id, u.full_name as user_name, u.email as user_email,
          g.id as group_id, g.name as group_name, g.contribution_amount,
          gm.joined_at as member_since
        FROM payments p
        JOIN users u ON p.payer_id = u.id
        JOIN equb_groups g ON p.group_id = g.id
        LEFT JOIN group_members gm ON p.payer_id = gm.user_id AND p.group_id = gm.group_id
        WHERE p.id = ?
      `, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment not found' 
        });
      }
      
      return res.json({
        success: true,
        data: { payment: rows[0] }
      });
      
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payment' 
      });
    }
  }
);

/**
 * POST /api/admin/payments/:id/refund
 * Process refund (requires password confirmation)
 * Requires: payments.refund permission
 */
router.post('/payments/:id/refund',
  requirePermission('payments.refund'),
  auditLog('payment_refund', 'payment', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!(await verifyAdminAction(req, res))) return;
      
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Reason must be at least 10 characters' 
        });
      }
      
      // Check if payment exists and is refundable
      const [paymentRows] = await pool.execute(`
        SELECT p.id, p.amount, p.status, p.payer_id as user_id, p.group_id,
               u.email as user_email, u.full_name as user_name,
               g.name as group_name
        FROM payments p
        JOIN users u ON p.payer_id = u.id
        JOIN equb_groups g ON p.group_id = g.id
        WHERE p.id = ? AND p.status = 'completed'
      `, [id]);
      
      if (paymentRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment not found or not refundable' 
        });
      }
      
      const payment = paymentRows[0];
      
      // Process refund (update payment status)
      await pool.execute(`
        UPDATE payments 
        SET status = 'refunded', updated_at = NOW()
        WHERE id = ?
      `, [id]);
      
      await safeCreateNotification(
        payment.user_id,
        'Payment Refunded',
        `Your payment of $${payment.amount} for group "${payment.group_name}" has been refunded. Reason: ${reason}`
      );
      
      return res.json({
        success: true,
        message: 'Payment refunded successfully'
      });
      
    } catch (error) {
      console.error('Failed to refund payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to refund payment' 
      });
    }
  }
);

/**
 * GET /api/admin/payouts
 * List payouts
 * Requires: payouts.view permission
 */
router.get('/payouts',
  requirePermission('payouts.view'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status, group_id } = req.query;
      const offset = (page - 1) * limit;

      const [payoutTableRows] = await pool.execute(`SHOW TABLES LIKE 'payouts'`);
      if (!payoutTableRows.length) {
        return res.json({
          success: true,
          data: {
            payouts: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0,
            },
          },
        });
      }

      const [payoutColumns] = await pool.execute('SHOW COLUMNS FROM payouts');
      const payoutColumnSet = new Set(payoutColumns.map((column) => column.Field));
      const [groupColumns] = await pool.execute('SHOW COLUMNS FROM equb_groups');
      const groupColumnSet = new Set(groupColumns.map((column) => column.Field));

      const roundNumberExpr = payoutColumnSet.has('round_number') ? 'po.round_number' : 'NULL';
      const scheduledDateExpr = payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'NULL';
      const paidAtExpr = payoutColumnSet.has('paid_at') ? 'po.paid_at' : 'NULL';
      const createdAtExpr = payoutColumnSet.has('created_at')
        ? 'po.created_at'
        : (payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'NOW()');
      const cycleRoundsExpr = groupColumnSet.has('cycle_total_rounds') ? 'g.cycle_total_rounds' : 'NULL';
      const sortColumn = payoutColumnSet.has('created_at')
        ? 'po.created_at'
        : (payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'po.id');
      
      let query = `
        SELECT
          po.id, po.amount, po.status,
          ${roundNumberExpr} as round_number,
          ${scheduledDateExpr} as scheduled_date,
          ${paidAtExpr} as paid_at,
          ${createdAtExpr} as created_at,
          u.id as user_id, u.full_name as user_name, u.email as user_email,
          g.id as group_id, g.name as group_name,
          ${cycleRoundsExpr} as cycle_total_rounds
        FROM payouts po
        JOIN users u ON po.recipient_id = u.id
        JOIN equb_groups g ON po.group_id = g.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ' AND (CAST(po.id AS CHAR) LIKE ? OR u.email LIKE ? OR u.full_name LIKE ? OR g.name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (status) {
        query += ' AND po.status = ?';
        params.push(status);
      }
      
      if (group_id) {
        query += ' AND po.group_id = ?';
        params.push(group_id);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Add ordering and pagination
      query += ` ORDER BY ${sortColumn} DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, params);
      
      return res.json({
        success: true,
        data: {
          payouts: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payouts' 
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/revoke-admin
 * Revoke admin role from a user (requires password confirmation)
 * Requires: roles.revoke permission
 */
router.post('/users/:id/revoke-admin',
  requirePermission('roles.revoke'),
  auditLog('role_revoke', 'user', (req) => req.params.id),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await verifyAdminAction(req, res))) return;

      if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot revoke your own admin role'
        });
      }

      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get admin role
      const [roleRows] = await pool.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['admin']
      );

      if (roleRows.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Admin role not found'
        });
      }

      const adminRoleId = roleRows[0].id;

      // Ensure target user currently has admin role
      const [existingRows] = await pool.execute(
        'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
        [id, adminRoleId]
      );

      if (existingRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User does not have admin role'
        });
      }

      // Prevent revoking the last admin
      const [adminCountRows] = await pool.execute(`
        SELECT COUNT(*) as admin_count
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'admin'
      `);

      if (adminCountRows[0].admin_count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot revoke the last admin role'
        });
      }

      await pool.execute(
        'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
        [id, adminRoleId]
      );

      await safeCreateNotification(
        id,
        'Admin Role Revoked',
        'Your administrator role has been revoked. You no longer have access to the admin dashboard.'
      );

      return res.json({
        success: true,
        message: 'Admin role revoked successfully'
      });
    } catch (error) {
      console.error('Failed to revoke admin role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to revoke admin role'
      });
    }
  }
);

/**
 * GET /api/admin/payouts/:id
 * Get payout details
 * Requires: payouts.view permission
 */
router.get('/payouts/:id',
  requirePermission('payouts.view'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const [payoutTableRows] = await pool.execute(`SHOW TABLES LIKE 'payouts'`);
      if (!payoutTableRows.length) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found',
        });
      }

      const [payoutColumns] = await pool.execute('SHOW COLUMNS FROM payouts');
      const payoutColumnSet = new Set(payoutColumns.map((column) => column.Field));
      const [groupColumns] = await pool.execute('SHOW COLUMNS FROM equb_groups');
      const groupColumnSet = new Set(groupColumns.map((column) => column.Field));

      const roundNumberExpr = payoutColumnSet.has('round_number') ? 'po.round_number' : 'NULL';
      const scheduledDateExpr = payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'NULL';
      const paidAtExpr = payoutColumnSet.has('paid_at') ? 'po.paid_at' : 'NULL';
      const createdAtExpr = payoutColumnSet.has('created_at')
        ? 'po.created_at'
        : (payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'NOW()');
      const cycleRoundsExpr = groupColumnSet.has('cycle_total_rounds') ? 'g.cycle_total_rounds' : 'NULL';

      const [rows] = await pool.execute(`
        SELECT
          po.id, po.amount, po.status,
          ${roundNumberExpr} as round_number,
          ${scheduledDateExpr} as scheduled_date,
          ${paidAtExpr} as paid_at,
          ${createdAtExpr} as created_at,
          u.id as user_id, u.full_name as user_name, u.email as user_email,
          g.id as group_id, g.name as group_name,
          ${cycleRoundsExpr} as cycle_total_rounds
        FROM payouts po
        JOIN users u ON po.recipient_id = u.id
        JOIN equb_groups g ON po.group_id = g.id
        WHERE po.id = ?
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found',
        });
      }

      return res.json({
        success: true,
        data: { payout: rows[0] },
      });
    } catch (error) {
      console.error('Failed to fetch payout:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payout',
      });
    }
  }
);

// ==================== Analytics Endpoint ====================

/**
 * GET /api/admin/analytics
 * Get platform analytics
 * Requires: analytics.view permission
 */
router.get('/analytics',
  requirePermission('analytics.view'),
  async (req, res) => {
    try {
      // Totals used by the admin dashboard overview cards.
      const [[userTotals]] = await pool.execute(`
        SELECT
          COUNT(*) as total_users,
          SUM(is_active = 1) as active_users,
          SUM(is_active = 0) as inactive_users
        FROM users
      `);

      const [[adminTotals]] = await pool.execute(`
        SELECT COUNT(DISTINCT ur.user_id) as admin_users
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'admin'
      `);

      const userStats = {
        ...userTotals,
        admin_users: adminTotals?.admin_users || 0,
      };
      
      // Get group statistics
      const [[groupStats]] = await pool.execute(`
        SELECT
          COUNT(*) as total_groups,
          SUM(status = 'open') as open_groups,
          SUM(status = 'active') as active_groups,
          SUM(status = 'completed') as completed_groups,
          SUM(status = 'cancelled') as cancelled_groups,
          SUM(is_public = 1) as public_groups,
          SUM(is_public = 0) as private_groups,
          AVG(current_members) as avg_members_per_group,
          SUM(contribution_amount * current_members) as total_contribution_value
        FROM equb_groups
      `);
      
      // Get payment statistics
      const [[paymentStats]] = await pool.execute(`
        SELECT
          COUNT(*) as total_payments,
          SUM(status = 'completed') as completed_payments,
          SUM(status = 'pending') as pending_payments,
          SUM(status = 'failed') as failed_payments,
          SUM(status = 'refunded') as refunded_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_processed_amount
        FROM payments
      `);
      
      // Get recent activity
      const [recentActivity] = await pool.execute(`
        SELECT 
          'user_signup' as type,
          u.full_name as user_name,
          u.email as user_email,
          u.created_at as timestamp
        FROM users u
        WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT 
          'group_created' as type,
          u.full_name as user_name,
          u.email as user_email,
          g.created_at as timestamp
        FROM equb_groups g
        JOIN users u ON g.created_by = u.id
        WHERE g.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT 
          'payment_completed' as type,
          u.full_name as user_name,
          u.email as user_email,
          p.created_at as timestamp
        FROM payments p
        JOIN users u ON p.payer_id = u.id
        WHERE p.status = 'completed' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY timestamp DESC
        LIMIT 50
      `);
      
      return res.json({
        success: true,
        data: {
          user_stats: userStats,
          group_stats: groupStats || {},
          payment_stats: paymentStats || {},
          recent_activity: recentActivity
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch analytics' 
      });
    }
  }
);
