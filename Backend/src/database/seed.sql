-- Sample seed data for Digital Equb
USE `digital-equb`;

-- Insert sample users (passwords are hashed 'password123')
INSERT INTO users (full_name, email, phone, password_hash, bio) VALUES
('Abebe Girma', 'abebe@example.com', '+251911234567', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Equb enthusiast from Addis Ababa'),
('Tigist Haile', 'tigist@example.com', '+251922345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Savings group coordinator'),
('Dawit Bekele', 'dawit@example.com', '+251933456789', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Financial planner'),
('Meron Tadesse', 'meron@example.com', '+251944567890', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Community leader'),
('Yonas Alemu', 'yonas@example.com', '+251955678901', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Entrepreneur');

-- Insert sample equb groups
INSERT INTO equb_groups (name, description, contribution_amount, frequency, max_members, current_members, status, start_date, end_date, created_by) VALUES
('Office Savings Circle', 'Monthly savings group for office colleagues', 2000.00, 'monthly', 10, 5, 'active', '2024-01-01', '2024-10-31', 1),
('Family Equb', 'Family savings group for big purchases', 5000.00, 'monthly', 8, 3, 'active', '2024-02-01', '2024-09-30', 2),
('Neighborhood Group', 'Weekly savings for neighborhood improvements', 500.00, 'weekly', 20, 12, 'active', '2024-01-15', '2024-07-15', 3),
('Tech Workers Equb', 'Biweekly savings for tech professionals', 3000.00, 'biweekly', 6, 2, 'open', '2024-03-01', '2024-08-31', 1),
('Completed Savings', 'A completed savings round', 1000.00, 'monthly', 5, 5, 'completed', '2023-01-01', '2023-05-31', 4);

-- Insert group members
INSERT INTO group_members (group_id, user_id, role, payout_order, has_received_payout) VALUES
(1, 1, 'admin', 1, 1),
(1, 2, 'member', 2, 0),
(1, 3, 'member', 3, 0),
(1, 4, 'member', 4, 0),
(1, 5, 'member', 5, 0),
(2, 2, 'admin', 1, 0),
(2, 1, 'member', 2, 0),
(2, 4, 'member', 3, 0),
(3, 3, 'admin', 1, 1),
(3, 1, 'member', 5, 0),
(3, 2, 'member', 3, 0);

-- Insert sample payments
INSERT INTO payments (group_id, payer_id, amount, status, payment_method, due_date, paid_at, transaction_ref) VALUES
(1, 1, 2000.00, 'completed', 'bank_transfer', '2024-01-05', '2024-01-04 10:30:00', 'TXN-001-2024'),
(1, 2, 2000.00, 'completed', 'mobile_money', '2024-01-05', '2024-01-05 09:15:00', 'TXN-002-2024'),
(1, 3, 2000.00, 'completed', 'bank_transfer', '2024-01-05', '2024-01-05 14:20:00', 'TXN-003-2024'),
(1, 4, 2000.00, 'pending', 'bank_transfer', '2024-02-05', NULL, NULL),
(1, 5, 2000.00, 'pending', 'mobile_money', '2024-02-05', NULL, NULL),
(2, 2, 5000.00, 'completed', 'bank_transfer', '2024-02-05', '2024-02-03 11:00:00', 'TXN-004-2024'),
(2, 1, 5000.00, 'completed', 'mobile_money', '2024-02-05', '2024-02-05 08:30:00', 'TXN-005-2024'),
(3, 3, 500.00, 'completed', 'cash', '2024-01-22', '2024-01-22 16:00:00', 'TXN-006-2024');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, related_group_id) VALUES
(1, 'Payment Due', 'Your payment of 2000 ETB for Office Savings Circle is due in 3 days', 'payment_due', 0, 1),
(1, 'New Group Joined', 'You have successfully joined Neighborhood Group', 'group_update', 1, 3),
(2, 'Payout Scheduled', 'You are scheduled to receive 20000 ETB from Office Savings Circle next month', 'payout', 0, 1),
(3, 'Payment Received', 'Your payment of 500 ETB for Neighborhood Group has been confirmed', 'payment_received', 1, 3),
(4, 'Payment Reminder', 'Your payment of 2000 ETB for Office Savings Circle is overdue', 'payment_due', 0, 1);

-- Insert payouts
INSERT INTO payouts (group_id, recipient_id, round_number, amount, status, scheduled_date, paid_at) VALUES
(1, 1, 1, 10000.00, 'paid', '2024-01-31', '2024-01-31 12:00:00'),
(1, 2, 2, 10000.00, 'scheduled', '2024-02-29', NULL),
(1, 3, 3, 10000.00, 'scheduled', '2024-03-31', NULL),
(5, 4, 1, 5000.00, 'paid', '2023-01-31', '2023-01-31 10:00:00'),
(5, 5, 2, 5000.00, 'paid', '2023-02-28', '2023-02-28 10:00:00');
