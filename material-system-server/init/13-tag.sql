CREATE TABLE IF NOT EXISTS `tag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tag_name` VARCHAR(100) NOT NULL COMMENT '标签名称',
  `tag_code` VARCHAR(100) NOT NULL COMMENT '标签编码',
  `tag_type` VARCHAR(50) DEFAULT 'material' COMMENT '标签类型：material-材料标签 construction-施工标签 general-通用标签',
  `status` VARCHAR(20) NOT NULL DEFAULT 'enabled' COMMENT '状态：enabled-启用 disabled-禁用',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
  `ref_count` INT NOT NULL DEFAULT 0 COMMENT '关联数量',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tag_code` (`tag_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

INSERT INTO `tag` (`tag_name`, `tag_code`, `tag_type`, `status`, `sort_order`, `description`, `ref_count`) VALUES
('环保材料', 'TAG_ECO', 'material', 'enabled', 1, '环保认证材料标签', 50),
('进口材料', 'TAG_IMPORT', 'material', 'enabled', 2, '进口材料标签', 69),
('防火材料', 'TAG_FIREPROOF', 'material', 'enabled', 3, '防火等级材料标签', 192),
('防水材料', 'TAG_WATERPROOF', 'material', 'enabled', 4, '防水材料标签', 154),
('高端定制', 'TAG_PREMIUM', 'general', 'disabled', 5, '高端定制材料标签', 194),
('经济型', 'TAG_ECONOMY', 'general', 'enabled', 6, '经济型材料标签', 105),
('抗菌材料', 'TAG_ANTIBACTERIAL', 'material', 'enabled', 7, '抗菌材料标签', 144),
('隔热保温', 'TAG_INSULATION', 'construction', 'disabled', 8, '隔热保温材料标签', 3),
('耐磨材料', 'TAG_WEARPROOF', 'material', 'enabled', 9, '耐磨材料标签', 182),
('隔音材料', 'TAG_SOUNDPROOF', 'construction', 'enabled', 10, '隔音材料标签', 103);
