-- ============================================================
-- 页面生成器自动生成，请勿手工修改内容
-- 页面：任务详情（pageKey: ren-wu-lie-biao-detail）
-- 生成时间：2026-10-10 11:34:02
-- 执行方式：放入 material-system-server/src/main/resources/db/migration/ 目录，
--           由 Flyway 在后端启动时自动执行（系统本身不执行 DDL）
-- ============================================================

CREATE TABLE IF NOT EXISTS `ren_wu_lie_biao` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `fu_ze_ren` VARCHAR(255) DEFAULT NULL COMMENT '负责人',
  `kai_shi_shi_jian` VARCHAR(255) DEFAULT NULL COMMENT '开始时间',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` VARCHAR(64) DEFAULT NULL COMMENT '创建人',
  `update_by` VARCHAR(64) DEFAULT NULL COMMENT '更新人',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常 1-已删除',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '页面生成器-任务详情';
