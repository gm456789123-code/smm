-- Unique ref for top-up idempotency (run once on production / existing DBs)
-- Prevents concurrent double-credit on the same slip / Stripe intent / angpao code.

USE smm;

-- 1) Referral rows previously reused the same ref as the parent top-up — split them first
UPDATE transactions
SET ref = CONCAT('referral:', ref)
WHERE tx_type = 'referral'
  AND ref IS NOT NULL
  AND ref <> ''
  AND ref NOT LIKE 'referral:%';

-- 2) If any duplicate refs remain, keep the oldest row and clear ref on later copies
--    (cleared refs stay visible in history but no longer block UNIQUE)
UPDATE transactions t
JOIN (
  SELECT ref, MIN(id) AS keep_id
  FROM transactions
  WHERE ref IS NOT NULL AND ref <> ''
  GROUP BY ref
  HAVING COUNT(*) > 1
) d ON t.ref = d.ref AND t.id <> d.keep_id
SET t.ref = CONCAT('dup-cleared:', t.id, ':', t.ref);

-- 3) Enforce uniqueness (MySQL allows multiple NULL refs)
-- Skip if index already exists
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'transactions'
    AND index_name = 'uniq_transactions_ref'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE transactions ADD UNIQUE KEY uniq_transactions_ref (ref)',
  'SELECT "uniq_transactions_ref already exists" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
