const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeAdmin(email) {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'equb_db',
      ssl: process.env.DB_HOST?.includes('tidbcloud.com') ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      } : undefined
    });

    console.log(`Looking up user with email: ${email}`);
    const [users] = await conn.query('SELECT id, email FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log(`User with email ${email} not found.`);
      return;
    }
    
    const userId = users[0].id;
    console.log(`Found user ID: ${userId}`);

    // Check if admin role exists
    const [roles] = await conn.query('SELECT id FROM roles WHERE name = "admin"');
    let roleId;
    
    if (roles.length === 0) {
      console.log('Admin role does not exist. Please run simple_admin_fix.sql first, or manually create the role.');
      return;
    } else {
      roleId = roles[0].id;
      console.log(`Found admin role ID: ${roleId}`);
    }

    // Assign role
    const [existing] = await conn.query('SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, roleId]);
    if (existing.length > 0) {
      console.log('User is already an admin!');
    } else {
      await conn.query('INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)', [userId, roleId, userId]);
      console.log('Successfully assigned admin role to user!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

const targetEmail = process.argv[2] || 'zerishyero@gmail.com';
makeAdmin(targetEmail);
