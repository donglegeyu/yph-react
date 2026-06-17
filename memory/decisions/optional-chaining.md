# D002: 使用可选链防止数组越界

> Date: 2026-04-15
> Status: Active

## 决策

采用 **可选链操作符（?.）** 防止数组越界和空指针错误

## 背景

开发表格展开收起功能时，需要处理深层嵌套数据。

## 问题场景

```typescript
// ❌ 危险写法
const value = array[index].property.nested

// 风险：index 超出范围或 property 为 undefined
```

## 解决方案

```typescript
// ✅ 安全写法
const value = array?.[index]?.property?.nested

// 使用可选链自动处理 undefined/null
```

## 实施

### 代码示例

```typescript
// 列表数据访问
const item = list?.[index]?.children?.[childIndex]

// API 响应处理
const data = response?.data?.result ?? []

// 深层属性访问
const title = item?.meta?.title ?? '未命名'
```

## 效果

- ✅ 运行时错误减少
- ✅ 代码更健壮
- ✅ 无需大量 if 判断

## 适用场景

- API 响应处理
- 表格行数据访问
- 表单字段处理
- 深层对象属性访问

## 注意事项

- 适当使用 ?? 提供默认值
- 不要过度嵌套（超过 3 层建议重构）
- 结合 TypeScript 类型更安全

## 相关

- [Code Review 工作流](../workflows/code-review.md)
- [数组越界错误](../errors/array-out-of-bounds.md)
