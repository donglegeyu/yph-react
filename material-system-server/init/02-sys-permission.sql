-- 权限系统数据库脚本
-- 创建时间：2026-05-07

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    nickname VARCHAR(50) COMMENT '昵称',
    status TINYINT DEFAULT 1 COMMENT '1-启用 0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 域表
CREATE TABLE IF NOT EXISTS sys_domain (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    domain_key VARCHAR(50) NOT NULL UNIQUE COMMENT '域标识',
    domain_name VARCHAR(100) NOT NULL COMMENT '域名称',
    description VARCHAR(255) COMMENT '描述',
    is_default TINYINT DEFAULT 0 COMMENT '1-默认域(不可调整层级排序) 0-自定义域',
    status TINYINT DEFAULT 1 COMMENT '1-启用 0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_domain_key (domain_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='域表';

-- 域-菜单关联表（支持域内个性化配置）
CREATE TABLE IF NOT EXISTS sys_domain_menu (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    domain_id BIGINT NOT NULL COMMENT '域ID',
    menu_id BIGINT NOT NULL COMMENT '菜单ID（关联nav_menu）',
    custom_label VARCHAR(100) COMMENT '域内自定义菜单名称（为空使用默认名称）',
    custom_level INT COMMENT '域内自定义层级（仅自定义域可用，为空继承系统层级）',
    custom_parent_id BIGINT COMMENT '域内自定义父菜单（仅自定义域可用，指向sys_domain_menu.id）',
    sort INT DEFAULT 0 COMMENT '域内排序（默认域使用系统排序）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_domain_menu (domain_id, menu_id),
    KEY idx_domain_id (domain_id),
    KEY idx_menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='域-菜单关联表';

-- 数据权限规则表（支持域级别和用户级别）
CREATE TABLE IF NOT EXISTS sys_data_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT COMMENT '用户ID（用户级别规则，可为空）',
    domain_id BIGINT COMMENT '域ID（域级别规则，可为空）',
    menu_key VARCHAR(50) NOT NULL COMMENT '菜单标识',
    filter_type VARCHAR(20) NOT NULL COMMENT '过滤类型：all/self/dept/custom',
    filter_field VARCHAR(50) COMMENT '过滤字段',
    filter_value VARCHAR(255) COMMENT '过滤值',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_id (user_id),
    KEY idx_domain_id (domain_id),
    KEY idx_menu_key (menu_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据权限规则表';

-- 用户-域关联表
CREATE TABLE IF NOT EXISTS sys_user_domain (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    domain_id BIGINT NOT NULL COMMENT '域ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_domain (user_id, domain_id),
    KEY idx_user_id (user_id),
    KEY idx_domain_id (domain_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-域关联表';

-- 初始化默认域「星际造梦」
INSERT INTO sys_domain (domain_key, domain_name, description, is_default, status) VALUES
('xingjiZM', '星际造梦', '系统默认域，使用系统默认菜单结构', 1, 1);

-- 为默认域添加所有菜单（使用系统菜单）
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT
    (SELECT id FROM sys_domain WHERE domain_key = 'xingjiZM'),
    id,
    label,
    sort
FROM nav_menu
WHERE deleted = 0 AND status = 1;
