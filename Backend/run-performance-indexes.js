const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runPerformanceIndexes() {
  console.log('🚀 Adding performance indexes to TiDB Cloud...\n');

  try {
    // Connect to TiDB Cloud
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      }
    });

    console.log('✅ Connected to database:', process.env.DB_NAME);

    // Read and execute the SQL file
    const sqlFile = fs.readFileSync('./src/database/performance-indexes.sql', 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      const cleanStatement = statement.trim();
      
      // Skip comments and EXPLAIN statements
      if (cleanStatement.startsWith('--') || cleanStatement.startsWith('EXPLAIN')) {
        continue;
      }

      try {
        console.log(`📊 Executing: ${cleanStatement.substring(0, 50)}...`);
        await connection.execute(cleanStatement);
        console.log('✅ Success');
        successCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('already exists')) {
          console.log('⚠️  Index already exists - skipping');
          skipCount++;
        } else {
          console.error('❌ Error:', error.message);
        }
      }
    }

    console.log(`\n🎉 Index creation completed!`);
    console.log(`✅ Created: ${successCount} indexes`);
    console.log(`⚠️  Already existed: ${skipCount} indexes`);

    // Test performance improvement
    console.log('\n🔍 Testing query performance...');
    
    const start = Date.now();
    const [result] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT g.id) AS total_groups,
        SUM(CASE WHEN g.status = 'active' THEN 1 ELSE 0 END) AS active_groups,
        COUNT(CASE WHEN n.is_read = 0 THEN 1 END) AS unread_notifications
      FROM group_members gm
      LEFT JOIN equb_groups g ON gm.group_id = g.id
      LEFT JOIN notifications n ON n.user_id = gm.user_id
      WHERE gm.user_id = 1
      LIMIT 1
    `);
    
    const duration = Date.now() - start;
    console.log(`⚡ Test query completed in: ${duration}ms`);
    
    if (duration < 100) {
      console.log('🚀 EXCELLENT: Queries are now optimized!');
    } else if (duration < 200) {
      console.log('✅ GOOD: Queries are much faster');
    } else {
      console.log('⚠️  Still needs optimization');
    }

    await connection.end();
    console.log('\n✅ Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your .env database credentials');
    console.error('2. Ensure TiDB cluster is running');
    console.error('3. Verify database exists');
    process.exit(1);
  }
}

runPerformanceIndexes();
