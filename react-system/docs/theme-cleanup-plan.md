# !important 清理方案

## 问题

`global.scss` 中有 **91 处** `!important`，用于对抗 antd v6 CSS-in-JS 的样式覆盖。根源是 global.scss 中的 CSS 变量值与 company-ui 预置的 `companyTheme` token 值不一致。

## 方案：内层 ConfigProvider 合并主题

利用 antd v5+ 嵌套 `ConfigProvider` 自动 **merge** 的特性，新增一层内部 ConfigProvider 把 CSS 变量中的属性值同步为 antd token，从而不再需要 SCSS 用 `!important` 对抗。

```
ThemeProvider (companyTheme: colorPrimary=#F95914 border=8)
  └─ ConfigProvider (appTheme: hover=#FF7043 border=6 ...)  ← 新增
       └─ App
```

## 创建文件

`src/theme/appTheme.ts`

```typescript
import type { ThemeConfig } from 'antd'

export const appTheme: ThemeConfig = {
  token: {
    // 覆盖 hover/active 颜色
    colorPrimaryHover: '#FF7043',
    colorPrimaryActive: '#E64A19',
    // 圆角改为 6px（公司标准）
    borderRadius: 6,
    // 占位符颜色
    colorTextPlaceholder: 'rgba(0, 0, 0, 0.25)',
  },
  components: {
    Button: {
      // 按钮圆角
      borderRadius: 6,
      // 默认按钮颜色
      defaultBorderColor: '#D9D9D9',
      defaultBg: '#FFFFFF',
      defaultColor: 'rgba(0, 0, 0, 0.88)',
      // 悬停颜色
      defaultHoverBorderColor: '#F95914',
      defaultHoverColor: '#F95914',
      // 链接按钮颜色
      textHoverBg: 'transparent',
      // 去掉聚焦阴影（antd v6 用 outline 替代）
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Table: {
      // 表头背景色
      headerBg: '#FAFAFA',
      // 表头字重
      fontWeightStrong: 600,
      // 单元格 padding（行高 46px = 7px * 2 + 22px lineHeight + 10px = 略超，实际 7px 即可）
      cellPaddingBlock: 7,
      cellPaddingInline: 16,
      // 表头无边框
      headerBorderRadius: 0,
      // 隐藏固定列阴影
      cellFixedShadow: 'none',
    },
  },
}
```

## 修改 App.tsx

```typescript
import { ThemeProvider } from '@donglegeyu/company-ui'
import { ConfigProvider } from 'antd'
import { appTheme } from '@/theme/appTheme'

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <ConfigProvider theme={appTheme}>
          <AppInit />
          <Suspense ...>
            <RouterProvider router={router} />
          </Suspense>
        </ConfigProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  )
}
```

## 清理 global.scss（删除约 75 条 !important）

### 可删除块（被 token 覆盖）

| 行号范围 | 规则 | 被哪个 token 替代 |
|---------|------|------------------|
| 206-211 | `.ant-btn { border-radius, box-shadow }` | `Button.borderRadius` |
| 213-229 | `.ant-btn-primary` 颜色系列 | `token.colorPrimary` 系列 + `Button.primaryShadow` |
| 231-253 | `.ant-btn-default` 颜色系列 | `Button.default*` 系列 |
| 255-266 | `.ant-btn { focus, active }` | `Button.primaryShadow / defaultShadow = none` |
| 268-272 | `.ant-btn-default:active` | `Button.defaultActive*` |
| 274-278 | `.ant-btn-primary:active` | `Button.primaryShadow = none` |
| 280-283 | `.ant-btn-link:active` | `Button.textHoverBg = transparent` |
| 286-295 | `.ant-btn-link` | `Button.*` + `token.colorPrimary` |
| 297-305 | `.ant-btn-link[danger]` | `token.colorPrimary` |
| 308-319 | `.ant-space-item` 图标 | 走 `Button.paddingInline`，可用 `size` prop 控制 |
| 341-343 | `.ant-table-body::-webkit-scrollbar` | 保留（浏览器级）|
| 346-351 | `.ant-table-thead > tr > th` padding/background | `Table.headerBg`, `Table.cellPaddingInline` |
| 353-355 | `.ant-table-cell` padding | `Table.cellPaddingBlock/Inline` |
| 357-365 | `.ant-table-cell-fix-right-first` | 已用 `onHeaderCell` inline style |
| 367-370 | `.ant-table-cell-fix-right-first .ant-space` | 转为 class 无 `!important` |
| 396-403 | `.ant-tag.status-pending` | `Tag.color`, `Tag.bg` |
| 404-409 | `.ant-tag.status-approved` | 同上 |
| 410-415 | `.ant-tag.status-rejected` | 同上 |
| 423-427 | placeholder 颜色 | `token.colorTextPlaceholder` |
| 430-453 | 表格操作列按钮样式 | 减少 `!important`，只保留必要的 |
| 457-458 | `.ant-table-cell { white-space }` | 保留 |
| 461-463 | `.ant-table-tbody > tr > td` | `Table.cellPaddingBlock/Inline` |
| 466-469 | `.ant-table-thead > tr > th` | `Table.cellPaddingBlock/Inline` |
| 472-484 | `.ant-table-measure-row` | 保留（hack）|
| 487-488 | `.ant-table-measure-row { visibility }` | 保留 |
| 491-494 | `.ant-table-cell-fix-left/right` | `Table.cellFixedShadow = 'none'` |
| 502-508 | `.ant-spin*` 加载颜色 | `token.colorPrimary` |
| 514-545 | `.icon-only-btn` | 项目自身类，可去掉 `!important` |

### 必须保留的（约 15 条）

| 行号 | 原因 |
|------|------|
| 342 | 浏览器级滚动条，无对应 token |
| 457 | `white-space: nowrap` 无对应 token |
| 472-484 | measure-row 零尺寸 hack，无对应 token |
| 487 | measure-row visibility hack，无对应 token |
| 538-539 | `.icon-only-btn:focus` 无对应 token |

## 执行步骤

1. 创建 `src/theme/appTheme.ts`
2. 更新 `App.tsx` 加 `ConfigProvider`
3. 逐个删除 `global.scss` 中被覆盖的 `!important` 规则
4. 编译验证（`npx tsc --noEmit`）
5. 浏览器验证按钮颜色、表格间距、标签颜色是否一致
6. 如果发现 token 没覆盖到的场景，补全 token 配置，不要回退到 `!important`
