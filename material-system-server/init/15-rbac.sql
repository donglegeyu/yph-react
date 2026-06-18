-- ============================================================
-- RBAC 权限系统表结构（部门 / 角色 / 用户-角色 / 角色-菜单 / 角色-部门）
-- 创建时间：2026-06-15
-- 设计说明：
--   1. domain(域) 与 dept(部门) 共存：domain 管业务模块可见性，dept 管数据可见范围
--   2. menu_type 中文枚举保留不动，新增 menu_category CHAR(1) 存 M/C/F
--   3. 用户-部门 1:N（sys_user.dept_id），未来可升级 M:N
--   4. 数据范围拦截本期不做，仅建表存配置
-- ============================================================

-- ----------------------------------------------------------
-- 1. 扩展 sys_user 表：补充 RBAC 所需字段
-- ----------------------------------------------------------
ALTER TABLE sys_user
    ADD COLUMN real_name VARCHAR(50) NULL COMMENT '真实姓名' AFTER nickname,
    ADD COLUMN dept_id BIGINT NULL COMMENT '所属部门ID' AFTER real_name,
    ADD COLUMN phone VARCHAR(20) NULL COMMENT '手机号' AFTER dept_id,
    ADD COLUMN email VARCHAR(100) NULL COMMENT '邮箱' AFTER phone,
    ADD COLUMN last_login_time DATETIME NULL COMMENT '上次登录时间' AFTER status,
    ADD COLUMN last_login_ip VARCHAR(50) NULL COMMENT '上次登录IP' AFTER last_login_time;
ALTER TABLE sys_user ADD INDEX idx_dept_id (dept_id);

-- ----------------------------------------------------------
-- 2. 扩展 nav_menu 表：补充权限标识 / 组件路径 / 可见性 / 分类
-- ----------------------------------------------------------
ALTER TABLE nav_menu
    ADD COLUMN component VARCHAR(255) NULL COMMENT '组件路径(material/UserManagement)' AFTER path,
    ADD COLUMN perms VARCHAR(100) NULL COMMENT '权限标识(system:user:add)' AFTER component,
    ADD COLUMN visible TINYINT DEFAULT 1 COMMENT '1显示 0隐藏' AFTER perms,
    ADD COLUMN menu_category CHAR(1) NULL COMMENT '菜单分类 M目录 C菜单 F按钮' AFTER visible;
ALTER TABLE nav_menu ADD INDEX idx_perms (perms);

-- 给现有菜单回填 menu_category（业务菜单/系统菜单 → C 目录类父级无 path 的 → M）
UPDATE nav_menu SET menu_category = 'C' WHERE menu_category IS NULL AND path IS NOT NULL AND path != '';
UPDATE nav_menu SET menu_category = 'M' WHERE menu_category IS NULL AND (path IS NULL OR path = '');

-- ----------------------------------------------------------
-- 3. 部门表 sys_dept（树形，ancestors 存祖级路径便于查子树）
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT DEFAULT 0 COMMENT '父部门ID(根=0)',
    ancestors VARCHAR(255) DEFAULT '' COMMENT '祖级路径(逗号分隔,如 0,1,5)',
    dept_name VARCHAR(50) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) NOT NULL COMMENT '部门编码',
    sort_order INT DEFAULT 0 COMMENT '显示顺序',
    leader_user_id BIGINT NULL COMMENT '负责人ID(关联sys_user.id)',
    status TINYINT DEFAULT 1 COMMENT '1启用 0停用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_dept_code (dept_code),
    KEY idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 初始化部门树：总公司 → 研发部/销售部/财务部
INSERT INTO sys_dept (id, parent_id, ancestors, dept_name, dept_code, sort_order, status) VALUES
(1, 0, '0', '逸品汇总公司', 'yph_hq', 0, 1),
(2, 1, '0,1', '研发部', 'yph_rd', 1, 1),
(3, 1, '0,1', '销售部', 'yph_sales', 2, 1),
(4, 1, '0,1', '财务部', 'yph_finance', 3, 1),
(5, 3, '0,1,3', '华东销售组', 'yph_sales_east', 1, 1),
(6, 3, '0,1,3', '华北销售组', 'yph_sales_north', 2, 1);

