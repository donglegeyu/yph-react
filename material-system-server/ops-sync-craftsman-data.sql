-- ============================================================
-- 工匠数据同步脚本：把线上 5 个工匠的数据同步成本地一致
--
-- 执行方式（由运维操作）：
--   docker exec -i <mysql容器名> mysql -uroot -proot123456 material_system_react < ops-sync-craftsman-data.sql
--
-- 注意：只更新已有字段，不会删除/新建记录
-- ============================================================

-- 张建国 (id=1)
UPDATE `craftsman` SET
  `service_skills` = '1,4',
  `birthday` = '1985-03-15',
  `id_card_no` = '110101198503151234',
  `age` = 41,
  `residential_address` = '北京市市辖区东城区街道',
  `service_area` = '北京市/市辖区/东城区',
  `id_card_images` = '/test/idcard-front.jpg,/test/idcard-back.jpg',
  `work_certificate` = '/test/work-cert-real.png',
  `service_record` = '',
  `no_criminal_certificate` = '/test/nocriminal.png',
  `residential_area_code` = '11,1101,110101',
  `residential_street` = '街道',
  `residential_detail` = '',
  `id_card_valid_date` = NULL
WHERE `id` = 1;

-- 李明辉 (id=2)
UPDATE `craftsman` SET
  `service_skills` = NULL,
  `birthday` = '1985-03-15',
  `id_card_no` = '110101198503151234',
  `age` = 37,
  `residential_address` = '上海市浦东新区张江路100号',
  `service_area` = '上海市浦东新区、徐汇区',
  `id_card_images` = '/test/idcard-front.jpg,/test/idcard-back.jpg',
  `work_certificate` = '/test/work-cert-real.png',
  `service_record` = NULL,
  `no_criminal_certificate` = '/test/nocriminal.png',
  `residential_area_code` = NULL,
  `residential_street` = NULL,
  `residential_detail` = NULL,
  `id_card_valid_date` = NULL
WHERE `id` = 2;

-- 王大力 (id=3)
UPDATE `craftsman` SET
  `service_skills` = NULL,
  `birthday` = '1985-03-15',
  `id_card_no` = '110101198503151234',
  `age` = 35,
  `residential_address` = '广州市天河区天河路200号',
  `service_area` = '广州市天河区、越秀区',
  `id_card_images` = '/test/idcard-front.jpg,/test/idcard-back.jpg',
  `work_certificate` = '/test/work-cert-real.png',
  `service_record` = NULL,
  `no_criminal_certificate` = '/test/nocriminal.png',
  `residential_area_code` = NULL,
  `residential_street` = NULL,
  `residential_detail` = NULL,
  `id_card_valid_date` = NULL
WHERE `id` = 3;

-- 赵铁柱 (id=4)
UPDATE `craftsman` SET
  `service_skills` = NULL,
  `birthday` = '1985-03-15',
  `id_card_no` = '110101198503151234',
  `age` = 44,
  `residential_address` = '深圳市南山区科技园南路',
  `service_area` = '深圳市南山区、福田区',
  `id_card_images` = '/test/idcard-front.jpg,/test/idcard-back.jpg',
  `work_certificate` = '/test/work-cert-real.png',
  `service_record` = NULL,
  `no_criminal_certificate` = '/test/nocriminal.png',
  `residential_area_code` = NULL,
  `residential_street` = NULL,
  `residential_detail` = NULL,
  `id_card_valid_date` = NULL
WHERE `id` = 4;

-- 刘金宝 (id=5)
UPDATE `craftsman` SET
  `service_skills` = NULL,
  `birthday` = '1985-03-15',
  `id_card_no` = '110101198503151234',
  `age` = 33,
  `residential_address` = '成都市武侯区天府大道北段',
  `service_area` = '成都市武侯区、锦江区',
  `id_card_images` = '/test/idcard-front.jpg,/test/idcard-back.jpg',
  `work_certificate` = '/test/work-cert-real.png',
  `service_record` = NULL,
  `no_criminal_certificate` = '/test/nocriminal.png',
  `residential_area_code` = NULL,
  `residential_street` = NULL,
  `residential_detail` = NULL,
  `id_card_valid_date` = NULL
WHERE `id` = 5;

-- 验证
SELECT '=== 同步后数据 ===' AS info;
SELECT id, name, id_card_no, id_card_images, work_certificate, no_criminal_certificate
FROM `craftsman` WHERE id IN (1,2,3,4,5) ORDER BY id;
