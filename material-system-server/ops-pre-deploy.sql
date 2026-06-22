-- ============================================================
-- 服务器部署前预处理脚本（一次性执行）
-- 适用场景：服务器在 skill / certificate 功能上线前部署
-- 用途：确保 Flyway V4-V6 能顺利执行（不依赖缺失的表）
-- 执行方式：由运维在部署新版后端前执行一次
--   docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react < ops-pre-deploy.sql
-- ============================================================

-- 1. 如果 flyway_schema_history 不存在，手动建立基线（version 0-6 全标记为已执行）
--    这样后端启动时 Flyway 只执行 V7
CREATE TABLE IF NOT EXISTS `flyway_schema_history` (
    installed_rank INT NOT NULL,
    version VARCHAR(50) DEFAULT NULL,
    description VARCHAR(200) DEFAULT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT DEFAULT NULL,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    KEY flyway_schema_history_s_idx (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入基线记录（如果服务器已有 Flyway 记录则跳过）
INSERT IGNORE INTO `flyway_schema_history`
(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES
(1, '0',   '<< Flyway Baseline >>',        'BASELINE', '<< Flyway Baseline >>',        NULL,          'root', 0, 1),
(2, '1',   'baseline',                      'SQL',      'V1__baseline.sql',              1179945110,    'root', 1, 1),
(3, '2',   'example template',             'SQL',      'V2__example_template.sql',      -2003511443,   'root', 1, 1),
(4, '3',   'craftsman relations',          'SQL',      'V3__craftsman_relations.sql',   0,             'root', 1, 1),
(5, '4',   'certificate type',             'SQL',      'V4__certificate_type.sql',      0,             'root', 1, 1),
(6, '5',   'craftsman structured address', 'SQL',      'V5__craftsman_structured_address.sql', 0,      'root', 1, 1),
(7, '6',   'craftsman relations add deleted','SQL',    'V6__craftsman_relations_add_deleted.sql', 0,    'root', 1, 1);

-- 2. 预建 V4 依赖的 certificate_image 表（避免 V4 失败）
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

-- 3. 验证
SELECT '预处理完成，flyway_schema_history 记录数：' AS info, COUNT(*) AS cnt FROM `flyway_schema_history`;
SELECT 'certificate_image 表状态：' AS info, COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificate_image';
