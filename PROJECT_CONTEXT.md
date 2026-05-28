# 材料申请管理系统 - 项目上下文

> 本文件是 AI 理解项目的核心入口，每次新会话开始时应优先阅读此文件。

---

## 1. 项目基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | 材料申请管理系统（中台NRP） |
| **数据库** | `material_system` |
| **前端端口** | `3002` |
| **后端端口** | `8080` |
| **文档位置** | `docs/` 目录 |

---

## 2. 技术架构

### 2.1 前端技术栈

```
Vue 3 + TypeScript + Vite + Ant Design Vue 4 + Pinia + Vue Router
```

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5 | 核心框架 |
| TypeScript | 5.9 | 类型系统 |
| Vite | 8.0 | 构建工具 |
| Ant Design Vue | 4.2 | UI 组件库 |
| Pinia | 3.0 | 状态管理 |
| Vue Router | 4.6 | 路由管理 |

### 2.2 后端技术栈

```
Spring Boot 3.2 + MyBatis-Plus 3.5 + MySQL 8.0 + Docker
```

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2 | 核心框架 |
| MyBatis-Plus | 3.5 | ORM 框架 |
| MySQL | 8.0 | 数据库 |
| JDK | 17 | Java 版本 |
| Maven | 3.8+ | 构建工具 |
| Docker | - | 容器化部署 |

---

## 3. 关键架构决策

### 3.1 前后端分离架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (Vite)                        │
│                    端口: 3002                            │
│                 代理配置 → localhost:8080                │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    后端 (Spring Boot)                     │
│              容器名: material-backend                    │
│                    端口: 8080                            │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   MySQL (Docker)                         │
│              容器名: material-mysql                     │
│                    端口: 3306                            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 API 代理配置

前端所有 API 通过 Vite 代理转发，避免跨域问题：

```typescript
// vite.config.ts
proxy: {
  '/api/nav-menus': 'http://localhost:8080',
  '/api/custom-nav-menus': 'http://localhost:8080',
  '/api/favorites': 'http://localhost:8080',
  '/api/menu-views': 'http://localhost:8080',
  '/api/materials': 'http://localhost:8080',
  '/api/material-views': 'http://localhost:8080',
  '/api/user-preferences': 'http://localhost:8080',
  '/api/icons': 'http://localhost:8081',  // 图标服务独立端口
}
```

### 3.3 三端同步规则（材料申请列表页）

当列表增加字段时，**必须同步修改三处**：

1. `defaultColumnFields` - 表格列定义
2. `filterItems` - 筛选表单字段
3. `dialogFilterOptions` - 视图管理选项

三者必须保持完全一致。

### 3.4 组件规范

- **职责分离**：业务逻辑封装在 `composables/` 中，UI 组件只负责渲染
- **图标来源**：必须使用 IconPark（从 `/public/iconpark/sprite.svg` 引用）
- **列表页模板**：使用 `ListPageTemplate.vue` 或 `SmartListTemplate.vue`

---

## 4. 特殊依赖路径

### 4.1 路径别名

| 别名 | 实际路径 | 用途 |
|------|---------|------|
| `@` | `src/` | 源代码根目录 |
| `@/components` | `src/components/` | 组件目录 |
| `@/views` | `src/views/` | 页面目录 |
| `@/stores` | `src/stores/` | 状态管理 |
| `@/composables` | `src/composables/` | 组合式函数 |
| `@/constants` | `src/constants/` | 常量定义 |

### 4.2 特殊目录

| 目录 | 用途 |
|------|------|
| `public/iconpark/` | 图标 SVG 文件 |
| `server/` | 本地图标服务（端口 8081） |
| `constants/api.ts` | API 地址常量（**必须引用，禁止硬编码**） |

---

## 5. 工具链组合

### 5.1 前端命令

```bash
# 开发环境
npm run dev          # 启动 Vite 开发服务器（端口 3002）

# 构建
npm run build        # TypeScript 检查 + 构建生产版本
npm run preview      # 预览构建结果
```

### 5.2 后端命令

