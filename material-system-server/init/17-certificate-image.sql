-- 证件类型图片库表
-- 示例图按证件类型全局共享，一张证件类型对应一组示例图
CREATE TABLE IF NOT EXISTS `certificate_image` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `certificate_type` VARCHAR(100) NOT NULL COMMENT '证件类型',
  `example_image` VARCHAR(2048) NOT NULL COMMENT '示例图（逗号分隔多张，最多5张）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_type` (`certificate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='证件类型图片库表';

-- 初始数据（按证件类型去重）
INSERT INTO `certificate_image` (`certificate_type`, `example_image`, `sort_order`)
SELECT * FROM (
  SELECT '特种作业操作证' AS a,
    CONCAT(
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1565314925585-2c2e6c6e6c6e?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop'
    ) AS b, 1 AS c
  UNION ALL SELECT '上岗证',
    CONCAT(
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1521791136064-7957c94ce04c?fit=crop',
      ',',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?fit=crop'
    ), 2
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `certificate_image` LIMIT 1);
