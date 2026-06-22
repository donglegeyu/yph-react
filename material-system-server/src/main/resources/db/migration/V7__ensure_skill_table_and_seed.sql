-- ============================================================
-- V7__ensure_skill_table_and_seed.sql
-- 兜底脚本：补齐服务器可能缺失的表 + 种子数据
-- 适用场景：服务器在功能上线前部署，init SQL 未自动执行
-- 所有操作幂等，可重复执行
-- ============================================================

-- ============================================================
-- 1. certificate_image 证件类型图片库表（V4 迁移依赖此表）
-- ============================================================
CREATE TABLE IF NOT EXISTS `certificate_image` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `certificate_type` VARCHAR(100) NOT NULL COMMENT '证件类型',
  `example_image` VARCHAR(2048) NOT NULL COMMENT '示例图（逗号分隔多张，最多5张）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_type` (`certificate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='证件类型图片库表';

-- 补充 certificate_image 种子数据（仅当表为空时插入）
INSERT INTO `certificate_image` (`certificate_type`, `example_image`, `sort_order`)
SELECT * FROM (
  SELECT '特种作业操作证' AS a,
    CONCAT(
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1565314925585-2c2e6c6e6c6e?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop'
    ) AS b, 1 AS c
  UNION ALL SELECT '上岗证',
    CONCAT(
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1521791136064-7957c94ce04c?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?fit=crop'
    ), 2
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `certificate_image` LIMIT 1);

-- ============================================================
-- 2. skill 技能管理表
-- ============================================================
CREATE TABLE IF NOT EXISTS `skill` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `skill_name` VARCHAR(100) NOT NULL COMMENT '服务技能',
  `category1` VARCHAR(100) DEFAULT NULL COMMENT '一级品类',
  `category2` VARCHAR(100) DEFAULT NULL COMMENT '二级品类',
  `category3` VARCHAR(100) DEFAULT NULL COMMENT '三级品类',
  `certificate_type` VARCHAR(100) DEFAULT NULL COMMENT '证件类型',
  `example_image` VARCHAR(2048) DEFAULT NULL COMMENT '示例图（逗号分隔多张，最多5张）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能管理表';

-- 补充 skill 种子数据（仅当表为空时插入）
INSERT INTO `skill` (`skill_name`, `category1`, `category2`, `category3`, `certificate_type`, `example_image`, `sort_order`)
SELECT * FROM (
  SELECT '检修' AS a, '到家(服务类)' AS b, '家电服务' AS c, '家电检修服务' AS d, '特种作业操作证' AS e, '' AS f, 1 AS g
  UNION ALL SELECT '清洗', '到家(服务类)', '家电服务', '家电清洗服务', '上岗证', '', 2
  UNION ALL SELECT '安装', '到家(服务类)', '家电服务', '家电安装服务', '特种作业操作证', '', 3
  UNION ALL SELECT '维修', '到家(服务类)', '家电服务', '家电维修服务', '特种作业操作证', '', 4
  UNION ALL SELECT '保养', '到家(服务类)', '清洗服务', '家电保养服务', '上岗证', '', 5
  UNION ALL SELECT '移机', '到家(服务类)', '家电服务', '家电移机服务', '上岗证', '', 6
  UNION ALL SELECT '拆装', '到家(服务类)', '家电服务', '家电拆装服务', '特种作业操作证', '', 7
  UNION ALL SELECT '清洗', '到家(服务类)', '清洗服务', '家电清洗服务', '上岗证', '', 8
  UNION ALL SELECT '维修', '到家(服务类)', '清洗服务', '家电维修服务', '上岗证', '', 9
  UNION ALL SELECT '安装', '到家(服务类)', '家电服务', '家电安装服务', '特种作业操作证', '', 10
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `skill` LIMIT 1);

-- ============================================================
-- 3. certificate_type 证件类型字典表兜底（即使 V4 失败也能保证基础数据）
-- ============================================================
CREATE TABLE IF NOT EXISTS `certificate_type` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(100) NOT NULL COMMENT '证件类型名称（唯一）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_type_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='证件类型字典表';

INSERT INTO `certificate_type` (`name`, `sort_order`)
SELECT '特种作业操作证', 1
WHERE NOT EXISTS (SELECT 1 FROM `certificate_type` WHERE `name` = '特种作业操作证');

INSERT INTO `certificate_type` (`name`, `sort_order`)
SELECT '上岗证', 2
WHERE NOT EXISTS (SELECT 1 FROM `certificate_type` WHERE `name` = '上岗证');

-- ============================================================
-- 4. skill 表三级品类字段兜底（防 18 号 init SQL 未执行）
-- ============================================================
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

SELECT 'V7 ensure tables and seed data' AS msg;
