-- 菜单管理视图表
CREATE TABLE IF NOT EXISTS `menu_view` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '视图名称',
  `filters` TEXT COMMENT '筛选条件JSON',
  `filter_order` TEXT COMMENT '筛选条件顺序JSON',
  `user_id` VARCHAR(50) NOT NULL COMMENT '用户ID',
  `page_type` VARCHAR(50) NOT NULL DEFAULT 'menu-management' COMMENT '页面类型',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_page` (`user_id`, `page_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单管理视图表';
