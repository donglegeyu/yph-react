-- 为所有记录设置 quantity_minus_one = quantity - 1
-- 如果 quantity_minus_one 字段不存在，先添加
ALTER TABLE material_application ADD COLUMN IF NOT EXISTS quantity_minus_one DECIMAL(12,2) COMMENT '材料数量-1' AFTER quantity;

-- 为现有记录填充数据（quantity - 1）
UPDATE material_application 
SET quantity_minus_one = quantity - 1 
WHERE quantity_minus_one IS NULL AND quantity IS NOT NULL;

-- 或者只更新有值的记录
UPDATE material_application 
SET quantity_minus_one = quantity - 1 
WHERE quantity IS NOT NULL;

-- 查看更新后的数据
SELECT id, application_no, material_name, quantity, quantity_minus_one 
FROM material_application 
LIMIT 10;
