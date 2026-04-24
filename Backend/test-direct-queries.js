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

async function testQueries() {
  try {
    console.log('Testing payouts query directly...');
    
    // Test simple payouts query
    try {
      const [payouts] = await pool.execute('SELECT COUNT(*) as total FROM payouts');
      console.log('✅ Payouts count query works:', payouts[0].total);
    } catch (e) {
      console.error('❌ Payouts count query failed:', e.message);
    }
    
    // Test payouts select query
    try {
      const [payouts] = await pool.execute('SELECT * FROM payouts LIMIT 5');
      console.log('✅ Payouts select query works, found:', payouts.length);
    } catch (e) {
      console.error('❌ Payouts select query failed:', e.message);
    }
    
    console.log('\nTesting audit logs query directly...');
    
    // Test simple audit logs query
    try {
      const [logs] = await pool.execute('SELECT COUNT(*) as total FROM admin_actions');
      console.log('✅ Audit logs count query works:', logs[0].total);
    } catch (e) {
      console.error('❌ Audit logs count query failed:', e.message);
    }
    
    // Test audit logs select query
    try {
      const [logs] = await pool.execute('SELECT * FROM admin_actions LIMIT 5');
      console.log('✅ Audit logs select query works, found:', logs.length);
    } catch (e) {
      console.error('❌ Audit logs select query failed:', e.message);
    }
    
    console.log('\nTesting user query (for JOIN)...');
    
    // Test user query
    try {
      const [users] = await pool.execute('SELECT * FROM users LIMIT 1');
      console.log('✅ User query works, found:', users.length);
    } catch (e) {
      console.error('❌ User query failed:', e.message);
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

testQueries();
