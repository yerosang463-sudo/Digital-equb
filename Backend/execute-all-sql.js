const { pool } = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function executeSqlFile(filename) {
  try {
    console.log(`\n=== Executing ${filename} ===`);
    
    const sqlPath = path.join(__dirname, 'src', 'database', 'sql', filename);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Parse SQL statements (remove comments and empty lines)
    const statements = sql
      .split(/\r?\n/)
      .map(line => line.replace(/--.*$/, '').trim())
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('USE'));
    
    console.log(`Found ${statements.length} statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.execute(statement);
        console.log(`✓ Statement ${i + 1}: ${statement.substring(0, 50)}...`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_ENTRY' ||
            error.message.includes('already exists') ||
            error.message.includes('doesn\'t exist')) {
          console.log(`⚠ Statement ${i + 1} skipped (${error.code || 'Table doesn\'t exist'})`);
        } else {
          console.error(`✗ Statement ${i + 1} failed:`, statement.substring(0, 100) + '...');
          throw error;
        }
      }
    }
    
    console.log(`✅ ${filename} executed successfully`);
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    throw error;
  }
}

async function executeAllSql() {
  try {
    console.log('=== Executing All SQL Files on TiDB Database ===');
    
    // Test connection first
    console.log('Testing database connection...');
    await pool.execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Execute files in order
    const files = [
      'schema.sql',
      'migration_v2.sql', 
      'migration_v3.sql',
      'migration_v4.sql',
      'migration_v5.sql'
    ];
    
    for (const file of files) {
      await executeSqlFile(file);
    }
    
    // Verify tables were created
    console.log('\n=== Verifying Tables ===');
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    console.log('Tables created:');
    tables.forEach(table => console.log(`✓ ${table.TABLE_NAME}`));
    
    // Verify admin role setup
    console.log('\n=== Verifying Admin Setup ===');
    const [adminCheck] = await pool.execute(`
      SELECT 
        r.name as role_name,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      WHERE r.name = 'admin'
      GROUP BY r.id, r.name
    `);
    
    if (adminCheck.length > 0) {
      console.log(`✓ Admin role: ${adminCheck[0].role_name} (${adminCheck[0].user_count} users assigned)`);
    }
    
    console.log('\n=== All SQL Execution Complete ===');
    console.log('✅ Database is ready for admin dashboard');
    
  } catch (error) {
    console.error('❌ SQL execution failed:', error);
  } finally {
    await pool.end();
  }
}

executeAllSql();
