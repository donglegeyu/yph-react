# 避免 inline style，使用 className + SCSS

> Last updated: 2026-06-21

## 场景

在 company-ui 项目里写组件时（特别是 Drawer/Modal/抽屉/弹窗内容区），为了"快速实现"大量使用 inline style：

```tsx
// ❌ 错误写法
<div style={{ padding: '8px 0' }}>
  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>提示文字</span>
    <Button type="link" style={{ padding: 0 }}>下载模板</Button>
  </div>
</div>
```

## 问题现象

- DevTools 检查元素时，div 上**只有 style 属性，没有任何 class 名**
- 无法通过类名定位元素、无法调试
- 无法通过 CSS 覆盖样式（inline style 优先级最高）
- 团队协作时难以沟通"我说的是这个元素"
- 样式无法复用

## 根因：违反项目样式规范

本项目（react-system）的样式规范是 **className + 同名 SCSS 文件**，不是 inline style。已有约定：

```
src/pages/common/
├── CraftsmanQuery.tsx     ← 组件
├── CraftsmanQuery.scss    ← 配套样式（同名）
├── CraftsmanForm.tsx
├── CraftsmanForm.scss
├── SecurityCheckQuery.tsx
├── SecurityCheckQuery.scss
└── ...
```

## 标准写法

### 1. JSX 用语义化 className

```tsx
// ✅ 正确写法
<div className="craftsman-import-body">
  <div className="craftsman-import-header">
    <span className="craftsman-import-hint">提示文字</span>
    <Button type="link" className="craftsman-import-template-btn">下载模板</Button>
  </div>
</div>
```

### 2. 创建同名 SCSS 文件

文件：`src/pages/common/CraftsmanQuery.scss`

```scss
.craftsman-import-body {
  padding: 8px 0;
}

.craftsman-import-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.craftsman-import-hint {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.craftsman-import-template-btn {
  padding: 0;
}
```

### 3. 组件内 import SCSS

```tsx
import './CraftsmanQuery.scss'
```

## 命名规范

- BEM 风格：`{页面}-{区域}-{元素}`
- 示例：`craftsman-import-header`、`craftsman-upload-icon`
- 用页面名做前缀避免全局冲突

## 何时可以用 inline style（例外）

仅限以下场景可用 inline style：

1. **动态计算的样式**（值依赖 JS 变量，如 `width: `${percent}%``）
2. **一次性、不复用的微调**（如 `marginBottom: 8` 这种单点调整）
3. **antd 组件的 props**（如 `<Col span={12}>`，这不是 style）

静态的、可复用的布局/颜色/间距样式，**必须**用 className + SCSS。

## 相关

- 项目样式规范文件：[react-system/src/assets/styles/global.scss](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/assets/styles/global.scss)
- 已有配套 scss 的页面参考：[CraftsmanForm.scss](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/CraftsmanForm.scss)
