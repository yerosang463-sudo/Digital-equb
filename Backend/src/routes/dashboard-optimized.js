const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/combined - Single optimized query for all dashboard data
router.get('/combined', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const start = Date.now();

    // Single consolidated query - replaces 4 separate queries
    const [dashboardData] = await pool.query(`
      SELECT 
        -- Group Statistics
        COUNT(DISTINCT g.id) AS total_groups,
        SUM(CASE WHEN g.status = 'active' THEN 1 ELSE 0 END) AS active_groups,
        SUM(CASE WHEN gm.role = 'admin' THEN 1 ELSE 0 END) AS groups_as_admin,
        
        -- Payment Statistics  
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) AS total_contributed,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) AS pending_amount,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) AS pending_payments,
        
        -- Payout Statistics
        SUM(CASE WHEN po.status = 'paid' THEN po.amount ELSE 0 END) AS total_received,
        SUM(CASE WHEN po.status = 'scheduled' THEN po.amount ELSE 0 END) AS upcoming_payout,
        COUNT(CASE WHEN po.status = 'scheduled' THEN 1 END) AS scheduled_payouts,
        
        -- Notification Statistics
        COUNT(CASE WHEN n.is_read = 0 THEN 1 END) AS unread_notifications,
        
        -- Recent Groups (limited to 5)
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', g.id,
            ',"name":"', REPLACE(g.name, '"', '\\"'),
            '","status":"', g.status,
            '","contribution_amount":', IFNULL(g.contribution_amount, 0),
            ',"frequency":"', IFNULL(g.frequency, ''),
            '","role":"', IFNULL(gm.role, ''),
            '","member_count":', (
              SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id
            ),
            ',"max_members":', IFNULL(g.max_members, 0),
            ',"joined_at":"', IFNULL(gm.joined_at, ''),
            '"}'
          ) ORDER BY gm.joined_at DESC SEPARATOR '|'
        ) AS recent_groups_json,
        
        -- Recent Payments (limited to 5)
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', p.id,
            ',"amount":', IFNULL(p.amount, 0),
            ',"status":"', IFNULL(p.status, ''),
            ',"group_name":"', REPLACE(g2.name, '"', '\\"'),
            '","created_at":"', IFNULL(p.created_at, ''),
            '"}'
          ) ORDER BY p.created_at DESC SEPARATOR '|'
        ) AS recent_payments_json,
        
        -- Recent Payouts (limited to 5)
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', po.id,
            ',"amount":', IFNULL(po.amount, 0),
            ',"status":"', IFNULL(po.status, ''),
            ',"group_name":"', REPLACE(g3.name, '"', '\\"'),
            ',"scheduled_date":"', IFNULL(po.scheduled_date, ''),
            '"}'
          ) ORDER BY po.scheduled_date DESC SEPARATOR '|'
        ) AS recent_payouts_json,
        
        -- Recent Notifications (limited to 5)
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', n.id,
            ',"type":"', IFNULL(n.type, ''),
            ',"message":"', REPLACE(n.message, '"', '\\"'),
            '","created_at":"', IFNULL(n.created_at, ''),
            '","is_read":', IFNULL(n.is_read, 0),
            '"}'
          ) ORDER BY n.created_at DESC SEPARATOR '|'
        ) AS recent_notifications_json
        
      FROM group_members gm
      LEFT JOIN equb_groups g ON gm.group_id = g.id
      LEFT JOIN payments p ON p.payer_id = gm.user_id
      LEFT JOIN payouts po ON po.recipient_id = gm.user_id  
      LEFT JOIN notifications n ON n.user_id = gm.user_id
      LEFT JOIN equb_groups g2 ON g2.id = p.group_id
      LEFT JOIN equb_groups g3 ON g3.id = po.group_id
      WHERE gm.user_id = ?
      GROUP BY gm.user_id
    `, [userId]);

    if (dashboardData.length === 0) {
      return res.json({
        success: true,
        stats: {
          groups: { total_groups: 0, active_groups: 0, groups_as_admin: 0 },
          payments: { total_contributed: 0, pending_amount: 0, pending_payments: 0 },
          payouts: { total_received: 0, upcoming_payout: 0, scheduled_payouts: 0 },
          unread_notifications: 0
        },
        recent_groups: [],
        recent_payments: [],
        recent_payouts: [],
        recent_notifications: []
      });
    }

    const data = dashboardData[0];
    const queryTime = Date.now() - start;

    // Parse JSON arrays from GROUP_CONCAT results
    const parseJsonArray = (jsonString) => {
      if (!jsonString || jsonString === null) return [];
      try {
        return jsonString.split('|').map(item => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        }).filter(Boolean);
      } catch {
        return [];
      }
    };

    const response = {
      success: true,
      stats: {
        groups: {
          total_groups: data.total_groups || 0,
          active_groups: data.active_groups || 0,
          groups_as_admin: data.groups_as_admin || 0
        },
        payments: {
          total_contributed: Number(data.total_contributed || 0),
          pending_amount: Number(data.pending_amount || 0),
          pending_payments: data.pending_payments || 0
        },
        payouts: {
          total_received: Number(data.total_received || 0),
          upcoming_payout: Number(data.upcoming_payout || 0),
          scheduled_payouts: data.scheduled_payouts || 0
        },
        unread_notifications: data.unread_notifications || 0
      },
      recent_groups: parseJsonArray(data.recent_groups_json).slice(0, 5),
      recent_payments: parseJsonArray(data.recent_payments_json).slice(0, 5),
      recent_payouts: parseJsonArray(data.recent_payouts_json).slice(0, 5),
      recent_notifications: parseJsonArray(data.recent_notifications_json).slice(0, 5),
      performance: {
        query_time: `${queryTime}ms`,
        optimization: 'single_query_consolidated'
      }
    };

    // Add performance header
    res.set('X-Query-Time', `${queryTime}ms`);
    res.set('X-Optimization', 'consolidated-single-query');
    
    res.json(response);

  } catch (err) {
    console.error('Dashboard optimized endpoint error:', err);
    next(err);
  }
});

