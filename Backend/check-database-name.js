const mysql = require('mysql2/promise');

async function checkDatabaseName() {
  try {
    // Connect with correct credentials from .env
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'yero',
      password: '@yero54321'
    });
    
    console.log('Connected to MySQL server');
    
    // List all databases
    const [databases] = await conn.execute(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE '%digital%'
      ORDER BY schema_name
    `);
    
    console.log('\n=== Available Databases ===');
    databases.forEach(db => {
      console.log(db.schema_name);
    });
    
    // Check tables in both database names
    for (const dbName of ['digital-equb', 'digital_equb']) {
      const [tables] = await conn.execute(`
        SELECT TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = ?
        ORDER BY table_name
      `, [dbName]);
      
      console.log(`\n=== Tables in ${dbName} ===`);
      if (tables.length > 0) {
        tables.forEach(t => console.log(t.TABLE_NAME));
      } else {
        console.log('No tables found');
      }
    }
    
    await conn.end();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkDatabaseName();
