-- Add file attachment support to support_tickets (run once on existing DBs)

USE smm;

SET @col_exists := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'support_tickets'
    AND column_name = 'attachment_url'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE support_tickets ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL AFTER detail',
  'SELECT "attachment_url already exists" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