-- ----------------------------------------------------------
-- 4. 角色表 sys_role
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL COMMENT '角色编码(ROLE_ADMIN)',
    data_scope TINYINT DEFAULT 1 COMMENT '1全部 2自定义部门 3本部门 4本部门及以下 5仅本人',
    sort_order INT DEFAULT 0 COMMENT '显示顺序',
    status TINYINT DEFAULT 1 COMMENT '1启用 0停用',
    remark VARCHAR(255) NULL COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 初始化角色
INSERT INTO sys_role (id, role_name, role_code, data_scope, sort_order, status, remark) VALUES
(1, '超级管理员', 'ROLE_ADMIN', 1, 0, 1, '拥有所有权限'),
(2, '研发人员', 'ROLE_DEV', 3, 1, 1, '本部门数据'),
(3, '销售专员', 'ROLE_SALES', 3, 2, 1, '本部门数据'),
(4, '销售主管', 'ROLE_SALES_LEADER', 4, 3, 1, '本部门及以下数据'),
(5, '财务专员', 'ROLE_FINANCE', 5, 4, 1, '仅本人数据');

-- ----------------------------------------------------------
-- 5. 用户-角色中间表 sys_user_role
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_role (user_id, role_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-角色关联表';

-- ----------------------------------------------------------
-- 6. 角色-菜单中间表 sys_role_menu（功能权限）
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_role_menu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL COMMENT '角色ID',
    menu_id BIGINT NOT NULL COMMENT '菜单ID(关联nav_menu)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_menu (role_id, menu_id),
    KEY idx_menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-菜单关联表';

-- 超级管理员拥有所有菜单权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM nav_menu WHERE deleted = 0 AND status = 1;

-- ----------------------------------------------------------
-- 7. 角色-部门中间表 sys_role_dept（数据权限，仅 data_scope=2 自定义时生效）
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_role_dept (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL COMMENT '角色ID',
    dept_id BIGINT NOT NULL COMMENT '部门ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_dept (role_id, dept_id),
    KEY idx_dept_id (dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-部门数据权限关联表';

-- ----------------------------------------------------------
-- 8. 给现有 admin 用户补充部门和角色
-- ----------------------------------------------------------
UPDATE sys_user SET real_name = '系统管理员', dept_id = 1 WHERE username = 'admin' AND real_name IS NULL;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, 1 FROM sys_user u WHERE u.username = 'admin'
AND NOT EXISTS (SELECT 1 FROM sys_user_role ur WHERE ur.user_id = u.id AND ur.role_id = 1);

-- ----------------------------------------------------------
-- 9. 研发角色(ROLE_DEV) 的菜单权限
-- ----------------------------------------------------------
-- 研发人员拥有：系统菜单 + 全部业务中心 + 采购/商品/工匠下的子菜单（不含系统中心管理类菜单）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 2, m.id
FROM nav_menu m
WHERE m.deleted = 0 AND m.status = 1
  AND m.`key` IN (
    -- 系统菜单
    'home', 'super-search', 'favorites',
    -- 业务一级中心（除系统中心 settings-center 外的全部）
    'purchase-center', 'material-center', 'bidding-center', 'central-stock',
    'customer-center', 'stock-center', 'craftsman-center', 'logistics-center',
    'price-center', 'organization-center', 'message-center',
    -- 商品中心 / 材料中心 子菜单
    'material-apply', 'construction-library', 'construction-apply',
    -- 采购中心 子菜单
    'purchase-demand', 'purchase-order',
    -- 工匠中心 全部子菜单
    'craftsman-manage', 'craftsman-search', 'craftsman-skill', 'craftsman-application',
    'workorder-center', 'workorder-pool', 'workorder-abnormal', 'workorder-sampling',
    'workorder-return-visit', 'workorder-barcode-error', 'workorder-correction', 'workorder-sn-search',
    'config-center', 'config-fault-phenomenon', 'config-fault-reason', 'config-repair-measure',
    'config-repair-parts', 'config-workorder-rule', 'config-evaluation', 'config-device-link',
    'quality-center', 'quality-feedback-list', 'quality-batch-list'
  )
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu rm WHERE rm.role_id = 2 AND rm.menu_id = m.id
  );

-- ----------------------------------------------------------
-- 10. 工匠演示账号绑定研发角色
-- ----------------------------------------------------------
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, 2 FROM sys_user u WHERE u.username = 'craftsman'
AND NOT EXISTS (SELECT 1 FROM sys_user_role ur WHERE ur.user_id = u.id AND ur.role_id = 2);
