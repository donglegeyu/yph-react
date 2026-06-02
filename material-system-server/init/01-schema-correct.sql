-- 材料申请管理系统数据库初始化脚本

-- 材料申请表
CREATE TABLE IF NOT EXISTS material_application (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_no VARCHAR(50) COMMENT '申请单号',
    material_name VARCHAR(255) COMMENT '材料名称',
    spec VARCHAR(100) COMMENT '规格型号',
    unit VARCHAR(20) COMMENT '单位',
    quantity DECIMAL(12,2) COMMENT '申请数量',
    material_quantity DECIMAL(12,2) COMMENT '材料数量',
    department VARCHAR(50) COMMENT '部门',
    supplier VARCHAR(255) COMMENT '供应商',
    description TEXT COMMENT '描述',
    status VARCHAR(50) COMMENT '状态',
    applicant VARCHAR(100) COMMENT '申请人',
    apply_time DATETIME COMMENT '申请时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='材料申请表';

-- 导航菜单表
CREATE TABLE IF NOT EXISTS nav_menu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) COMMENT '菜单Key',
    label VARCHAR(100) COMMENT '菜单名称',
    path VARCHAR(255) COMMENT '路径',
    icon VARCHAR(50) COMMENT '图标',
    sort INT DEFAULT 0 COMMENT '排序',
    status INT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    parent_id BIGINT DEFAULT 0 COMMENT '父级ID',
    level INT DEFAULT 0 COMMENT '层级',
    menu_type VARCHAR(50) DEFAULT '业务菜单' COMMENT '菜单类型：业务菜单、系统菜单-上',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导航菜单表';

-- 插入默认菜单数据
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) VALUES
('home', '首页', '/home', 'home', 1, 1, 0, '系统菜单-上'),
('favorites', '收藏', '/favorites', 'star', 2, 1, 0, '系统菜单-上'),
('material-center', '材料中心', NULL, 'file', 3, 1, 0, '业务菜单'),
('material-apply', '材料申请', '/materials', 'list', 1, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='material-center') AS t), '业务菜单'),
('construction-library', '施工项库', '/construction-library', 'building-one', 2, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='material-center') AS t), '业务菜单'),
('purchase-center', '采购中心', NULL, 'buy', 2, 1, 0, '业务菜单'),
('purchase-demand', '采购需求单', '/purchase-demand', 'transaction', 1, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='purchase-center') AS t), '业务菜单'),
('purchase-order', '采购订单', '/purchase-order', 'bill', 2, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='purchase-center') AS t), '业务菜单'),
('product-center', '商品中心', NULL, 'commodity', 3, 1, 0, '业务菜单'),
('tag-list', '标签列表', '/tag-list', 'coupon', 1, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='product-center') AS t), '业务菜单'),
('category-list', '分类列表', '/category-list', 'list', 2, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='product-center') AS t), '业务菜单'),
('brand-list', '品牌列表', '/brand-list', 'bank-card', 3, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='product-center') AS t), '业务菜单'),
('settings-center', '系统中心', NULL, 'setting', 4, 1, 0, '业务菜单'),
('menu-management', '菜单管理', '/menu-management', 'list', 1, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') AS t), '业务菜单'),
('domain-manage', '域管理', '/domain-manage', 'setting', 2, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') AS t), '业务菜单'),
('user-management', '用户管理', '/user-management', 'user', 3, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') AS t), '业务菜单'),
('system-settings', '系统设置', NULL, 'tool', 4, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') AS t), '业务菜单'),
('permission-query', '权限查询', '/permission-query', 'safe', 5, 1, (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='settings-center') AS t), '业务菜单'),
('super-search', '超级搜索', NULL, 'search', 1, 1, 0, '系统菜单-下');

-- 修复所有菜单的 level 值
UPDATE nav_menu SET level = 0 WHERE parent_id IS NULL OR parent_id = 0;
UPDATE nav_menu SET level = 1 WHERE parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE parent_id IS NULL OR parent_id = 0) AS t) AND (parent_id IS NOT NULL AND parent_id != 0);
UPDATE nav_menu SET level = 2 WHERE parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 1) AS t);
UPDATE nav_menu SET level = 3 WHERE parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 2) AS t);