```bash
# Docker 容器管理
docker build -t material-backend-new:latest .           # 构建新镜像
docker run -d --name material-backend -p 8080:8080 material-backend-new:latest  # 启动容器
docker exec material-mysql mysql -u root -proot123456   # 进入数据库

# 容器重启
docker rm -f material-backend && docker run -d --name material-backend -p 8080:8080 material-backend-new:latest
```

### 5.3 数据库连接

```bash
# MySQL 容器
容器名: material-mysql
端口: 3306 (已映射)
用户: root
密码: root123456
数据库: material_system
```

### 5.4 常用脚本

```bash
# 自动更新文档
./scripts/auto-update-docs.sh

# 同步每日记录
./scripts/sync-daily-records.sh

# 代码检查
./scripts/commit-check.sh
```

---

## 6. 开发习惯与规范

### 6.1 页面样式保护规则（最高优先级）

> **绝对不改动任何页面样式！**

- 不修改 CSS/SCSS 文件
- 不修改 Vue 组件中的 class/style 属性
- 不修改颜色、布局、间距等样式代码

**例外**：只有用户明确说"改页面样式"或"改样式"时才允许修改样式。

### 6.2 API 地址规范

**禁止硬编码**，必须从 `constants/api.ts` 引用：

```typescript
// ✅ 正确
import { API_ENDPOINTS } from '@/constants/api'
fetch(API_ENDPOINTS.MATERIALS)

// ❌ 错误
fetch('/api/materials')
fetch('http://localhost:8080/api/materials')
```

### 6.3 TypeScript 类型规范

**禁止使用 `any` 类型**，必须定义具体接口：

```typescript
// ✅ 正确
interface MaterialRecord {
  id: number
  materialName: string
  status: string
}
const data = ref<MaterialRecord[]>([])

// ❌ 错误
const data = ref<any[]>([])
```

### 6.4 错误处理规范

所有 API 调用必须包含用户可见的反馈：

```typescript
import { message } from 'ant-design-vue'

try {
  const res = await fetch(url)
} catch (e) {
  message.error('操作失败，请稍后重试')
}
```

---

## 7. 重要约定

### 7.1 MyBatis-Plus 字段映射

后端实体类使用 `@TableField` 注解映射数据库字段：

```java
@TableField("material_quantity")
private Integer materialQuantity;
```

### 7.2 状态码约定

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 404 | 未找到 |
| 500 | 服务器错误 |

### 7.3 业务状态码

```typescript
// 材料申请状态
'pending'   // 待审核
'approved'  // 已通过
'rejected'  // 已拒绝

// 菜单状态
1  // 启用
0  // 禁用
```

---

## 8. 参考文档

| 文档 | 位置 | 说明 |
|------|------|------|
| 编码规范 | `.trae/rules` | AI 协作规则 |
| 开发手册 | `docs/项目文档/开发手册.md` | 完整开发指南 |
| API 手册 | `docs/项目文档/API手册.md` | 接口文档 |
| 组件规范 | `docs/功能开发文档/功能开发文档.组件规范.md` | 组件开发规范 |
| 架构设计 | `docs/architecture/ARCHITECTURE-DESIGN.md` | 架构设计文档 |

---

## 9. AI 使用指南

### 9.1 新会话开始时

1. 优先阅读本文档（PROJECT_CONTEXT.md）
2. 查看 `.trae/rules` 了解当前规范
3. 如有疑问，查看 `docs/` 目录相关文档

### 9.2 任务处理流程

1. **分析任务** → 理解需求，阅读相关代码
2. **制定计划** → 输出 plan.md（涉及多个文件时）
3. **确认执行** → 用户确认后开始实施
4. **自检规范** → 检查是否违反 `.trae/rules`

### 9.3 常见问题处理

| 问题 | 处理方式 |
|------|---------|
| 前端 API 报错 | 检查 Vite 代理配置是否正确 |
| 后端无法启动 | 检查 Docker 容器状态 |
| 数据库连接失败 | 检查 MySQL 容器是否运行 |
| 样式异常 | **不要修改**，除非用户明确要求 |
