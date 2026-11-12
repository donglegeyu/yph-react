-- V4: 统一 appr_cc 表排序规则
-- 背景：V3 建表时未显式指定 COLLATE，MySQL 8 默认 utf8mb4_0900_ai_ci，
-- 与 V1/V2 建的 appr_business_link / appr_task_action（utf8mb4_unicode_ci）不一致，
-- cc/mine 的 LEFT JOIN 报 "Illegal mix of collations" (HY000)。
-- 幂等性：CONVERT TO 重复执行结果一致，无副作用。
ALTER TABLE appr_cc CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
