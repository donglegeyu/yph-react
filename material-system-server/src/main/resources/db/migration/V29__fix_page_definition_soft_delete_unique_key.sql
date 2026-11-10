-- 修复 page_definition 逻辑删除撞 uk_page_key_del 唯一索引的问题
-- 现象：同 pageKey 第二次逻辑删除时报 DuplicateKeyException
--   （旧索引 uk_page_key_del(page_key, deleted)，同 key 的第二条 deleted=1 记录与第一条冲突）
-- 方案：普通列 del_key + BEFORE UPDATE 触发器维护。
--   未删记录 del_key=0；逻辑删除（deleted 置 1）时触发器把 del_key 置为该行 id，
--   保证 (page_key, del_key) 唯一：未删记录 (page_key, 0) 唯一，已删记录带各自 id 互不冲突。
--   注：不能使用生成列 del_key = IF(deleted=0,0,id)——MySQL 生成列禁止引用自增列（错误码 3109），
--   故用触发器实现同等效果，应用层（MyBatis-Plus 逻辑删除）无需任何改动。

-- 1. 删除旧的唯一索引（若存在）
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND INDEX_NAME = 'uk_page_key_del'
);
SET @sql := IF(@idx_exists > 0,
  'ALTER TABLE page_definition DROP INDEX uk_page_key_del',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 新增普通列 del_key（若不存在），新插入的记录默认 0（即未删除形态）
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND COLUMN_NAME = 'del_key'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE page_definition ADD COLUMN del_key BIGINT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. 回填存量已删记录：del_key = id（幂等，只处理已删且未回填的行）
UPDATE page_definition SET del_key = id WHERE deleted <> 0 AND del_key = 0;

-- 4. 触发器：行更新时维护 del_key（幂等：先删后建）
--    未删保持 0；逻辑删除时置为行 id
--    注意：触发器体只有一条语句，不用 BEGIN..END——Flyway 7.15 会把块内第一个分号当语句结尾导致 1064
DROP TRIGGER IF EXISTS trg_page_definition_del_key_bu;
CREATE TRIGGER trg_page_definition_del_key_bu BEFORE UPDATE ON page_definition
FOR EACH ROW SET NEW.del_key = IF(NEW.deleted = 0, 0, NEW.id);

-- 5. 建立新的唯一索引（若不存在）
SET @idx_exists2 := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND INDEX_NAME = 'uk_page_key_del'
);
SET @sql := IF(@idx_exists2 = 0,
  'ALTER TABLE page_definition ADD UNIQUE KEY uk_page_key_del (page_key, del_key)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
