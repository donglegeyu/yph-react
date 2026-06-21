# company-ui hideInFilter patch

> Last updated: 2026-06-20

## 背景

`@donglegeyu/company-ui` 的 `SmartListTemplate` 中 `fields` 同时驱动筛选表单、列定义、列设置、自定义筛选方案弹窗。某些字段（如"示例图"）需要出现在列表/列设置，但不应该出现在筛选区域。

## 官方 1.2.22 现状（部分支持）

官方 1.2.22 已新增 `hideInFilter` 支持，但**只覆盖了 2/3 处**：

| 位置 | 文件 | 行号 | 状态 |
|------|------|------|------|
| 类型定义 | `types/index.d.ts` | 54 | ✅ 官方已加 `hideInFilter?: boolean` |
| 自定义筛选方案弹窗可选字段 | `SmartListTemplate/index.js` | 217 | ✅ 官方已加 `&& !field.hideInFilter` |
| **筛选区显示项 `displayFilterItems`** | `SmartListTemplate/index.js` | **240** | ❌ **官方遗漏，仍是 `!nonBusinessFields.includes(field.key)`** |

第三处是真正控制筛选区显示的关键逻辑，不补的话默认 scheme 下 `hideInFilter: true` 的字段**仍会出现在筛选区**。

## 项目内临时 Patch（1 处）

文件：`node_modules/@donglegeyu/company-ui/dist/es/template-components/SmartListTemplate/index.js`

`displayFilterItems`（约第 239 行）的过滤条件：

```diff
  var displayFilterItems = useMemo(function () {
    var filteredFields = fields.filter(function (field) {
-     return !nonBusinessFields.includes(field.key);
+     return !nonBusinessFields.includes(field.key) && !field.hideInFilter;
    });
```

**`npm install` 后会丢失，需重新应用。** 建议组件库下个版本补上这一处。

## 使用方式

业务页面 fields 定义中，对需要隐藏的字段加 `hideInFilter: true`：

```typescript
{ key: 'exampleImage', label: '示例图', type: 'input', width: 260, hideInFilter: true }
```

该字段仍会出现在列表列、列设置面板中，但不会出现在筛选区域和自定义筛选方案配置弹窗中。

## 待推动组件库维护者补全

在 SmartListTemplate 源码的 `displayFilterItems` useMemo 中，把 `filteredFields` 的过滤条件从：

```js
return !nonBusinessFields.includes(field.key);
```

改为：

```js
return !nonBusinessFields.includes(field.key) && !field.hideInFilter;
```

补全后项目内的临时 patch 即可移除。
