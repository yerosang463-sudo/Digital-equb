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

async function fixPayoutsTable() {
  try {
    console.log('Checking and fixing payouts table...');
    
    // Check if table has data
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM payouts');
    console.log(`Total payouts in table: ${count[0].total}`);
    
    // Try a simple query to see if table is accessible
    try {
      const [sample] = await pool.execute('SELECT id, amount, status FROM payouts LIMIT 1');
      console.log('Sample payout:', sample[0]);
    } catch (queryError) {
      console.error('Error querying payouts table:', queryError.message);
      console.log('Attempting to recreate payouts table...');
      
      // Drop and recreate the table if it's corrupted
      await pool.execute('DROP TABLE IF EXISTS payouts');
      
      await pool.execute(`
        CREATE TABLE payouts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          group_id INT NOT NULL,
          recipient_id INT NOT NULL,
          round_number INT,
          round_id INT,
          amount DECIMAL(12,2) NOT NULL,
          status ENUM('scheduled', 'paid', 'cancelled') DEFAULT 'scheduled',
          scheduled_date DATE,
          paid_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      console.log('Payouts table recreated successfully');
    }
    
    // Verify the table is working now
    const [verify] = await pool.execute('SELECT COUNT(*) as total FROM payouts');
    console.log(`Verification: Total payouts after fix: ${verify[0].total}`);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

fixPayoutsTable();
