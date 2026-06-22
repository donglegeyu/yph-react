-- ============================================================
-- V4__certificate_type.sql
-- 证件类型独立表：让证件类型的增删改直接写库
-- 不再依赖 certificate_image 表反推类型列表
-- ============================================================

CREATE TABLE IF NOT EXISTS `certificate_type` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(100) NOT NULL COMMENT '证件类型名称（唯一）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_type_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='证件类型字典表';

-- 修复已有表的字段排序规则（防止历史遗留数据不匹配）
ALTER TABLE `certificate_type` MODIFY `name` VARCHAR(100) NOT NULL COLLATE utf8mb4_general_ci COMMENT '证件类型名称（唯一）';

-- 迁移：从 certificate_image 表反查已有的证件类型，写入新表（幂等）
-- 使用 COLLATE utf8mb4_general_ci 防止 MySQL 5.7 报字符集冲突（1267）
INSERT INTO `certificate_type` (`name`, `sort_order`)
SELECT t.certificate_type, t.sort_order
FROM (
  SELECT `certificate_type` AS certificate_type, MIN(`sort_order`) AS sort_order
  FROM `certificate_image`
  GROUP BY `certificate_type`
) t
WHERE NOT EXISTS (
  SELECT 1 FROM `certificate_type` ct 
  WHERE ct.`name` COLLATE utf8mb4_general_ci = t.certificate_type COLLATE utf8mb4_general_ci
);

-- 兜底：保证两个内置默认类型存在
INSERT INTO `certificate_type` (`name`, `sort_order`)
SELECT '特种作业操作证', 1
WHERE NOT EXISTS (SELECT 1 FROM `certificate_type` WHERE `name` = '特种作业操作证');

INSERT INTO `certificate_type` (`name`, `sort_order`)
SELECT '上岗证', 2
WHERE NOT EXISTS (SELECT 1 FROM `certificate_type` WHERE `name` = '上岗证');

SELECT 'V4 certificate_type created' AS msg;
