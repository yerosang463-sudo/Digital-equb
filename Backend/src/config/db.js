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
  connectionLimit: 20, // Increased from 10 for better concurrency
  queueLimit: 100, // Added queue limit to handle connection bursts
  maxIdle: 10, // Maximum idle connections
  idleTimeout: 60000, // 1 minute idle timeout
  acquireTimeout: 10000, // 10 seconds to acquire connection
  timezone: '+00:00',
  multipleStatements: true, // Enable multiple statements for batch queries
  namedPlaceholders: true, // Enable named placeholders for better performance
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

// Temporarily disable performance monitoring to fix deployment
// const { createPerformancePool } = require('../middleware/performance');
// const monitoredPool = createPerformancePool(pool);

module.exports = { pool, testConnection };
