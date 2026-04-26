USE `sql12824412`;

-- Check if your user exists and what ID it has
SELECT id, email, full_name FROM users WHERE email = 'yerosang463@gmail.com';

-- Check what roles exist
SELECT id, name FROM roles;

-- Check what roles are assigned to your user
SELECT 
    u.id as user_id,
    u.email,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'yerosang463@gmail.com';
