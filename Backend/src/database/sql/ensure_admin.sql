USE `sql12824412`;

-- Step 1: Create/update the admin user with correct password
-- Password @yero27101620 hashed with bcrypt
INSERT INTO users (id, full_name, email, password_hash, is_active) 
VALUES (5, 'System Administrator', 'yerosang463@gmail.com', '$2a$10$sextGiFGU0hqdIAXw.Sk2edifMxJG1uhL4EEP49CBnUSSjtEwixAK', 1)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2a$10$sextGiFGU0hqdIAXw.Sk2edifMxJG1uhL4EEP49CBnUSSjtEwixAK',
    is_active = 1;

-- Step 2: Ensure admin role exists
INSERT IGNORE INTO roles (id, name, description, permissions) VALUES
(1, 'admin', 'Full platform administrator with complete access to all features and data', '["users.view", "users.edit", "users.delete", "users.ban", "groups.view", "groups.edit", "groups.delete", "groups.force_close", "payments.view", "payments.edit", "payments.refund", "payouts.view", "payouts.edit", "analytics.view", "roles.assign", "roles.revoke", "system.manage"]');

-- Step 3: Remove any existing role assignments for this user
DELETE FROM user_roles WHERE user_id = 5;

-- Step 4: Assign admin role to user ID 5
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (5, 1, 5);

-- Step 5: Verify everything is correct
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.is_active,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';

-- Step 6: Test query to verify admin permissions
SELECT 
    u.email,
    r.name as role,
    r.permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';
