# 代码扫描命令

> Last updated: 2026-06-16

## 用途

批量扫描项目代码，发现潜在问题

## 常用命令（React 项目）

```bash
# 进入前端目录
cd react-system

# ESLint 检查
npm run lint

# TypeScript 类型检查
npx tsc --noEmit

# Vite 构建（含类型检查）
npm run build
```

## 工作流

1. 执行扫描命令
2. 分析输出结果
3. 修复问题
4. 重新扫描验证

## 输出示例

```
✓ 15 problems (0 errors, 15 warnings)
```

## 相关

- [自动化开发流程](../workflows/automation-development.md)
