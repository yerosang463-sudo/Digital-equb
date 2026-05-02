const mysql = require('mysql2/promise');
require('./env');

// Determine if we're using TiDB (check if host contains 'tidbcloud.com')
const isTiDB = process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'yero',
  password: process.env.DB_PASSWORD || '@yero54321',
  database: process.env.DB_NAME || 'digital-equb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  // Enable SSL for TiDB Cloud (required for secure connections)
  ssl: isTiDB ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : undefined
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully to database:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    console.error('DB_HOST:', process.env.DB_HOST);
    console.error('DB_USER:', process.env.DB_USER);
    console.error('DB_NAME:', process.env.DB_NAME);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
