const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'Backend/.env' });

async function checkAdmin() {
  let conn;
  try {
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

    if (process.env.DB_HOST?.includes('tidbcloud.com')) {
      config.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
    }

    conn = await mysql.createConnection(config);

    console.log('Fetching admin role...');
    const [roles] = await conn.execute('SELECT * FROM roles WHERE name = "admin"');
    if (roles.length === 0) {
      console.log('Admin role not found!');
      return;
    }
    
    console.log('Admin role details:', JSON.stringify(roles[0], null, 2));
    
    // Add all possible permissions to the admin role
    const allPermissions = [
      "users.view", "users.edit", "users.delete", "users.ban", "users.hard_delete",
      "groups.view", "groups.edit", "groups.delete", "groups.force_close", "groups.members.manage",
      "payments.view", "payments.delete", "payments.refund",
      "payouts.view", "payouts.delete",
      "roles.assign", "roles.revoke",
      "analytics.view", "audit.view"
    ];
    
    console.log('Updating admin permissions...');
    await conn.execute(
      'UPDATE roles SET permissions = ? WHERE name = "admin"',
      [JSON.stringify(allPermissions)]
    );
    
    console.log('Successfully updated admin permissions to include all actions.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (conn) await conn.end();
  }
}

checkAdmin();
