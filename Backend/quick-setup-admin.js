const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'yero',
  password: '@yero54321',
  database: 'digital-equb',
});

async function quickSetup() {
  try {
    const conn = await pool.getConnection();
    
    console.log('🔄 Quick setup: Creating users and admin...');
    
    // Create 5 users (password for all: password123, except admin)
    const passwordHash = await bcryptjs.hash('password123', 10);
    const adminPasswordHash = await bcryptjs.hash('@yero27101620', 10);
    
    const users = [
      { id: 1, name: 'Abebe Bekele', email: 'abebe@example.com', phone: '+251911234567', hash: passwordHash },
      { id: 2, name: 'Tigist Alemayehu', email: 'tigist@example.com', phone: '+251922345678', hash: passwordHash },
      { id: 3, name: 'Dawit Haile', email: 'dawit@example.com', phone: '+251933456789', hash: passwordHash },
      { id: 4, name: 'Meron Tadesse', email: 'meron@example.com', phone: '+251944567890', hash: passwordHash },
      { id: 5, name: 'System Administrator', email: 'yerosang463@gmail.com', phone: '+251900000000', hash: adminPasswordHash }
    ];
    
    for (const user of users) {
      await conn.execute(
        'INSERT INTO users (id, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?',
        [user.id, user.name, user.email, user.phone, user.hash, user.hash]
      );
    }
    console.log('✅ Created 5 users');
    
    // Create admin role
    await conn.execute(`
      INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE permissions = ?
    `, [
      1,
      'admin',
      'Full platform administrator',
      JSON.stringify(["users.view","users.edit","users.delete","users.ban","groups.view","groups.edit","groups.delete","groups.force_close","payments.view","payments.edit","payments.refund","payouts.view","payouts.edit","analytics.view","roles.assign","roles.revoke","system.manage"]),
      JSON.stringify(["users.view","users.edit","users.delete","users.ban","groups.view","groups.edit","groups.delete","groups.force_close","payments.view","payments.edit","payments.refund","payouts.view","payouts.edit","analytics.view","roles.assign","roles.revoke","system.manage"])
    ]);
    console.log('✅ Created admin role');
    
    // Assign admin role to user 5
    await conn.execute(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
      [5, 1, 5]
    );
    console.log('✅ Assigned admin role to yerosang463@gmail.com');
    
    // Create Testing Sample group
    await conn.execute(`
      INSERT INTO equb_groups (id, name, description, contribution_amount, frequency, max_members, current_members, cycle_total_rounds, status, start_date, end_date, is_public, winner_selection_mode, auto_select_winner, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = name
    `, [
      1, 'Testing Sample',
      'A public demo group showing a fully completed Equb cycle. All 4 members contributed 500 Birr each round and every member received their payout.',
      500.00, 'monthly', 4, 4, 4, 'completed', '2026-01-01', '2026-04-30', 1, 'random', 1, 1
    ]);
    console.log('✅ Created Testing Sample group');
    
    // Add members
    for (let i = 1; i <= 4; i++) {
      await conn.execute(`
        INSERT INTO group_members (group_id, user_id, role, payout_order, has_received_payout, payout_date)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE payout_order = payout_order
      `, [1, i, i === 1 ? 'admin' : 'member', i, 1, `2026-0${i}-30`]);
    }
    console.log('✅ Added 4 members');
    
    // Add rounds
    for (let i = 1; i <= 4; i++) {
      await conn.execute(`
        INSERT INTO equb_rounds (id, group_id, round_number, due_date, status, winner_id, winner_selected_by, selection_method, closed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE round_number = round_number
      `, [i, 1, i, `2026-0${i}-31`, 'closed', i, 1, 'random', `2026-0${i}-31 18:00:00`]);
    }
    console.log('✅ Added 4 rounds');
    
    // Add payments (4 members × 4 rounds = 16)
    let paymentId = 1;
    for (let round = 1; round <= 4; round++) {
      for (let user = 1; user <= 4; user++) {
        await conn.execute(`
          INSERT INTO payments (id, group_id, payer_id, round_id, round_number, amount, status, payment_method, simulation_status, due_date, paid_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE amount = amount
        `, [paymentId++, 1, user, round, round, 500.00, 'completed', 'telebirr', 'success', `2026-0${round}-31`, `2026-0${round}-${25+user} 10:00:00`]);
      }
    }
    console.log('✅ Added 16 payments');
    
    // Add payouts
    for (let i = 1; i <= 4; i++) {
      await conn.execute(`
        INSERT INTO payouts (id, group_id, round_id, recipient_id, round_number, amount, status, scheduled_date, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = amount
      `, [i, 1, i, i, i, 2000.00, 'paid', `2026-0${i}-31`, `2026-0${i}-31 18:00:00`]);
    }
    console.log('✅ Added 4 payouts');
    
    conn.release();
    console.log('\n🎉 Quick setup complete!');
    console.log('\n📧 Admin Login:');
    console.log('   Email: yerosang463@gmail.com');
    console.log('   Password: @yero27101620');
    console.log('\n📧 Test Users (password: password123):');
    console.log('   - abebe@example.com');
    console.log('   - tigist@example.com');
    console.log('   - dawit@example.com');
    console.log('   - meron@example.com');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickSetup();