-- 添加 material_quantity 字段到 material_application 表
-- 如果字段已存在，会报错，可以先 DROP 再 ADD

-- 添加字段（如果不存在）
ALTER TABLE material_application ADD COLUMN IF NOT EXISTS material_quantity DECIMAL(12,2) COMMENT '材料数量' AFTER quantity;

-- 为所有记录填充数据（可以将 quantity 的值复制过来作为初始值）
UPDATE material_application 
SET material_quantity = quantity 
WHERE material_quantity IS NULL AND quantity IS NOT NULL;

-- 查看结果
SELECT id, application_no, material_name, quantity, material_quantity 
FROM material_application 
LIMIT 10;
