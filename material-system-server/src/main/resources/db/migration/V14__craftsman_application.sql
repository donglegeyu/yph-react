-- ============================================================
-- V14__craftsman_application.sql
-- 工匠申请表
-- 业务流程：新增工匠先写入申请单 → 审批通过后搬到 craftsman 主表
-- 设计说明：form_data 以 JSON 字符串存储表单提交的完整内容，
--           审批通过时反序列化为 CraftsmanCreateDTO 调用现有逻辑，
--           避免再建一堆申请关联表。
-- ============================================================

CREATE TABLE IF NOT EXISTS `craftsman_application` (
  `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `application_no`    VARCHAR(32)  NOT NULL COMMENT '申请单号 WA + yyyyMMdd + 4位流水',
  `application_type`  VARCHAR(16)  NOT NULL DEFAULT 'add' COMMENT '申请单类型 add/edit/delete',
  `status`            VARCHAR(16)  NOT NULL DEFAULT 'draft' COMMENT '状态 draft/pending/approved/rejected',
  `name`              VARCHAR(64)  DEFAULT NULL COMMENT '姓名（冗余，便于列表展示/筛选）',
  `phone`             VARCHAR(20)  DEFAULT NULL COMMENT '手机号（冗余）',
  `user_account`      VARCHAR(64)  DEFAULT NULL COMMENT '用户账号（冗余）',
  `service_provider_name` VARCHAR(128) DEFAULT NULL COMMENT '所属供应商（冗余）',
  `applicant`         VARCHAR(64)  DEFAULT NULL COMMENT '申请人',
  `apply_time`        DATE         DEFAULT NULL COMMENT '申请日期',
  `form_data`         LONGTEXT     DEFAULT NULL COMMENT '表单提交的完整 JSON',
  `reject_reason`     VARCHAR(500) DEFAULT NULL COMMENT '驳回原因',
  `create_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted`           TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除 0未删 1已删',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_application_no` (`application_no`),
  KEY `idx_status` (`status`),
  KEY `idx_name` (`name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_apply_time` (`apply_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠申请单';
