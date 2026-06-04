-- 工单管理相关菜单（工匠中心下的二级/三级菜单）
-- 所有 INSERT 使用 WHERE NOT EXISTS 模式，防止重复执行

-- 一、工匠中心（一级菜单，如果不存在则创建）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'craftsman-center', '工匠中心', NULL, 'user', 8, 1, 0, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'craftsman-center' AND (`menu_type` = '业务菜单' OR `menu_type` != ''));

-- 二、工单管理（二级菜单，工匠中心下）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'workorder-center', '工单管理', NULL, 'work-order', 1, 1, id, '业务菜单'
FROM nav_menu WHERE `key` = 'craftsman-center' AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-center') LIMIT 1;

-- 工单管理三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-pool' AS `key`, '工单池' AS label, '/workorder-pool' AS path, 'list' AS icon, 1 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-pool');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-abnormal' AS `key`, '异常工单' AS label, '/workorder-abnormal' AS path, 'alert' AS icon, 2 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-abnormal');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-sampling' AS `key`, '抽样单管理' AS label, '/workorder-sampling' AS path, 'check-circle' AS icon, 3 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-sampling');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-return-visit' AS `key`, '回访查看' AS label, '/workorder-return-visit' AS path, 'phone' AS icon, 4 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-return-visit');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-barcode-error' AS `key`, '异常条码处理' AS label, '/workorder-barcode-error' AS path, 'barcode' AS icon, 5 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-barcode-error');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-correction' AS `key`, '订正异常查询' AS label, '/workorder-correction' AS path, 'edit' AS icon, 6 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-correction');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'workorder-sn-search' AS `key`, 'SN码查询' AS label, '/workorder-sn-search' AS path, 'search' AS icon, 7 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'workorder-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'workorder-sn-search');

-- 三、基础配置（二级菜单，工匠中心下）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'config-center', '基础配置', NULL, 'setting', 2, 1, id, '业务菜单'
FROM nav_menu WHERE `key` = 'craftsman-center' AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-center') LIMIT 1;

-- 基础配置三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-fault-phenomenon' AS `key`, '故障现象配置' AS label, '/config-fault-phenomenon' AS path, 'warning' AS icon, 1 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-fault-phenomenon');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-fault-reason' AS `key`, '故障原因配置' AS label, '/config-fault-reason' AS path, 'info-circle' AS icon, 2 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-fault-reason');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-repair-measure' AS `key`, '维修措施配置' AS label, '/config-repair-measure' AS path, 'wrench' AS icon, 3 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-repair-measure');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-repair-parts' AS `key`, '维修配件配置' AS label, '/config-repair-parts' AS path, 'package' AS icon, 4 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-repair-parts');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-workorder-rule' AS `key`, '工单规则设置' AS label, '/config-workorder-rule' AS path, 'rule' AS icon, 5 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-workorder-rule');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-evaluation' AS `key`, '评价设置' AS label, '/config-evaluation' AS path, 'star' AS icon, 6 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-evaluation');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'config-device-link' AS `key`, '设备关联配置' AS label, '/config-device-link' AS path, 'link' AS icon, 7 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'config-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'config-device-link');

-- 四、品质反馈（二级菜单，工匠中心下）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'quality-center', '品质反馈', NULL, 'check-square', 3, 1, id, '业务菜单'
FROM nav_menu WHERE `key` = 'craftsman-center' AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'quality-center') LIMIT 1;

-- 品质反馈三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'quality-feedback-list' AS `key`, '品质反馈申请列表' AS label, '/quality-feedback-list' AS path, 'clipboard' AS icon, 1 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'quality-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'quality-feedback-list');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'quality-batch-list' AS `key`, '批次反馈申请列表' AS label, '/quality-batch-list' AS path, 'layers' AS icon, 2 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'quality-center'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'quality-batch-list');

-- 五、工匠管理（二级菜单，工匠中心下）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'craftsman-manage', '工匠管理', NULL, 'team', 4, 1, id, '业务菜单'
FROM nav_menu WHERE `key` = 'craftsman-center' AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'craftsman-manage') LIMIT 1;

-- 工匠管理三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'craftsman-skill' AS `key`, '工匠技能管理' AS label, '/craftsman-skill' AS path, 'award' AS icon, 1 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'craftsman-manage'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'craftsman-skill');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'craftsman-application' AS `key`, '工匠申请查询' AS label, '/craftsman-application' AS path, 'file-application' AS icon, 2 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'craftsman-manage'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'craftsman-application');

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT x.* FROM (
  SELECT 'craftsman-search' AS `key`, '工匠列表' AS label, '/craftsman-search' AS path, 'search-user' AS icon, 3 AS sort, 1 AS status, id AS parent_id, '业务菜单' AS menu_type FROM nav_menu WHERE `key` = 'craftsman-manage'
) x WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'craftsman-search');

-- 注意：不执行 UPDATE level 语句，以免覆盖菜单管理页面中用户手动设置的 level 值
