-- ============================================================
-- V11__add_training_menus.sql
-- 工匠中心新增二级菜单：培训资源、培训运营
-- 培训资源下三级菜单：课件管理、课程管理、题库管理、试卷管理
-- 培训运营下三级菜单：培训任务管理
-- 同时同步到默认域和工匠平台域
-- 所有 INSERT 均为幂等：按 key 判重，已存在则跳过
-- ============================================================

-- 1. 新增二级菜单（幂等）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'training-resource', '培训资源', NULL, 'book', 4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center' AND deleted=0 LIMIT 1) t), 1, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='training-resource' AND deleted=0);

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'training-operation', '培训运营', NULL, 'rocket', 5, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='craftsman-center' AND deleted=0 LIMIT 1) t), 1, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='training-operation' AND deleted=0);

-- 2. 培训资源下的三级菜单（幂等）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'courseware-manage', '课件管理', '/courseware-manage', 'file-text', 1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='courseware-manage' AND deleted=0);

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'course-manage', '课程管理', '/course-manage', 'read', 2, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='course-manage' AND deleted=0);

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'question-bank-manage', '题库管理', '/question-bank-manage', 'question-circle', 3, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='question-bank-manage' AND deleted=0);

INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'exam-paper-manage', '试卷管理', '/exam-paper-manage', 'form', 4, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-resource' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='exam-paper-manage' AND deleted=0);

-- 3. 培训运营下的三级菜单（幂等）
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'training-task-manage', '培训任务管理', '/training-task-manage', 'schedule', 1, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='training-operation' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='training-task-manage' AND deleted=0);

-- 4. 同步到默认域（幂等：已存在则跳过）
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM nav_menu m
CROSS JOIN sys_domain d
WHERE d.is_default = 1 AND d.status = 1
  AND m.`key` IN ('training-resource', 'training-operation',
                  'courseware-manage', 'course-manage', 'question-bank-manage', 'exam-paper-manage',
                  'training-task-manage')
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );

-- 5. 同步到工匠平台域（幂等：已存在则跳过）
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM sys_domain d
JOIN nav_menu m ON m.`key` IN (
    'training-resource', 'training-operation',
    'courseware-manage', 'course-manage', 'question-bank-manage', 'exam-paper-manage',
    'training-task-manage'
)
WHERE d.domain_key = 'gongjiangPT'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );

-- 6. 同步超管角色权限（幂等）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN nav_menu m ON m.`key` IN (
    'training-resource', 'training-operation',
    'courseware-manage', 'course-manage', 'question-bank-manage', 'exam-paper-manage',
    'training-task-manage'
)
WHERE r.role_code = 'ROLE_ADMIN'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu srm
    WHERE srm.role_id = r.id AND srm.menu_id = m.id
  );
