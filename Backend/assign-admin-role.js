const { pool } = require('./src/config/db');

async function assignAdminRole() {
  const adminEmail = 'yerosang463@gmail.com';
  
  try {
    console.log('Assigning admin role to:', adminEmail);
    
    // Get user ID
    const [userRows] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );
    
    if (userRows.length === 0) {
      console.error('User not found:', adminEmail);
      return;
    }
    
    const userId = userRows[0].id;
    console.log('Found user ID:', userId);
    
    // Get admin role ID
    const [roleRows] = await pool.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['admin']
    );
    
    if (roleRows.length === 0) {
      console.error('Admin role not found in database');
      return;
    }
    
    const roleId = roleRows[0].id;
    console.log('Found admin role ID:', roleId);
    
    // Check if user already has admin role
    const [existingRows] = await pool.execute(
      'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, roleId]
    );
    
    if (existingRows.length > 0) {
      console.log('User already has admin role');
      return;
    }
    
    // Assign admin role
    await pool.execute(
      'INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at) VALUES (?, ?, ?, NOW())',
      [userId, roleId, userId]
    );
    
    console.log('✅ Admin role assigned successfully to:', adminEmail);
    console.log('User can now access admin dashboard with full permissions');
    
  } catch (error) {
    console.error('Error assigning admin role:', error);
  } finally {
    await pool.end();
  }
}

assignAdminRole();
