const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'yero',
  password: '@yero54321',
  database: 'digital-equb',
});

async function checkUsers() {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.execute('SELECT id, full_name, email FROM users ORDER BY id');
    console.log('👥 Current users:');
    users.forEach(user => {
      console.log(`  - ID ${user.id}: ${user.full_name} (${user.email})`);
    });
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
checkUsers();