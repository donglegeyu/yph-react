-- ============================================================
-- V3__craftsman_relations.sql
-- 工匠关联表：技能 / 品牌 / 接单区域（规范化存储）
-- 前端 CraftsmanForm 的专业技能、品牌、接单区域改为关联表存储
-- ============================================================

-- ===== 1. craftsman_skill 工匠-技能关联 =====
CREATE TABLE IF NOT EXISTS `craftsman_skill` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `craftsman_id` BIGINT NOT NULL COMMENT '工匠ID',
  `skill_id` BIGINT NOT NULL COMMENT '技能ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_craftsman_id` (`craftsman_id`),
  KEY `idx_skill_id` (`skill_id`),
  UNIQUE KEY `uk_craftsman_skill` (`craftsman_id`, `skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠-技能关联表';

-- ===== 2. craftsman_brand 工匠-品牌关联 =====
CREATE TABLE IF NOT EXISTS `craftsman_brand` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `craftsman_id` BIGINT NOT NULL COMMENT '工匠ID',
  `brand_value` VARCHAR(100) NOT NULL COMMENT '品牌标识',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_craftsman_id` (`craftsman_id`),
  UNIQUE KEY `uk_craftsman_brand` (`craftsman_id`, `brand_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠-品牌关联表';

-- ===== 3. craftsman_service_area 工匠-接单区域关联 =====
CREATE TABLE IF NOT EXISTS `craftsman_service_area` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `craftsman_id` BIGINT NOT NULL COMMENT '工匠ID',
  `area_codes` VARCHAR(200) NOT NULL COMMENT '区域编码（逗号分隔，如 110000,110100,110105）',
  `area_labels` VARCHAR(500) DEFAULT NULL COMMENT '区域标签（逗号分隔，如 北京市,北京市,朝阳区）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_craftsman_id` (`craftsman_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠-接单区域关联表';

-- ===== 4. craftsman_certificate 工匠资格证书关联 =====
CREATE TABLE IF NOT EXISTS `craftsman_certificate` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `craftsman_id` BIGINT NOT NULL COMMENT '工匠ID',
  `certificate_type` VARCHAR(100) NOT NULL COMMENT '证书类型',
  `image_urls` TEXT COMMENT '证书图片URL（逗号分隔）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_craftsman_id` (`craftsman_id`),
  UNIQUE KEY `uk_craftsman_type` (`craftsman_id`, `certificate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠资格证书图片表';

SELECT 'V3 craftsman relations created' AS msg;
