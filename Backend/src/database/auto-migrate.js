const { pool } = require('../config/db');

async function tableExists(tableName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = ?`,
    [tableName]
  );

  return rows[0].count > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = ?
     AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows[0].count > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = ?
     AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  return rows[0].count > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    console.log(`${tableName}.${columnName} already exists`);
    return;
  }

  console.log(`Adding ${tableName}.${columnName}...`);
  await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function modifyColumnIfExists(tableName, columnName, definition) {
  if (!(await columnExists(tableName, columnName))) {
    return;
  }

  console.log(`Ensuring ${tableName}.${columnName} definition...`);
  await pool.execute(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${definition}`);
}

async function ensureGoogleAuthColumns() {
  if (!(await tableExists('users'))) {
    console.log('users table does not exist yet - skipping auth column migration');
    return;
  }

  await addColumnIfMissing('users', 'google_id', 'VARCHAR(255) NULL AFTER avatar_url');
  await addColumnIfMissing(
    'users',
    'auth_provider',
    "VARCHAR(30) NOT NULL DEFAULT 'local' AFTER google_id"
  );
  await addColumnIfMissing(
    'users',
    'email_verified',
    'TINYINT(1) DEFAULT 0 AFTER auth_provider'
  );

  if (!(await indexExists('users', 'unique_google_id'))) {
    console.log('Adding users.unique_google_id index...');
    await pool.execute('ALTER TABLE users ADD UNIQUE KEY unique_google_id (google_id)');
  }
}

async function ensureRbacTables() {
  console.log('Ensuring RBAC tables exist...');

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL,
      created_at DATETIME DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      assigned_by INT NULL,
      assigned_at DATETIME DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE KEY unique_user_role (user_id, role_id),
      INDEX idx_user_id (user_id),
      INDEX idx_role_id (role_id)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_user_id INT NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id INT,
      details TEXT,
      ip_address VARCHAR(45),
      created_at DATETIME DEFAULT NULL,
      FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_admin_user_id (admin_user_id),
      INDEX idx_action_type (action_type),
      INDEX idx_target (target_type, target_id),
      INDEX idx_created_at (created_at)
    )
  `);

  await pool.execute(`
    INSERT INTO roles (name, description, permissions)
    VALUES (
      'admin',
      'Full platform administrator with complete access to all features and data',
      '["users.view", "users.edit", "users.delete", "users.ban", "groups.view", "groups.edit", "groups.delete", "groups.force_close", "payments.view", "payments.edit", "payments.refund", "payouts.view", "payouts.edit", "analytics.view", "roles.assign", "roles.revoke", "system.manage"]'
    )
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      permissions = VALUES(permissions)
  `);
}

async function ensureGroupMemberPaymentColumn() {
  if (!(await tableExists('group_members'))) {
    console.log('group_members table does not exist yet - skipping group member migration');
    return;
  }

  await addColumnIfMissing(
    'group_members',
    'has_paid_current_round',
    'TINYINT(1) DEFAULT 0 AFTER role'
  );
}

async function ensurePaymentTableEnumModification() {
  if (!(await tableExists('payments'))) {
    console.log('payments table does not exist yet - skipping payment table migration');
    return;
  }

  await modifyColumnIfExists('payments', 'payment_method', "ENUM('bank_transfer', 'mobile_money', 'telebirr', 'cash', 'other', 'system_auto') DEFAULT 'telebirr'");
}

async function autoMigrate() {
  try {
    console.log('Running automatic database migrations...');

    await ensureGoogleAuthColumns();
    await ensureRbacTables();
    await ensureGroupMemberPaymentColumn();
    await ensurePaymentTableEnumModification();

    console.log('Automatic database migrations completed');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
}

module.exports = { autoMigrate };
