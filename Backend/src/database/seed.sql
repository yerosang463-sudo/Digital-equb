-- Sample seed data for Digital Equb
USE `digital-equb`;

-- Sample users (password for all: password123)
INSERT INTO users (full_name, email, phone, password_hash, bio) VALUES
('Abebe Bekele', 'abebe@example.com', '+251911234567', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Equb enthusiast from Addis Ababa'),
('Tigist Alemayehu', 'tigist@example.com', '+251922345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Savings group coordinator'),
('Daniel Haile', 'daniel@example.com', '+251933456789', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Tech professional and disciplined saver'),
('Sara Mulugeta', 'sara@example.com', '+251944567890', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Community organizer'),
('Yohannes Tadesse', 'yohannes@example.com', '+251955678901', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Entrepreneur building a family fund'),
('Dawit Alemu', 'dawit@example.com', '+251966789012', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Developer and group admin'),
('Meron Kebede', 'meron@example.com', '+251977890123', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Operations lead'),
('Helen Girma', 'helen@example.com', '+251988901234', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Saving for a new business');

-- Groups
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
('Family Savings Circle', 'Monthly family savings circle with random winner selection.', 500.00, 'monthly', 5, 5, 'active', '2026-01-01', '2026-05-31', 'random', 1, 1),
('Tech Professionals Equb', 'Professional circle for product builders and freelancers.', 1000.00, 'monthly', 4, 4, 'active', '2026-02-01', '2026-05-31', 'manual', 0, 6),
('Women Entrepreneurs Fund', 'Open group for small business capital planning.', 2000.00, 'monthly', 6, 3, 'open', '2026-03-01', '2026-08-31', 'random', 1, 4);

-- Members
INSERT INTO group_members (group_id, user_id, role, payout_order, has_received_payout, payout_date) VALUES
(1, 1, 'admin', 1, 1, '2026-01-31'),
(1, 2, 'member', 2, 1, '2026-02-28'),
(1, 3, 'member', 3, 0, NULL),
(1, 4, 'member', 4, 0, NULL),
(1, 5, 'member', 5, 0, NULL),
(2, 6, 'admin', 1, 1, '2026-02-28'),
(2, 1, 'member', 2, 0, NULL),
(2, 7, 'member', 3, 0, NULL),
(2, 8, 'member', 4, 0, NULL),
(3, 4, 'admin', 1, 0, NULL),
(3, 2, 'member', 2, 0, NULL),
(3, 5, 'member', 3, 0, NULL);

-- Rounds
INSERT INTO equb_rounds (id, group_id, round_number, due_date, status, winner_id, winner_selected_by, selection_method, started_at, closed_at) VALUES
(1, 1, 1, '2026-01-01', 'closed', 1, 1, 'manual', '2026-01-01 08:00:00', '2026-01-31 18:00:00'),
(2, 1, 2, '2026-02-01', 'closed', 2, 1, 'random', '2026-02-01 08:00:00', '2026-02-28 18:00:00'),
(3, 1, 3, '2026-03-01', 'winner_selected', 3, 1, 'auto', '2026-03-01 08:00:00', NULL),
(4, 2, 1, '2026-02-01', 'closed', 6, 6, 'manual', '2026-02-01 08:00:00', '2026-02-28 18:00:00'),
(5, 2, 2, '2026-03-01', 'collecting', NULL, NULL, NULL, '2026-03-01 08:00:00', NULL);

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
  paid_at,
  notes
) VALUES
(1, 1, 1, 1, 500.00, 'completed', 'telebirr', 'TB-ROUND1-USER1', '+251911234567', 'success', '2026-01-01', '2026-01-01 09:00:00', 'Simulated Telebirr payment'),
(1, 2, 1, 1, 500.00, 'completed', 'telebirr', 'TB-ROUND1-USER2', '+251922345678', 'success', '2026-01-01', '2026-01-01 09:10:00', 'Simulated Telebirr payment'),
(1, 3, 1, 1, 500.00, 'completed', 'telebirr', 'TB-ROUND1-USER3', '+251933456789', 'success', '2026-01-01', '2026-01-01 09:20:00', 'Simulated Telebirr payment'),
(1, 4, 1, 1, 500.00, 'completed', 'telebirr', 'TB-ROUND1-USER4', '+251944567890', 'success', '2026-01-01', '2026-01-01 09:30:00', 'Simulated Telebirr payment'),
(1, 5, 1, 1, 500.00, 'completed', 'telebirr', 'TB-ROUND1-USER5', '+251955678901', 'success', '2026-01-01', '2026-01-01 09:40:00', 'Simulated Telebirr payment'),
(1, 1, 2, 2, 500.00, 'completed', 'telebirr', 'TB-ROUND2-USER1', '+251911234567', 'success', '2026-02-01', '2026-02-01 09:00:00', 'Simulated Telebirr payment'),
(1, 2, 2, 2, 500.00, 'completed', 'telebirr', 'TB-ROUND2-USER2', '+251922345678', 'success', '2026-02-01', '2026-02-01 09:10:00', 'Simulated Telebirr payment'),
(1, 3, 2, 2, 500.00, 'completed', 'telebirr', 'TB-ROUND2-USER3', '+251933456789', 'success', '2026-02-01', '2026-02-01 09:20:00', 'Simulated Telebirr payment'),
(1, 4, 2, 2, 500.00, 'completed', 'telebirr', 'TB-ROUND2-USER4', '+251944567890', 'success', '2026-02-01', '2026-02-01 09:30:00', 'Simulated Telebirr payment'),
(1, 5, 2, 2, 500.00, 'completed', 'telebirr', 'TB-ROUND2-USER5', '+251955678901', 'success', '2026-02-01', '2026-02-01 09:40:00', 'Simulated Telebirr payment'),
(1, 1, 3, 3, 500.00, 'completed', 'telebirr', 'TB-ROUND3-USER1', '+251911234567', 'success', '2026-03-01', '2026-03-01 09:00:00', 'Simulated Telebirr payment'),
(1, 2, 3, 3, 500.00, 'completed', 'telebirr', 'TB-ROUND3-USER2', '+251922345678', 'success', '2026-03-01', '2026-03-01 09:10:00', 'Simulated Telebirr payment'),
(1, 3, 3, 3, 500.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment'),
(1, 4, 3, 3, 500.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment'),
(1, 5, 3, 3, 500.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment'),
(2, 6, 4, 1, 1000.00, 'completed', 'telebirr', 'TB-TECH1-USER6', '+251966789012', 'success', '2026-02-01', '2026-02-01 09:00:00', 'Simulated Telebirr payment'),
(2, 1, 4, 1, 1000.00, 'completed', 'telebirr', 'TB-TECH1-USER1', '+251911234567', 'success', '2026-02-01', '2026-02-01 09:10:00', 'Simulated Telebirr payment'),
(2, 7, 4, 1, 1000.00, 'completed', 'telebirr', 'TB-TECH1-USER7', '+251977890123', 'success', '2026-02-01', '2026-02-01 09:20:00', 'Simulated Telebirr payment'),
(2, 8, 4, 1, 1000.00, 'completed', 'telebirr', 'TB-TECH1-USER8', '+251988901234', 'success', '2026-02-01', '2026-02-01 09:30:00', 'Simulated Telebirr payment'),
(2, 6, 5, 2, 1000.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment'),
(2, 1, 5, 2, 1000.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment'),
(2, 7, 5, 2, 1000.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment'),
(2, 8, 5, 2, 1000.00, 'pending', 'telebirr', NULL, NULL, 'initiated', '2026-03-01', NULL, 'Pending current round payment');

-- Payouts
INSERT INTO payouts (group_id, round_id, recipient_id, round_number, amount, status, scheduled_date, paid_at) VALUES
(1, 1, 1, 1, 2500.00, 'paid', '2026-01-31', '2026-01-31 18:00:00'),
(1, 2, 2, 2, 2500.00, 'paid', '2026-02-28', '2026-02-28 18:00:00'),
(1, 3, 3, 3, 2500.00, 'scheduled', '2026-03-31', NULL),
(2, 4, 6, 1, 4000.00, 'paid', '2026-02-28', '2026-02-28 18:00:00');

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, related_group_id, related_payment_id) VALUES
(1, 'Round winner selected', 'Daniel Haile won round 3 in Family Savings Circle.', 'payout', 0, 1, NULL),
(1, 'Payment due', 'Your round 2 contribution for Tech Professionals Equb is pending.', 'payment_due', 0, 2, 21),
(2, 'Group updated', 'Women Entrepreneurs Fund is open for new members.', 'group_update', 1, 3, NULL),
(3, 'Payment reminder', 'Your Family Savings Circle contribution is still pending this round.', 'payment_due', 0, 1, 13),
(6, 'Round closed', 'Round 1 for Tech Professionals Equb has been closed successfully.', 'group_update', 1, 2, NULL);
