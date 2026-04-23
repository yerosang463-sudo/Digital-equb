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

async function testPayoutsEndpoint() {
  try {
    console.log('Testing payouts endpoint logic...');
    
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [payoutTableRows] = await pool.execute(`SHOW TABLES LIKE 'payouts'`);
    console.log('Payouts table exists:', payoutTableRows.length > 0);
    
    if (!payoutTableRows || !payoutTableRows.length) {
      console.log('No payouts table found');
      process.exit(0);
    }

    const [payoutColumns] = await pool.execute('SHOW COLUMNS FROM payouts');
    const payoutColumnSet = new Set(payoutColumns.map((column) => column.Field));
    const [groupColumns] = await pool.execute('SHOW COLUMNS FROM equb_groups');
    const groupColumnSet = new Set(groupColumns.map((column) => column.Field));

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
    
    let query = `
      SELECT
        po.id, po.amount, po.status,
        ${roundNumberExpr} as round_number,
        ${scheduledDateExpr} as scheduled_date,
        ${paidAtExpr} as paid_at,
        ${createdAtExpr} as created_at,
        u.id as user_id, u.full_name as user_name, u.email as user_email,
        g.id as group_id, g.name as group_name,
        ${cycleRoundsExpr} as cycle_total_rounds
      FROM payouts po
      LEFT JOIN users u ON po.recipient_id = u.id
      LEFT JOIN equb_groups g ON po.group_id = g.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    console.log('Count query:', countQuery);
    
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;
    console.log('Total count:', total);
    
    // Add ordering and pagination
    query += ` ORDER BY ${sortColumn} DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    console.log('Final query:', query);
    console.log('Params:', params);
    
    try {
      const result = await pool.execute(query, params);
      console.log('Query result:', result);
      const rows = result[0];
      console.log('Found rows:', rows.length);
      
      if (rows.length > 0) {
        console.log('Sample row:', rows[0]);
      }
    } catch (queryError) {
      console.error('Query error:', queryError.message);
      console.log('Trying simpler query...');
      
      // Try simpler query without JOIN
      const simpleQuery = 'SELECT * FROM payouts ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const simpleResult = await pool.execute(simpleQuery, [parseInt(limit), parseInt(offset)]);
      console.log('Simple query result:', simpleResult);
      const simpleRows = simpleResult[0];
      console.log('Simple query found rows:', simpleRows.length);
      
      if (simpleRows.length > 0) {
        console.log('Sample simple row:', simpleRows[0]);
      }
    }
    
    if (rows.length > 0) {
      console.log('Sample row:', rows[0]);
    }
    
    console.log('\n=== Response Structure ===');
    const response = {
      success: true,
      data: {
        payouts: rows || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
    console.log(JSON.stringify(response, null, 2));
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

testPayoutsEndpoint();
