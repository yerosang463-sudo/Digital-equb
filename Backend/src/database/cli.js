#!/usr/bin/env node

/**
 * Database CLI Tool
 * 
 * Usage:
 *   node backend/src/database/cli.js migrate     # Run migrations
 *   node backend/src/database/cli.js status     # Check migration status
 *   node backend/src/database/cli.js reset      # Reset database (dev only)
 */

const { DatabaseMigrator } = require('./migrator');
require('../config/env');

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'migrate':
        console.log('🔄 Running database migrations...');
        await DatabaseMigrator.runMigrations();
        console.log('✅ Migrations completed!');
        break;
        
      case 'status':
        console.log('📊 Checking migration status...');
        const executed = await DatabaseMigrator.getExecutedMigrations();
        
        if (executed.length === 0) {
          console.log('❌ No migrations have been executed');
        } else {
          console.log('✅ Executed migrations:');
          executed.forEach(migration => {
            console.log(`   📄 ${migration.filename} (${migration.executed_at})`);
          });
        }
        
        const isReady = await DatabaseMigrator.isDatabaseReady();
        console.log(`\n📊 Database ready: ${isReady ? '✅ Yes' : '❌ No'}`);
        break;
        
      case 'reset':
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Cannot reset database in production!');
          process.exit(1);
        }
        
        console.log('⚠️  This will delete all data! Are you sure? (y/N)');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', async (key) => {
          if (key.toString() === 'y' || key.toString() === 'Y') {
            await DatabaseMigrator.resetDatabase();
            console.log('✅ Database reset completed');
          } else {
            console.log('❌ Reset cancelled');
          }
          process.exit(0);
        });
        return;
        
      default:
        console.log('📖 Database CLI Tool');
        console.log('');
        console.log('Usage:');
        console.log('  node backend/src/database/cli.js migrate     # Run migrations');
        console.log('  node backend/src/database/cli.js status      # Check status');
        console.log('  node backend/src/database/cli.js reset       # Reset database (dev only)');
        console.log('');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main();