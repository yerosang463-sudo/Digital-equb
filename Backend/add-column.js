const { pool } = require('./src/config/db');

async function addColumn() {
  try {
    console.log('Checking if has_paid_current_round column exists...');
    
    const [check] = await pool.execute(
      'SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "group_members" AND COLUMN_NAME = "has_paid_current_round"'
    );
    
    console.log('Column exists:', check[0].count > 0);
    
    if (check[0].count === 0) {
      console.log('Adding column...');
      await pool.execute('ALTER TABLE group_members ADD COLUMN has_paid_current_round TINYINT(1) DEFAULT 0 AFTER role');
      console.log('✅ Column added successfully');
    } else {
      console.log('✅ Column already exists');
    }
    
    // Verify
    const [verify] = await pool.execute(
      'SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = "digital_equb" AND TABLE_NAME = "group_members" AND COLUMN_NAME = "has_paid_current_round"'
    );
    
    if (verify.length > 0) {
      console.log('✅ Verification successful:', verify[0]);
    }
    
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

addColumn();
