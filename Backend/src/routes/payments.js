const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const {
  buildTransactionReference,
  createNotification,
  ensureCurrentRound,
  ensureRoundPaymentsForMembers,
  getCurrentRound,
  getGroupById,
} = require('../utils/equb');

function basePaymentsQuery() {
  return `
    SELECT
      p.*,
      g.name AS group_name,
      u.full_name AS payer_name,
      r.status AS round_status,
      winner.full_name AS round_winner_name,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = p.group_id) as group_total_members,
      (SELECT COUNT(*) FROM payments p2 
       WHERE p2.group_id = p.group_id 
       AND p2.round_number = p.round_number 
       AND p2.status = 'completed') as round_paid_count
    FROM payments p
    JOIN equb_groups g ON p.group_id = g.id
    JOIN users u ON p.payer_id = u.id
    LEFT JOIN equb_rounds r ON p.round_id = r.id
    LEFT JOIN users winner ON r.winner_id = winner.id
  `;
}

async function syncUserGroupPayments(userId) {
  const [groups] = await pool.query(
    `SELECT DISTINCT g.id, g.status
     FROM equb_groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = ? AND g.status IN ('open', 'active')`,
    [userId]
  );

  for (const groupRef of groups) {
    const group = await getGroupById(pool, groupRef.id);
    if (!group) {
      continue;
    }

    let round = null;
    if (group.status === 'active') {
      round = await ensureCurrentRound(pool, group.id);
    } else {
      // For open groups, use the existing round (created at group creation)
      round = await getCurrentRound(pool, group.id);
    }

    if (!round) {
      continue;
    }

    await ensureRoundPaymentsForMembers(pool, group, {
      roundId: round.id,
      roundNumber: round.round_number,
      dueDate: round.due_date,
      onlyUserId: userId,
    });
  }
}

// GET /api/payments/summary/me - payment stats for the authenticated user
router.get('/summary/me', authenticate, async (req, res, next) => {
  try {
    const [stats] = await pool.query(
      `SELECT
         COUNT(*) AS total_payments,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_paid,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS total_pending
       FROM payments
       WHERE payer_id = ?`,
      [req.user.id]
    );

    res.json({ success: true, summary: stats[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments - list payments for authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    await syncUserGroupPayments(req.user.id);

    const { status, group_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = `${basePaymentsQuery()} WHERE p.payer_id = ?`;
    const params = [req.user.id];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (group_id) {
      query += ' AND p.group_id = ?';
      params.push(group_id);
    }

    query += ' ORDER BY COALESCE(p.due_date, p.created_at) DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), offset);

    const [rows] = await pool.query(query, params);

    res.json({ success: true, payments: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/group/:groupId - list all payments for a group
router.get('/group/:groupId', authenticate, async (req, res, next) => {
  try {
    const [member] = await pool.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.groupId, req.user.id]
    );

    if (member.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    const { status, round = 'all', page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = `${basePaymentsQuery()} WHERE p.group_id = ?`;
    const params = [req.params.groupId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (round === 'current') {
      query += ` AND p.round_id = (
        SELECT id
        FROM equb_rounds
        WHERE group_id = ? AND status IN ('collecting', 'winner_selected')
        ORDER BY round_number DESC
        LIMIT 1
      )`;
      params.push(req.params.groupId);
    } else if (round !== 'all') {
      query += ' AND p.round_number = ?';
      params.push(Number(round));
    }

    query += ' ORDER BY p.round_number DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), offset);

    const [rows] = await pool.query(query, params);

    res.json({ success: true, payments: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/:id/telebirr/simulate - simulate Telebirr payment
router.post(
  '/:id/telebirr/simulate',
  authenticate,
  [
    body('phone').notEmpty().trim().withMessage('Telebirr phone number is required'),
    body('notes').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [paymentRows] = await conn.query(
        `SELECT * FROM payments WHERE id = ? AND payer_id = ? FOR UPDATE`,
        [req.params.id, req.user.id]
      );

      if (paymentRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const payment = paymentRows[0];
      if (payment.status === 'completed') {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'This payment has already been completed' });
      }

      const transactionRef = buildTransactionReference('TB');

      await conn.query(
        `UPDATE payments
         SET status = 'completed',
             payment_method = 'telebirr',
             telebirr_phone = ?,
             simulation_status = 'success',
             transaction_ref = ?,
             notes = ?,
             paid_at = NOW()
         WHERE id = ?`,
        [req.body.phone, transactionRef, req.body.notes || 'Simulated Telebirr payment', req.params.id]
      );

      // Update member's paid status for current round (with error handling for missing column)
      try {
        await conn.query(
          `UPDATE group_members
           SET has_paid_current_round = 1
           WHERE group_id = ? AND user_id = ?`,
          [payment.group_id, payment.payer_id]
        );
      } catch (updateError) {
        if (updateError.message.includes('Unknown column')) {
          console.warn('has_paid_current_round column does not exist - skipping update');
        } else {
          throw updateError;
        }
      }

      const [admins] = await conn.query(
        `SELECT user_id
         FROM group_members
         WHERE group_id = ? AND role = 'admin'`,
        [payment.group_id]
      );

      const [payerUser] = await conn.query(`SELECT full_name FROM users WHERE id = ?`, [payment.payer_id]);
      const [groupDetails] = await conn.query(`SELECT name FROM equb_groups WHERE id = ?`, [payment.group_id]);

      const payerName = payerUser[0]?.full_name || 'A member';
      const groupName = groupDetails[0]?.name || 'a group';

      for (const admin of admins) {
        await createNotification(conn, {
          userId: admin.user_id,
          title: 'Payment received',
          message: `${payerName} completed a Telebirr payment for ${groupName}.`,
          type: 'payment_received',
          relatedGroupId: payment.group_id,
          relatedPaymentId: payment.id,
        });
      }

      await createNotification(conn, {
        userId: req.user.id,
        title: 'Payment successful',
        message: `Your Telebirr payment for ${groupName} was completed successfully.`,
        type: 'payment_received',
        relatedGroupId: payment.group_id,
        relatedPaymentId: payment.id,
      });

      const [updatedPayments] = await conn.query(
        `${basePaymentsQuery()} WHERE p.id = ?`,
        [req.params.id]
      );

      await conn.commit();

      res.json({
        success: true,
        message: 'Telebirr payment simulated successfully',
        payment: updatedPayments[0],
      });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  }
);

// GET /api/payments/:id - get single payment
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `${basePaymentsQuery()} WHERE p.id = ? AND p.payer_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, payment: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
