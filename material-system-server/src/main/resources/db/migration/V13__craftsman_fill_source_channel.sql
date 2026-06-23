-- ============================================================
-- V13__craftsman_fill_source_channel.sql
-- 修复：为 craftsman 表的 source_channel 字段填充默认值
-- 确保所有工匠数据都有来源渠道，默认值为 platform_create（中台新增）
-- ============================================================

UPDATE `craftsman`
  SET `source_channel` = 'platform_create'
  WHERE `source_channel` IS NULL OR `source_channel` = '';
