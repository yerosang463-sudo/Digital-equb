const { pool } = require('./src/config/db');

async function checkRoundSchema() {
  try {
    console.log('Checking equb_rounds table schema...');
    
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'digital_equb'
      AND TABLE_NAME = 'equb_rounds'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n=== equb_rounds Table Columns ===');
    if (columns && columns.length > 0) {
      columns.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (default: ${col.COLUMN_DEFAULT})`);
      });
    } else {
      console.log('No columns found or table does not exist');
    }
    
    // Check sample data
    const [sampleData] = await pool.execute(`
      SELECT * FROM equb_rounds LIMIT 5
    `);
    
    if (sampleData.length > 0) {
      console.log('\n=== Sample Round Data ===');
      sampleData.forEach(r => {
        console.log(r);
      });
    }
    
    // Check current rounds for active groups
    const [currentRounds] = await pool.execute(`
      SELECT r.*, g.name as group_name
      FROM equb_rounds r
      JOIN equb_groups g ON g.id = r.group_id
      WHERE r.status IN ('collecting', 'winner_selected')
      ORDER BY r.group_id, r.round_number DESC
    `);
    
    console.log('\n=== Current Active Rounds ===');
    currentRounds.forEach(r => {
      console.log(`Group: ${r.group_name} | Round: ${r.round_number} | Status: ${r.status}`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkRoundSchema();
