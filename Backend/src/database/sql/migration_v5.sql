-- Migration v5: Add RBAC tables for admin system

-- Roles, user_roles, and admin_actions tables for role-based access control



USE `sql12824412`;



-- Roles table

CREATE TABLE IF NOT EXISTS roles (

  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(50) NOT NULL UNIQUE,

  description TEXT,

  permissions JSON NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_name (name)

);



-- User roles assignment table

CREATE TABLE IF NOT EXISTS user_roles (

  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  role_id INT NOT NULL,

  assigned_by INT NOT NULL,

  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,

  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_user_role (user_id, role_id),

  INDEX idx_user_id (user_id),

  INDEX idx_role_id (role_id)

);



-- Admin actions audit log

CREATE TABLE IF NOT EXISTS admin_actions (

  id INT AUTO_INCREMENT PRIMARY KEY,

  admin_user_id INT NOT NULL,

  action_type VARCHAR(50) NOT NULL,

  target_type VARCHAR(50) NOT NULL,

  target_id INT,

  details JSON,

  ip_address VARCHAR(45),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_admin_user_id (admin_user_id),

  INDEX idx_action_type (action_type),

  INDEX idx_target (target_type, target_id),

  INDEX idx_created_at (created_at)

);



-- Seed admin role

INSERT INTO roles (name, description, permissions) VALUES

('admin', 'Full platform administrator with complete access to all features and data', '["users.view", "users.edit", "users.delete", "users.ban", "groups.view", "groups.edit", "groups.delete", "groups.force_close", "payments.view", "payments.edit", "payments.refund", "payouts.view", "payouts.edit", "analytics.view", "roles.assign", "roles.revoke", "system.manage"]');