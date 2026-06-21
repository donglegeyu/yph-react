# D005: 证件类型独立成表（certificate_type）

> Last updated: 2026-06-21

## 背景

技能管理模块的「管理证件类型抽屉」原本依赖 `certificate_image` 表反推证件类型列表——即证件类型的存在性由"是否有图片记录"决定。这带来三个问题：

1. 新增一个证件类型但不上传图片，刷新后该类型就消失（不持久）
2. 类型列表与图片记录语义耦合，删除图片记录会导致类型也消失
3. 前端只能本地 state 操作，无法多端同步

## 决策

新建独立的 `certificate_type` 字典表，证件类型的增删改直接写库，与图片记录解耦。

## 实现要点

### 数据库（Flyway V4）
- 表 `certificate_type`：`id / name(唯一) / sort_order / create_time / update_time`
- 迁移脚本从 `certificate_image.certificate_type` 聚合去重写入新表（幂等）
- 兜底保证「特种作业操作证」「上岗证」两条默认数据存在

### 后端
- 标准 Entity/Mapper/Service/Controller 四层（参考 CertificateImage 同构）
- API：`/api/certificate-types`
  - `GET` 列表（按 sort_order 升序）
  - `POST` 新增或改名（带 id 为改名，不带为新增；均做重名校验）
  - `DELETE /{id}` 删除
- **联动设计**：改名时同步更新 `certificate_image.certificate_type`，保证示例图不丢；删除时同步清理关联图片记录

### 前端
- `CertOption` 类型增加可选 `id` 字段承载后端主键
- 抽屉的增删改全部改为调后端接口 + `saving` 状态防重复提交
- `SkillManagement` 证件类型筛选下拉框从静态写死改为动态加载

## 涉及文件

后端：
- `db/migration/V4__certificate_type.sql`
- `entity/CertificateType.java`
- `mapper/CertificateTypeMapper.java`
- `service/CertificateTypeService.java` + `impl/CertificateTypeServiceImpl.java`
- `controller/CertificateTypeController.java`

前端：
- `constants/api.ts`（新增 CERTIFICATE_TYPES）
- `pages/common/CertManageDrawer.tsx`（重构）
- `pages/common/SkillManagement.tsx`（筛选下拉动态化）

## 部署注意

Docker 构建依赖私有镜像仓库 `registry.zrhsh.com`，需在能访问该仓库的环境执行 `./restart-safe.sh`。后端启动后 Flyway 自动执行 V4，无需手动改库。
