const { pool } = require('./src/config/db');

async function checkAdminSetup() {
  const adminEmail = 'yerosang463@gmail.com';
  
  try {
    console.log('=== Checking Admin Setup ===');
    console.log('Admin Email:', adminEmail);
    
    // Check if required tables exist
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('users', 'roles', 'user_roles')
    `);
    
    console.log('\n=== Tables Found ===');
    tables.forEach(table => console.log(`✓ ${table.TABLE_NAME}`));
    
    // Check if admin user exists
    const [users] = await pool.execute(
      'SELECT id, email, is_active FROM users WHERE email = ?',
      [adminEmail]
    );
    
    console.log('\n=== Admin User Check ===');
    if (users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const adminUser = users[0];
    console.log(`✓ User found: ID=${adminUser.id}, Email=${adminUser.email}, Active=${adminUser.is_active}`);
    
    // Check if roles table has admin role
    const [roles] = await pool.execute(
      'SELECT id, name, permissions FROM roles WHERE name = ?',
      ['admin']
    );
    
    console.log('\n=== Admin Role Check ===');
    if (roles.length === 0) {
      console.log('❌ Admin role not found in roles table');
      return;
    }
    
    const adminRole = roles[0];
    console.log(`✓ Admin role found: ID=${adminRole.id}`);
    console.log(`✓ Permissions: ${adminRole.permissions}`);
    
    // Check if user has admin role assigned
    const [userRoles] = await pool.execute(
      'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
      [adminUser.id, adminRole.id]
    );
    
    console.log('\n=== User Role Assignment Check ===');
    if (userRoles.length === 0) {
      console.log('❌ Admin role not assigned to user');
      console.log('Attempting to assign admin role...');
      
      await pool.execute(
        'INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at) VALUES (?, ?, ?, NOW())',
        [adminUser.id, adminRole.id, adminUser.id]
      );
      
      console.log('✅ Admin role assigned successfully');
    } else {
      console.log('✓ Admin role already assigned to user');
    }
    
    // Final check - simulate authentication
    console.log('\n=== Authentication Simulation ===');
    const [roleCheck] = await pool.execute(`
      SELECT 
        r.name as role_name,
        r.permissions as role_permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [adminUser.id]);
    
    if (roleCheck.length > 0) {
      const roles = roleCheck.map(r => r.role_name);
      const permissions = [];
      
      roleCheck.forEach(r => {
        try {
          const perms = JSON.parse(r.role_permissions);
          if (Array.isArray(perms)) {
            permissions.push(...perms);
          }
        } catch (e) {
          console.error('Error parsing permissions:', e);
        }
      });
      
      console.log(`✓ Roles: [${roles.join(', ')}]`);
      console.log(`✓ Permissions: [${permissions.join(', ')}]`);
      console.log(`✓ Is Admin: ${roles.includes('admin')}`);
    }
    
    console.log('\n=== Admin Setup Complete ===');
    
  } catch (error) {
    console.error('Error checking admin setup:', error);
  } finally {
    await pool.end();
  }
}

checkAdminSetup();