// GET /api/dashboard/stats-optimized - Optimized version of original stats endpoint
router.get('/stats-optimized', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const start = Date.now();

    // Single query for all stats - replaces 4 separate queries
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT g.id) AS total_groups,
        SUM(CASE WHEN g.status = 'active' THEN 1 ELSE 0 END) AS active_groups,
        SUM(CASE WHEN gm.role = 'admin' THEN 1 ELSE 0 END) AS groups_as_admin,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) AS total_contributed,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) AS pending_amount,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) AS pending_payments,
        SUM(CASE WHEN po.status = 'paid' THEN po.amount ELSE 0 END) AS total_received,
        SUM(CASE WHEN po.status = 'scheduled' THEN po.amount ELSE 0 END) AS upcoming_payout,
        COUNT(CASE WHEN po.status = 'scheduled' THEN 1 END) AS scheduled_payouts,
        COUNT(CASE WHEN n.is_read = 0 THEN 1 END) AS unread_notifications
      FROM group_members gm
      LEFT JOIN equb_groups g ON gm.group_id = g.id
      LEFT JOIN payments p ON p.payer_id = gm.user_id
      LEFT JOIN payouts po ON po.recipient_id = gm.user_id
      LEFT JOIN notifications n ON n.user_id = gm.user_id
      WHERE gm.user_id = ?
    `, [userId]);

    const queryTime = Date.now() - start;
    
    res.set('X-Query-Time', `${queryTime}ms`);
    res.set('X-Optimization', 'consolidated-stats-query');
    
    res.json({
      success: true,
      stats: {
        groups: {
          total_groups: stats[0]?.total_groups || 0,
          active_groups: stats[0]?.active_groups || 0,
          groups_as_admin: stats[0]?.groups_as_admin || 0
        },
        payments: {
          total_contributed: Number(stats[0]?.total_contributed || 0),
          pending_amount: Number(stats[0]?.pending_amount || 0),
          pending_payments: stats[0]?.pending_payments || 0
        },
        payouts: {
          total_received: Number(stats[0]?.total_received || 0),
          upcoming_payout: Number(stats[0]?.upcoming_payout || 0),
          scheduled_payouts: stats[0]?.scheduled_payouts || 0
        },
        unread_notifications: stats[0]?.unread_notifications || 0
      },
      performance: {
        query_time: `${queryTime}ms`,
        optimization: 'consolidated-stats-query'
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
