# portal 组件样式丢失：ConfigProvider theme 链断裂

> Last updated: 2026-06-21

## 场景

`CompanyDrawer`、`CompanyModal` 等 antd 组件通过 **portal 挂载到 `document.body`**，脱离了主 React 树的 DOM 层级。在抽屉/弹窗内部使用 antd 原生组件（如 `Upload.Dragger`）时，样式丢失或 class 不完整。

## 问题现象

- 抽屉/弹窗里的 antd 原生组件样式异常
- DevTools 看到 portal 节点下的元素缺少应有的样式
- 主页面（非 portal）的同类组件样式正常

## 根因：React Context 与 portal

虽然 React 的 Context **理论上能穿透 portal**（Context 基于 React 树而非 DOM 树），但 antd v6 的 CSS-in-JS 样式注入存在以下坑：

1. **主题 token 通过 ConfigProvider 的 Context 传递**
2. **portal 元素的样式需要正确的 theme cacheKey 才能匹配注入的 `<style>`**
3. **多层 ConfigProvider 嵌套时，内层不传 theme 会覆盖外层 theme**

### 项目特有的 Provider 链问题

文件：[react-system/src/App.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/App.tsx)

```tsx
// ❌ 之前的写法（theme 链断裂）
<ThemeProvider>                        {/* 注入 companyTheme */}
  <ConfigProvider locale={zhCN}>       {/* 没传 theme，覆盖了外层！ */}
    <AntdApp>...</AntdApp>
  </ConfigProvider>
</ThemeProvider>

// ✅ 修复后
<ThemeProvider>
  <ConfigProvider locale={zhCN} theme={companyTheme}>  {/* 显式传 theme */}
    <AntdApp>...</AntdApp>
  </ConfigProvider>
</ThemeProvider>
```

## 标准修复方案

### 方案 1：补全 Provider 链的 theme（项目级根治）

在 App.tsx 的每一层 ConfigProvider 都显式传 theme：

```tsx
import { ThemeProvider, companyTheme } from '@donglegeyu/company-ui'
import { ConfigProvider } from 'antd'

<ThemeProvider>
  <ConfigProvider locale={zhCN} theme={companyTheme}>
    {/* 所有页面和 portal 组件都能拿到正确的 theme */}
  </ConfigProvider>
</ThemeProvider>
```

### 方案 2：局部包裹 ConfigProvider（单点修复）

在 portal 内容区内部，手动用 ConfigProvider 包裹 antd 原生组件：

```tsx
import { ConfigProvider } from 'antd'
import { companyTheme } from '@donglegeyu/company-ui'

<CompanyDrawer title="导入" open={open}>
  <ConfigProvider theme={companyTheme}>
    <Upload.Dragger {...props}>
      {/* 内容 */}
    </Upload.Dragger>
  </ConfigProvider>
</CompanyDrawer>
```

## 何时需要手动包 ConfigProvider

| 场景 | 是否需要手动包 |
|------|---------------|
| 用 company-ui 组件（CompanyButton/CompanySelect 等） | ❌ 不需要（自带主题） |
| 在主页面用 antd 原生组件 | ❌ 不需要（外层 Provider 覆盖） |
| 在 portal（Drawer/Modal）里用 antd 原生组件 | ✅ 需要手动包 |
| 用 antd 原生组件 + 自定义 portal | ✅ 需要手动包 |

## 验证 theme 是否生效

```bash
# 检查 document.head 里的 <style> 标签数量
# 打开抽屉前后对比，应该新增 drawer 相关的 style 块
document.querySelectorAll('style[data-rc-order]').length
```

## 相关

- 项目 Provider 配置：[react-system/src/App.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/App.tsx)
- companyTheme 定义：`node_modules/@donglegeyu/company-ui/dist/es/theme/GlobalTheme.js`
- 关联问题：[company-ui CompanyUpload 无 Dragger](./company-upload-no-dragger.md)
