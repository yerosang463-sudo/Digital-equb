const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'Backend/.env' });

async function checkPermissions() {
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

    console.log('Checking admin role permissions...');
    const [perms] = await conn.query(`
      SELECT p.name 
      FROM permissions p 
      JOIN role_permissions rp ON p.id = rp.permission_id 
      JOIN roles r ON rp.role_id = r.id 
      WHERE r.name = 'admin'
    `);
    
    const permNames = perms.map(p => p.name);
    console.log('Admin permissions:', JSON.stringify(permNames, null, 2));

    const required = ['payments.delete', 'payouts.delete', 'users.hard_delete'];
    const missing = required.filter(p => !permNames.includes(p));

    if (missing.length > 0) {
      console.log('Missing permissions:', missing);
      console.log('Adding missing permissions...');

      for (const perm of missing) {
        // Find or create permission
        let [rows] = await conn.execute('SELECT id FROM permissions WHERE name = ?', [perm]);
        let permId;
        if (rows.length === 0) {
          const [result] = await conn.execute('INSERT INTO permissions (name, description) VALUES (?, ?)', [perm, `Allow ${perm.replace('.', ' ')}`]);
          permId = result.insertId;
        } else {
          permId = rows[0].id;
        }

        // Get admin role id
        const [roleRows] = await conn.execute('SELECT id FROM roles WHERE name = "admin"');
        const roleId = roleRows[0].id;

        // Assign to admin
        await conn.execute('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, permId]);
        console.log(`Assigned ${perm} to admin role.`);
      }
    } else {
      console.log('All required permissions are already assigned.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (conn) await conn.end();
  }
}

checkPermissions();
