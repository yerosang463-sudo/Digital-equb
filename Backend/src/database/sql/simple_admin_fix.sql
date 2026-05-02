-- Get your user ID first
SELECT id, email FROM users WHERE email = 'yerosang463@gmail.com';

-- Delete any existing admin role assignments for your email
DELETE ur FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'yerosang463@gmail.com';

-- Create admin role with simple permissions
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full platform administrator', '["users.view", "users.edit", "users.delete", "users.ban", "groups.view", "groups.edit", "groups.delete", "groups.force_close", "payments.view", "payments.edit", "payments.refund", "payouts.view", "payouts.edit", "analytics.view", "roles.assign", "roles.revoke", "system.manage"]');

-- Assign admin role to your user
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, u.id
FROM users u, roles r
WHERE u.email = 'yerosang463@gmail.com' AND r.name = 'admin';

-- Check final result
SELECT 
    u.id,
    u.email,
    r.name as role,
    r.permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';
