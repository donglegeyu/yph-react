-- 18-skill-category-migration.sql
-- 将 skill 表的 secondary_category 拆分为三级品类 category1/category2/category3
-- 幂等：重复执行不会出错

-- 1. 新增三级品类字段（如果不存在）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skill' AND COLUMN_NAME = 'category1');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `skill` ADD COLUMN `category1` VARCHAR(100) DEFAULT NULL COMMENT ''一级品类'' AFTER `skill_name`',
  'SELECT ''category1 already exists'' AS msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skill' AND COLUMN_NAME = 'category2');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `skill` ADD COLUMN `category2` VARCHAR(100) DEFAULT NULL COMMENT ''二级品类'' AFTER `category1`',
  'SELECT ''category2 already exists'' AS msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skill' AND COLUMN_NAME = 'category3');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `skill` ADD COLUMN `category3` VARCHAR(100) DEFAULT NULL COMMENT ''三级品类'' AFTER `category2`',
  'SELECT ''category3 already exists'' AS msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 从旧的 secondary_category 迁移数据到三级品类（仅当新字段为空且旧字段有值时）
UPDATE `skill`
SET `category1` = '到家(服务类)',
    `category2` = CASE
      WHEN `secondary_category` = '到家/清洗类' THEN '清洗服务'
      WHEN `secondary_category` = '到家/家电类' THEN '家电服务'
      ELSE '家电服务'
    END,
    `category3` = CASE
      WHEN `secondary_category` = '到家/清洗类' THEN '家电清洗服务'
      WHEN `secondary_category` = '到家/家电类' THEN '家电安装服务'
      ELSE '家电服务'
    END
WHERE `category1` IS NULL
  AND `secondary_category` IS NOT NULL
  AND `secondary_category` != '';

-- 3. 删除旧字段（如果还存在）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skill' AND COLUMN_NAME = 'secondary_category');
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `skill` DROP COLUMN `secondary_category`',
  'SELECT ''secondary_category already dropped'' AS msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
