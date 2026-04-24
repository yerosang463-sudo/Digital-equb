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

async function checkRoundsTable() {
  try {
    console.log('Checking rounds table...');
    
    // Check if table exists
    const [tables] = await pool.execute(`SHOW TABLES LIKE '%round%'`);
    console.log('\n=== Round-related tables ===');
    tables.forEach(table => {
      console.log(Object.values(table)[0]);
    });
    
    if (tables.length > 0) {
      const tableName = Object.values(tables[0])[0];
      console.log(`\nUsing table: ${tableName}`);
      
      // Check table structure
      const [columns] = await pool.execute(`SHOW COLUMNS FROM ${tableName}`);
      console.log('\n=== Table Columns ===');
      columns.forEach(col => {
        console.log(`${col.Field}: ${col.Type} (default: ${col.Default})`);
      });
      
      // Check if table has data
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
      console.log(`\nTotal records: ${count[0].total}`);
      
      // Try a sample query to check for cycle_number column
      try {
        const [sample] = await pool.execute(`SELECT * FROM ${tableName} LIMIT 1`);
        console.log('\nSample record:', sample[0]);
      } catch (queryError) {
        console.error('Error querying rounds table:', queryError.message);
      }
    } else {
      console.log('No round-related tables found');
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

checkRoundsTable();
