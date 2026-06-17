# G2 5.x 图表样式配置坑

> Last updated: 2026-06-16

## 场景

在 React 项目中使用 `@ant-design/charts` v2.6.7（底层 G2 5.4.8）的 `<Column>` 柱状图组件，设置 X/Y 轴文字颜色时，色值正确但显示为浅色。

## 坑点

### 坑1：`labelFill` / `labelFontSize` 是 theme 层属性，不是 axis 组件配置项？

**结论：否，这是误导。**

查 G2 5.4.8 的 [create.d.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/node_modules/@antv/g2/lib/theme/create.d.ts) 类型定义时，会发现 `labelFill` / `labelFontSize` 出现在 `theme.axis` 对象里。但这只是**主题默认值**的定义位置，不代表它们只能用在 theme 里。

根据 G2 v5 官方文档（[51CTO 实践文章](https://blog.51cto.com/u_15365254/12651901)），`labelFill` **可以直接写在 `axis.x` 里**，这是官方推荐写法：

```ts
axis: {
  x: { labelFill: '#1D2129' }
}
```

### 坑2：`label.style.fill` 嵌套写法不生效

`@ant-design/charts` 的 `<Column>` 包装层对 `axis.x.label.style.fill` 的嵌套传递有丢失，以下写法**无效**：

```ts
// ❌ 无效
axis: {
  x: {
    label: { style: { fill: '#1D2129', fontSize: 12 } }
  }
}
```

### 坑3（根本原因）：`labelOpacity` 默认透明度

**G2 v5 默认给 axis label 加了一层透明度（约 0.45）**，导致即使 `fill = '#1D2129'` 深黑色，渲染出来也会变成浅灰色。

这就是"色值对，但显示不对"的根本原因 —— 不是 fill 没生效，而是透明度让深色变浅了。

## 正确写法

```ts
axis: {
  x: {
    title: false,
    labelAutoRotate: false,
    labelFill: '#1D2129',      // 颜色
    labelFontSize: 12,         // 字号
    labelOpacity: 1,           // ← 关键：重置默认透明度
  },
  y: {
    title: false,
    labelFormatter: (v: string) => v,
    labelFill: '#1D2129',
    labelFontSize: 12,
    labelOpacity: 1,           // ← 关键：重置默认透明度
    gridLineDash: [2, 2],      // 虚线（不是 'dash' 字符串）
    gridStroke: 'rgba(0,0,0,0.06)',
  },
}
```

## 关键要点

| 属性 | 正确位置 | 说明 |
|------|---------|------|
| `labelFill` | `axis.x` / `axis.y` 顶层 | 文字颜色 |
| `labelFontSize` | `axis.x` / `axis.y` 顶层 | 文字字号 |
| `labelOpacity` | `axis.x` / `axis.y` 顶层 | **必须设为 1**，否则 G2 默认透明度让颜色变浅 |
| `gridLineDash` | `axis.y` 顶层 | `[2, 2]` 数组，不是 `'dash'` 字符串 |
| `gridStroke` | `axis.y` 顶层 | 网格线颜色 |

## 排查路径

1. 检查 `@antv/g2` 版本（`package.json` / `node_modules/@antv/g2/package.json`）
2. 查 G2 类型定义 `node_modules/@antv/g2/lib/theme/create.d.ts` 确认属性名
3. 查官方文档 / 实践文章确认 API 写法
4. **遇到"色值对但显示浅"，优先怀疑 `opacity` 类属性**

## 相关文件

- [SalesDashboard.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/home/SalesDashboard.tsx) - 销售仪表盘图表配置
