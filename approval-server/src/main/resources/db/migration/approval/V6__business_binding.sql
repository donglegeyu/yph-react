-- ============================================================
-- V6: 业务流程绑定表（审批绑定管理）
-- 背景：原来 startInternal 按约定式路由（businessType 驼峰化查流程定义），
--       查不到静默回退演示流程 materialApplication —— 行业反模式，本次治理。
-- 行为：业务提交时按 business_type 查绑定记录，显式判定三态：
--       started（正常走审批）/ passed_through（免审直通）/ 明确报错。
-- 幂等：CREATE TABLE IF NOT EXISTS；初始数据 WHERE NOT EXISTS。
-- ============================================================
CREATE TABLE IF NOT EXISTS appr_business_binding (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  business_type VARCHAR(64) NOT NULL COMMENT '业务场景类型（业务服务回调处理器已注册，如 craftsman_application）',
  business_name VARCHAR(128) NOT NULL COMMENT '业务名称（展示用）',
  process_key VARCHAR(64) NULL COMMENT '绑定的流程标识（对应 appr_process_design.process_key / Flowable definition key），NULL=未绑定',
  approval_mode VARCHAR(16) NOT NULL DEFAULT 'required' COMMENT '审批模式：required=必须审批，optional=可免审（未绑定时提交即通过）',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1=启用，0=停用',
  remark VARCHAR(255) NULL COMMENT '备注',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_appr_business_binding_type (business_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务流程绑定（审批绑定管理）';

-- ---------- 初始绑定：工匠申请（required，流程未发布/未绑定时提交会明确报错，属预期治理效果） ----------
INSERT INTO appr_business_binding (business_type, business_name, process_key, approval_mode, enabled, remark)
SELECT 'craftsman_application', '工匠申请', 'craftsmanApplication', 'required', 1, '工匠入驻申请审批'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM appr_business_binding WHERE business_type = 'craftsman_application');
