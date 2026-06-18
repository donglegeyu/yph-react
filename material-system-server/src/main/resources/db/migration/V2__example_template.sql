-- ============================================================
-- 示例：后续新增数据库变更的模板
-- 复制此文件，改名 V2__你的描述.sql，修改内容后提交 git
-- ============================================================

-- ===== 规则 =====
-- 1. 文件名格式：V{版本号}__{描述}.sql（两个下划线）
--    版本号递增：V2、V3、V4...
-- 2. 每个脚本必须幂等（可重复执行不出错）
--    - 建表用 CREATE TABLE IF NOT EXISTS
--    - 加字段用 SET @col_exists 判断
--    - 插数据用 INSERT ... WHERE NOT EXISTS
-- 3. 脚本一旦提交 git 并部署，就不能再修改（Flyway 会校验 checksum）
--    要改就新建一个更高版本号的脚本

-- ===== 示例：新增一个字段 =====
-- SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'new_field');
-- SET @sql = IF(@col_exists = 0,
--   'ALTER TABLE `craftsman` ADD COLUMN `new_field` VARCHAR(100) DEFAULT NULL COMMENT ''新字段''',
--   'SELECT ''already exists''');
-- PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ===== 示例：插入配置数据 =====
-- INSERT INTO sys_domain (domain_key, domain_name, description, is_default, status)
-- SELECT 'new_domain', '新域', '描述', 0, 1
-- WHERE NOT EXISTS (SELECT 1 FROM sys_domain WHERE domain_key = 'new_domain');

SELECT 'migration placeholder' AS msg;
