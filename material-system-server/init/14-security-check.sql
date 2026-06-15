-- ============================================================
-- 安检结果查询：扩展字段以对齐 MasterGo 设计稿
-- 兼容旧字段（check_result/hidden_danger/status 保留）
-- ============================================================

-- 1) 扩展表结构（幂等，通过 INFORMATION_SCHEMA 判断列是否存在）
-- order_code 工单编码
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'order_code');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `order_code` varchar(50) DEFAULT NULL COMMENT ''工单编码'' AFTER `id`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- customer_name 客户名称
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'customer_name');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `customer_name` varchar(100) DEFAULT NULL COMMENT ''客户名称'' AFTER `gas_code`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- check_status 安检状态
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'check_status');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `check_status` varchar(20) DEFAULT NULL COMMENT ''安检状态'' AFTER `customer_name`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- visit_result 上门结果
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'visit_result');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `visit_result` varchar(20) DEFAULT NULL COMMENT ''上门结果'' AFTER `check_status`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- has_danger 是否隐患
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'has_danger');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `has_danger` varchar(10) DEFAULT NULL COMMENT ''是否隐患'' AFTER `check_user`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- max_danger_level 最高隐患等级
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'max_danger_level');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `max_danger_level` varchar(10) DEFAULT NULL COMMENT ''最高隐患等级'' AFTER `has_danger`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- danger_count 隐患数量
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'danger_count');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `danger_count` int DEFAULT 0 COMMENT ''隐患数量'' AFTER `max_danger_level`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- company 所属项目公司
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'company');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `company` varchar(100) DEFAULT NULL COMMENT ''所属项目公司'' AFTER `address`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- check_area 安检片区
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'check_area');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `check_area` varchar(50) DEFAULT NULL COMMENT ''安检片区'' AFTER `company`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- check_category 安检分类
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'check_category');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `check_category` varchar(50) DEFAULT NULL COMMENT ''安检分类'' AFTER `check_area`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- phone 联系电话
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'phone');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `phone` varchar(30) DEFAULT NULL COMMENT ''联系电话'' AFTER `customer_name`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- report_book 报表册
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'report_book');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `report_book` varchar(30) DEFAULT NULL COMMENT ''报表册'' AFTER `phone`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_type 用户类型
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'user_type');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `user_type` varchar(20) DEFAULT NULL COMMENT ''用户类型'' AFTER `check_user`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- upload_status 上传状态
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_check' AND COLUMN_NAME = 'upload_status');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `security_check` ADD COLUMN `upload_status` varchar(20) DEFAULT NULL COMMENT ''上传状态'' AFTER `user_type`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) 刷入符合设计稿的字段数据（按 gas_code 幂等更新，仅当新字段为空时填充）
UPDATE `security_check` SET
  `order_code` = 'SC20260415001',
  `customer_name` = '张建国',
  `phone` = '138****0001',
  `report_book` = '第3册',
  `user_type` = '居民用户',
  `upload_status` = '已上传',
  `check_status` = 'checked',
  `visit_result` = 'done',
  `has_danger` = '0',
  `max_danger_level` = NULL,
  `danger_count` = 0,
  `company` = '北京燃气第一分公司',
  `check_area` = '朝阳片区',
  `check_category` = '入户安检'
WHERE `gas_code` = 'GD202604001' AND `phone` IS NULL;

UPDATE `security_check` SET
  `order_code` = 'SC20260415002',
  `customer_name` = '李淑芬',
  `phone` = '138****0002',
  `report_book` = '第5册',
  `user_type` = '居民用户',
  `upload_status` = '已上传',
  `check_status` = 'checked',
  `visit_result` = 'done',
  `has_danger` = '1',
  `max_danger_level` = '1',
  `danger_count` = 2,
  `company` = '北京燃气第二分公司',
  `check_area` = '海淀片区',
  `check_category` = '入户安检'
WHERE `gas_code` = 'GD202604002' AND `phone` IS NULL;

UPDATE `security_check` SET
  `order_code` = 'SC20260415003',
  `customer_name` = '王秀英',
  `phone` = '138****0003',
  `report_book` = '第2册',
  `user_type` = '居民用户',
  `upload_status` = '已上传',
  `check_status` = 'checked',
  `visit_result` = 'done',
  `has_danger` = '0',
  `max_danger_level` = NULL,
  `danger_count` = 0,
  `company` = '北京燃气第一分公司',
  `check_area` = '丰台片区',
  `check_category` = '入户安检'
WHERE `gas_code` = 'GD202604003' AND `phone` IS NULL;

UPDATE `security_check` SET
  `order_code` = 'SC20260415004',
  `customer_name` = '赵国庆',
  `phone` = '138****0004',
  `report_book` = '第8册',
  `user_type` = '非居民用户',
  `upload_status` = '已上传',
  `check_status` = 'checked',
  `visit_result` = 'done',
  `has_danger` = '1',
  `max_danger_level` = '2',
  `danger_count` = 1,
  `company` = '北京燃气第三分公司',
  `check_area` = '西城片区',
  `check_category` = '入户安检'
