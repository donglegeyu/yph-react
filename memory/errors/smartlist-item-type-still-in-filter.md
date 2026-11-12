# SmartListTemplate 的 type:'item' 不会阻止字段进入筛选区

> Last updated: 2026-11-11

## 现象

把列表页所有 `fields` 都设成 `type: 'item'`（本意"仅作展示列、不出筛选区"），页面渲染结果：筛选区仍然出现，且每个字段只剩裸标签（`流程标识:` / `流程名称:` …），**没有任何输入控件**，却挂着查询/重置按钮——看起来像页面坏了。

## 根因

- SmartListTemplate 生成筛选字段时只排除两类：`nonBusinessFields`（`action/index/checkbox/selection`）和显式声明 `hideInFilter: true` 的字段（`template-components/SmartListTemplate/index.js` 的 `displayFilterItems` useMemo）。
- `type: 'item'` **不在排除逻辑里**，FilterForm 收到后没有对应控件渲染，就成了"只有标签没有输入框"的残缺筛选行。
- 筛选区整体渲染条件是 `displayFilterItems.length > 0`——全部字段 `hideInFilter` 后整个筛选区（含查询/重置按钮）才会消失。

## 正确写法

```ts
// ❌ 错误：以为 type:'item' 就不会进筛选区
{ key: 'version', label: '版本', type: 'item', width: 100 },

// ✅ 正确：展示列要显式声明 hideInFilter
{ key: 'version', label: '版本', type: 'item', width: 100, hideInFilter: true },
```

项目内先例：`react-system/src/pages/common/ModelManagement.tsx`（全 item 字段页，每条都带 `hideInFilter: true`，文件内有注释说明）。

## 排查路径（以后遇到同类问题先查这里）

1. 项目内全局搜 `hideInFilter` / `type: 'item'`，看有没有现成先例
2. 读 `node_modules/@donglegeyu/company-ui/dist/es/template-components/SmartListTemplate/index.js` 的 `displayFilterItems` 与 `<FilterForm>` 渲染条件

## 波及范围

审批中心 4 个列表页（ApprovalProcessAdmin / ApprovalDone / ApprovalMine / ApprovalTodo）曾全部踩中，2026-11-11 已统一加 `hideInFilter: true` 修复并浏览器验证。
