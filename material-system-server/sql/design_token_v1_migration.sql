-- Design Token 第一阶段迁移脚本
-- 扩展基础 Token 到 55 个（从 19 个扩展）
-- 执行时间：2026-04-26

-- 1. 新增动效分类（如果不存在）
INSERT IGNORE INTO `design_token_category` (`name`, `code`, `sort_order`) VALUES ('动效', 'motion', 6);

-- 2. 获取动效分类ID（如果上面的 INSERT 成功，需要查询真实ID）
SET @motion_category_id = (SELECT id FROM design_token_category WHERE code = 'motion' LIMIT 1);

-- 3. 扩展颜色类 Token（原有 8 个扩展到 25 个，删除原有的 layout-bg，新增 18 个）
DELETE FROM `design_token` WHERE `token_key` = '--layout-bg';

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`) VALUES
-- 功能色背景色
(1, '成功背景色', '--color-success-bg', 'color', '#f6ffed', '#f6ffed', '成功状态背景色', 0, NULL, 8),
(1, '警告背景色', '--color-warning-bg', 'color', '#fffbE6', '#fffbE6', '警告状态背景色', 0, NULL, 9),
(1, '错误背景色', '--color-error-bg', 'color', '#fff2f0', '#fff2f0', '错误状态背景色', 0, NULL, 10),
(1, '信息背景色', '--color-info-bg', 'color', '#e6f4ff', '#e6f4ff', '信息状态背景色', 0, NULL, 11),

-- 功能色边框色
(1, '成功边框色', '--color-success-border', 'color', '#b7eb8f', '#b7eb8f', '成功状态边框色', 0, NULL, 12),
(1, '警告边框色', '--color-warning-border', 'color', '#ffe58f', '#ffe58f', '警告状态边框色', 0, NULL, 13),
(1, '错误边框色', '--color-error-border', 'color', '#ffccc7', '#ffccc7', '错误状态边框色', 0, NULL, 14),
(1, '信息边框色', '--color-info-border', 'color', '#91caff', '#91caff', '信息状态边框色', 0, NULL, 15),

-- 文本色
(1, '主文本色', '--color-text', 'color', '#000000e6', '#000000e6', '主要文本色', 1, 'colorText', 16),
(1, '次要文本色', '--color-text-secondary', 'color', '#00000073', '#00000073', '次要文本色', 1, 'colorTextSecondary', 17),
(1, '占位文本色', '--color-text-tertiary', 'color', '#00000047', '#00000047', '占位文本色', 0, NULL, 18),
(1, '禁用文本色', '--color-text-quaternary', 'color', '#00000026', '#00000026', '禁用文本色', 0, NULL, 19),

-- 背景色
(1, '容器背景色', '--color-bg-container', 'color', '#ffffff', '#ffffff', '容器背景色', 1, 'colorBgContainer', 20),
(1, '布局背景色', '--color-bg-layout', 'color', '#f5f5f5', '#f5f5f5', '布局背景色', 1, 'colorBgLayout', 21),
(1, '抬升背景色', '--color-bg-elevated', 'color', '#ffffff', '#ffffff', '卡片、弹窗等抬升元素背景', 0, NULL, 22),
(1, '遮罩背景色', '--color-bg-mask', 'color', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.45)', '遮罩背景色', 0, NULL, 23),

-- 边框色
(1, '边框色', '--color-border', 'color', '#d9d9d9', '#d9d9d9', '边框色', 1, 'colorBorder', 24),
(1, '次要边框色', '--color-border-secondary', 'color', '#f0f0f0', '#f0f0f0', '次要边框色', 1, 'colorBorderSecondary', 25);

-- 4. 扩展字体类 Token（原有 2 个扩展到 10 个）
DELETE FROM `design_token` WHERE `category_id` = 2;

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`) VALUES
(2, '字体家族', '--font-family', 'text', "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", '字体家族', 1, 'fontFamily', 1),
(2, '代码字体', '--font-family-code', 'text', "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace", "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo', Courier, monospace", '代码字体', 0, NULL, 2),
(2, '小字号', '--font-size-sm', 'number', '12', '12', '小字体大小(px)', 1, 'fontSizeSM', 3),
(2, '基础字号', '--font-size-base', 'number', '14', '14', '基础字体大小(px)', 1, 'fontSize', 4),
(2, '大字号', '--font-size-lg', 'number', '16', '16', '大字体大小(px)', 1, 'fontSizeLG', 5),
(2, '标题1字号', '--font-size-h1', 'number', '38', '38', '标题1字体大小(px)', 1, 'fontSizeHeading1', 6),
(2, '标题2字号', '--font-size-h2', 'number', '30', '30', '标题2字体大小(px)', 1, 'fontSizeHeading2', 7),
(2, '标题3字号', '--font-size-h3', 'number', '24', '24', '标题3字体大小(px)', 1, 'fontSizeHeading3', 8),
(2, '标题4字号', '--font-size-h4', 'number', '20', '20', '标题4字体大小(px)', 1, 'fontSizeHeading4', 9),
(2, '行高', '--line-height', 'number', '1.5714', '1.5714', '行高', 1, 'lineHeight', 10);

