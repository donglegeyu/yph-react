-- Design Token 表结构 + 初始数据

-- 1. Token 分类表
CREATE TABLE IF NOT EXISTS `design_token_category` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '分类描述',
    `code` VARCHAR(50) NOT NULL COMMENT '分类标识',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Design Token 分类表';

-- 2. Token 表
CREATE TABLE IF NOT EXISTS `design_token` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `category_id` BIGINT NOT NULL COMMENT '分类ID',
    `name` VARCHAR(100) NOT NULL COMMENT 'Token名称',
    `token_key` VARCHAR(100) NOT NULL COMMENT 'Token键名',
    `token_type` VARCHAR(20) NOT NULL COMMENT 'Token类型: color/number/text/shadow',
    `default_value` VARCHAR(500) NOT NULL COMMENT '默认值',
    `current_value` VARCHAR(500) NOT NULL COMMENT '当前值',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `is_ant_design_token` TINYINT DEFAULT 0 COMMENT '是否为Ant Design Token',
    `ant_design_token_name` VARCHAR(100) DEFAULT NULL COMMENT 'Ant Design Token名称',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_category_id` (`category_id`),
    INDEX `idx_token_key` (`token_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Design Token 表';

-- 3. 组件 Token 表
CREATE TABLE IF NOT EXISTS `component_token` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `component_name` VARCHAR(100) NOT NULL COMMENT '组件名称',
    `token_key` VARCHAR(100) NOT NULL COMMENT 'Token键名',
    `token_type` VARCHAR(20) NOT NULL COMMENT 'Token类型',
    `default_light_value` VARCHAR(500) DEFAULT NULL COMMENT '默认亮色值',
    `default_dark_value` VARCHAR(500) DEFAULT NULL COMMENT '默认暗色值',
    `current_light_value` VARCHAR(500) DEFAULT NULL COMMENT '当前亮色值',
    `current_dark_value` VARCHAR(500) DEFAULT NULL COMMENT '当前暗色值',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_component_name` (`component_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组件级 Design Token 表';

-- 4. 插入分类
INSERT INTO `design_token_category` (`name`, `code`, `sort_order`) VALUES
('基础色阶', 'base-color', 1),
('颜色', 'color', 2),
('字体', 'typography', 3),
('间距', 'spacing', 4),
('边框', 'border', 5),
('阴影', 'shadow', 6),
('动效', 'motion', 7)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

-- 5. 插入基础色阶 Token（base-color, id=1）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础1', '--primary-1', 'color', '#FFF2E8', '#FFF2E8', '主色色阶', 0, 1 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-1');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础2', '--primary-2', 'color', '#FFDCD1', '#FFDCD1', '主色色阶', 0, 2 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-2');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础3', '--primary-3', 'color', '#FFBBA8', '#FFBBA8', '主色色阶', 0, 3 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-3');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础4', '--primary-4', 'color', '#FF997F', '#FF997F', '主色色阶', 0, 4 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-4');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础5', '--primary-5', 'color', '#FF7756', '#FF7756', '主色色阶', 0, 5 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-5');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础6', '--primary-6', 'color', '#F95914', '#F95914', '主色色阶', 0, 6 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-6');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础7', '--primary-7', 'color', '#E64A19', '#E64A19', '主色色阶', 0, 7 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-7');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础8', '--primary-8', 'color', '#CC3D10', '#CC3D10', '主色色阶', 0, 8 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-8');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础9', '--primary-9', 'color', '#993008', '#993008', '主色色阶', 0, 9 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-9');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '基础10', '--primary-10', 'color', '#662300', '#662300', '主色色阶', 0, 10 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-10');

