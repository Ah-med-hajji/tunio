-- =====================================================================
-- Tuneo — Phase 3 baseline migration
-- Apply once against the `visite` MySQL schema before booting the
-- updated backend. Idempotent where possible.
--
-- Fixes:
--   K-13  reservations.user_id is NOT NULL in the dump but no longer
--          mapped by the JPA entity → make it nullable so inserts work.
--   K-20  reservations table is MyISAM (no FK enforcement) → convert
--          to InnoDB.
--   Phase 3.3  Add avatar_url to users so the profile page can store
--              a profile picture URL.
-- =====================================================================

START TRANSACTION;

-- K-13 — orphan column
ALTER TABLE `reservations`
    MODIFY COLUMN `user_id` INT NULL;

-- K-20 — engine
ALTER TABLE `reservations` ENGINE = InnoDB;

-- Phase 3.3 — avatar URL (idempotent guard via INFORMATION_SCHEMA)
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'users'
    AND COLUMN_NAME  = 'avatar_url'
);
SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `avatar_url` LONGTEXT NULL',
  'SELECT 1');
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

COMMIT;
