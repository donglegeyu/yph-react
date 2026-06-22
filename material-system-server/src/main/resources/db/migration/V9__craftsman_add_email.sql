-- ============================================================
-- V9__craftsman_add_email.sql
-- 为工匠新增邮箱字段
-- ============================================================

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'email');
SET @sql = IF(@col = 0,
  'ALTER TABLE `craftsman` ADD COLUMN `email` VARCHAR(100) DEFAULT NULL COMMENT ''邮箱''',
  'SELECT ''email already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'V9 craftsman email column added' AS msg;
