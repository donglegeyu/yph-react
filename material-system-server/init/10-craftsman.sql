-- 工匠表
CREATE TABLE IF NOT EXISTS `craftsman` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `craftsman_code` varchar(50) NOT NULL COMMENT '工匠编码',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `user_account` varchar(100) DEFAULT NULL COMMENT '用户账号',
  `service_provider_name` varchar(200) DEFAULT NULL COMMENT '服务商名称',
  `craftsman_category` varchar(20) DEFAULT 'outsource' COMMENT '工匠类别：outsource外部员工 internal内部员工',
  `craftsman_type` tinyint DEFAULT 1 COMMENT '工匠类型：1正式工匠 2意向工匠',
  `region` varchar(100) DEFAULT NULL COMMENT '区域',
  `service_skills` varchar(500) DEFAULT NULL COMMENT '服务技能',
  `register_time` datetime DEFAULT NULL COMMENT '注册时间',
  `status` tinyint DEFAULT 1 COMMENT '状态：1启用 0停用',
  `birthday` varchar(20) DEFAULT NULL COMMENT '出生日期',
  `id_card_no` varchar(20) DEFAULT NULL COMMENT '身份证号',
  `age` int DEFAULT NULL COMMENT '年龄',
  `residential_address` varchar(500) DEFAULT NULL COMMENT '常住地址',
  `service_area` varchar(500) DEFAULT NULL COMMENT '接单区域',
  `id_card_images` varchar(1000) DEFAULT NULL COMMENT '身份证图片（正反面，逗号分隔）',
  `work_certificate` varchar(1000) DEFAULT NULL COMMENT '工作证明（图片URL，逗号分隔）',
  `no_criminal_certificate` varchar(1000) DEFAULT NULL COMMENT '无犯罪证明（图片URL，逗号分隔）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_craftsman_code` (`craftsman_code`),
  KEY `idx_name` (`name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_craftsman_category` (`craftsman_category`),
  KEY `idx_craftsman_type` (`craftsman_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工匠表';

-- 插入测试数据
INSERT INTO craftsman (craftsman_code, name, phone, user_account, service_provider_name, craftsman_category, craftsman_type, region, service_skills, register_time, status, birthday, id_card_no, age, residential_address, service_area, id_card_images, work_certificate, no_criminal_certificate) VALUES
('CM20260001', '张建国', '13800138001', 'zhangjg', '北京建工集团有限公司', 'outsource', 1, '华北', '木工、泥瓦工', '2026-01-15 09:00:00', 1, '1985-03-15', '110101198503151234', 41, '北京市朝阳区建国路88号', '北京市朝阳区、海淀区', 'https://testimg.com/idcard-front-1.jpg,https://testimg.com/idcard-back-1.jpg', 'https://testimg.com/work-cert-1.jpg', 'https://testimg.com/no-criminal-1.jpg'),
('CM20260002', '李明辉', '13800138002', 'limh', '上海建工集团', 'outsource', 1, '华东', '水电工、油漆工', '2026-02-20 14:30:00', 1, '1988-07-22', '310104198807221567', 37, '上海市浦东新区张江路100号', '上海市浦东新区、徐汇区', 'https://testimg.com/idcard-front-2.jpg,https://testimg.com/idcard-back-2.jpg', 'https://testimg.com/work-cert-2.jpg', 'https://testimg.com/no-criminal-2.jpg'),
('CM20260003', '王大力', '13800138003', 'wangdl', '广州建筑股份有限公司 / 第三分公司', 'outsource', 2, '华南', '钢筋工、混凝土工', '2026-03-10 10:15:00', 1, '1990-11-08', '440106199011082345', 35, '广州市天河区天河路200号', '广州市天河区、越秀区', 'https://testimg.com/idcard-front-3.jpg,https://testimg.com/idcard-back-3.jpg', 'https://testimg.com/work-cert-3.jpg', 'https://testimg.com/no-criminal-3.jpg'),
('CM20260004', '赵铁柱', '13800138004', 'zhaotz', '深圳建筑工程公司', 'internal', 1, '华南', '瓦工', '2026-04-05 16:45:00', 0, '1982-05-30', '440303198205303012', 44, '深圳市南山区科技园南路', '深圳市南山区、福田区', 'https://testimg.com/idcard-front-4.jpg,https://testimg.com/idcard-back-4.jpg', 'https://testimg.com/work-cert-4.jpg', 'https://testimg.com/no-criminal-4.jpg'),
('CM20260005', '刘金宝', '13800138005', 'liujb', '成都建工集团', 'internal', 2, '西南', '防水工、保温工', '2026-05-18 08:20:00', 1, '1992-09-12', '510104199209124567', 33, '成都市武侯区天府大道北段', '成都市武侯区、锦江区', 'https://testimg.com/idcard-front-5.jpg,https://testimg.com/idcard-back-5.jpg', 'https://testimg.com/work-cert-5.jpg', 'https://testimg.com/no-criminal-5.jpg');

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
