-- Sample seed data for Digital Equb
USE `digital-equb`;

-- Clear existing data to avoid duplicate errors
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE payouts;
TRUNCATE TABLE payments;
TRUNCATE TABLE equb_rounds;
TRUNCATE TABLE group_members;
TRUNCATE TABLE equb_groups;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Sample users (password for all: password123)
-- Keeping only 2 users
INSERT INTO users (full_name, email, phone, password_hash, bio) VALUES
('Abebe Bekele', 'abebe@example.com', '+251911234567', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Equb enthusiast from Addis Ababa'),
('Tigist Alemayehu', 'tigist@example.com', '+251922345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Savings group coordinator');

-- Groups
-- Keeping only 2 groups
INSERT INTO equb_groups (
  name,
  description,
  contribution_amount,
  frequency,
  max_members,
  current_members,
  status,
  start_date,
  end_date,
  winner_selection_mode,
  auto_select_winner,
  created_by
) VALUES
('Family Savings Circle', 'Monthly family savings circle with random winner selection.', 500.00, 'monthly', 5, 2, 'active', '2026-01-01', '2026-05-31', 'random', 1, 1),
('Tech Professionals Equb', 'Professional circle for product builders and freelancers.', 1000.00, 'monthly', 4, 2, 'active', '2026-02-01', '2026-05-31', 'manual', 0, 2);

-- Members
INSERT INTO group_members (group_id, user_id, role, payout_order, has_received_payout, payout_date) VALUES
(1, 1, 'admin', 1, 1, '2026-01-31'),
(1, 2, 'member', 2, 0, NULL),
(2, 2, 'admin', 1, 1, '2026-02-28'),
(2, 1, 'member', 2, 0, NULL);

-- Rounds
INSERT INTO equb_rounds (id, group_id, round_number, due_date, status, winner_id, winner_selected_by, selection_method, started_at, closed_at) VALUES
(1, 1, 1, '2026-01-01', 'closed', 1, 1, 'manual', '2026-01-01 08:00:00', '2026-01-31 18:00:00'),
(2, 2, 1, '2026-02-01', 'closed', 2, 2, 'manual', '2026-02-01 08:00:00', '2026-02-28 18:00:00');

-- Payments
INSERT INTO payments (
  group_id,
  payer_id,
  round_id,
  round_number,
  amount,
  status,
  payment_method,
  transaction_ref,
  telebirr_phone,
  simulation_status,
  due_date,
  paid_at
) VALUES
(1, 1, 1, 1, 500.00, 'completed', 'telebirr', 'TB-ROUND1-USER1', '+251911234567', 'success', '2026-01-01', '2026-01-01 09:00:00'),
(2, 2, 1, 1, 1000.00, 'completed', 'telebirr', 'TB-TECH1-USER2', '+251922345678', 'success', '2026-02-01', '2026-02-01 09:00:00');

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, related_group_id, related_payment_id) VALUES
(1, 'Payment successful', 'Your contribution to Family Savings Circle was received.', 'payment_due', 0, 1, 1),
(2, 'Round closed', 'Round 1 for Tech Professionals Equb has been closed successfully.', 'group_update', 1, 2, NULL);

