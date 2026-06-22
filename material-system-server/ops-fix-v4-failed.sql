-- ============================================================
-- 服务器部署前一次性修复脚本 V2（覆盖 V4 字符集冲突场景）
--
-- 问题历史：
--   V1 首次执行：V4 因 certificate_image 表不存在而失败
--   清理后再执行：V4 因 utf8mb4_unicode_ci / utf8mb4_general_ci 冲突失败
--
-- 本脚本作用：
--   1. 预建 certificate_image 表（防止 V4 找不到表）
--   2. 统一 certificate_type.name 字段的 collation 为 utf8mb4_general_ci
--   3. 清理所有失败的 Flyway 记录 + V4 记录（强制重新执行）
--
-- 执行方式（由运维操作，每次 V4 失败后执行一次）：
--   docker exec -i <mysql容器名> mysql -uroot -proot123456 material_system_react < ops-fix-v4-failed.sql
-- ============================================================

-- 1. 预建 V4 依赖的 certificate_image 表（如果不存在）
CREATE TABLE IF NOT EXISTS `certificate_image` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `certificate_type` VARCHAR(100) NOT NULL COMMENT '证件类型',
  `example_image` VARCHAR(2048) NOT NULL COMMENT '示例图（逗号分隔多张，最多5张）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_type` (`certificate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='证件类型图片库表';

-- 2. 如果 certificate_type 表已存在，统一其 collation（关键修复）
ALTER TABLE `certificate_type` MODIFY `name` VARCHAR(100) NOT NULL COLLATE utf8mb4_general_ci COMMENT '证件类型名称（唯一）';

-- 3. 删除所有失败的 Flyway 记录
DELETE FROM `flyway_schema_history` WHERE `success` = 0;

-- 4. 删除 V4 的记录（无论成功失败），强制让 Flyway 重新执行新版 V4
DELETE FROM `flyway_schema_history` WHERE `version` = '4';

-- 5. 验证
SELECT '=== 修复后 flyway_schema_history 状态 ===' AS info;
SELECT installed_rank, version, description, success FROM `flyway_schema_history` ORDER BY installed_rank;

SELECT '=== certificate_type 表 collation ===' AS info;
SELECT COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificate_type' AND COLUMN_NAME = 'name';

SELECT '=== 修复完成，请重新部署后端 ===' AS info;
