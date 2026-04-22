-- Seed data for Digital Equb
-- Testing Sample: 4 members, 4 completed rounds, full history
USE `digital-equb`;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM notifications;
DELETE FROM payouts;
DELETE FROM payments;
DELETE FROM equb_rounds;
DELETE FROM group_invitations;
DELETE FROM group_members;
DELETE FROM equb_groups;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Users (password for all: password123) ───────────────────────────────────
INSERT INTO users (id, full_name, email, phone, password_hash, bio) VALUES
(1, 'Abebe Bekele',     'abebe@example.com',   '+251911234567', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Equb enthusiast from Addis Ababa'),
(2, 'Tigist Alemayehu', 'tigist@example.com',  '+251922345678', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Savings group coordinator'),
(3, 'Dawit Haile',      'dawit@example.com',   '+251933456789', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Finance professional'),
(4, 'Meron Tadesse',    'meron@example.com',   '+251944567890', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Community savings advocate');

-- ─── Group ───────────────────────────────────────────────────────────────────
-- 4 members, 4 rounds completed, is_public so everyone can view details
INSERT INTO equb_groups (id, name, description, contribution_amount, frequency, max_members, current_members, cycle_total_rounds, status, start_date, end_date, is_public, winner_selection_mode, auto_select_winner, created_by) VALUES
(1, 'Testing Sample', 'A public demo group showing a fully completed Equb cycle. All 4 members contributed 500 Birr each round and every member received their payout.', 500.00, 'monthly', 4, 4, 4, 'completed', '2026-01-01', '2026-04-30', 1, 'random', 1, 1);

-- ─── Members (payout_order matches who won each round) ───────────────────────
INSERT INTO group_members (group_id, user_id, role, payout_order, has_received_payout, payout_date) VALUES
(1, 1, 'admin',  1, 1, '2026-01-31'),
(1, 2, 'member', 2, 1, '2026-02-28'),
(1, 3, 'member', 3, 1, '2026-03-31'),
(1, 4, 'member', 4, 1, '2026-04-30');

-- ─── Rounds (all 4 closed) ────────────────────────────────────────────────────
INSERT INTO equb_rounds (id, group_id, round_number, due_date, status, winner_id, winner_selected_by, selection_method, closed_at) VALUES
(1, 1, 1, '2026-01-31', 'closed', 1, 1, 'random', '2026-01-31 18:00:00'),
(2, 1, 2, '2026-02-28', 'closed', 2, 1, 'random', '2026-02-28 18:00:00'),
(3, 1, 3, '2026-03-31', 'closed', 3, 1, 'random', '2026-03-31 18:00:00'),
(4, 1, 4, '2026-04-30', 'closed', 4, 1, 'random', '2026-04-30 18:00:00');

-- ─── Payments (4 members × 4 rounds = 16 payments, all completed) ─────────────
-- Round 1
INSERT INTO payments (group_id, payer_id, round_id, round_number, amount, status, payment_method, simulation_status, due_date, paid_at) VALUES
(1, 1, 1, 1, 500.00, 'completed', 'telebirr', 'success', '2026-01-31', '2026-01-28 10:00:00'),
(1, 2, 1, 1, 500.00, 'completed', 'telebirr', 'success', '2026-01-31', '2026-01-29 11:00:00'),
(1, 3, 1, 1, 500.00, 'completed', 'telebirr', 'success', '2026-01-31', '2026-01-30 09:00:00'),
(1, 4, 1, 1, 500.00, 'completed', 'telebirr', 'success', '2026-01-31', '2026-01-30 14:00:00');
-- Round 2
INSERT INTO payments (group_id, payer_id, round_id, round_number, amount, status, payment_method, simulation_status, due_date, paid_at) VALUES
(1, 1, 2, 2, 500.00, 'completed', 'telebirr', 'success', '2026-02-28', '2026-02-25 10:00:00'),
(1, 2, 2, 2, 500.00, 'completed', 'telebirr', 'success', '2026-02-28', '2026-02-26 11:00:00'),
(1, 3, 2, 2, 500.00, 'completed', 'telebirr', 'success', '2026-02-28', '2026-02-27 09:00:00'),
(1, 4, 2, 2, 500.00, 'completed', 'telebirr', 'success', '2026-02-28', '2026-02-27 14:00:00');
-- Round 3
INSERT INTO payments (group_id, payer_id, round_id, round_number, amount, status, payment_method, simulation_status, due_date, paid_at) VALUES
(1, 1, 3, 3, 500.00, 'completed', 'telebirr', 'success', '2026-03-31', '2026-03-28 10:00:00'),
(1, 2, 3, 3, 500.00, 'completed', 'telebirr', 'success', '2026-03-31', '2026-03-29 11:00:00'),
(1, 3, 3, 3, 500.00, 'completed', 'telebirr', 'success', '2026-03-31', '2026-03-30 09:00:00'),
(1, 4, 3, 3, 500.00, 'completed', 'telebirr', 'success', '2026-03-31', '2026-03-30 14:00:00');
-- Round 4
INSERT INTO payments (group_id, payer_id, round_id, round_number, amount, status, payment_method, simulation_status, due_date, paid_at) VALUES
(1, 1, 4, 4, 500.00, 'completed', 'telebirr', 'success', '2026-04-30', '2026-04-27 10:00:00'),
(1, 2, 4, 4, 500.00, 'completed', 'telebirr', 'success', '2026-04-30', '2026-04-28 11:00:00'),
(1, 3, 4, 4, 500.00, 'completed', 'telebirr', 'success', '2026-04-30', '2026-04-29 09:00:00'),
(1, 4, 4, 4, 500.00, 'completed', 'telebirr', 'success', '2026-04-30', '2026-04-29 14:00:00');

-- ─── Payouts (each member received 2000 Birr = 4 × 500) ──────────────────────
INSERT INTO payouts (group_id, round_id, recipient_id, round_number, amount, status, scheduled_date, paid_at) VALUES
(1, 1, 1, 1, 2000.00, 'paid', '2026-01-31', '2026-01-31 18:00:00'),
(1, 2, 2, 2, 2000.00, 'paid', '2026-02-28', '2026-02-28 18:00:00'),
(1, 3, 3, 3, 2000.00, 'paid', '2026-03-31', '2026-03-31 18:00:00'),
(1, 4, 4, 4, 2000.00, 'paid', '2026-04-30', '2026-04-30 18:00:00');

-- ─── Notifications ────────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read, related_group_id) VALUES
(1, 'You won Round 1!',        'Congratulations! You received the payout of 2000 Birr for Round 1 of Testing Sample.', 'payout',       1, 1),
(2, 'Round 1 winner selected', 'Abebe Bekele won Round 1 in Testing Sample.',                                           'payout',       1, 1),
(3, 'Round 1 winner selected', 'Abebe Bekele won Round 1 in Testing Sample.',                                           'payout',       1, 1),
(4, 'Round 1 winner selected', 'Abebe Bekele won Round 1 in Testing Sample.',                                           'payout',       1, 1),
(2, 'You won Round 2!',        'Congratulations! You received the payout of 2000 Birr for Round 2 of Testing Sample.', 'payout',       1, 1),
(1, 'Round 2 winner selected', 'Tigist Alemayehu won Round 2 in Testing Sample.',                                       'payout',       1, 1),
(3, 'Round 2 winner selected', 'Tigist Alemayehu won Round 2 in Testing Sample.',                                       'payout',       1, 1),
(4, 'Round 2 winner selected', 'Tigist Alemayehu won Round 2 in Testing Sample.',                                       'payout',       1, 1),
(3, 'You won Round 3!',        'Congratulations! You received the payout of 2000 Birr for Round 3 of Testing Sample.', 'payout',       1, 1),
(1, 'Round 3 winner selected', 'Dawit Haile won Round 3 in Testing Sample.',                                            'payout',       1, 1),
(2, 'Round 3 winner selected', 'Dawit Haile won Round 3 in Testing Sample.',                                            'payout',       1, 1),
(4, 'Round 3 winner selected', 'Dawit Haile won Round 3 in Testing Sample.',                                            'payout',       1, 1),
(4, 'You won Round 4!',        'Congratulations! You received the payout of 2000 Birr for Round 4 of Testing Sample.', 'payout',       1, 1),
(1, 'Round 4 winner selected', 'Meron Tadesse won Round 4 in Testing Sample.',                                          'payout',       1, 1),
(2, 'Round 4 winner selected', 'Meron Tadesse won Round 4 in Testing Sample.',                                          'payout',       1, 1),
(3, 'Round 4 winner selected', 'Meron Tadesse won Round 4 in Testing Sample.',                                          'payout',       1, 1),
(1, 'Cycle completed!',        'The Testing Sample Equb cycle has been completed successfully. All members received their payouts.', 'group_update', 1, 1),
(2, 'Cycle completed!',        'The Testing Sample Equb cycle has been completed successfully. All members received their payouts.', 'group_update', 1, 1),
(3, 'Cycle completed!',        'The Testing Sample Equb cycle has been completed successfully. All members received their payouts.', 'group_update', 1, 1),
(4, 'Cycle completed!',        'The Testing Sample Equb cycle has been completed successfully. All members received their payouts.', 'group_update', 1, 1);
