-- ============================================================
-- 全量菜单种子数据（统一管理，替代原 01/06/09.5/12/16 中分散的菜单 INSERT）
-- ============================================================
-- 说明：
--   1. 本文件是 nav_menu 菜单数据的【唯一来源】，后续新增菜单只改这里
--   2. 所有菜单只写基础列，menu_category 由 15-rbac.sql 回填（有 path→C，无 path→M）
--   3. 末尾统一同步默认域，解决原 02 号脚本「过早同步」导致菜单缺失的问题
--   4. parent_id 用动态子查询引用 parent 的 key，避免硬编码数字 ID
-- ============================================================

-- ============================================================
-- 一、一级菜单（parent_id = 0）
-- ============================================================
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
-- 系统菜单
('home',             '首页',     '/home',       'home',    1, 1, 0, '系统菜单-上'),
('favorites',        '收藏',     '/favorites',  'star',    2, 1, 0, '系统菜单-上'),
('super-search',     '超级搜索', NULL,          'search',  1, 1, 0, '系统菜单-下'),
-- 业务一级中心
('purchase-center',  '采购中心', NULL, 'buy',        2, 1, 0, '业务菜单'),
('material-center',  '商品中心', '',   'file',       3, 1, 0, '业务菜单'),
('product-center',   '演示中心', '',   'commodity',  3, 1, 0, '业务菜单'),
('settings-center',  '系统中心', NULL, 'setting',    4, 1, 0, '业务菜单'),
('bidding-center',   '招采中心', NULL, NULL,         5, 1, 0, '业务菜单'),
('central-stock',    '中央库存', NULL, NULL,         6, 1, 0, '业务菜单'),
('customer-center',  '客户中心', NULL, NULL,         7, 1, 0, '业务菜单'),
('craftsman-center', '工匠中心', NULL, 'user',       8, 1, 0, '业务菜单'),
('stock-center',     '库存中心', NULL, NULL,         8, 1, 0, '业务菜单'),
('logistics-center', '物流中心', NULL, NULL,         9, 1, 0, '业务菜单'),
('price-center',     '价格中心', NULL, NULL,        10, 1, 0, '业务菜单'),
('organization-center','组织中心', NULL, NULL,      11, 1, 0, '业务菜单'),
('message-center',   '消息中心', NULL, NULL,        12, 1, 0, '业务菜单');

-- ============================================================
-- 二、材料中心 / 商品中心 下的二级菜单
-- ============================================================
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('material-apply',       '材料申请',     '/materials',          'list',         1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='material-center') t), '业务菜单'),
('construction-library', '施工项库',     '/construction-library','building-one', 2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='material-center') t), '业务菜单'),
('construction-apply',   '施工申请列表', '/construction-apply', NULL,           1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='construction-library') t), '业务菜单'),
('tag-list',             '标签列表',     '/tag-list',           'coupon',       1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='product-center') t), '业务菜单'),
('brand-list',           '安检结果查询', '/security-check-query','bank-card',    3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='product-center') t), '业务菜单');

-- ============================================================
-- 三、采购中心下的二级菜单
-- ============================================================
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('purchase-demand', '采购需求单', '/purchase-demand', 'transaction', 1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='purchase-center') t), '业务菜单'),
('purchase-order',  '采购订单',   '/purchase-order',  'bill',        2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='purchase-center') t), '业务菜单');

-- ============================================================
-- 四、系统中心下的二级菜单（菜单/域管理分组、权限管理目录、系统设置目录）
-- ============================================================
-- 4.1 「菜单/域管理」分组
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('menu-domain-group', '菜单/域管理', '', NULL, 0, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') t), '业务菜单'),
('menu-management', '菜单管理', '/menu-management', 'list',    1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='menu-domain-group') t), '业务菜单'),
('domain-manage',   '域管理',   '/domain-manage',   'setting', 2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='menu-domain-group') t), '业务菜单');

-- 4.2 「权限管理」目录
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('permission-center',       '权限管理', NULL,                'safe',  1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') t), '业务菜单'),
('user-management',         '账号管理', '/user-management', 'user',  1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='permission-center') t), '业务菜单'),
('department-management',   '部门管理', '/department-management', 'team', 2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='permission-center') t), '业务菜单'),
('role-management',         '角色管理', '/role-management', 'award', 3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='permission-center') t), '业务菜单'),
('permission-query',        '权限查询', '/permission-query', 'safe',  4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='permission-center') t), '业务菜单');

-- 4.3 「系统设置」目录
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('system-settings',    '系统设置', NULL,               'tool', 4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') t), '业务菜单'),
('component-preview',  '组件预览', '/component-preview','app',  1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='system-settings') t), '业务菜单');

