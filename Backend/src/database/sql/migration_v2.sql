USE `sql12824412`;

-- Migration v2: All columns already exist in schema.sql
-- This migration is now redundant and only contains the UPDATE statement

UPDATE equb_groups g
SET g.cycle_total_rounds = (
  SELECT COUNT(*)
  FROM group_members gm
  WHERE gm.group_id = g.id
)
WHERE g.cycle_total_rounds IS NULL AND g.status IN ('active', 'completed');
