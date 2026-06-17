# D003: 新建文档存放位置规则

> Last updated: 2026-06-16
> Date: 2026-06-16
> Status: Active

## 决策

项目内新建 `.md` 文档时，按**受众**选择存放位置，不随意丢在根目录。

## 背景

2026-06-16 重构菜单 init SQL 时，新建了 `RUNBOOK.md` 放在项目根目录。复盘时发现根目录已有 `CLAUDE.md`（给 AI），两个文档受众不同但混放，定位混乱。遂将 RUNBOOK 迁至 `docs/部署运行/`，并明确后续所有新建文档的存放规则。

## 存放位置对照表

| 位置 | 用途 | 受众 | 举例 |
|------|------|------|------|
| `CLAUDE.md`（根） | AI 会话入口、项目稳定事实 | AI | 项目入口、技术栈、端口 |
| `docs/` | 人类阅读的正式文档 | 人 | 架构设计、产品方案、运行指南 |
| `docs/部署运行/` | 部署、运维、运行类文档 | 人 | RUNBOOK.md |
| `docs/architecture/` | 架构设计文档 | 人 | ARCHITECTURE-DESIGN.md |
| `docs/产品文档/` | 产品方案、需求文档 | 人 | 域权限系统产品文档.md |
| `.trae/rules.d/` | 编码/运维**规范**（强制约束） | AI + 人 | ops-rules.md、fe-rules.md |
| `memory/` | AI 经验沉淀（踩坑、模式、决策） | AI | errors/、decisions/、patterns/ |
| 各子项目 `README.md` | 子项目说明 | 人 | react-system/README.md |

## 判断标准

新建文档前问自己：**这份文档给谁看？**

- **给 AI 看的稳定事实** → `CLAUDE.md` 或 `memory/`
- **给人看的运行/部署指南** → `docs/部署运行/`
- **给人看的设计/产品方案** → `docs/architecture/` 或 `docs/产品文档/`
- **强制约束的规范** → `.trae/rules.d/`
- **子项目局部说明** → 对应子项目的 `README.md`

## 禁止

- ❌ 把人类文档丢在项目根目录（根目录只放 `CLAUDE.md` 这类 AI 入口）
- ❌ 在 `memory/` 写人类正式文档（那是 AI 经验沉淀）
- ❌ 在 `docs/` 写强制规范（那是 `.trae/rules.d/` 的职责）

## 已迁移案例

- `RUNBOOK.md`（根） → `docs/部署运行/RUNBOOK.md`（2026-06-16）

## 相关

- [CLAUDE.md 记忆系统章节](../../CLAUDE.md)
- [init/README.md](../../material-system-server/init/README.md)