-- 5.1 成功色色阶
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功1', '--success-1', 'color', '#F6FFED', '#F6FFED', '成功色色阶', 0, 11 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-1');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功2', '--success-2', 'color', '#D9F7BE', '#D9F7BE', '成功色色阶', 0, 12 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-2');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功3', '--success-3', 'color', '#B7EB8F', '#B7EB8F', '成功色色阶', 0, 13 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-3');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功4', '--success-4', 'color', '#95DE64', '#95DE64', '成功色色阶', 0, 14 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-4');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功5', '--success-5', 'color', '#73D13D', '#73D13D', '成功色色阶', 0, 15 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-5');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功6', '--success-6', 'color', '#52C41A', '#52C41A', '成功色色阶', 0, 16 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-6');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功7', '--success-7', 'color', '#389E0D', '#389E0D', '成功色色阶', 0, 17 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-7');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功8', '--success-8', 'color', '#237804', '#237804', '成功色色阶', 0, 18 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-8');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功9', '--success-9', 'color', '#135200', '#135200', '成功色色阶', 0, 19 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-9');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '成功10', '--success-10', 'color', '#092B00', '#092B00', '成功色色阶', 0, 20 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--success-10');

-- 5.2 警告色色阶
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告1', '--warning-1', 'color', '#FFFBE6', '#FFFBE6', '警告色色阶', 0, 21 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-1');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告2', '--warning-2', 'color', '#FFF1B8', '#FFF1B8', '警告色色阶', 0, 22 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-2');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告3', '--warning-3', 'color', '#FFE58F', '#FFE58F', '警告色色阶', 0, 23 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-3');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告4', '--warning-4', 'color', '#FFD666', '#FFD666', '警告色色阶', 0, 24 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-4');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告5', '--warning-5', 'color', '#FFC53D', '#FFC53D', '警告色色阶', 0, 25 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-5');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告6', '--warning-6', 'color', '#FAAD14', '#FAAD14', '警告色色阶', 0, 26 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-6');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告7', '--warning-7', 'color', '#D9960E', '#D9960E', '警告色色阶', 0, 27 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-7');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告8', '--warning-8', 'color', '#B88008', '#B88008', '警告色色阶', 0, 28 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-8');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告9', '--warning-9', 'color', '#996A04', '#996A04', '警告色色阶', 0, 29 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-9');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '警告10', '--warning-10', 'color', '#7A5402', '#7A5402', '警告色色阶', 0, 30 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--warning-10');

-- 5.3 错误色色阶
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误1', '--error-1', 'color', '#FFF2F0', '#FFF2F0', '错误色色阶', 0, 31 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-1');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误2', '--error-2', 'color', '#FFD8D6', '#FFD8D6', '错误色色阶', 0, 32 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-2');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误3', '--error-3', 'color', '#FFB3B0', '#FFB3B0', '错误色色阶', 0, 33 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-3');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误4', '--error-4', 'color', '#FF8E8A', '#FF8E8A', '错误色色阶', 0, 34 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-4');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误5', '--error-5', 'color', '#FF6A66', '#FF6A66', '错误色色阶', 0, 35 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-5');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误6', '--error-6', 'color', '#FF4D4F', '#FF4D4F', '错误色色阶', 0, 36 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-6');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误7', '--error-7', 'color', '#E8383A', '#E8383A', '错误色色阶', 0, 37 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-7');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误8', '--error-8', 'color', '#D12426', '#D12426', '错误色色阶', 0, 38 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-8');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误9', '--error-9', 'color', '#B81214', '#B81214', '错误色色阶', 0, 39 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-9');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '错误10', '--error-10', 'color', '#A00000', '#A00000', '错误色色阶', 0, 40 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--error-10');

