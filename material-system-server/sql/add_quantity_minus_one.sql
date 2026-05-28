-- 添加 quantity_minus_one 字段到 material_application 表
ALTER TABLE material_application ADD COLUMN IF NOT EXISTS quantity_minus_one DECIMAL(12,2) COMMENT '材料数量-1' AFTER quantity;
