CREATE TABLE IF NOT EXISTS `construction_application` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `application_no` varchar(50) NOT NULL COMMENT '申请单号',
  `construction_name` varchar(200) NOT NULL COMMENT '施工项名称',
  `content` text COMMENT '施工内容',
  `status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态: draft/pending/approved/rejected',
  `quantity` decimal(15,4) DEFAULT 0 COMMENT '申请数量',
  `budget` decimal(15,2) COMMENT '预算',
  `applicant` varchar(50) COMMENT '申请人',
  `apply_time` datetime COMMENT '申请时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_application_no` (`application_no`),
  KEY `idx_status_apply_time` (`status`, `apply_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='施工申请表';

-- 插入测试数据
INSERT INTO construction_application (application_no, construction_name, content, status, quantity, budget, applicant, apply_time) VALUES
('CA202604220001', '基础开挖工程', 'A栋楼地基土方开挖', 'approved', 1, 50000, '张三', '2026-04-22 08:30:00'),
('CA202604220002', '钢筋绑扎工程', '地下室钢筋绑扎施工', 'pending', 1, 80000, '李四', '2026-04-22 09:00:00'),
('CA202604220003', '混凝土浇筑', '一层楼板混凝土浇筑', 'draft', 1, 120000, '王五', '2026-04-22 10:00:00'),
('CA202604220004', '防水施工', '屋面防水卷材铺设', 'approved', 1, 35000, '赵六', '2026-04-22 11:00:00'),
('CA202604220005', '外墙保温', '外墙外保温系统安装', 'rejected', 1, 65000, '张三', '2026-04-22 14:00:00');

-- 注：施工申请列表菜单已统一迁移到 09-menu-seed.sql 集中管理
