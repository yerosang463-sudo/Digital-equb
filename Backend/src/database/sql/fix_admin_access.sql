-- First, check what user ID your email has
SELECT id, email, full_name FROM users WHERE email = 'yerosang463@gmail.com';

-- Check if roles table exists and what's in it
SELECT * FROM roles;

-- Check current role assignments
SELECT ur.user_id, ur.role_id, u.email, r.name as role_name 
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';

-- Fix: Get your actual user ID and assign admin role
INSERT IGNORE INTO roles (id, name, description, permissions) VALUES
(1, 'admin', 'Full platform administrator with complete access to all features and data', '["users.view", "users.edit", "users.delete", "users.ban", "groups.view", "groups.edit", "groups.delete", "groups.force_close", "payments.view", "payments.edit", "payments.refund", "payouts.view", "payouts.edit", "analytics.view", "roles.assign", "roles.revoke", "system.manage"]');

-- Assign admin role using your actual user ID (not hardcoded 5)
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, 1, u.id
FROM users u
WHERE u.email = 'yerosang463@gmail.com';

-- Final verification
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    r.name as role_name,
    r.permissions
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';
