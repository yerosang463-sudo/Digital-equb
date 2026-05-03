const { pool } = require('../config/db');

/**
 * Middleware to log admin actions to audit log
 * Should be placed after authentication but before the route handler
 */
const auditLog = (actionType, targetType, getTargetId = null, getDetails = null) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    
    // Override send to capture response and log after action
    res.send = async function(data) {
      try {
        // Only log if user is admin and action was successful (2xx status)
        if (req.user && req.user.isAdmin && res.statusCode >= 200 && res.statusCode < 300) {
          const targetId = getTargetId ? getTargetId(req) : req.params.id || null;
          const details = getDetails ? getDetails(req, data) : {};
          
          // Add request information to details
          details.requestBody = req.body || {};
          details.requestParams = req.params || {};
          details.requestQuery = req.query || {};
          
          // Get IP address
          const ipAddress = req.headers['x-forwarded-for'] || 
                           req.connection.remoteAddress || 
                           req.socket.remoteAddress ||
                           req.connection.socket.remoteAddress;
          
          await pool.execute(`
            INSERT INTO admin_actions 
            (admin_user_id, action_type, target_type, target_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            req.user.id,
            actionType,
            targetType,
            targetId,
            JSON.stringify(details),
            ipAddress
          ]);
        }
      } catch (error) {
        console.error('Failed to log admin action:', error);
        // Don't fail the request if audit logging fails
      }
      
      // Call original send
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Simple audit middleware for basic actions
 */
const simpleAudit = (actionType, targetType) => {
  return auditLog(actionType, targetType);
};

/**
 * Get audit logs (admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      admin_user_id, 
      action_type, 
      target_type,
      start_date,
      end_date,
      search
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    const [auditTableRows] = await pool.execute(`SHOW TABLES LIKE 'admin_actions'`);
    if (!auditTableRows.length) {
      return res.json({
        success: true,
        data: {
          logs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    }

    const [auditColumns] = await pool.execute('SHOW COLUMNS FROM admin_actions');
    const auditColumnSet = new Set(auditColumns.map((column) => column.Field));

    const hasActionType = auditColumnSet.has('action_type');
    const hasTargetType = auditColumnSet.has('target_type');
    const hasTargetId = auditColumnSet.has('target_id');
    const hasDetails = auditColumnSet.has('details');
    const hasIpAddress = auditColumnSet.has('ip_address');
    const hasCreatedAt = auditColumnSet.has('created_at');

    // Get total count first
    let countQuery = `SELECT COUNT(*) as total FROM admin_actions WHERE 1=1`;
    const countParams = [];
    
    if (admin_user_id) {
      countQuery += ' AND admin_user_id = ?';
      countParams.push(admin_user_id);
    }
    
    if (action_type && hasActionType) {
      countQuery += ' AND action_type = ?';
      countParams.push(action_type);
    }
    
    if (target_type && hasTargetType) {
      countQuery += ' AND target_type = ?';
      countParams.push(target_type);
    }
    
    if (start_date && hasCreatedAt) {
      countQuery += ' AND DATE(created_at) >= ?';
      countParams.push(start_date);
    }
    
    if (end_date && hasCreatedAt) {
      countQuery += ' AND DATE(created_at) <= ?';
      countParams.push(end_date);
    }
    
    if (search && hasActionType) {
      countQuery += ' AND action_type LIKE ?';
      countParams.push(`%${search}%`);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    if (total === 0) {
      return res.json({
        success: true,
        data: {
          logs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    }

    // Simplified query without JOIN to avoid ECONNRESET errors
    let query = `
      SELECT
        id,
        admin_user_id,
        ${hasActionType ? 'action_type' : 'NULL'} as action_type,
        ${hasTargetType ? 'target_type' : 'NULL'} as target_type,
        ${hasTargetId ? 'target_id' : 'NULL'} as target_id,
        ${hasDetails ? 'details' : 'NULL'} as details,
        ${hasIpAddress ? 'ip_address' : 'NULL'} as ip_address,
        ${hasCreatedAt ? 'created_at' : 'NOW()'} as created_at
      FROM admin_actions
      WHERE 1=1
    `;
    
    const params = [];
    
    if (admin_user_id) {
      query += ' AND admin_user_id = ?';
      params.push(admin_user_id);
    }
    
    if (action_type && hasActionType) {
      query += ' AND action_type = ?';
      params.push(action_type);
    }
    
    if (target_type && hasTargetType) {
      query += ' AND target_type = ?';
      params.push(target_type);
    }
    
    if (start_date && hasCreatedAt) {
      query += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date && hasCreatedAt) {
      query += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }
    
    if (search && hasActionType) {
      query += ' AND action_type LIKE ?';
      params.push(`%${search}%`);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY ${hasCreatedAt ? 'created_at' : 'id'} DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    // Return logs without user details to avoid connection issues
    return res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    const currentPage = parseInt(req.query.page) || 1;
    const currentLimit = parseInt(req.query.limit) || 50;
    // Return empty result instead of error to prevent frontend crash
    return res.json({
      success: true,
      data: {
        logs: [],
        pagination: {
          page: currentPage,
          limit: currentLimit,
          total: 0,
          pages: 0,
        },
      },
    });
  }
};

module.exports = {
  auditLog,
  simpleAudit,
  getAuditLogs
};