-- 5.4 信息色色阶
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息1', '--info-1', 'color', '#F0F5FF', '#F0F5FF', '信息色色阶', 0, 41 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-1');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息2', '--info-2', 'color', '#D6E8FF', '#D6E8FF', '信息色色阶', 0, 42 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-2');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息3', '--info-3', 'color', '#ADC8FF', '#ADC8FF', '信息色色阶', 0, 43 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-3');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息4', '--info-4', 'color', '#85A8FF', '#85A8FF', '信息色色阶', 0, 44 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-4');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息5', '--info-5', 'color', '#5D89FF', '#5D89FF', '信息色色阶', 0, 45 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-5');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息6', '--info-6', 'color', '#1677FF', '#1677FF', '信息色色阶', 0, 46 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-6');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息7', '--info-7', 'color', '#095ED9', '#095ED9', '信息色色阶', 0, 47 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-7');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息8', '--info-8', 'color', '#0047B3', '#0047B3', '信息色色阶', 0, 48 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-8');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息9', '--info-9', 'color', '#00348C', '#00348C', '信息色色阶', 0, 49 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-9');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '信息10', '--info-10', 'color', '#002266', '#002266', '信息色色阶', 0, 50 FROM `design_token_category` c WHERE c.code = 'base-color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--info-10');

-- 6. 插入颜色类 Token（color, id=2）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色', '--primary-color', 'color', '#F95914', '#F95914', '主题主色', 1, 'colorPrimary', 1 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-color');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色悬浮态', '--primary-hover', 'color', '#FF7043', '#FF7043', '主色悬浮态', 1, 'colorPrimaryHover', 2 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-hover');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色激活态', '--primary-active', 'color', '#E64A19', '#E64A19', '主色激活态', 1, 'colorPrimaryActive', 3 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-active');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色背景', '--primary-bg', 'color', '#FFF2E8', '#FFF2E8', '主色背景色', 0, NULL, 4 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-bg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色边框', '--primary-border', 'color', '#FFDCD1', '#FFDCD1', '主色边框色', 0, NULL, 5 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-border');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色文本', '--primary-text', 'color', '#F95914', '#F95914', '主色文本色', 0, NULL, 6 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-text');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主色浅背景', '--primary-bg-light', 'color', '#FFF7F0', '#FFF7F0', '主色浅背景色', 0, NULL, 7 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--primary-bg-light');

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '成功背景色', '--color-success-bg', 'color', '#f6ffed', '#f6ffed', '成功状态背景色', 0, NULL, 8 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-success-bg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '警告背景色', '--color-warning-bg', 'color', '#fffbE6', '#fffbE6', '警告状态背景色', 0, NULL, 9 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-warning-bg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '错误背景色', '--color-error-bg', 'color', '#fff2f0', '#fff2f0', '错误状态背景色', 0, NULL, 10 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-error-bg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '信息背景色', '--color-info-bg', 'color', '#e6f4ff', '#e6f4ff', '信息状态背景色', 0, NULL, 11 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-info-bg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '成功边框色', '--color-success-border', 'color', '#b7eb8f', '#b7eb8f', '成功状态边框色', 0, NULL, 12 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-success-border');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '警告边框色', '--color-warning-border', 'color', '#ffe58f', '#ffe58f', '警告状态边框色', 0, NULL, 13 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-warning-border');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '错误边框色', '--color-error-border', 'color', '#ffccc7', '#ffccc7', '错误状态边框色', 0, NULL, 14 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-error-border');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '信息边框色', '--color-info-border', 'color', '#91caff', '#91caff', '信息状态边框色', 0, NULL, 15 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-info-border');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '主文本色', '--color-text', 'color', '#000000e6', '#000000e6', '主要文本色', 1, 'colorText', 16 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-text');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '次要文本色', '--color-text-secondary', 'color', '#00000073', '#00000073', '次要文本色', 1, 'colorTextSecondary', 17 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-text-secondary');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '占位文本色', '--color-text-tertiary', 'color', '#00000047', '#00000047', '占位文本色', 0, NULL, 18 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-text-tertiary');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '禁用文本色', '--color-text-quaternary', 'color', '#00000026', '#00000026', '禁用文本色', 0, NULL, 19 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-text-quaternary');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '容器背景色', '--color-bg-container', 'color', '#ffffff', '#ffffff', '容器背景色', 1, 'colorBgContainer', 20 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-bg-container');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '布局背景色', '--color-bg-layout', 'color', '#f5f5f5', '#f5f5f5', '布局背景色', 1, 'colorBgLayout', 21 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-bg-layout');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '抬升背景色', '--color-bg-elevated', 'color', '#ffffff', '#ffffff', '卡片、弹窗等抬升元素背景', 0, NULL, 22 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-bg-elevated');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '遮罩背景色', '--color-bg-mask', 'color', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.45)', '遮罩背景色', 0, NULL, 23 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-bg-mask');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '边框色', '--color-border', 'color', '#d9d9d9', '#d9d9d9', '边框色', 1, 'colorBorder', 24 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-border');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '次要边框色', '--color-border-secondary', 'color', '#f0f0f0', '#f0f0f0', '次要边框色', 1, 'colorBorderSecondary', 25 FROM `design_token_category` c WHERE c.code = 'color'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--color-border-secondary');