WHERE `gas_code` = 'GD202604004' AND `order_code` IS NULL;

UPDATE `security_check` SET
  `order_code` = 'SC20260415005',
  `customer_name` = '刘阿姨',
  `phone` = '138****0005',
  `report_book` = '第1册',
  `user_type` = '居民用户',
  `upload_status` = '未上传',
  `check_status` = 'unchecked',
  `visit_result` = 'home',
  `has_danger` = '0',
  `max_danger_level` = NULL,
  `danger_count` = 0,
  `company` = '北京燃气第一分公司',
  `check_area` = '东城片区',
  `check_category` = '入户安检'
WHERE `gas_code` = 'GD202604005' AND `order_code` IS NULL;

-- 3) 补充更多演示数据（仅当表中总数 <=5 时插入，避免重复）
INSERT INTO `security_check`
  (`order_code`, `gas_code`, `customer_name`, `phone`, `report_book`, `check_status`, `visit_result`, `check_user`,
   `user_type`, `upload_status`, `has_danger`, `max_danger_level`, `danger_count`, `address`, `company`, `check_area`,
   `check_category`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'SC20260415006', 'GD202604006', '陈晓东', '138****0006', '第4册', 'checked', 'done', '周涛',
       '居民用户', '已上传', '1', '1', 3, '北京市昌平区回龙观东大街108号院4栋301',
       '北京燃气第二分公司', '昌平片区', '入户安检',
       '2026-04-10 09:00:00', '不合格', '灶具连接管老化', 'fail'
FROM DUAL WHERE (SELECT COUNT(*) FROM `security_check`) <= 5;

INSERT INTO `security_check`
  (`order_code`, `gas_code`, `customer_name`, `phone`, `report_book`, `check_status`, `visit_result`, `check_user`,
   `user_type`, `upload_status`, `has_danger`, `max_danger_level`, `danger_count`, `address`, `company`, `check_area`,
   `check_category`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'SC20260415007', 'GD202604007', '林慧敏', '138****0007', '第6册', 'checked', 'done', '黄玲',
       '居民用户', '已上传', '0', NULL, 0, '北京市通州区新华西街56号院2栋1802',
       '北京燃气第一分公司', '通州片区', '入户安检',
       '2026-04-09 14:30:00', '合格', '无', 'pass'
FROM DUAL WHERE (SELECT COUNT(*) FROM `security_check`) <= 6;

INSERT INTO `security_check`
  (`order_code`, `gas_code`, `customer_name`, `phone`, `report_book`, `check_status`, `visit_result`, `check_user`,
   `user_type`, `upload_status`, `has_danger`, `max_danger_level`, `danger_count`, `address`, `company`, `check_area`,
   `check_category`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'SC20260415008', 'GD202604008', '吴志强', '138****0008', '第7册', 'unchecked', 'refuse', '张明',
       '非居民用户', '未上传', '0', NULL, 0, '北京市石景山区八角西街66号院6栋101',
       '北京燃气第三分公司', '石景山片区', '入户安检',
       '2026-04-08 10:20:00', '待安检', '无', 'pending'
FROM DUAL WHERE (SELECT COUNT(*) FROM `security_check`) <= 7;

INSERT INTO `security_check`
  (`order_code`, `gas_code`, `customer_name`, `phone`, `report_book`, `check_status`, `visit_result`, `check_user`,
   `user_type`, `upload_status`, `has_danger`, `max_danger_level`, `danger_count`, `address`, `company`, `check_area`,
   `check_category`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'SC20260415009', 'GD202604009', '黄丽萍', '138****0009', '第9册', 'checked', 'done', '李强',
       '居民用户', '已上传', '1', '3', 1, '北京市大兴区兴华大街20号院3栋506',
       '北京燃气第二分公司', '大兴片区', '复检',
       '2026-04-07 16:00:00', '不合格', '报警器超期', 'fail'
FROM DUAL WHERE (SELECT COUNT(*) FROM `security_check`) <= 8;

INSERT INTO `security_check`
  (`order_code`, `gas_code`, `customer_name`, `phone`, `report_book`, `check_status`, `visit_result`, `check_user`,
   `user_type`, `upload_status`, `has_danger`, `max_danger_level`, `danger_count`, `address`, `company`, `check_area`,
   `check_category`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'SC20260415010', 'GD202604010', '郑国华', '138****0010', '第10册', 'checked', 'done', '王伟',
       '居民用户', '已上传', '0', NULL, 0, '北京市顺义区府前中路11号院1栋1603',
       '北京燃气第一分公司', '顺义片区', '入户安检',
       '2026-04-06 11:45:00', '合格', '无', 'pass'
FROM DUAL WHERE (SELECT COUNT(*) FROM `security_check`) <= 9;
