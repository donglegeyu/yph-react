-- ============================================================
-- 菜单修复脚本：把「页面生成器」在「页面生成」域下挂到「演示中心」下
--
-- 问题：
--   - 用户在域 3（页面生成）下通过页面生成器创建了页面
--   - 但页面生成器菜单(menu_id=66)的 custom_parent_id 为 NULL
--   - 导致它默认挂到了系统设置(parent_id=17)下，而不是演示中心(9)下
--
-- 执行方式（由运维操作）：
--   docker exec -i <mysql容器名> mysql -uroot -proot123456 material_system_react < ops-fix-page-generator-menu.sql
-- ============================================================

-- 1. 把域 3 下 page-generator(66) 的父菜单改成演示中心(9)
UPDATE `sys_domain_menu`
SET `custom_parent_id` = 9,
    `custom_level` = 2
WHERE `domain_id` = 3 AND `menu_id` = 66;

-- 2. 验证：域 3 下演示中心的子菜单
SELECT '=== 修复后：域 3（页面生成）下演示中心(9) 的子菜单 ===' AS info;
SELECT sdm.menu_id, m.label, sdm.custom_label, sdm.custom_parent_id, sdm.custom_level, sdm.sort
FROM `sys_domain_menu` sdm
JOIN `nav_menu` m ON m.id = sdm.menu_id
WHERE sdm.domain_id = 3
  AND (sdm.custom_parent_id = 9 OR sdm.menu_id = 9)
ORDER BY sdm.sort, sdm.menu_id;

SELECT '=== 修复完成 ===' AS info;
SELECT '页面生成器已挂到演示中心下，刷新页面即可看到' AS msg;
