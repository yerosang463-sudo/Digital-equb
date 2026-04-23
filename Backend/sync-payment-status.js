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

async function syncPaymentStatus() {
  try {
    console.log('Syncing payment status with has_paid_current_round field...');
    
    // Get all active groups
    const [groups] = await pool.execute(`
      SELECT id, name, status
      FROM equb_groups
      WHERE status IN ('open', 'active')
    `);
    
    console.log(`Processing ${groups.length} active groups`);
    
    for (const group of groups) {
      console.log(`\nProcessing group: ${group.name} (ID: ${group.id}, Status: ${group.status})`);
      
      // Get the current round for this group
      const [currentRound] = await pool.execute(`
        SELECT r.*
        FROM equb_rounds r
        WHERE r.group_id = ? 
        AND r.status IN ('collecting', 'winner_selected')
        ORDER BY r.round_number DESC
        LIMIT 1
      `, [group.id]);
      
      if (currentRound.length === 0) {
        console.log(`  No active round found for this group`);
        continue;
      }
      
      const round = currentRound[0];
      console.log(`  Current round: ${round.round_number} (ID: ${round.id}, Status: ${round.status})`);
      
      // Get completed payments for this group's current round
      const [roundPayments] = await pool.execute(`
        SELECT DISTINCT p.payer_id
        FROM payments p
        WHERE p.group_id = ? 
        AND p.round_id = ?
        AND p.status = 'completed'
      `, [group.id, round.id]);
      
      console.log(`  Found ${roundPayments.length} completed payments for current round`);
      
      // Update has_paid_current_round for members who have paid
      for (const payment of roundPayments) {
        await pool.execute(`
          UPDATE group_members
          SET has_paid_current_round = 1
          WHERE group_id = ? AND user_id = ?
        `, [group.id, payment.payer_id]);
        
        console.log(`  Updated payment status for user_id: ${payment.payer_id}`);
      }
      
      // Verify the updates
      const [memberStatus] = await pool.execute(`
        SELECT gm.user_id, u.full_name, gm.has_paid_current_round
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ?
      `, [group.id]);
      
      console.log(`  Member payment status after sync:`);
      memberStatus.forEach(m => {
        console.log(`    ${m.full_name}: has_paid_current_round = ${m.has_paid_current_round}`);
      });
    }
    
    console.log('\n✅ Payment status sync completed successfully');
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    console.error('Stack trace:', e.stack);
    process.exit(1);
  }
}

syncPaymentStatus();
