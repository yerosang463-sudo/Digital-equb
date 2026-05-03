const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'Backend/.env' });

async function resetAdminPassword() {
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

    const email = 'yerosang463@gmail.com'; // From .env ADMIN_EMAIL
    const newPassword = '@yero27101620';
    
    console.log(`Hashing new password for ${email}...`);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    console.log(`Updating password in database...`);
    const [result] = await conn.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, email]
    );

    if (result.affectedRows === 0) {
      console.log(`User ${email} not found. Checking for zerishyero@gmail.com...`);
      const alternateEmail = 'zerishyero@gmail.com';
      const [altResult] = await conn.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hash, alternateEmail]
      );
      if (altResult.affectedRows === 0) {
          console.log(`User ${alternateEmail} also not found.`);
      } else {
          console.log(`Successfully updated password for ${alternateEmail}`);
      }
    } else {
      console.log(`Successfully updated password for ${email}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (conn) await conn.end();
  }
}

resetAdminPassword();
