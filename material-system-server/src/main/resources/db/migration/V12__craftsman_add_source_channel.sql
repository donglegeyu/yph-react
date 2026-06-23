-- ============================================================
-- V12__craftsman_add_source_channel.sql
-- 工匠表新增「来源渠道」字段
-- 枚举值：工匠平台app(craftsman_app) / 中台导入(platform_import) / 中台新增(platform_create) / 协同门户新增(portal_create)
-- 默认值：platform_create（中台新增），兼容历史数据
-- ============================================================

ALTER TABLE `craftsman`
  ADD COLUMN `source_channel` varchar(20) DEFAULT 'platform_create'
    COMMENT '来源渠道：craftsman_app工匠平台app / platform_import中台导入 / platform_create中台新增 / portal_create协同门户新增'
    AFTER `service_provider_name`;

-- 索引（按渠道查询时使用）
ALTER TABLE `craftsman`
  ADD INDEX `idx_source_channel` (`source_channel`);

-- 确保已有数据都填充默认值（ALTER TABLE DEFAULT 不一定会自动填充已有行）
UPDATE `craftsman`
  SET `source_channel` = 'platform_create'
  WHERE `source_channel` IS NULL OR `source_channel` = '';
