CREATE TABLE IF NOT EXISTS `skill` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `skill_name` VARCHAR(100) NOT NULL COMMENT '服务技能',
  `secondary_category` VARCHAR(100) DEFAULT NULL COMMENT '二级品类',
  `certificate_type` VARCHAR(100) DEFAULT NULL COMMENT '证件类型',
  `example_image` VARCHAR(2048) DEFAULT NULL COMMENT '示例图（逗号分隔多张，最多5张）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` INT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能管理表';

INSERT INTO `skill` (`skill_name`, `secondary_category`, `certificate_type`, `example_image`, `sort_order`)
SELECT * FROM (
  SELECT '检修' AS a, '到家/清洗类' AS b, '特种作业操作证' AS c,
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20front%20side%20blue%20cover%20work%20permit%20ID%20card%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20inside%20page%20details%20work%20permit%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20back%20side%20official%20seal%20photo&image_size=square'
    ) AS d, 1 AS e
  UNION ALL SELECT '清洗', '到家/清洗类', '上岗证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20front%20side%20work%20badge%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20back%20side%20information%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20lanyard%20badge%20holder%20photo&image_size=square'
    ), 2
  UNION ALL SELECT '安装', '到家/家电类', '特种作业操作证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20front%20side%20blue%20cover%20work%20permit%20ID%20card%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20inside%20page%20details%20work%20permit%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20back%20side%20official%20seal%20photo&image_size=square'
    ), 3
  UNION ALL SELECT '维修', '到家/家电类', '特种作业操作证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20front%20side%20blue%20cover%20work%20permit%20ID%20card%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20inside%20page%20details%20work%20permit%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20back%20side%20official%20seal%20photo&image_size=square'
    ), 4
  UNION ALL SELECT '保养', '到家/清洗类', '上岗证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20front%20side%20work%20badge%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20back%20side%20information%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20lanyard%20badge%20holder%20photo&image_size=square'
    ), 5
  UNION ALL SELECT '移机', '到家/家电类', '上岗证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20front%20side%20work%20badge%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20back%20side%20information%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20lanyard%20badge%20holder%20photo&image_size=square'
    ), 6
  UNION ALL SELECT '拆装', '到家/家电类', '特种作业操作证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20front%20side%20blue%20cover%20work%20permit%20ID%20card%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20inside%20page%20details%20work%20permit%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20back%20side%20official%20seal%20photo&image_size=square'
    ), 7
  UNION ALL SELECT '清洗', '到家/家电类', '上岗证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20front%20side%20work%20badge%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20back%20side%20information%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20lanyard%20badge%20holder%20photo&image_size=square'
    ), 8
  UNION ALL SELECT '维修', '到家/清洗类', '上岗证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20front%20side%20work%20badge%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20back%20side%20information%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20employment%20duty%20card%20lanyard%20badge%20holder%20photo&image_size=square'
    ), 9
  UNION ALL SELECT '安装', '到家/清洗类', '特种作业操作证',
    CONCAT(
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20front%20side%20blue%20cover%20work%20permit%20ID%20card%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20inside%20page%20details%20work%20permit%20photo&image_size=square',
      ',',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=China%20special%20operation%20certificate%20back%20side%20official%20seal%20photo&image_size=square'
    ), 10
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `skill` LIMIT 1);
