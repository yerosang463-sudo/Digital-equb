const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'yero',
  password: '@yero54321',
  database: 'digital-equb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

async function checkPayouts() {
  try {
    console.log('Checking payouts table and data...');
    
    // Check if payouts table exists
    const tableCheck = await pool.execute(`SHOW TABLES LIKE 'payouts'`);
    console.log('Payouts table exists:', tableCheck[0].length > 0);
    
    if (tableCheck[0].length > 0) {
      // Check table structure
      const columns = await pool.execute('SHOW COLUMNS FROM payouts');
      console.log('\n=== Payouts Table Columns ===');
      columns[0].forEach(col => {
        console.log(`${col.Field}: ${col.Type} (default: ${col.Default})`);
      });
      
      // Check sample data with error handling
      try {
        const payouts = await pool.execute('SELECT * FROM payouts LIMIT 5');
        console.log('\n=== Sample Payout Data ===');
        if (payouts[0].length > 0) {
          payouts[0].forEach(p => console.log(p));
        } else {
          console.log('No payouts found in database');
        }
      } catch (queryError) {
        console.error('Error querying payouts:', queryError.message);
        console.log('This might indicate a table corruption or connection issue');
      }
      
      // Test the full query that the admin endpoint uses
      try {
        const payoutColumns = await pool.execute('SHOW COLUMNS FROM payouts');
        const payoutColumnSet = new Set(payoutColumns[0].map((column) => column.Field));
        const groupColumns = await pool.execute('SHOW COLUMNS FROM equb_groups');
        const groupColumnSet = new Set(groupColumns[0].map((column) => column.Field));

        const roundNumberExpr = payoutColumnSet.has('round_number') ? 'po.round_number' : 'NULL';
        const scheduledDateExpr = payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'NULL';
        const paidAtExpr = payoutColumnSet.has('paid_at') ? 'po.paid_at' : 'NULL';
        const createdAtExpr = payoutColumnSet.has('created_at')
          ? 'po.created_at'
          : (payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'NOW()');
        const cycleRoundsExpr = groupColumnSet.has('cycle_total_rounds') ? 'g.cycle_total_rounds' : 'NULL';
        const sortColumn = payoutColumnSet.has('created_at')
          ? 'po.created_at'
          : (payoutColumnSet.has('scheduled_date') ? 'po.scheduled_date' : 'po.id');
        
        // Test simple query first
        console.log('\n=== Testing Simple Payout Query ===');
        const simpleQuery = 'SELECT * FROM payouts LIMIT 5';
        console.log('Simple query:', simpleQuery);
        
        const simpleResult = await pool.execute(simpleQuery);
        console.log('Simple result:', simpleResult);
        const simpleRows = simpleResult[0];
        console.log(`Found ${simpleRows.length} payouts with simple query`);
        
        // Now test the full query
        let query = `
          SELECT
            po.id, po.amount, po.status,
            po.round_number,
            po.scheduled_date,
            po.paid_at,
            po.created_at,
            u.id as user_id, u.full_name as user_name, u.email as user_email,
            g.id as group_id, g.name as group_name
          FROM payouts po
          JOIN users u ON po.recipient_id = u.id
          JOIN equb_groups g ON po.group_id = g.id
          WHERE 1=1
          ORDER BY po.created_at DESC
          LIMIT 10
        `;
        
        console.log('\n=== Testing Admin Payout Query ===');
        console.log('Query:', query);
        
        const result = await pool.execute(query);
        console.log('Query result:', result);
        const rows = result[0];
        console.log(`Found ${rows.length} payouts`);
        if (rows && rows.length > 0) {
          rows.forEach(r => console.log(r));
        } else {
          console.log('No payouts found with query');
        }
      } catch (queryError) {
        console.error('Error in full query test:', queryError.message);
        console.log('The admin endpoint should handle this gracefully');
      }
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

checkPayouts();
