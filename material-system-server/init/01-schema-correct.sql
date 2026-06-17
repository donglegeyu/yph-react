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

-- 注：菜单种子数据已统一迁移到 09-menu-seed.sql 集中管理
