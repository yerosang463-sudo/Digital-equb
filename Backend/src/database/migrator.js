const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

class DatabaseMigrator {
  /**
   * Run all database migrations automatically
   * This will execute SQL files in order and track what's been done
   */
  static async runMigrations() {
    try {
      console.log('Starting database migrations...');
      
      // Create migrations tracking table first
      await this.createMigrationsTable();
      
      // Define migration files in order (your existing files)
      const migrationFiles = [
        'schema.sql',        // Creates all tables
        'seed.sql',          // Initial data
        'migration_v2.sql',  // Version 2 changes
        'migration_v3.sql',  // Version 3 changes  
        'migration_v4.sql',  // Version 4 changes
        'migration_v5.sql'   // Version 5 changes (RBAC system)
      ];
      
      // Check if we need to force re-run schema.sql (if RBAC tables missing)
      const [existingSchema] = await pool.execute(
        'SELECT id FROM migrations WHERE filename = ?',
        ['schema.sql']
      );
      
      if (existingSchema.length > 0) {
        // Check if admin_actions table exists
        const [tables] = await pool.execute('SHOW TABLES LIKE "admin_actions"');
        if (tables.length === 0) {
          console.log('WARNING: RBAC tables missing, forcing re-run of schema.sql...');
          await this.forceRunMigrationFile('schema.sql');
        }
      }
      
      // Run each migration file
      for (const file of migrationFiles) {
        await this.runMigrationFile(file);
      }
      
      console.log('All database migrations completed successfully!');
      console.log('Database is ready for use');
      
    } catch (error) {
      console.error('Migration failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Create a table to track which migrations have been executed
   */
  static async createMigrationsTable() {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64),
          INDEX idx_filename (filename)
        )
      `);
    } catch (error) {
      // If this fails, database might not exist yet
      console.log('WARNING: Database connection issue, will retry...');
      throw error;
    }
  }
  
  /**
   * Execute a single migration file if it hasn't been run before
   */
  static async runMigrationFile(filename) {
    try {
      // Check if this migration was already executed
      const [existing] = await pool.execute(
        'SELECT id, executed_at FROM migrations WHERE filename = ?',
        [filename]
      );
      
      if (existing.length > 0) {
        console.log(`Skipping ${filename} (already executed on ${existing[0].executed_at})`);
        return;
      }
      
      // Check if file exists
      const sqlPath = path.join(__dirname, 'sql', filename);
      if (!fs.existsSync(sqlPath)) {
        console.log(`  Migration file ${filename} not found, skipping`);
        return;
      }
      
      console.log(`Executing migration: ${filename}`);
      
      // Read SQL file
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Split into individual statements (handle multi-statement files)
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      // Get a connection for executing statements
      const connection = await pool.getConnection();
      
      try {
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement) {
            try {
              // For all statements, use the connection's query method
              // This handles USE, SET, PREPARE, EXECUTE, DEALLOCATE, and regular SQL
              await connection.query(statement);
            } catch (stmtError) {
              // Some statements might fail if they already exist or tables don't exist
              // We'll log but continue for idempotent operations
              if (stmtError.code === 'ER_TABLE_EXISTS_ERROR' || 
                  stmtError.code === 'ER_DUP_ENTRY' ||
                  stmtError.code === 'ER_NO_SUCH_TABLE' ||
                  stmtError.message.includes('already exists') ||
                  stmtError.message.includes('doesn\'t exist')) {
                console.log(`   ℹ Statement ${i + 1} skipped (${stmtError.code || 'Table doesn\'t exist'})`);
              } else {
                console.error(`    Statement ${i + 1} failed:`, statement.substring(0, 100) + '...');
                throw stmtError;
              }
            }
          }
        }
      } finally {
        connection.release();
      }
      
      // Mark migration as completed
      await pool.execute(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      
      console.log(` Successfully executed: ${filename}`);
      
    } catch (error) {
      console.error(` Failed to execute migration ${filename}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Force re-run a migration file even if it was already executed
   * Useful for development when schema changes
   */
  static async forceRunMigrationFile(filename) {
    try {
      // Remove from migrations table if exists
      await pool.execute(
        'DELETE FROM migrations WHERE filename = ?',
        [filename]
      );
      
      // Now run the migration
      await this.runMigrationFile(filename);
      
    } catch (error) {
      console.error(`Failed to force execute migration ${filename}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get list of executed migrations
   */
  static async getExecutedMigrations() {
    try {
      const [rows] = await pool.execute(`
        SELECT filename, executed_at 
        FROM migrations 
        ORDER BY executed_at ASC
      `);
      return rows;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Check if database is ready (all migrations executed)
   */
  static async isDatabaseReady() {
    try {
      const executed = await this.getExecutedMigrations();
      const requiredMigrations = ['schema.sql', 'seed.sql'];
      
      return requiredMigrations.every(required => 
        executed.some(exec => exec.filename === required)
      );
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Reset database (for development only - removes all data!)
   */
  static async resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production!');
    }
    
    console.log('Resetting database...');
    
    // Drop migrations table
    await pool.execute('DROP TABLE IF EXISTS migrations');
    
    // You can add more cleanup here if needed
    console.log('Database reset completed');
  }
}

module.exports = { DatabaseMigrator };