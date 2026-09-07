-- Add manual status-lock flag to transactions (run once on existing DBs)
-- When an admin manually sets an order's status, status_locked=1 so the
-- provider status sync will no longer overwrite it.

USE smm;

SET @col_exists := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'transactions'
    AND column_name = 'status_locked'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE transactions ADD COLUMN status_locked TINYINT(1) DEFAULT 0 AFTER tx_status',
  'SELECT "status_locked already exists" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