-- 7. 插入字体类 Token（typography, id=3）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '字体家族', '--font-family', 'text', '''PingFang SC'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif', '''PingFang SC'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif', '字体家族', 1, 'fontFamily', 1 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-family');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '代码字体', '--font-family-code', 'text', '''SFMono-Regular'', Consolas, ''Liberation Mono'', Menlo, Courier, monospace', '''SFMono-Regular'', Consolas, ''Liberation Mono'', Menlo'', Courier, monospace', '代码字体', 0, NULL, 2 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-family-code');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '小字号', '--font-size-sm', 'number', '12', '12', '小字体大小(px)', 1, 'fontSizeSM', 3 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-sm');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '基础字号', '--font-size-base', 'number', '14', '14', '基础字体大小(px)', 1, 'fontSize', 4 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-base');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '大字号', '--font-size-lg', 'number', '16', '16', '大字体大小(px)', 1, 'fontSizeLG', 5 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-lg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '标题1字号', '--font-size-h1', 'number', '38', '38', '标题1字体大小(px)', 1, 'fontSizeHeading1', 6 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-h1');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '标题2字号', '--font-size-h2', 'number', '30', '30', '标题2字体大小(px)', 1, 'fontSizeHeading2', 7 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-h2');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '标题3字号', '--font-size-h3', 'number', '24', '24', '标题3字体大小(px)', 1, 'fontSizeHeading3', 8 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-h3');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '标题4字号', '--font-size-h4', 'number', '20', '20', '标题4字体大小(px)', 1, 'fontSizeHeading4', 9 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--font-size-h4');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '行高', '--line-height', 'number', '1.5714', '1.5714', '行高', 1, 'lineHeight', 10 FROM `design_token_category` c WHERE c.code = 'typography'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--line-height');

-- 8. 插入间距类 Token（spacing, id=4）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '间距 XXS', '--spacing-xxs', 'number', '4', '4', '超小间距(px)', 0, 1 FROM `design_token_category` c WHERE c.code = 'spacing'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--spacing-xxs');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '间距 XS', '--spacing-xs', 'number', '8', '8', '小间距(px)', 0, 2 FROM `design_token_category` c WHERE c.code = 'spacing'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--spacing-xs');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '间距 SM', '--spacing-sm', 'number', '12', '12', '中小间距(px)', 0, 3 FROM `design_token_category` c WHERE c.code = 'spacing'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--spacing-sm');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '间距 MD', '--spacing-md', 'number', '16', '16', '中间距(px)', 0, 4 FROM `design_token_category` c WHERE c.code = 'spacing'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--spacing-md');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '间距 LG', '--spacing-lg', 'number', '24', '24', '大间距(px)', 0, 5 FROM `design_token_category` c WHERE c.code = 'spacing'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--spacing-lg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '间距 XL', '--spacing-xl', 'number', '32', '32', '超大间距(px)', 0, 6 FROM `design_token_category` c WHERE c.code = 'spacing'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--spacing-xl');

