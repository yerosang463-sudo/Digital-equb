const { pool } = require('./src/config/db');

async function checkAllTables() {
  try {
    console.log('Checking all tables in digital_equb database...');
    
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'digital_equb'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n=== All Tables ===');
    tables.forEach(t => {
      console.log(`${t.TABLE_NAME} (${t.TABLE_TYPE})`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkAllTables();
