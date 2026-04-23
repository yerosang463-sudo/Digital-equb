-- Add has_paid_current_round column to group_members table
-- This column tracks whether a member has paid for the current round

USE digital_equb;

-- Check if column exists, if not add it
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'digital_equb'
    AND TABLE_NAME = 'group_members'
    AND COLUMN_NAME = 'has_paid_current_round'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE group_members ADD COLUMN has_paid_current_round TINYINT(1) DEFAULT 0 AFTER role',
    'SELECT "Column already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the column was added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'digital_equb'
AND TABLE_NAME = 'group_members'
AND COLUMN_NAME = 'has_paid_current_round';
