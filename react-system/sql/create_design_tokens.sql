-- ========== Design Token 系统表 ==========

CREATE TABLE IF NOT EXISTS design_token_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description VARCHAR(200) COMMENT '分类描述',
    code VARCHAR(50) NOT NULL COMMENT '分类标识',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设计Token分类表';

CREATE TABLE IF NOT EXISTS design_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT 'Token名称',
    token_key VARCHAR(100) NOT NULL COMMENT 'Token变量名',
    token_type VARCHAR(50) NOT NULL COMMENT 'Token类型',
    default_value VARCHAR(255) NOT NULL COMMENT '默认值',
    current_value VARCHAR(255) NOT NULL COMMENT '当前值',
    description VARCHAR(500) COMMENT '描述',
    is_ant_design_token TINYINT DEFAULT 0 COMMENT '是否Ant Design Token',
    ant_design_token_name VARCHAR(100) COMMENT 'Ant Design Token名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_category_id (category_id),
    UNIQUE KEY uk_token_key (token_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设计Token表';

-- ========== 初始化分类 ==========

INSERT INTO design_token_category (name, description, code, sort_order) VALUES
('颜色', '颜色相关Token', 'color', 1),
('字体', '字体相关Token', 'typography', 2),
('间距', '间距相关Token', 'spacing', 3),
('边框', '边框圆角相关Token', 'border', 4),
('阴影', '阴影相关Token', 'shadow', 5),
('自定义', '用户自定义Token', 'custom', 6);

-- ========== 初始化基础 Token ==========

SET @color_id = (SELECT id FROM design_token_category WHERE code = 'color');
SET @typo_id = (SELECT id FROM design_token_category WHERE code = 'typography');

-- 品牌色
INSERT INTO design_token (category_id, name, token_key, token_type, default_value, current_value, description, is_ant_design_token, sort_order) VALUES
(@color_id, '主色', '--primary-color', 'color', '#F95914', '#F95914', '主品牌色', 1, 1),
(@color_id, '主色悬停', '--primary-hover', 'color', '#FF7756', '#FF7756', '主色悬停状态', 1, 2),
(@color_id, '主色激活', '--primary-active', 'color', '#E64A19', '#E64A19', '主色激活状态', 1, 3),
(@color_id, '成功色', '--color-success', 'color', '#52C41A', '#52C41A', '成功状态色', 1, 6),
(@color_id, '警告色', '--color-warning', 'color', '#FAAD14', '#FAAD14', '警告状态色', 1, 7),
(@color_id, '错误色', '--color-error', 'color', '#FF4D4F', '#FF4D4F', '错误状态色', 1, 8),
(@color_id, '信息色', '--color-info', 'color', '#1890FF', '#1890FF', '信息状态色', 1, 9),
(@color_id, '主文本色', '--color-text', 'color', '#000000E6', '#000000E6', '主要文本色', 1, 20),
(@color_id, '次要文本色', '--color-text-secondary', 'color', '#00000073', '#00000073', '次要文本色', 1, 21),
(@color_id, '主边框色', '--color-border', 'color', '#D9D9D9', '#D9D9D9', '主要边框色', 1, 31),
(@color_id, '次要边框色', '--color-border-secondary', 'color', '#F0F0F0', '#F0F0F0', '次要边框色', 0, 32);

-- 字体类
INSERT INTO design_token (category_id, name, token_key, token_type, default_value, current_value, description, is_ant_design_token, sort_order) VALUES
(@typo_id, '基础字号', '--font-size-base', 'number', '14', '14', '基础字号(px)', 0, 1),
(@typo_id, '小号字体', '--font-size-sm', 'number', '12', '12', '小号字体(px)', 0, 2),
(@typo_id, '大号字体', '--font-size-lg', 'number', '16', '16', '大号字体(px)', 0, 3);

-- 基础色阶 (primary-1 ~ primary-10)
INSERT INTO design_token (category_id, name, token_key, token_type, default_value, current_value, description, is_ant_design_token, sort_order) VALUES
(@color_id, '基础1', '--primary-1', 'color', '#FFF2E8', '#FFF2E8', '主色色阶1', 0, 51),
(@color_id, '基础2', '--primary-2', 'color', '#FFDCD1', '#FFDCD1', '主色色阶2', 0, 52),
(@color_id, '基础3', '--primary-3', 'color', '#FFBBA8', '#FFBBA8', '主色色阶3', 0, 53),
(@color_id, '基础4', '--primary-4', 'color', '#FF997F', '#FF997F', '主色色阶4', 0, 54),
(@color_id, '基础5', '--primary-5', 'color', '#FF7756', '#FF7756', '主色色阶5', 0, 55),
(@color_id, '基础6', '--primary-6', 'color', '#F95914', '#F95914', '主色色阶6(基准)', 0, 56),
(@color_id, '基础7', '--primary-7', 'color', '#E64A19', '#E64A19', '主色色阶7', 0, 57),
(@color_id, '基础8', '--primary-8', 'color', '#CC3D10', '#CC3D10', '主色色阶8', 0, 58),
(@color_id, '基础9', '--primary-9', 'color', '#993008', '#993008', '主色色阶9', 0, 59),
(@color_id, '基础10', '--primary-10', 'color', '#662300', '#662300', '主色色阶10', 0, 60);

-- ========== sys_user 初始化 ==========

INSERT INTO sys_user (username, password, nickname, status) VALUES
('admin', 'admin123', '管理员', 1);

-- ========== component_token 初始化 ==========

INSERT INTO component_token (component_name, token_key, token_type, default_light_value, default_dark_value, current_light_value, current_dark_value, description, sort_order) VALUES
('Button', '--primary-color', 'color', '#F95914', '#FF6A3D', '#F95914', '#FF6A3D', '按钮主色', 1),
('Button', '--primary-hover', 'color', '#FF7756', '#FF8A5C', '#FF7756', '#FF8A5C', '按钮悬停色', 2),
('Button', '--border-radius-base', 'number', '6', '6', '6', '6', '按钮圆角', 3),
('Input', '--color-border', 'color', '#D9D9D9', '#434343', '#D9D9D9', '#434343', '输入框边框', 1),
('Input', '--color-text', 'color', '#000000E6', '#FFFFFFE6', '#000000E6', '#FFFFFFE6', '输入框文字', 2),
('Table', '--color-border', 'color', '#D9D9D9', '#434343', '#D9D9D9', '#434343', '表格边框', 1),
('Form', '--color-border', 'color', '#D9D9D9', '#434343', '#D9D9D9', '#434343', '表单边框', 1),
('Modal', '--border-radius-base', 'number', '8', '8', '8', '8', '弹窗圆角', 1),
('Card', '--color-bg-container', 'color', '#FFFFFF', '#1F1F1F', '#FFFFFF', '#1F1F1F', '卡片背景', 1),
('Card', '--border-radius-base', 'number', '6', '6', '6', '6', '卡片圆角', 2);
