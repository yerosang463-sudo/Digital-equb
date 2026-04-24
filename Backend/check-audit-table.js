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

async function checkAuditTable() {
  try {
    console.log('Checking admin_actions table...');
    
    // Check if table exists
    const [tables] = await pool.execute(`SHOW TABLES LIKE 'admin_actions'`);
    console.log('Table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check table structure
      const [columns] = await pool.execute('SHOW COLUMNS FROM admin_actions');
      console.log('\n=== Admin Actions Table Columns ===');
      columns.forEach(col => {
        console.log(`${col.Field}: ${col.Type} (default: ${col.Default})`);
      });
      
      // Check if table has data
      const [count] = await pool.execute('SELECT COUNT(*) as total FROM admin_actions');
      console.log(`\nTotal records: ${count[0].total}`);
      
      // Try a simple query
      try {
        const [sample] = await pool.execute('SELECT * FROM admin_actions LIMIT 1');
        console.log('\nSample record:', sample[0]);
      } catch (queryError) {
        console.error('Error querying admin_actions table:', queryError.message);
      }
    } else {
      console.log('admin_actions table does not exist. Creating it...');
      
      // Create the table
      await pool.execute(`
        CREATE TABLE admin_actions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_user_id INT NOT NULL,
          action_type VARCHAR(100),
          target_type VARCHAR(100),
          target_id INT,
          details TEXT,
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      console.log('admin_actions table created successfully');
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

checkAuditTable();
