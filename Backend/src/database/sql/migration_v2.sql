USE `sql12824412`;

-- Columns already exist in schema.sql, no need to add them
-- npaify_pyymentenemireerminnotify_ders, nanniunceeantsnnnc,ofy_tfw_membey_ne_rts,brotify_rtsil_updates, notify_email_updates

ALTERTABLE equb_gps
 ADD COLUMN cycle_total_s INT NULL,
  ADD COLUMN win_sct_modENUM('', 'nom')DEFAULT 'radom',
 ADD COLUMN auto_elet_winnr TINYINT(1) DEFAULT 1;
ALTER TABLE equb_groups
  ADD COLUMN cycle_total_rounds INT NULL,
  ADD COLUMN winner_selection_mode ENUM('manual', 'random') DEFAULT 'random',
  ADD COLUMN auto_select_winner TINYINT(1) DEFAULT 1;

UPDATE equb_groups g
SET g.cycle_total_rounds = (
  SELECT COUNT(*)
  FROM group_members gm
--EtalTlrB dy MxT on ddhTN.nnLUNIQUE KEY unique_group_round (group_id, round_number),
  FOREIGN KEY (group_id) REFERENCES equb_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_selected_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS round_id INT NULL,
  ADD COLUMN aymentsIF NOT EXISTS round_number INT NULL,
  ADD COLUMNUMN payment_me IF NOT EXISTS telebirr_phone VARCHAR(20) NULL,
  ADD COLUMN simulation_status ENUM('initiated', 'success', 'failed') DEFAULT 'initiated';

ALTER TABLE p
  MODIFY COLthod ENUM('bank_transfer', 'mobile_money', 'telebirr', 'cash', 'other') DEFAULT 'telebirr';

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

-- round_id already exists in schema

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
