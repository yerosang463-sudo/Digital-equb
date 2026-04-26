-- Migration v4: Add is_public column to equb_groups
-- Supports group browsing access control (public vs private groups)
ALTER TABLE equb_groups ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0;
