-- ============================================================
-- V35: 修正「抄送我的」菜单图标
-- 原因：V34 配的 icon='mail' 不在前端 iconMap 映射表，也不在
-- iconpark sprite 符号集中，<use href="#mail"> 悬空导致图标空白。
-- 改为 'read'（iconMap: read → bookmark，sprite 中存在）。
-- 带旧值守卫：仅当仍是 'mail' 时才更新，不覆盖用户手动修改。
-- ============================================================

UPDATE nav_menu SET icon = 'read'
WHERE `key` = 'approval-cc' AND deleted = 0 AND icon = 'mail';
