const { pool } = require('../config/db');

async function autoMigrate() {
  try {
    console.log('Running automatic database migrations...');
    
    // Check if has_paid_current_round column exists
    const [columnCheck] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'group_members'
       AND COLUMN_NAME = 'has_paid_current_round'`
    );

    const columnExists = columnCheck[0].count > 0;
    
    if (!columnExists) {
      console.log('Adding has_paid_current_round column to group_members table...');
      
      await pool.execute(
        `ALTER TABLE group_members ADD COLUMN has_paid_current_round TINYINT(1) DEFAULT 0 AFTER role`
      );
      
      console.log('has_paid_current_round column added successfully');
    } else {
      console.log('has_paid_current_round column already exists');
    }
    
    // Verify the column was added
    const [verify] = await pool.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'group_members'
       AND COLUMN_NAME = 'has_paid_current_round'`
    );
    
    if (verify.length > 0) {
      console.log('Column verification successful:', verify[0]);
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
}

module.exports = { autoMigrate };
