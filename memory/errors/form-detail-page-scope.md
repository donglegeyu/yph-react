# 改表单页却误删详情页功能：共用配置 UI 的范围控制

> Last updated: 2026-10-12

## 场景

页面生成器（PageGeneratorWizard）中，**表单页（templateType='form'）与详情页共用同一套正文配置 UI**（Tab → 内容类型 → 字段分组）。用户说「表单页正文整个分组删除」，我误以为分组是多余的，把共用 UI 里的分组体系全链路删除（types.ts / Wizard / PreviewPanel / DynamicDetailPage），导致详情页分组功能一起消失。

## 问题现象

- 用户纠偏：「撤回刚刚的操作，我让你改的是表单页，你咋改到详情页去了」
- 详情页已上线的分组配置/渲染被连带删除

## 根因

1. **没识别共用 UI**：`isForm = config.templateType === 'form'` 只控制 Radio 选项显隐，正文配置（含字段分组）是两种页面类型共用的
2. **扩大改动范围**：把「表单页不需要」错误推广成「这个功能不需要」
3. 删除共用功能前没有检查该功能是否被其他页面类型依赖

## 正确做法

| 规则 | 说明 |
|------|------|
| ✅ 改动前先问「这个 UI/字段被谁共用」 | 表单页/详情页/列表页共用配置时要逐一确认影响面 |
| ✅ 共用 UI 中只影响一方时，用 `isForm` 条件包裹 | 分组 UI 用 `{!isForm && ...}` 包住，表单页不渲染 |
| ✅ 「删除」操作优先改为「条件隐藏 + 数据兼容」 | 表单页老数据的分组字段在迁移逻辑中拍平回 `fieldKeys`，详情页数据原样保留 |
| ❌ 绝不因一方不需要就删除共用功能 | 另一方可能正在使用（且已发布页面依赖它） |

## 数据兼容坑（连带教训）

后端反序列化老数据后 `fieldGroups` 可能是 **null**（不是字段缺失），`'fieldGroups' in t` 判断为 true 但读 `.length` 崩溃。必须用 `Array.isArray()` 判断三态：undefined / null / 空数组。

```tsx
const legacyGroups = (t as { fieldGroups?: {...}[] | null }).fieldGroups
if (!legacyGroups || legacyGroups.length === 0) {
  if (Array.isArray(legacyGroups)) return t // 已是空数组
  return { ...t, fieldGroups: [] }          // null/undefined 补齐
}
```

## 相关

- 类型定义：[react-system/src/pages/generator/types.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/generator/types.ts)
- 共用配置 UI：[react-system/src/pages/generator/PageGeneratorWizard.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/generator/PageGeneratorWizard.tsx)
