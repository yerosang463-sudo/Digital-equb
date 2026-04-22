-- Seed data for Digital Equb
-- Resets all data and inserts minimal test fixtures for group-browsing-access-control
USE `digital-equb`;

-- Clear all existing data
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

-- Users (password for all: password123)
INSERT INTO users (id, full_name, email, phone, password_hash, bio) VALUES
(1, 'Abebe Bekele',     'abebe@example.com',  '+251911234567', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Equb enthusiast from Addis Ababa'),
(2, 'Tigist Alemayehu', 'tigist@example.com', '+251922345678', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Savings group coordinator');

-- Groups
INSERT INTO equb_groups (id, name, description, contribution_amount, frequency, max_members, current_members, status, is_public, winner_selection_mode, auto_select_winner, created_by) VALUES
(1, 'Testing Sample', 'A public test group for development and QA.', 500.00, 'monthly', 5, 1, 'open', 1, 'random', 1, 1);

-- Group members (user 1 is admin/creator of Testing Sample)
INSERT INTO group_members (group_id, user_id, role) VALUES
(1, 1, 'admin');
