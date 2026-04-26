USE `sql12824412`;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_payment_reminders TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notify_winner_announcements TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notify_new_member_alerts TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notify_email_updates TINYINT(1) DEFAULT 1;

ALTER TABLE equb_groups
  ADD COLUMN IF NOT EXISTS cycle_total_rounds INT NULL,
  ADD COLUMN IF NOT EXISTS winner_selection_mode ENUM('manual', 'random') DEFAULT 'random',
  ADD COLUMN IF NOT EXISTS auto_select_winner TINYINT(1) DEFAULT 1;

UPDATE equb_groups g
SET g.cycle_total_rounds = (
  SELECT COUNT(*)
  FROM group_members gm
  WHERE gm.group_id = g.id
)
WHERE g.cycle_total_rounds IS NULL AND g.status IN ('active', 'completed');

CREATE TABLE IF NOT EXISTS equb_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  round_number INT NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('collecting', 'winner_selected', 'closed') DEFAULT 'collecting',
  winner_id INT NULL,
  winner_selected_by INT NULL,
  selection_method ENUM('manual', 'random', 'auto') NULL,
  started_at DATETIME DEFAULT NULL,
  closed_at TIMESTAMP NULL,
  UNIQUE KEY unique_group_round (group_id, round_number),
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_selected_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS round_id INT NULL,
  ADD COLUMN IF NOT EXISTS round_number INT NULL,
  ADD COLUMN IF NOT EXISTS telebirr_phone VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS simulation_status ENUM('initiated', 'success', 'failed') DEFAULT 'initiated';

ALTER TABLE payments
  MODIFY COLUMN payment_method ENUM('bank_transfer', 'mobile_money', 'telebirr', 'cash', 'other') DEFAULT 'telebirr';

SET @payments_round_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND CONSTRAINT_NAME = 'fk_payments_round_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @payments_round_fk_sql := IF(
  @payments_round_fk_exists = 0,
  'ALTER TABLE payments ADD CONSTRAINT fk_payments_round_id FOREIGN KEY (round_id) REFERENCES equb_rounds(id) ON DELETE SET NULL',
  'SELECT ''fk_payments_round_id already exists'' AS message'
);

PREPARE payments_round_fk_stmt FROM @payments_round_fk_sql;
EXECUTE payments_round_fk_stmt;
DEALLOCATE PREPARE payments_round_fk_stmt;

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS round_id INT NULL;

SET @payouts_round_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payouts'
    AND CONSTRAINT_NAME = 'fk_payouts_round_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @payouts_round_fk_sql := IF(
  @payouts_round_fk_exists = 0,
  'ALTER TABLE payouts ADD CONSTRAINT fk_payouts_round_id FOREIGN KEY (round_id) REFERENCES equb_rounds(id) ON DELETE SET NULL',
  'SELECT ''fk_payouts_round_id already exists'' AS message'
);

PREPARE payouts_round_fk_stmt FROM @payouts_round_fk_sql;
EXECUTE payouts_round_fk_stmt;
DEALLOCATE PREPARE payouts_round_fk_stmt;