-- 9. 插入边框类 Token（border, id=5）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '基础圆角', '--border-radius-base', 'number', '6', '6', '基础圆角大小(px)', 1, 'borderRadius', 1 FROM `design_token_category` c WHERE c.code = 'border'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--border-radius-base');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '小圆角', '--border-radius-sm', 'number', '4', '4', '小圆角(px)', 1, 'borderRadiusSM', 2 FROM `design_token_category` c WHERE c.code = 'border'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--border-radius-sm');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`)
SELECT c.id, '大圆角', '--border-radius-lg', 'number', '8', '8', '大圆角(px)', 1, 'borderRadiusLG', 3 FROM `design_token_category` c WHERE c.code = 'border'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--border-radius-lg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '超小圆角', '--border-radius-xs', 'number', '2', '2', '超小圆角(px)', 0, 4 FROM `design_token_category` c WHERE c.code = 'border'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--border-radius-xs');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '圆形', '--border-radius-circle', 'text', '50%', '50%', '圆形（用于头像等）', 0, 5 FROM `design_token_category` c WHERE c.code = 'border'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--border-radius-circle');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '边框宽度', '--border-width', 'number', '1', '1', '边框宽度(px)', 0, 6 FROM `design_token_category` c WHERE c.code = 'border'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--border-width');

-- 10. 插入阴影类 Token（shadow, id=6）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '小阴影', '--shadow-sm', 'shadow', '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', '小阴影', 0, 1 FROM `design_token_category` c WHERE c.code = 'shadow'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--shadow-sm');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '中等阴影', '--shadow-md', 'shadow', '0 4px 12px rgba(0, 0, 0, 0.08)', '0 4px 12px rgba(0, 0, 0, 0.08)', '中等阴影', 0, 2 FROM `design_token_category` c WHERE c.code = 'shadow'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--shadow-md');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '大阴影', '--shadow-lg', 'shadow', '0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', '0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', '大阴影', 0, 3 FROM `design_token_category` c WHERE c.code = 'shadow'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--shadow-lg');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '浮层阴影', '--shadow-elevated', 'shadow', '0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.08)', '0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.08)', '浮层阴影（弹窗等）', 0, 4 FROM `design_token_category` c WHERE c.code = 'shadow'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--shadow-elevated');

-- 11. 插入动效类 Token（motion, id=7）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '快速动画时长', '--motion-duration-fast', 'text', '0.1s', '0.1s', '快速动画时长，如 hover 效果', 0, 1 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-duration-fast');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '中等动画时长', '--motion-duration-mid', 'text', '0.2s', '0.2s', '中等动画时长，如展开收起', 0, 2 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-duration-mid');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '慢速动画时长', '--motion-duration-slow', 'text', '0.3s', '0.3s', '慢速动画时长，如页面切换', 0, 3 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-duration-slow');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '缓入缓出', '--motion-ease-in-out', 'text', 'cubic-bezier(0.645, 0.045, 0.355, 1.000)', 'cubic-bezier(0.645, 0.045, 0.355, 1.000)', '缓入缓出动画曲线', 0, 4 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-ease-in-out');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '缓出', '--motion-ease-out', 'text', 'cubic-bezier(0.215, 0.610, 0.355, 1.000)', 'cubic-bezier(0.215, 0.610, 0.355, 1.000)', '缓出动画曲线', 0, 5 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-ease-out');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '缓入', '--motion-ease-in', 'text', 'cubic-bezier(0.550, 0.055, 0.675, 0.190)', 'cubic-bezier(0.550, 0.055, 0.675, 0.190)', '缓入动画曲线', 0, 6 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-ease-in');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '线性', '--motion-linear', 'text', 'linear', 'linear', '线性动画曲线', 0, 7 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-linear');
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`)
SELECT c.id, '弹跳', '--motion-bounce', 'text', 'cubic-bezier(0.680, -0.550, 0.265, 1.550)', 'cubic-bezier(0.680, -0.550, 0.265, 1.550)', '弹跳动画曲线', 0, 8 FROM `design_token_category` c WHERE c.code = 'motion'
AND NOT EXISTS (SELECT 1 FROM `design_token` WHERE `token_key` = '--motion-bounce');
