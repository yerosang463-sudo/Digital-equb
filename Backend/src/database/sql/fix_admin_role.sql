-- Find the user id for yerosang463@gmail.com and assign admin role
-- This script will assign the admin role to the user with this email

-- First, ensure the admin role exists
INSERT IGNORE INTO roles (name, description, permissions) VALUES
('admin', 'Full platform administrator with complete access to all features and data', '["users.view", "users.edit", "users.delete", "users.ban", "groups.view", "groups.edit", "groups.delete", "groups.force_close", "payments.view", "payments.edit", "payments.refund", "payouts.view", "payouts.edit", "analytics.view", "roles.assign", "roles.revoke", "system.manage"]');

-- Assign admin role to yerosang463@gmail.com
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT 
    u.id as user_id,
    r.id as role_id,
    u.id as assigned_by
FROM users u
CROSS JOIN roles r
WHERE u.email = 'yerosang463@gmail.com' 
  AND r.name = 'admin';

-- Verify the assignment
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';
