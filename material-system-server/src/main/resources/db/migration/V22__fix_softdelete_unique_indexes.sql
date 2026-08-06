-- ============================================================
-- V11__fix_softdelete_unique_indexes.sql
-- 全局审计修复：把 @TableLogic 表的唯一索引改成 (字段, deleted)
-- 避免"逻辑删除后无法重建"的 500 错误
--
-- 审计范围（13 张同时满足"有 deleted 字段"+"有唯一索引"的表）：
--   sys_domain, sys_user, sys_role, sys_dept, tag,
--   page_definition,
--   craftsman, craftsman_brand, craftsman_certificate, craftsman_skill,
--   craftsman_application, construction_application
--
-- 排除（无 deleted 字段，不在本次范围）：
--   certificate_image, certificate_type, favorite,
--   sys_domain_menu, sys_role_menu, sys_role_dept,
--   sys_user_domain, sys_user_role, user_preference
-- ============================================================

-- sys_domain（确认有问题的，且可能有 2 个重复索引 domain_key + uk_domain_key）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_domain' AND INDEX_NAME='domain_key');
SET @s := IF(@e>0,'ALTER TABLE `sys_domain` DROP INDEX `domain_key`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_domain' AND INDEX_NAME='uk_domain_key');
SET @s := IF(@e>0,'ALTER TABLE `sys_domain` DROP INDEX `uk_domain_key`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_domain' AND INDEX_NAME='uk_domain_key_del');
SET @s := IF(@e=0,'ALTER TABLE `sys_domain` ADD UNIQUE KEY `uk_domain_key_del` (`domain_key`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- sys_user（可能有 username + uk_username 两个重复索引）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_user' AND INDEX_NAME='username');
SET @s := IF(@e>0,'ALTER TABLE `sys_user` DROP INDEX `username`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_user' AND INDEX_NAME='uk_username');
SET @s := IF(@e>0,'ALTER TABLE `sys_user` DROP INDEX `uk_username`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_user' AND INDEX_NAME='uk_username_del');
SET @s := IF(@e=0,'ALTER TABLE `sys_user` ADD UNIQUE KEY `uk_username_del` (`username`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- sys_role（role_code）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_role' AND INDEX_NAME='uk_role_code');
SET @s := IF(@e>0,'ALTER TABLE `sys_role` DROP INDEX `uk_role_code`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_role' AND INDEX_NAME='uk_role_code_del');
SET @s := IF(@e=0,'ALTER TABLE `sys_role` ADD UNIQUE KEY `uk_role_code_del` (`role_code`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- sys_dept（dept_code）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_dept' AND INDEX_NAME='uk_dept_code');
SET @s := IF(@e>0,'ALTER TABLE `sys_dept` DROP INDEX `uk_dept_code`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sys_dept' AND INDEX_NAME='uk_dept_code_del');
SET @s := IF(@e=0,'ALTER TABLE `sys_dept` ADD UNIQUE KEY `uk_dept_code_del` (`dept_code`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- tag（tag_code）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tag' AND INDEX_NAME='uk_tag_code');
SET @s := IF(@e>0,'ALTER TABLE `tag` DROP INDEX `uk_tag_code`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tag' AND INDEX_NAME='uk_tag_code_del');
SET @s := IF(@e=0,'ALTER TABLE `tag` ADD UNIQUE KEY `uk_tag_code_del` (`tag_code`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- page_definition（page_key）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='page_definition' AND INDEX_NAME='uk_page_key');
SET @s := IF(@e>0,'ALTER TABLE `page_definition` DROP INDEX `uk_page_key`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='page_definition' AND INDEX_NAME='uk_page_key_del');
SET @s := IF(@e=0,'ALTER TABLE `page_definition` ADD UNIQUE KEY `uk_page_key_del` (`page_key`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- craftsman（craftsman_code）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman' AND INDEX_NAME='uk_craftsman_code');
SET @s := IF(@e>0,'ALTER TABLE `craftsman` DROP INDEX `uk_craftsman_code`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman' AND INDEX_NAME='uk_craftsman_code_del');
SET @s := IF(@e=0,'ALTER TABLE `craftsman` ADD UNIQUE KEY `uk_craftsman_code_del` (`craftsman_code`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- craftsman_brand（craftsman_id, brand_value）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_brand' AND INDEX_NAME='uk_craftsman_brand');
SET @s := IF(@e>0,'ALTER TABLE `craftsman_brand` DROP INDEX `uk_craftsman_brand`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_brand' AND INDEX_NAME='uk_craftsman_brand_del');
SET @s := IF(@e=0,'ALTER TABLE `craftsman_brand` ADD UNIQUE KEY `uk_craftsman_brand_del` (`craftsman_id`, `brand_value`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- craftsman_certificate（craftsman_id, certificate_type）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_certificate' AND INDEX_NAME='uk_craftsman_type');
SET @s := IF(@e>0,'ALTER TABLE `craftsman_certificate` DROP INDEX `uk_craftsman_type`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_certificate' AND INDEX_NAME='uk_craftsman_cert_del');
SET @s := IF(@e=0,'ALTER TABLE `craftsman_certificate` ADD UNIQUE KEY `uk_craftsman_cert_del` (`craftsman_id`, `certificate_type`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- craftsman_skill（craftsman_id, skill_id）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_skill' AND INDEX_NAME='uk_craftsman_skill');
SET @s := IF(@e>0,'ALTER TABLE `craftsman_skill` DROP INDEX `uk_craftsman_skill`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_skill' AND INDEX_NAME='uk_craftsman_skill_del');
SET @s := IF(@e=0,'ALTER TABLE `craftsman_skill` ADD UNIQUE KEY `uk_craftsman_skill_del` (`craftsman_id`, `skill_id`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- craftsman_application（application_no）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_application' AND INDEX_NAME='uk_application_no');
SET @s := IF(@e>0,'ALTER TABLE `craftsman_application` DROP INDEX `uk_application_no`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='craftsman_application' AND INDEX_NAME='uk_app_no_del');
SET @s := IF(@e=0,'ALTER TABLE `craftsman_application` ADD UNIQUE KEY `uk_app_no_del` (`application_no`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

-- construction_application（application_no）
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='construction_application' AND INDEX_NAME='uk_application_no');
SET @s := IF(@e>0,'ALTER TABLE `construction_application` DROP INDEX `uk_application_no`','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;
SET @e := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='construction_application' AND INDEX_NAME='uk_cons_app_no_del');
SET @s := IF(@e=0,'ALTER TABLE `construction_application` ADD UNIQUE KEY `uk_cons_app_no_del` (`application_no`, `deleted`)','SELECT 1'); PREPARE s FROM @s; EXECUTE s; DEALLOCATE PREPARE s;

SELECT 'V11 软删除唯一索引全局修复完成（13 张表）' AS msg;
