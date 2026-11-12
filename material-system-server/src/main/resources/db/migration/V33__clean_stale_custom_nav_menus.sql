-- V33: 清理自定义导航缓存（user_preference.customNavMenus）中已不再是业务菜单的残留项
-- 背景：审批中心（approval-center）曾被设为业务菜单并写入用户自定义导航缓存，
--       之后在菜单管理里改为「系统菜单-下」，但缓存只增不删，导致其在业务菜单区继续显示。
-- 处理：从所有 customNavMenus 偏好行中移除 approval-center 项，保留其余项及顺序。
-- 幂等：仅处理仍包含 approval-center 的行；使用 JSON_SEARCH 定位数组下标后 JSON_REMOVE，顺序不变。

UPDATE user_preference
SET preference_value = JSON_REMOVE(
      preference_value,
      REPLACE(
        JSON_UNQUOTE(JSON_SEARCH(preference_value, 'one', 'approval-center', NULL, '$[*].key')),
        '.key',
        ''
      )
    )
WHERE preference_key LIKE 'customNavMenus%'
  AND JSON_SEARCH(preference_value, 'one', 'approval-center', NULL, '$[*].key') IS NOT NULL;
