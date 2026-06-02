-- 图标配置表
CREATE TABLE IF NOT EXISTS `icon_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `type` VARCHAR(20) NOT NULL COMMENT '图标类型: preset(预设), custom(自定义)',
    `value` VARCHAR(100) NOT NULL COMMENT '图标标识',
    `label` VARCHAR(100) NOT NULL COMMENT '图标名称',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_type` (`type`),
    INDEX `idx_value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图标配置表';

-- 插入默认预设图标
INSERT INTO `icon_config` (`type`, `value`, `label`, `sort_order`) VALUES
('preset', 'home', '首页', 1),
('preset', 'star', '收藏', 2),
('preset', 'shopping-cart-del', '购物车', 3),
('preset', 'setting', '设置', 4),
('preset', 'list', '列表', 6),
('preset', 'buy', '采购', 7),
('preset', 'commodity', '商品', 8),
('preset', 'coupon', '优惠券', 9),
('preset', 'wallet', '钱包', 10),
('preset', 'bank-card', '银行卡', 11),
('preset', 'bill', '账单', 12),
('preset', 'financing', '融资', 13),
('preset', 'transaction', '交易', 14),
('preset', 'receive', '收款', 15),
('preset', 'building-one', '建筑', 16),
('preset', 'user', '用户', 17),
('preset', 'file', '文件', 18),
('preset', 'search', '搜索', 19),
('preset', 'safe', '安全', 20),
('preset', 'tool', '工具', 21),
('preset', 'app', '应用', 22),
('preset', 'find', '查找', 23),
('preset', 'people-top-card', '用户卡片', 24),
('preset', 'file-cabinet', '文件柜', 25),
('preset', 'message-security', '安全消息', 26),
('preset', 'all-application', '全部应用', 27);
