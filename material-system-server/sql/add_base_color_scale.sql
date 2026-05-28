-- 添加基础色阶分类（在颜色分类之前）
-- 执行时间：2026-04-27

-- 1. 将所有分类的 sort_order 后移
UPDATE `design_token_category` SET `sort_order` = `sort_order` + 1;

-- 2. 插入新的"基础色阶"分类
INSERT INTO `design_token_category` (`name`, `code`, `sort_order`) VALUES
('基础色阶', 'base-color', 1);

-- 3. 插入基础色阶的 10 个 token（基于主色 #F95914 的 10 个色阶）
-- 注意：需要禁用外键检查才能插入
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `design_token` (`category_id`, `name`, `token_key`, `token_type`, `default_value`, `current_value`, `description`, `is_ant_design_token`, `sort_order`) VALUES
(21, '基础1', '--primary-1', 'color', '#FFF2E8', '#FFF2E8', '主色色阶1', 0, 1),
(21, '基础2', '--primary-2', 'color', '#FFDCD1', '#FFDCD1', '主色色阶2', 0, 2),
(21, '基础3', '--primary-3', 'color', '#FFBBA8', '#FFBBA8', '主色色阶3', 0, 3),
(21, '基础4', '--primary-4', 'color', '#FF997F', '#FF997F', '主色色阶4', 0, 4),
(21, '基础5', '--primary-5', 'color', '#FF7756', '#FF7756', '主色色阶5', 0, 5),
(21, '基础6', '--primary-6', 'color', '#F95914', '#F95914', '主色色阶6（基准色）', 0, 6),
(21, '基础7', '--primary-7', 'color', '#E64A19', '#E64A19', '主色色阶7', 0, 7),
(21, '基础8', '--primary-8', 'color', '#CC3D10', '#CC3D10', '主色色阶8', 0, 8),
(21, '基础9', '--primary-9', 'color', '#993008', '#993008', '主色色阶9', 0, 9),
(21, '基础10', '--primary-10', 'color', '#662300', '#662300', '主色色阶10', 0, 10);

SET FOREIGN_KEY_CHECKS = 1;
