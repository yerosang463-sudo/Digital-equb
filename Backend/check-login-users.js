const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'yero',
  password: '@yero54321',
  database: 'digital-equb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

async function checkUsers() {
  try {
    console.log('Checking users table...');
    
    // Check all users
    const [users] = await pool.execute('SELECT id, full_name, email, is_active, created_at FROM users');
    console.log('\n=== All Users ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.full_name}, Email: ${user.email}, Active: ${user.is_active}`);
    });
    
    // Check if admin user exists
    const [admin] = await pool.execute("SELECT * FROM users WHERE email = 'yerosang463@gmail.com'");
    console.log('\n=== Admin User Check ===');
    if (admin.length > 0) {
      console.log('Admin user found:', admin[0]);
      console.log('Has password_hash:', !!admin[0].password_hash);
      console.log('Is active:', admin[0].is_active);
    } else {
      console.log('Admin user not found');
    }
    
    // Test password verification for admin
    if (admin.length > 0 && admin[0].password_hash) {
      const bcrypt = require('bcryptjs');
      const testPassword = '@yero27101620';
      const isMatch = await bcrypt.compare(testPassword, admin[0].password_hash);
      console.log('\n=== Password Verification Test ===');
      console.log('Test password:', testPassword);
      console.log('Password match:', isMatch);
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

checkUsers();
