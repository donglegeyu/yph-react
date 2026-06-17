# TypeScript 类型错误

> Last updated: 2026-06-16

## 常见错误

### 1. 类型推断失败

```typescript
// ❌ 错误
const data = fetchData()  // 推断为 any

// ✅ 正确
const data: ResponseData = fetchData()
```

### 2. undefined/null 处理

```typescript
// ❌ 错误
const name = user.profile.displayName  // profile 可能为 undefined

// ✅ 正确
const name = user.profile?.displayName ?? '匿名'
```

### 3. 类型不匹配

```typescript
// ❌ 错误
const items: string[] = [1, 2, 3]  // 数字数组赋值给字符串数组

// ✅ 正确
const items: (string | number)[] = [1, 2, 3]
```

## 解决方案

### 定义接口

```typescript
interface User {
  id: number
  name: string
  profile?: {
    displayName: string
    avatar?: string
  }
}
```

### 使用类型守卫

```typescript
function isUser(obj: any): obj is User {
  return 'id' in obj && 'name' in obj
}
```

### 善用 utility types

```typescript
type PartialUser = Partial<User>
type RequiredUser = Required<User>
type ReadonlyUser = Readonly<User>
```

## 相关

- [D002: 可选链决策](../decisions/optional-chaining.md)
- [数组越界错误](./array-out-of-bounds.md)
