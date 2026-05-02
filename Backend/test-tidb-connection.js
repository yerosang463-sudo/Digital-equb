/**
 * TiDB Connection Test Script
 * Run this to verify your TiDB connection before deploying
 * 
 * Usage: node test-tidb-connection.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testTiDBConnection() {
  console.log('=====================================');
  console.log('   TiDB Connection Test');
  console.log('=====================================\n');

  console.log('Configuration:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  Port:', process.env.DB_PORT);
  console.log('  User:', process.env.DB_USER);
  console.log('  Database:', process.env.DB_NAME);
  console.log('  Password:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NOT SET');
  console.log('\n');

  try {
    console.log('⏳ Connecting to TiDB...\n');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
    });

    console.log('✅ Connected to TiDB successfully!\n');

    // Test 1: Check database
    const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('📊 Current Database:', dbResult[0].current_db);

    // Test 2: Check TiDB version
    const [versionResult] = await connection.execute('SELECT VERSION() as version');
    console.log('🔧 TiDB Version:', versionResult[0].version);

    // Test 3: List tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found. Run migrations to create tables.');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
      });
    }

    // Test 4: Check connection status
    const [statusResult] = await connection.execute('SELECT 1 as status');
    console.log('\n✅ Connection Status: Active');

    await connection.end();
    console.log('\n=====================================');
    console.log('   ✅ All Tests Passed!');
    console.log('=====================================\n');
    console.log('Next steps:');
    console.log('1. If no tables found, run: node src/database/cli.js migrate');
    console.log('2. Update Render environment variables');
    console.log('3. Deploy to Render\n');

  } catch (error) {
    console.error('\n❌ Connection Failed!\n');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('1. Check DB_HOST is correct (no http://, no trailing /)');
    console.error('2. Check DB_PORT is 4000 (not 3306)');
    console.error('3. Verify DB_USER includes prefix (e.g., "4vKx123.root")');
    console.error('4. Check DB_PASSWORD is correct');
    console.error('5. Ensure database exists in TiDB Console');
    console.error('6. Check TiDB cluster is running\n');
    process.exit(1);
  }
}

// Run the test
testTiDBConnection();