-- ============================================================
-- 五、工匠中心下的二级/三级菜单
-- ============================================================
-- 5.1 二级目录
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('craftsman-manage', '工匠管理', '',   'team',         0, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center') t), '业务菜单'),
('workorder-center', '工单管理', NULL, 'work-order',   1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center') t), '业务菜单'),
('config-center',    '基础配置', NULL, 'setting',      2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center') t), '业务菜单'),
('quality-center',   '品质反馈', NULL, 'check-square', 3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center') t), '业务菜单'),
('training-resource', '培训管理', NULL, 'book',          4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center') t), '业务菜单');

-- 5.2 工单管理三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('workorder-pool',         '工单池',       '/workorder-pool',         'list',         1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单'),
('workorder-abnormal',     '异常工单',     '/workorder-abnormal',     'alert',        2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单'),
('workorder-sampling',     '抽样单管理',   '/workorder-sampling',     'check-circle', 3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单'),
('workorder-return-visit', '回访查看',     '/workorder-return-visit', 'phone',        4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单'),
('workorder-barcode-error','异常条码处理', '/workorder-barcode-error','barcode',      5, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单'),
('workorder-correction',   '订正异常查询', '/workorder-correction',   'edit',         6, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单'),
('workorder-sn-search',    'SN码查询',     '/workorder-sn-search',    'search',       7, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='workorder-center') t), '业务菜单');

-- 5.3 基础配置三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('config-fault-phenomenon','故障现象配置','/config-fault-phenomenon','warning',      1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单'),
('config-fault-reason',    '故障原因配置','/config-fault-reason',    'info-circle',  2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单'),
('config-repair-measure',  '维修措施配置','/config-repair-measure',  'wrench',       3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单'),
('config-repair-parts',    '维修配件配置','/config-repair-parts',    'package',      4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单'),
('config-workorder-rule',  '工单规则设置','/config-workorder-rule',  'rule',         5, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单'),
('config-evaluation',      '评价设置',    '/config-evaluation',      'star',         6, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单'),
('config-device-link',     '设备关联配置','/config-device-link',     'link',         7, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='config-center') t), '业务菜单');

-- 5.4 品质反馈三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('quality-feedback-list', '品质反馈申请列表','/quality-feedback-list','clipboard', 1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='quality-center') t), '业务菜单'),
('quality-batch-list',    '批次反馈申请列表','/quality-batch-list',  'layers',    2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='quality-center') t), '业务菜单');

-- 5.5 工匠管理三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('craftsman-skill',       '技能管理','/craftsman-skill',      'award',            1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-manage') t), '业务菜单'),
('craftsman-application', '工匠申请','/craftsman-application','file-application', 2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-manage') t), '业务菜单'),
('craftsman-search',      '工匠列表','/craftsman-search',     'search-user',      3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-manage') t), '业务菜单');

-- 5.6 培训管理三级菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('courseware-manage',    '课件管理',   '/courseware-manage',    'file-text',       1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource') t), '业务菜单'),
('course-manage',        '课程管理',   '/course-manage',        'read',            2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource') t), '业务菜单'),
('question-bank-manage', '题库管理',   '/question-bank-manage', 'question-circle', 3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource') t), '业务菜单'),
('training-task-manage', '培训任务', '/training-task-manage', 'schedule',        4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource') t), '业务菜单');

-- ============================================================
-- 六、修复 level 值（仅补 NULL，不覆盖手动设置）
-- ============================================================
UPDATE nav_menu SET level = 0 WHERE level IS NULL AND (parent_id IS NULL OR parent_id = 0);
UPDATE nav_menu SET level = 1 WHERE level IS NULL AND parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 0) t);
UPDATE nav_menu SET level = 2 WHERE level IS NULL AND parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 1) t);
UPDATE nav_menu SET level = 3 WHERE level IS NULL AND parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 2) t);

-- ============================================================
-- 七、统一同步默认域（关键！替代原 02 号脚本的过早同步）
-- ============================================================
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM nav_menu m
CROSS JOIN sys_domain d
WHERE d.is_default = 1 AND d.status = 1
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );

-- 注：超管角色(role_id=1) 的菜单权限由 15-rbac.sql 统一授予
-- （该脚本末尾有 INSERT INTO sys_role_menu SELECT 1, id FROM nav_menu，会自动覆盖本文件新增的菜单）

-- ============================================================
-- 八、初始化「工匠平台」自定义域 + 该域可见菜单
-- ============================================================
-- 说明：工匠平台域只开放工单/配置/品质/工匠相关菜单，不含采购/商品等业务中心

-- 8.1 创建工匠平台域（幂等）
INSERT INTO sys_domain (domain_key, domain_name, description, is_default, status)
SELECT 'gongjiangPT', '工匠平台', '工匠平台域，仅开放工单与工匠相关菜单', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM sys_domain WHERE domain_key = 'gongjiangPT');

-- 8.2 工匠平台域可见的菜单 key 清单
-- 包含：首页、收藏、工匠中心(含其下全部子菜单)
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM sys_domain d
JOIN nav_menu m ON m.`key` IN (
    'home', 'favorites',
    'craftsman-center',
    'craftsman-manage', 'craftsman-search', 'craftsman-skill', 'craftsman-application',
    'workorder-center',
    'workorder-pool', 'workorder-abnormal', 'workorder-sampling', 'workorder-return-visit',
    'workorder-barcode-error', 'workorder-correction', 'workorder-sn-search',
    'config-center',
    'config-fault-phenomenon', 'config-fault-reason', 'config-repair-measure', 'config-repair-parts',
    'config-workorder-rule', 'config-evaluation', 'config-device-link',
    'quality-center',
    'quality-feedback-list', 'quality-batch-list',
    'training-resource',
    'courseware-manage', 'course-manage', 'question-bank-manage',
    'training-task-manage'
)
WHERE d.domain_key = 'gongjiangPT'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );
