# SmartListTemplate 列字段显示模式

> Last updated: 2026-06-16

## 场景

使用 `@donglegeyu/company-ui` 的 `SmartListTemplate` 组件时，在已有列表页面中新增字段（列），但新增的列不在表格中显示。

## 问题现象

- `columnFields` 中已定义新字段，`visible: true`
- 后端 API 返回值正确（可通过 curl 验证）
- `列设置` 弹窗中可以看到新字段
- 但表格中**不显示该列**

## 根因：双向查找机制

SmartListTemplate 组件内部渲染列时，执行以下逻辑（源码位于 `node_modules/@donglegeyu/company-ui/dist/es/template-components/SmartListTemplate/index.js` 第 301-344 行）：

```js
if (columnFields && columnFields.length > 0) {
  // Step 1: 从 columnFields 中筛选 visible=true 的 key
  var visibleKeys = columnFields.filter(cf => cf.visible && cf.key !== 'action')
    .map(cf => cf.key);

  // Step 2: 用 key 反向去 fields 数组中查找 fieldDef
  visibleFieldDefs = visibleKeys.map(function (key) {
    var fieldDef = fields.find(function (f) { return f.key === key; });

    // ⚠️ 如果在 fields 中找不到 → return null → 被过滤掉
    if (!fieldDef) return null;

    if (columnField) {
      return _objectSpread(_objectSpread({}, fieldDef), {
        width: columnField.width || fieldDef.width,
        fixed: columnField.fixed || fieldDef.fixed
      });
    }
    return fieldDef;
  }).filter(Boolean);   // null 值被过滤 → 该列不显示
}
```

**核心规则**：每一列必须**同时存在于两个数组**中才能被渲染：

| 数组 | 作用 | 是否必须包含新字段？ |
|------|------|---------------------|
| `fields` | 筛选表单字段定义，也是 SmartListTemplate 生成列配置的"主数据源" | ✅ **必须** |
| `columnFields` / `defaultColumnFields` | 控制列是否显示、宽度、固定位置 | ✅ 必须 |

## 为什么部分字段能显示？

以工匠列表为例：

| 字段 | `fields` 中存在？ | `columnFields` 中存在？ | 显示？ |
|------|------------------|------------------------|--------|
| `serviceSkills` | ✅ 第 48 行 | ✅ 第 60 行 | ✅ 显示 |
| `registerTime` | ❌ **缺少** | ✅ 第 61 行 | ❌ 不显示 |

`serviceSkills` 在 `fields` 中定义了 → `fields.find()` 能找到 → 正常渲染。
`registerTime` 只在 `columnFields` 中定义 → `fields.find()` 返回 `undefined` → `return null` → 被 `filter(Boolean)` 过滤掉。

## 推荐模式：新增字段的标准步骤

```tsx
// Step 1: 在 fields 数组中新增字段（筛选表单 + 列配置数据源）
const fields: FieldDefinition[] = [
  // ...已有字段
  { key: 'registerTime', label: '注册时间', type: 'input', width: 160 },  // ✅ 必须加
  { key: 'action', label: '操作', width: 180, fixed: 'right' },
]

// Step 2: 在 defaultColumnFields 中同步新增字段（控制列显示/宽度）
const defaultColumnFields: ColumnField[] = [
  // ...已有字段
  { key: 'registerTime', label: '注册时间', visible: true, width: 160 }, // ✅ 必须加
]

// Step 3: bodyCell 中无需特殊处理（返回 null 时 fallback 到 record[field.key]）
// SmartListTemplate 源码第 337-341 行:
// return result !== null ? result : record[field.key];
```

## 排查 Checklist

当新增字段不显示时，按以下顺序检查：

1. ✅ **后端返回**：`curl 'http://localhost:8080/api/xxx?size=1'` 确认字段存在且有值
2. ✅ **`fields` 数组**：检查 `fields.find(f => f.key === 'newField')` 是否能找到
3. ✅ **`columnFields` / `defaultColumnFields`**：检查 `visible: true`
4. ✅ **`bodyCell`**：无需手动处理，返回 `null` 时组件会 fallback 到 `record[field.key]`
5. ✅ **localStorage 缓存**：`localStorage.removeItem('column-settings-*')` 清除旧列配置缓存

## bodyCell 的 fallback 机制

SmartListTemplate 的列渲染逻辑（第 337-342 行）：

```js
render: bodyCell ? function (_, record) {
  var result = bodyCell({ ...field, key: field.key }, record);
  return result !== null ? result : record[field.key];
} : undefined
```

即：
- `bodyCell` 返回具体内容 → 使用该内容
- `bodyCell` 返回 `null` → fallback 到 `record[field.key]`（原始值）
- **无需为每个字段写 bodyCell 逻辑**，只需在需要特殊渲染（如状态标签、时间格式化、操作按钮）时处理

## 相关

- 本项目使用的组件库版本：`@donglegeyu/company-ui@1.2.8`
- 该组件基于 Ant Design 6 的 Table 封装
