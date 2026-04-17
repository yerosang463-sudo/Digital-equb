-- Digital Equb Database Schema
-- Database: digital-equb
-- User: yero

CREATE DATABASE IF NOT EXISTS `digital-equb`;
USE `digital-equb`;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  notify_payment_reminders TINYINT(1) DEFAULT 1,
  notify_winner_announcements TINYINT(1) DEFAULT 1,
  notify_new_member_alerts TINYINT(1) DEFAULT 0,
  notify_email_updates TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Equb groups table
CREATE TABLE IF NOT EXISTS equb_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  contribution_amount DECIMAL(12, 2) NOT NULL,
  frequency ENUM('weekly', 'biweekly', 'monthly') DEFAULT 'monthly',
  max_members INT NOT NULL DEFAULT 10,
  current_members INT DEFAULT 0,
  cycle_total_rounds INT DEFAULT NULL,
  status ENUM('open', 'active', 'completed', 'cancelled') DEFAULT 'open',
  start_date DATE,
  end_date DATE,
  winner_selection_mode ENUM('manual', 'random') DEFAULT 'random',
  auto_select_winner TINYINT(1) DEFAULT 1,
  created_by INT NOT NULL,
  total_pot DECIMAL(12, 2) GENERATED ALWAYS AS (contribution_amount * max_members) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
);

-- Group memberships table
CREATE TABLE IF NOT EXISTS group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  payout_order INT,
  has_received_payout TINYINT(1) DEFAULT 0,
  payout_date DATE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id)
);

-- Group rounds table
CREATE TABLE IF NOT EXISTS equb_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  round_number INT NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('collecting', 'winner_selected', 'closed') DEFAULT 'collecting',
  winner_id INT NULL,
  winner_selected_by INT NULL,
  selection_method ENUM('manual', 'random', 'auto') NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  UNIQUE KEY unique_group_round (group_id, round_number),
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_selected_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_round_group (group_id),
  INDEX idx_round_status (status)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  payer_id INT NOT NULL,
  round_id INT NULL,
  round_number INT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_method ENUM('bank_transfer', 'mobile_money', 'telebirr', 'cash', 'other') DEFAULT 'telebirr',
  transaction_ref VARCHAR(100),
  telebirr_phone VARCHAR(20),
  simulation_status ENUM('initiated', 'success', 'failed') DEFAULT 'initiated',
  due_date DATE,
  paid_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES equb_rounds(id) ON DELETE SET NULL,
  INDEX idx_payer_id (payer_id),
  INDEX idx_group_id (group_id),
  INDEX idx_round_id (round_id),
  INDEX idx_status (status)
);

-- Payouts table (who receives the pot each round)
CREATE TABLE IF NOT EXISTS payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  round_id INT NULL,
  recipient_id INT NOT NULL,
  round_number INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('scheduled', 'paid', 'cancelled') DEFAULT 'scheduled',
  scheduled_date DATE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES equb_rounds(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_id (group_id),
  INDEX idx_recipient_id (recipient_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('payment_due', 'payment_received', 'payout', 'group_invite', 'group_update', 'system') DEFAULT 'system',
  is_read TINYINT(1) DEFAULT 0,
  related_group_id INT,
  related_payment_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_group_id) REFERENCES equb_groups(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
);

-- Group join requests / invitations
CREATE TABLE IF NOT EXISTS group_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  invitee_email VARCHAR(150) NOT NULL,
  invited_by INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invitee_email (invitee_email),
  INDEX idx_group_id (group_id)
);
