/**
 * Password Confirmation Middleware for Sensitive Admin Actions
 * Requires users to confirm their password for sensitive operations
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { createAuditLog } = require('./audit');

// Store failed attempts for temporary lockout
const failedAttempts = new Map();

/**
 * Cleans up expired failed attempt entries
 */
const cleanupFailedAttempts = () => {
  const now = Date.now();
  for (const [key, entry] of failedAttempts.entries()) {
    if (now > entry.expiresAt) {
      failedAttempts.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupFailedAttempts, 5 * 60 * 1000);

/**
 * Middleware to require password confirmation for sensitive actions
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum failed attempts before lockout (default: 3)
 * @param {number} options.lockoutMinutes - Lockout duration in minutes (default: 15)
 * @returns {Function} Middleware function
 */
const requirePasswordConfirmation = (options = {}) => {
  const maxAttempts = options.maxAttempts || 3;
  const lockoutMinutes = options.lockoutMinutes || 15;
  
  return async (req, res, next) => {
    // Only apply to authenticated users
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    const key = `password_confirm:${userId}`;
    const now = Date.now();
    
    // Check if user is locked out
    const lockoutEntry = failedAttempts.get(key);
    if (lockoutEntry && now < lockoutEntry.lockoutUntil) {
      const remainingMinutes = Math.ceil((lockoutEntry.lockoutUntil - now) / (60 * 1000));
      
      // Log lockout violation
      try {
        await createAuditLog(
          req,
          'password_confirm.lockout',
          'user',
          userId,
          {
            reason: 'Too many failed password confirmation attempts',
            failed_attempts: lockoutEntry.failedAttempts,
            lockout_remaining_minutes: remainingMinutes,
            action_attempted: req.originalUrl
          }
        );
      } catch (error) {
        console.error('Failed to log lockout violation:', error);
      }
      
      return res.status(403).json({
        success: false,
        message: `Account temporarily locked. Too many failed password confirmation attempts. Please try again in ${remainingMinutes} minutes.`,
        lockoutRemaining: remainingMinutes
      });
    }
    
    // Check for password in request body
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required for this action'
      });
    }
    
    try {
      // Fetch user's current password hash from database
      const [rows] = await pool.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = rows[0];
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        // Increment failed attempts
        const currentEntry = failedAttempts.get(key) || {
          failedAttempts: 0,
          expiresAt: now + (60 * 60 * 1000) // 1 hour expiration
        };
        
        currentEntry.failedAttempts++;
        
        // Check if lockout should be triggered
        if (currentEntry.failedAttempts >= maxAttempts) {
          currentEntry.lockoutUntil = now + (lockoutMinutes * 60 * 1000);
          failedAttempts.set(key, currentEntry);
          
          // Log lockout trigger
          try {
            await createAuditLog(
              req,
              'password_confirm.lockout_triggered',
              'user',
              userId,
              {
                failed_attempts: currentEntry.failedAttempts,
                lockout_minutes: lockoutMinutes,
                action_attempted: req.originalUrl
              }
            );
          } catch (error) {
            console.error('Failed to log lockout trigger:', error);
          }
          
          return res.status(403).json({
            success: false,
            message: `Too many failed password confirmation attempts. Account locked for ${lockoutMinutes} minutes.`,
            lockoutRemaining: lockoutMinutes
          });
        }
        
        failedAttempts.set(key, currentEntry);
        
        // Log failed attempt
        try {
          await createAuditLog(
            req,
            'password_confirm.failed',
            'user',
            userId,
            {
              failed_attempts: currentEntry.failedAttempts,
              max_attempts: maxAttempts,
              action_attempted: req.originalUrl
            }
          );
        } catch (error) {
          console.error('Failed to log failed attempt:', error);
        }
        
        return res.status(401).json({
          success: false,
          message: 'Invalid password confirmation',
          remainingAttempts: maxAttempts - currentEntry.failedAttempts
        });
      }
      
      // Password is valid - clear failed attempts
      failedAttempts.delete(key);
      
      // Log successful confirmation
      try {
        await createAuditLog(
          req,
          'password_confirm.success',
          'user',
          userId,
          {
            action_attempted: req.originalUrl,
            confirmed_at: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error('Failed to log successful confirmation:', error);
      }
      
      // Remove password from request body for security
      delete req.body.password;
      
      next();
    } catch (error) {
      console.error('Password confirmation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during password confirmation'
      });
    }
  };
};

/**
 * Middleware to require password confirmation for specific sensitive actions
 */
const sensitiveActions = {
  userBan: requirePasswordConfirmation(),
  userDelete: requirePasswordConfirmation(),
  groupForceClose: requirePasswordConfirmation(),
  paymentRefund: requirePasswordConfirmation(),
  roleAssignment: requirePasswordConfirmation(),
  roleRevocation: requirePasswordConfirmation()
};

module.exports = {
  requirePasswordConfirmation,
  sensitiveActions,
  failedAttempts // Export for testing
};