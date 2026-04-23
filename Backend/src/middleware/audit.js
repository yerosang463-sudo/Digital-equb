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
    
    let query = `
      SELECT 
        aa.*,
        u.email as admin_email,
        u.full_name as admin_name
      FROM admin_actions aa
      JOIN users u ON aa.admin_user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (admin_user_id) {
      query += ' AND aa.admin_user_id = ?';
      params.push(admin_user_id);
    }
    
    if (action_type) {
      query += ' AND aa.action_type = ?';
      params.push(action_type);
    }
    
    if (target_type) {
      query += ' AND aa.target_type = ?';
      params.push(target_type);
    }
    
    if (start_date) {
      query += ' AND DATE(aa.created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(aa.created_at) <= ?';
      params.push(end_date);
    }
    
    if (search) {
      query += ' AND (u.email LIKE ? OR u.full_name LIKE ? OR aa.action_type LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;
    
    // Add ordering and pagination
    query += ' ORDER BY aa.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
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
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch audit logs' 
    });
  }
};

module.exports = {
  auditLog,
  simpleAudit,
  getAuditLogs
};