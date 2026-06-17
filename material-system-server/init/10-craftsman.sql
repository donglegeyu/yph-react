-- 工匠表
CREATE TABLE IF NOT EXISTS `craftsman` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `craftsman_code` varchar(50) NOT NULL COMMENT '工匠编码',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `user_account` varchar(100) DEFAULT NULL COMMENT '用户账号',
  `service_provider_name` varchar(200) DEFAULT NULL COMMENT '服务商名称',
  `type` varchar(20) DEFAULT 'outsource' COMMENT '工匠类型：outsource外包工匠 external外部工匠',
  `region` varchar(100) DEFAULT NULL COMMENT '区域',
  `service_skills` varchar(500) DEFAULT NULL COMMENT '服务技能',
  `register_time` datetime DEFAULT NULL COMMENT '注册时间',
  `status` tinyint DEFAULT 1 COMMENT '状态：1正式工匠 2意向工匠 0停用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_craftsman_code` (`craftsman_code`),
  KEY `idx_name` (`name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠表';

-- 插入测试数据
INSERT INTO craftsman (craftsman_code, name, phone, user_account, service_provider_name, type, region, service_skills, register_time, status) VALUES
('CM20260001', '张建国', '13800138001', 'zhangjg', '北京建工集团有限公司', 'outsource', '华北', '木工、泥瓦工', '2026-01-15 09:00:00', 1),
('CM20260002', '李明辉', '13800138002', 'limh', '上海建工集团', 'outsource', '华东', '水电工、油漆工', '2026-02-20 14:30:00', 1),
('CM20260003', '王大力', '13800138003', 'wangdl', '广州建筑股份有限公司 / 第三分公司', 'outsource', '华南', '钢筋工、混凝土工', '2026-03-10 10:15:00', 2),
('CM20260004', '赵铁柱', '13800138004', 'zhaotz', '深圳建筑工程公司', 'external', '华南', '瓦工', '2026-04-05 16:45:00', 0),
('CM20260005', '刘金宝', '13800138005', 'liujb', '成都建工集团', 'external', '西南', '防水工、保温工', '2026-05-18 08:20:00', 1);

-- 工匠视图表
CREATE TABLE IF NOT EXISTS `craftsman_view` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) NOT NULL COMMENT '视图名称',
  `filters` text COMMENT '筛选条件JSON',
  `filter_order` text COMMENT '筛选顺序JSON',
  `user_id` varchar(100) DEFAULT 'default' COMMENT '用户ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠视图表';
