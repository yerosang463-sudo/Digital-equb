/**
 * Middleware to require admin role
 * Checks if user has 'admin' role in their roles array
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin role required to access this resource' 
    });
  }
  next();
};

/**
 * Middleware factory to require specific permission
 * @param {string|string[]} requiredPermission - Single permission or array of permissions
 * @returns {Function} Middleware function
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // Admins have full access across the admin dashboard actions.
    if (req.user?.isAdmin) {
      return next();
    }

    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission check failed: user permissions not found' 
      });
    }
    
    const userPermissions = req.user.permissions;
    
    // Handle single permission string
    if (typeof requiredPermission === 'string') {
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          success: false, 
          message: `Permission '${requiredPermission}' required` 
        });
      }
    }
    // Handle array of permissions (user needs at least one)
    else if (Array.isArray(requiredPermission)) {
      const hasAnyPermission = requiredPermission.some(perm => 
        userPermissions.includes(perm)
      );
      
      if (!hasAnyPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `One of these permissions required: ${requiredPermission.join(', ')}` 
        });
      }
    }
    
    next();
  };
};

/**
 * Middleware to check if user has all specified permissions
 * @param {string[]} requiredPermissions - Array of permissions user must have all of
 * @returns {Function} Middleware function
 */
const requireAllPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    // Admins have full access across the admin dashboard actions.
    if (req.user?.isAdmin) {
      return next();
    }

    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission check failed: user permissions not found' 
      });
    }
    
    const userPermissions = req.user.permissions;
    const missingPermissions = requiredPermissions.filter(
      perm => !userPermissions.includes(perm)
    );
    
    if (missingPermissions.length > 0) {
      return res.status(403).json({ 
        success: false, 
        message: `Missing permissions: ${missingPermissions.join(', ')}` 
      });
    }
    
    next();
  };
};

module.exports = {
  requireAdmin,
  requirePermission,
  requireAllPermissions
};
