const { pool } = require('./src/config/db');

async function checkGroupSchema() {
  try {
    console.log('Checking equb_groups table schema...');
    
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'digital_equb'
      AND TABLE_NAME = 'equb_groups'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n=== equb_groups Table Columns ===');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (default: ${col.COLUMN_DEFAULT})`);
    });
    
    // Check sample data
    const [sampleData] = await pool.execute(`
      SELECT * FROM equb_groups LIMIT 1
    `);
    
    if (sampleData.length > 0) {
      console.log('\n=== Sample Group Data ===');
      console.log(sampleData[0]);
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkGroupSchema();
