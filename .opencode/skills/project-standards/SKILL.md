---
name: "project-standards"
description: "🚀 项目规范自动读取（必须）。新会话开始或提到"新任务"/"优化"/"修改"时必须触发。读取 .trae/rules.d/ 下的规范文档，输出摘要，更新核心记忆。"
---

# 🚀 项目规范自动读取 Skill

## ⚠️ 重要提醒

**本 Skill 必须在新会话开始时自动触发，无需用户手动调用。**

## 触发条件

当检测到以下任一情况时，**必须立即触发**：

1. **新会话开始**（最重要！）
2. 用户输入包含以下关键词：
   - "当前 agent 对"、"当前agent对"
   - "新任务"、"优化"、"修改"
   - "前端任务"、"后端任务"
   - "会给你指令"、"等待指令"
   - "规范"、"标准"
3. 用户要求开始开发任务

## 触发时必须执行

### 1. 读取规范文件

按顺序读取：

```
1. .trae/PROJECT_CONTEXT.md
2. .trae/rules.d/INDEX.md
3. 根据任务类型读取：
   - 前端任务 → fe-rules.md
   - 后端任务 → be-rules.md
   - 全栈任务 → fe-rules.md + be-rules.md + api-contract.md
```

### 2. 输出标准摘要

**必须使用以下格式输出到终端**：

```
✅ 已阅读项目规范：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 已读取文件：
  ✓ .trae/PROJECT_CONTEXT.md
  ✓ .trae/rules.d/INDEX.md
  ✓ .trae/rules.d/fe-rules.md（前端任务）

📌 核心要点已记忆：
  • 样式保护：绝对不改动 CSS/class/style，除非用户明确要求
  • CSS变量：所有颜色必须用 CSS 变量，严禁硬编码
  • Composable：业务逻辑必须封装在 composables/
  • v-for key：必须使用唯一 key，非 index
  • 异步处理：loading 和 error 必须处理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. 更新核心记忆

使用 `manage_core_memory` 工具：

```typescript
{
  "action": "ADD",
  "title": "前端开发核心禁止事项",
  "keywords": "样式保护|CSS变量|Composable|禁止事项",
  "content": "【前端核心规范】\n1. 样式保护：绝对不改动 CSS/class/style\n2. CSS变量：所有颜色必须用 CSS 变量\n3. Composable：业务逻辑封装在 composables/\n4. v-for key：必须使用唯一 key\n5. 异步处理：loading 和 error 必须处理",
  "category": "Rule",
  "scope": "project"
}
```

### 4. 简短确认

输出后直接确认：

```
✅ 已准备好接收指令！
```

## 禁止事项

- ❌ 不要问太多问题
- ❌ 不要长篇解释项目背景
- ❌ 不要跳过规范读取直接开始任务
- ❌ 不要忽略核心记忆更新

## 成功标志

触发后检查：
- [ ] 规范摘要已输出
- [ ] 核心记忆已更新
- [ ] 简短确认已发出
- [ ] 开始执行用户指令
