---
name: "project-rules-reader"
description: "前端/后端开发任务前，自动读取项目规范文档。触发：会话开始、接到开发任务时。"
---

# Project Rules Reader

自动读取项目规范文档，确保开发任务遵循项目约定。

## 触发条件

**必须触发（强制）：**
- 新会话开始时
- 接到任何开发任务时（前端/后端）
- 用户说"开始任务"、"做XX功能"时

**前置动作：** 读取规范文件 **后** 才能开始编写代码

## 读取顺序

### 前端任务必读
```
1. .trae/PROJECT_CONTEXT.md
2. .trae/rules.d/INDEX.md
3. .trae/rules.d/fe-rules.md
4. docs/功能开发文档/  (如果涉及菜单/页面)
5. sql/DESIGN_TOKEN_V2_README.md  (如果涉及颜色/样式)
```

### 后端任务必读
```
1. .trae/PROJECT_CONTEXT.md
2. .trae/rules.d/INDEX.md
3. .trae/rules.d/be-rules.md
```

## 核心要点清单

### 前端核心规范
| 规范 | 说明 |
|------|------|
| 样式保护 | 绝对不改动 CSS/class/style |
| CSS变量 | 所有颜色必须用 CSS 变量 |
| Composable | 业务逻辑封装在 composables/ |
| v-for key | 必须使用唯一 key，非 index |
| 异步处理 | loading 和 error 必须处理 |
| 路由双配置 | index.ts + pathComponentMap.ts |

### 后端核心规范
| 规范 | 说明 |
|------|------|
| Lambda查询 | 必须使用 LambdaQueryWrapper |
| DTO/VO隔离 | 严禁 Entity 直接暴露前端 |
| 异常处理 | Controller 禁止 try-catch |
| @TableField | 字段映射使用注解 |

## 输出格式

```
✅ 已阅读项目规范：

📄 已读取文件：
  ✓ .trae/PROJECT_CONTEXT.md
  ✓ .trae/rules.d/INDEX.md
  ✓ .trae/rules.d/fe-rules.md (前端任务)

📌 核心要点已记忆：
  • 样式保护：绝对不改动 CSS/class/style
  • CSS变量：所有颜色必须用 CSS 变量
  • Composable：业务逻辑封装在 composables/
  ...

✅ 已准备好接收指令！
```

## 禁止行为

- ❌ 未读取规范就开始写代码
- ❌ 跳过 fe-rules.md/be-rules.md
- ❌ 直接用 fetch 而不使用 composable（前端）
- ❌ 硬编码颜色值

## 后续动作

读取完成后：
1. 更新核心记忆（manage_core_memory）
2. 确认用户需求
3. 开始开发任务
