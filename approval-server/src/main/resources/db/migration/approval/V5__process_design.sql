-- V5: 流程设计器草稿表
-- 宜搭式可视化流程设计器：设计 JSON 存库，发布时由 BpmnGenerator 转成 BPMN XML 部署到 Flowable。
-- 幂等性：CREATE TABLE IF NOT EXISTS。
CREATE TABLE IF NOT EXISTS appr_process_design (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  process_key VARCHAR(64) NOT NULL COMMENT '流程标识（发布到 Flowable 的 process id）',
  name VARCHAR(128) NOT NULL COMMENT '流程名称',
  design_json MEDIUMTEXT NOT NULL COMMENT '设计器文档 JSON',
  published_version INT NOT NULL DEFAULT 0 COMMENT '最近一次发布成功的版本号，0=从未发布',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_appr_process_design_key (process_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='可视化流程设计器草稿';
