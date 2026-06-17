# 数组越界错误

> Last updated: 2026-04-15

## 问题描述

访问数组元素时，索引超出范围导致报错

```typescript
// ❌ 错误示例
const item = array[100]  // array 只有 10 个元素

// 报错：TypeError: Cannot read property 'x' of undefined
```

## 解决方案

### 方案1：可选链（推荐）

```typescript
const item = array?.[index]
const value = item?.property
```

### 方案2：默认值

```typescript
const item = array[index] ?? {}
const value = item.property ?? 'default'
```

## 相关

- [D002: 可选链决策](../decisions/optional-chaining.md)
