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

async function checkPaymentStatus() {
  try {
    console.log('Checking member payment status...');
    
    // Check group members and their payment status
    const [members] = await pool.execute(`
      SELECT gm.id, gm.user_id, u.full_name, gm.group_id, g.name as group_name, 
             gm.has_paid_current_round, gm.role, gm.has_received_payout
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      JOIN equb_groups g ON g.id = gm.group_id
      ORDER BY gm.group_id, gm.payout_order
    `);
    
    console.log('\n=== Group Members Payment Status ===');
    members.forEach(m => {
      console.log(`Group: ${m.group_name} | Member: ${m.full_name} | Paid: ${m.has_paid_current_round} | Role: ${m.role} | Received Payout: ${m.has_received_payout}`);
    });
    
    // Check payments
    const [payments] = await pool.execute(`
      SELECT p.id, p.payer_id, u.full_name, p.group_id, g.name as group_name, 
             p.amount, p.status, p.round_number
      FROM payments p
      JOIN users u ON u.id = p.payer_id
      JOIN equb_groups g ON g.id = p.group_id
      ORDER BY p.group_id, p.round_number
    `);
    
    console.log('\n=== Payment Status ===');
    payments.forEach(p => {
      console.log(`Group: ${p.group_name} | Payer: ${p.full_name} | Amount: ${p.amount} | Status: ${p.status} | Round: ${p.round_number}`);
    });
    
    // Check for payment ID 82 specifically
    const [payment82] = await pool.execute(`
      SELECT p.*, u.full_name, g.name as group_name
      FROM payments p
      JOIN users u ON u.id = p.payer_id
      JOIN equb_groups g ON g.id = p.group_id
      WHERE p.id = 82
    `);
    
    if (payment82.length > 0) {
      console.log('\n=== Payment ID 82 Details ===');
      console.log(payment82[0]);
      
      // Check if corresponding member has has_paid_current_round set
      const [memberStatus] = await pool.execute(`
        SELECT gm.*, u.full_name
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ? AND gm.user_id = ?
      `, [payment82[0].group_id, payment82[0].payer_id]);
      
      if (memberStatus.length > 0) {
        console.log('\n=== Corresponding Member Status ===');
        console.log(memberStatus[0]);
      }
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkPaymentStatus();
