CREATE TABLE IF NOT EXISTS `security_check` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `gas_code` varchar(50) DEFAULT NULL COMMENT '燃气编号',
  `address` varchar(255) DEFAULT NULL COMMENT '用户地址',
  `check_user` varchar(50) DEFAULT NULL COMMENT '安检人员',
  `check_date` datetime DEFAULT NULL COMMENT '安检日期',
  `check_result` varchar(20) DEFAULT NULL COMMENT '安检结果',
  `hidden_danger` varchar(100) DEFAULT NULL COMMENT '隐患项',
  `status` varchar(20) DEFAULT NULL COMMENT '状态',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安检记录';

INSERT INTO `security_check` (`gas_code`, `address`, `check_user`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'GD202604001', '北京市朝阳区建国路88号院3栋1单元502', '张明', '2026-04-15 09:30:00', '合格', '无', 'pass'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `security_check` WHERE `gas_code` = 'GD202604001');

INSERT INTO `security_check` (`gas_code`, `address`, `check_user`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'GD202604002', '北京市海淀区中关村大街32号6栋3单元801', '李强', '2026-04-14 14:20:00', '不合格', '灶具连接管老化', 'fail'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `security_check` WHERE `gas_code` = 'GD202604002');

INSERT INTO `security_check` (`gas_code`, `address`, `check_user`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'GD202604003', '北京市丰台区南三环西路16号院2栋402', '王伟', '2026-04-13 10:00:00', '合格', '无', 'pass'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `security_check` WHERE `gas_code` = 'GD202604003');

INSERT INTO `security_check` (`gas_code`, `address`, `check_user`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'GD202604004', '北京市西城区德胜门外大街10号院1栋603', '赵刚', '2026-04-12 16:45:00', '不合格', '燃气表接口漏气', 'fail'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `security_check` WHERE `gas_code` = 'GD202604004');

INSERT INTO `security_check` (`gas_code`, `address`, `check_user`, `check_date`, `check_result`, `hidden_danger`, `status`)
SELECT 'GD202604005', '北京市东城区东直门内大街77号院5栋201', '刘洋', '2026-04-11 11:15:00', '合格', '无', 'pending'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `security_check` WHERE `gas_code` = 'GD202604005');
