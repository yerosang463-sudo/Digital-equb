const { pool } = require('../config/db');

// Store rate limit data in memory (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Rate limiting middleware for admin endpoints
 * Limits to 100 requests per 15 minutes per user
 */
const adminRateLimit = (req, res, next) => {
  // Only apply rate limiting to admin endpoints
  if (!req.path.startsWith('/api/admin')) {
    return next();
  }
  
  // Only apply to authenticated users
  if (!req.user || !req.user.id) {
    return next();
  }
  
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  // Get or create rate limit entry for user
  let userLimit = rateLimitStore.get(userId);
  
  if (!userLimit) {
    userLimit = {
      count: 0,
      resetTime: now + windowMs,
      firstRequestTime: now
    };
    rateLimitStore.set(userId, userLimit);
  }
  
  // Check if window has expired
  if (now > userLimit.resetTime) {
    // Reset the window
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
    userLimit.firstRequestTime = now;
  }
  
  // Check if limit exceeded
  if (userLimit.count >= maxRequests) {
    // Log violation to audit log if user is admin
    if (req.user.isAdmin) {
      logRateLimitViolation(req);
    }
    
    // Calculate retry time
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      limit: maxRequests,
      window: '15 minutes'
    });
  }
  
  // Increment count
  userLimit.count++;
  
  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - userLimit.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil(userLimit.resetTime / 1000));
  
  next();
};

/**
 * Log rate limit violation to audit log
 */
const logRateLimitViolation = async (req) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     req.connection.socket.remoteAddress;
    
    await pool.execute(`
      INSERT INTO admin_actions 
      (admin_user_id, action_type, target_type, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'rate_limit_violation',
      'system',
      JSON.stringify({
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }),
      ipAddress
    ]);
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
};

/**
 * Clean up old rate limit entries periodically
 */
const cleanupRateLimitStore = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [userId, limit] of rateLimitStore.entries()) {
    if (now - limit.firstRequestTime > oneHour) {
      rateLimitStore.delete(userId);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

module.exports = {
  adminRateLimit
};