-- Design Token 第二阶段脚本
-- 实现组件级 Token + 深色模式支持
-- 执行时间：2026-04-26

-- ==================== 1. 创建组件 Token 表 ====================

CREATE TABLE IF NOT EXISTS `component_token` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `component_name` VARCHAR(50) NOT NULL COMMENT '组件名称',
  `token_key` VARCHAR(100) NOT NULL COMMENT 'Token 变量名',
  `token_type` VARCHAR(50) NOT NULL COMMENT 'Token 类型',
  `default_light_value` VARCHAR(255) NOT NULL COMMENT '浅色模式默认值',
  `default_dark_value` VARCHAR(255) NOT NULL COMMENT '深色模式默认值',
  `current_light_value` VARCHAR(255) NOT NULL COMMENT '浅色模式当前值',
  `current_dark_value` VARCHAR(255) NOT NULL COMMENT '深色模式当前值',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '说明描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_component_token` (`component_name`, `token_key`),
  KEY `idx_component_name` (`component_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组件级 Token 表';

-- ==================== 2. 创建主题配置表 ====================

CREATE TABLE IF NOT EXISTS `theme_config` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `theme_name` VARCHAR(50) NOT NULL COMMENT '主题名称（light/dark）',
  `is_active` TINYINT(1) DEFAULT 0 COMMENT '是否激活',
  `config_json` TEXT NOT NULL COMMENT '主题配置 JSON',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_theme_name` (`theme_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题配置表';

-- ==================== 3. 初始化组件 Token ====================

-- Button 组件 Token（18 个）
INSERT INTO `component_token` (`component_name`, `token_key`, `token_type`, `default_light_value`, `default_dark_value`, `current_light_value`, `current_dark_value`, `description`, `sort_order`) VALUES
-- 颜色
('Button', 'colorPrimary', 'color', '#F95914', '#FF6A3D', '#F95914', '#FF6A3D', '主要按钮背景色', 1),
('Button', 'colorPrimaryHover', 'color', '#FF7043', '#FF8A5C', '#FF7043', '#FF8A5C', '主要按钮悬停背景色', 2),
('Button', 'colorPrimaryActive', 'color', '#E64A19', '#FF4D20', '#E64A19', '#FF4D20', '主要按钮按下背景色', 3),
('Button', 'colorPrimaryDisabled', 'color', 'rgba(249, 89, 20, 0.25)', 'rgba(255, 106, 61, 0.25)', 'rgba(249, 89, 20, 0.25)', 'rgba(255, 106, 61, 0.25)', '主要按钮禁用背景色', 4),
('Button', 'colorPrimaryTextHover', 'color', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '主要按钮悬停文字色', 5),
('Button', 'colorText', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '按钮文字色', 6),
('Button', 'colorTextDisabled', 'color', 'rgba(0, 0, 0, 0.26)', 'rgba(255, 255, 255, 0.26)', 'rgba(0, 0, 0, 0.26)', 'rgba(255, 255, 255, 0.26)', '按钮禁用文字色', 7),
-- 边框
('Button', 'borderColor', 'color', '#d9d9d9', '#434343', '#d9d9d9', '#434343', '按钮边框色', 8),
('Button', 'borderColorHover', 'color', '#F95914', '#FF6A3D', '#F95914', '#FF6A3D', '按钮悬停边框色', 9),
-- 尺寸
('Button', 'controlHeight', 'number', '40', '40', '40', '40', '按钮高度', 10),
('Button', 'controlHeightSM', 'number', '32', '32', '32', '32', '小按钮高度', 11),
('Button', 'controlHeightLG', 'number', '48', '48', '48', '48', '大按钮高度', 12),
-- 圆角
('Button', 'borderRadius', 'number', '6', '6', '6', '6', '按钮圆角', 13),
('Button', 'borderRadiusSM', 'number', '4', '4', '4', '4', '小按钮圆角', 14),
('Button', 'borderRadiusLG', 'number', '8', '8', '8', '8', '大按钮圆角', 15),
-- 字体
('Button', 'fontSize', 'number', '14', '14', '14', '14', '按钮字号', 16),
('Button', 'fontSizeSM', 'number', '12', '12', '12', '12', '小按钮字号', 17),
('Button', 'fontSizeLG', 'number', '16', '16', '16', '16', '大按钮字号', 18);

-- Input 组件 Token（16 个）
INSERT INTO `component_token` (`component_name`, `token_key`, `token_type`, `default_light_value`, `default_dark_value`, `current_light_value`, `current_dark_value`, `description`, `sort_order`) VALUES
-- 颜色
('Input', 'colorBgContainer', 'color', '#ffffff', '#1f1f1f', '#ffffff', '#1f1f1f', '输入框背景色', 1),
('Input', 'colorBorder', 'color', '#d9d9d9', '#434343', '#d9d9d9', '#434343', '输入框边框色', 2),
('Input', 'colorPrimaryHover', 'color', '#FF7043', '#FF8A5C', '#FF7043', '#FF8A5C', '输入框悬停边框色', 3),
('Input', 'colorPrimaryActive', 'color', '#E64A19', '#FF4D20', '#E64A19', '#FF4D20', '输入框聚焦边框色', 4),
('Input', 'colorText', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '输入框文字色', 5),
('Input', 'colorPlaceholderText', 'color', 'rgba(0, 0, 0, 0.25)', 'rgba(255, 255, 255, 0.25)', 'rgba(0, 0, 0, 0.25)', 'rgba(255, 255, 255, 0.25)', '输入框占位符文字色', 6),
('Input', 'colorDisabledBg', 'color', '#f5f5f5', '#262626', '#f5f5f5', '#262626', '输入框禁用背景色', 7),
-- 尺寸
('Input', 'controlHeight', 'number', '40', '40', '40', '40', '输入框高度', 8),
('Input', 'controlHeightSM', 'number', '32', '32', '32', '32', '小输入框高度', 9),
('Input', 'controlHeightLG', 'number', '48', '48', '48', '48', '大输入框高度', 10),
-- 圆角
('Input', 'borderRadius', 'number', '6', '6', '6', '6', '输入框圆角', 11),
('Input', 'borderRadiusSM', 'number', '4', '4', '4', '4', '小输入框圆角', 12),
('Input', 'borderRadiusLG', 'number', '8', '8', '8', '8', '大输入框圆角', 13),
-- 字体
('Input', 'fontSize', 'number', '14', '14', '14', '14', '输入框字号', 14),
('Input', 'fontSizeSM', 'number', '12', '12', '12', '12', '小输入框字号', 15),
('Input', 'fontSizeLG', 'number', '16', '16', '16', '16', '大输入框字号', 16);

-- Table 组件 Token（18 个）
INSERT INTO `component_token` (`component_name`, `token_key`, `token_type`, `default_light_value`, `default_dark_value`, `current_light_value`, `current_dark_value`, `description`, `sort_order`) VALUES
-- 表头
('Table', 'headerBg', 'color', '#fafafa', '#1f1f1f', '#fafafa', '#1f1f1f', '表头背景色', 1),
('Table', 'headerColor', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '表头文字色', 2),
('Table', 'headerSortActiveBg', 'color', '#f5f5f5', '#262626', '#f5f5f5', '#262626', '表头排序激活背景色', 3),
('Table', 'headerSortHoverBg', 'color', '#f5f5f5', '#262626', '#f5f5f5', '#262626', '表头排序悬停背景色', 4),
-- 行
('Table', 'rowHoverBg', 'color', '#fafafa', '#262626', '#fafafa', '#262626', '行悬停背景色', 5),
('Table', 'rowSelectedBg', 'color', '#E6F4FF', '#1f3a5f', '#E6F4FF', '#1f3a5f', '行选中背景色', 6),
('Table', 'rowSelectedHoverBg', 'color', '#BAE0FF', '#2a4a6f', '#BAE0FF', '#2a4a6f', '行选中悬停背景色', 7),
-- 边框
('Table', 'borderColor', 'color', '#f0f0f0', '#303030', '#f0f0f0', '#303030', '表格边框色', 8),
('Table', 'borderColorSecondary', 'color', '#fafafa', '#262626', '#fafafa', '#262626', '表格次要边框色', 9),
-- 单元格
('Table', 'cellPaddingBlock', 'number', '16', '16', '16', '16', '单元格垂直内边距', 10),
('Table', 'cellPaddingInline', 'number', '16', '16', '16', '16', '单元格水平内边距', 11),
-- 文字
('Table', 'colorText', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '表格文字色', 12),
('Table', 'colorTextSecondary', 'color', 'rgba(0, 0, 0, 0.65)', 'rgba(255, 255, 255, 0.65)', 'rgba(0, 0, 0, 0.65)', 'rgba(255, 255, 255, 0.65)', '表格次要文字色', 13),
-- 背景
('Table', 'colorBgContainer', 'color', '#ffffff', '#141414', '#ffffff', '#141414', '表格容器背景色', 14),
('Table', 'colorBgElevated', 'color', '#ffffff', '#1f1f1f', '#ffffff', '#1f1f1f', '表格浮层背景色', 15),
-- 其他
('Table', 'headerBorderRadius', 'number', '0', '0', '0', '0', '表头圆角', 16),
('Table', 'rowBorderRadius', 'number', '0', '0', '0', '0', '行圆角', 17),
('Table', 'borderRadiusLG', 'number', '8', '8', '8', '8', '表格大圆角', 18);

-- Form 组件 Token（12 个）
INSERT INTO `component_token` (`component_name`, `token_key`, `token_type`, `default_light_value`, `default_dark_value`, `current_light_value`, `current_dark_value`, `description`, `sort_order`) VALUES
-- 标签
('Form', 'labelColor', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '表单标签文字色', 1),
('Form', 'labelFontSize', 'number', '14', '14', '14', '14', '表单标签字号', 2),
('Form', 'labelHeight', 'number', '32', '32', '32', '32', '表单标签高度', 3),
('Form', 'labelRequiredMarkColor', 'color', '#ff4d4f', '#ff4d4f', '#ff4d4f', '#ff4d4f', '表单必填标记色', 4),
-- 错误
('Form', 'labelErrorColor', 'color', '#ff4d4f', '#ff4d4f', '#ff4d4f', '#ff4d4f', '表单错误标签色', 5),
('Form', 'colorError', 'color', '#ff4d4f', '#ff4d4f', '#ff4d4f', '#ff4d4f', '表单错误文字色', 6),
-- 布局
('Form', 'verticalLayoutPaddingInline', 'number', '0', '0', '0', '0', '表单垂直布局水平内边距', 7),
('Form', 'verticalLayoutPaddingBlock', 'number', '8', '8', '8', '8', '表单垂直布局垂直内边距', 8),
-- 其他
('Form', 'colorBgComponent', 'color', '#ffffff', '#1f1f1f', '#ffffff', '#1f1f1f', '表单组件背景色', 9),
('Form', 'borderRadius', 'number', '6', '6', '6', '6', '表单圆角', 10),
('Form', 'fontSize', 'number', '14', '14', '14', '14', '表单字号', 11),
('Form', 'colorText', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '表单文字色', 12);

-- Modal 组件 Token（10 个）
INSERT INTO `component_token` (`component_name`, `token_key`, `token_type`, `default_light_value`, `default_dark_value`, `current_light_value`, `current_dark_value`, `description`, `sort_order`) VALUES
-- 颜色
('Modal', 'colorBgElevated', 'color', '#ffffff', '#1f1f1f', '#ffffff', '#1f1f1f', '弹窗背景色', 1),
('Modal', 'colorText', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '弹窗标题文字色', 2),
('Modal', 'colorTextSecondary', 'color', 'rgba(0, 0, 0, 0.65)', 'rgba(255, 255, 255, 0.65)', 'rgba(0, 0, 0, 0.65)', 'rgba(255, 255, 255, 0.65)', '弹窗内容文字色', 3),
-- 边框
('Modal', 'borderRadiusLG', 'number', '16', '16', '16', '16', '弹窗圆角', 4),
-- 尺寸
('Modal', 'titleFontSize', 'number', '20', '20', '20', '20', '弹窗标题字号', 5),
('Modal', 'contentFontSize', 'number', '14', '14', '14', '14', '弹窗内容字号', 6),
-- 阴影
('Modal', 'boxShadow', 'shadow', '0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.08)', '0 9px 28px 8px rgba(0, 0, 0, 0.30), 0 6px 16px rgba(0, 0, 0, 0.35)', '0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.08)', '0 9px 28px 8px rgba(0, 0, 0, 0.30), 0 6px 16px rgba(0, 0, 0, 0.35)', '弹窗阴影', 7),
-- 间距
('Modal', 'paddingContentHorizontal', 'number', '24', '24', '24', '24', '弹窗内容水平内边距', 8),
('Modal', 'paddingContentVertical', 'number', '24', '24', '24', '24', '弹窗内容垂直内边距', 9),
('Modal', 'headerPadding', 'text', '16px 24px 0', '16px 24px 0', '16px 24px 0', '16px 24px 0', '弹窗头部内边距', 10);

-- Card 组件 Token（10 个）
INSERT INTO `component_token` (`component_name`, `token_key`, `token_type`, `default_light_value`, `default_dark_value`, `current_light_value`, `current_dark_value`, `description`, `sort_order`) VALUES
-- 颜色
('Card', 'colorBgContainer', 'color', '#ffffff', '#1f1f1f', '#ffffff', '#1f1f1f', '卡片背景色', 1),
('Card', 'colorText', 'color', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', 'rgba(0, 0, 0, 0.88)', 'rgba(255, 255, 255, 0.88)', '卡片标题文字色', 2),
('Card', 'colorTextSecondary', 'color', 'rgba(0, 0, 0, 0.65)', 'rgba(255, 255, 255, 0.65)', 'rgba(0, 0, 0, 0.65)', 'rgba(255, 255, 255, 0.65)', '卡片内容文字色', 3),
-- 边框
('Card', 'borderRadiusLG', 'number', '12', '12', '12', '12', '卡片圆角', 4),
('Card', 'borderColor', 'color', '#f0f0f0', '#303030', '#f0f0f0', '#303030', '卡片边框色', 5),
-- 阴影
('Card', 'boxShadow', 'shadow', '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', '0 1px 2px 0 rgba(0, 0, 0, 0.10), 0 1px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.05)', '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', '0 1px 2px 0 rgba(0, 0, 0, 0.10), 0 1px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.05)', '卡片悬停阴影', 6),
('Card', 'boxShadowHover', 'shadow', '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', '0 6px 16px 0 rgba(0, 0, 0, 0.25), 0 3px 6px -4px rgba(0, 0, 0, 0.30), 0 9px 28px 8px rgba(0, 0, 0, 0.30)', '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', '0 6px 16px 0 rgba(0, 0, 0, 0.25), 0 3px 6px -4px rgba(0, 0, 0, 0.30), 0 9px 28px 8px rgba(0, 0, 0, 0.30)', '卡片悬停阴影', 7),
-- 尺寸
('Card', 'paddingLG', 'number', '24', '24', '24', '24', '卡片大内边距', 8),
('Card', 'titleFontSize', 'number', '16', '16', '16', '16', '卡片标题字号', 9),
('Card', 'fontSize', 'number', '14', '14', '14', '14', '卡片正文字号', 10);

-- ==================== 4. 初始化主题配置 ====================

-- 浅色主题
INSERT INTO `theme_config` (`theme_name`, `is_active`, `config_json`) VALUES
('light', 1, '{
  "name": "浅色主题",
  "type": "light",
  "colors": {
    "primary": "#F95914",
    "primaryHover": "#FF7043",
    "success": "#52C41A",
    "warning": "#FAAD14",
    "error": "#FF4D4F",
    "info": "#1890FF",
    "text": "#000000E6",
    "textSecondary": "#00000073",
    "border": "#D9D9D9",
    "bgContainer": "#FFFFFF",
    "bgLayout": "#F5F5F5",
    "bgElevated": "#FFFFFF"
  },
  "description": "默认浅色主题，适用于大部分场景"
}');

-- 深色主题
INSERT INTO `theme_config` (`theme_name`, `is_active`, `config_json`) VALUES
('dark', 0, '{
  "name": "深色主题",
  "type": "dark",
  "colors": {
    "primary": "#FF6A3D",
    "primaryHover": "#FF8A5C",
    "success": "#73D13D",
    "warning": "#FFC53D",
    "error": "#FF7875",
    "info": "#69C0FF",
    "text": "#FFFFFFE6",
    "textSecondary": "#FFFFFFB3",
    "border": "#434343",
    "bgContainer": "#1F1F1F",
    "bgLayout": "#000000",
    "bgElevated": "#262626"
  },
  "description": "深色主题，适用于夜间或低光环境"
}');

-- ==================== 5. 验证结果 ====================

-- 验证组件 Token 数量
SELECT 
  component_name AS '组件名称',
  COUNT(*) AS 'Token 数量'
FROM component_token
GROUP BY component_name
ORDER BY FIELD(component_name, 'Button', 'Input', 'Table', 'Form', 'Modal', 'Card');

-- 预期结果：
-- +--------------+--------------+
-- | 组件名称      | Token 数量   |
-- +--------------+--------------+
-- | Button       | 18           |
-- | Card         | 10           |
-- | Form         | 12           |
-- | Input        | 16           |
-- | Modal        | 10           |
-- | Table        | 18           |
-- +--------------+--------------+
-- | 总计         | 84           |
-- +--------------+--------------+

-- 验证主题配置
SELECT theme_name, is_active, LEFT(config_json, 100) AS config_preview FROM theme_config;

-- 预期结果：
-- +------------+-----------+------------------------------+
-- | theme_name | is_active | config_preview               |
-- +------------+-----------+------------------------------+
-- | light      | 1         | {"name": "浅色主题",...}     |
-- | dark       | 0         | {"name": "深色主题",...}     |
-- +------------+-----------+------------------------------+
