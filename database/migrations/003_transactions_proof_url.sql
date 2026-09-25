-- Add slip/proof-of-payment image support for manual admin-approved top-ups (run once on existing DBs)

USE smm;

SET @col_exists := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'transactions'
    AND column_name = 'proof_url'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE transactions ADD COLUMN proof_url VARCHAR(500) DEFAULT NULL AFTER note',
  'SELECT "proof_url already exists" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
