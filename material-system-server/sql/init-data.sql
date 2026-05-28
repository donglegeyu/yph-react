-- 初始化数据
USE material_system;

-- 材料申请测试数据
INSERT INTO material_application (application_no, material_name, spec, unit, quantity, department, supplier, description, status, applicant, apply_time) VALUES
('MA20260411001', '水泥', '普通硅酸盐水泥 32.5', '吨', 100, 'engineering', '华新水泥有限公司', '项目施工用', 'draft', '张三', '2026-04-10 09:00:00'),
('MA20260411002', '钢筋', 'HRB400 螺纹钢筋 Φ12', '吨', 50, 'engineering', '宝钢建材', '主体结构用', 'pending', '李四', '2026-04-09 14:30:00'),
('MA20260411003', '砂石', '中粗河砂', '立方米', 200, 'procurement', '本地砂石场', '混凝土配合比用', 'approved', '王五', '2026-04-08 10:00:00'),
('MA20260411004', '木材', '松木方 5cm×10cm×400cm', '立方米', 30, 'engineering', '林业建材', '模板支撑用', 'rejected', '赵六', '2026-04-07 16:00:00'),
('MA20260411005', '混凝土', 'C30 商品混凝土', '立方米', 500, 'engineering', '搅拌站A', '基础浇筑用', 'approved', '张三', '2026-04-06 08:00:00');