-- 5. 扩展间距类 Token（原有 4 个扩展到 6 个）
DELETE FROM `design_token` WHERE `category_id` = 3;

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`) VALUES
(3, '间距 XXS', '--spacing-xxs', 'number', '4', '4', '超小间距(px)', 0, NULL, 1),
(3, '间距 XS', '--spacing-xs', 'number', '8', '8', '小间距(px)', 0, NULL, 2),
(3, '间距 SM', '--spacing-sm', 'number', '12', '12', '中小间距(px)', 0, NULL, 3),
(3, '间距 MD', '--spacing-md', 'number', '16', '16', '中间距(px)', 0, NULL, 4),
(3, '间距 LG', '--spacing-lg', 'number', '24', '24', '大间距(px)', 0, NULL, 5),
(3, '间距 XL', '--spacing-xl', 'number', '32', '32', '超大间距(px)', 0, NULL, 6);

-- 6. 扩展边框类 Token（原有 3 个扩展到 6 个）
DELETE FROM `design_token` WHERE `category_id` = 4;

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`) VALUES
(4, '基础圆角', '--border-radius-base', 'number', '6', '6', '基础圆角大小(px)', 1, 'borderRadius', 1),
(4, '小圆角', '--border-radius-sm', 'number', '4', '4', '小圆角(px)', 1, 'borderRadiusSM', 2),
(4, '大圆角', '--border-radius-lg', 'number', '8', '8', '大圆角(px)', 1, 'borderRadiusLG', 3),
(4, '超小圆角', '--border-radius-xs', 'number', '2', '2', '超小圆角(px)', 0, NULL, 4),
(4, '圆形', '--border-radius-circle', 'text', '50%', '50%', '圆形（用于头像等）', 0, NULL, 5),
(4, '边框宽度', '--border-width', 'number', '1', '1', '边框宽度(px)', 0, NULL, 6);

-- 7. 扩展阴影类 Token（原有 2 个扩展到 4 个）
DELETE FROM `design_token` WHERE `category_id` = 5;

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`) VALUES
(5, '小阴影', '--shadow-sm', 'shadow', '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', '小阴影', 0, NULL, 1),
(5, '中等阴影', '--shadow-md', 'shadow', '0 4px 12px rgba(0, 0, 0, 0.08)', '0 4px 12px rgba(0, 0, 0, 0.08)', '中等阴影', 0, NULL, 2),
(5, '大阴影', '--shadow-lg', 'shadow', '0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', '0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', '大阴影', 0, NULL, 3),
(5, '浮层阴影', '--shadow-elevated', 'shadow', '0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.08)', '0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.08)', '浮层阴影（弹窗等）', 0, NULL, 4);

-- 8. 新增动效类 Token（8 个）
INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `ant_design_token_name`, `sort_order`) VALUES
(6, '快速动画时长', '--motion-duration-fast', 'text', '0.1s', '0.1s', '快速动画时长，如 hover 效果', 0, NULL, 1),
(6, '中等动画时长', '--motion-duration-mid', 'text', '0.2s', '0.2s', '中等动画时长，如展开收起', 0, NULL, 2),
(6, '慢速动画时长', '--motion-duration-slow', 'text', '0.3s', '0.3s', '慢速动画时长，如页面切换', 0, NULL, 3),
(6, '缓入缓出', '--motion-ease-in-out', 'text', 'cubic-bezier(0.645, 0.045, 0.355, 1.000)', 'cubic-bezier(0.645, 0.045, 0.355, 1.000)', '缓入缓出动画曲线', 0, NULL, 4),
(6, '缓出', '--motion-ease-out', 'text', 'cubic-bezier(0.215, 0.610, 0.355, 1.000)', 'cubic-bezier(0.215, 0.610, 0.355, 1.000)', '缓出动画曲线', 0, NULL, 5),
(6, '缓入', '--motion-ease-in', 'text', 'cubic-bezier(0.550, 0.055, 0.675, 0.190)', 'cubic-bezier(0.550, 0.055, 0.675, 0.190)', '缓入动画曲线', 0, NULL, 6),
(6, '线性', '--motion-linear', 'text', 'linear', 'linear', '线性动画曲线', 0, NULL, 7),
(6, '弹跳', '--motion-bounce', 'text', 'cubic-bezier(0.680, -0.550, 0.265, 1.550)', 'cubic-bezier(0.680, -0.550, 0.265, 1.550)', '弹跳动画曲线', 0, NULL, 8);

-- 9. 验证迁移结果
SELECT 
  c.name AS '分类名称',
  c.code AS '分类标识',
  COUNT(t.id) AS 'Token 数量'
FROM design_token_category c
LEFT JOIN design_token t ON c.id = t.category_id
GROUP BY c.id, c.name, c.code
ORDER BY c.sort_order;

-- 预期结果：
-- 分类名称    | 分类标识    | Token 数量
-- 颜色        | color      | 25
-- 字体        | typography | 10
-- 间距        | spacing    | 6
-- 边框        | border     | 6
-- 阴影        | shadow     | 4
-- 动效        | motion     | 8
-- 自定义      | custom     | 0
-- 总计        | -          | 59
