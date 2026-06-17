# API 模块模板

> Last updated: 2026-06-16

## 标准 API 模块（CRUD 封装）

```typescript
import apiClient from './client'
import type { XXX, XXXData } from '@/types/xxx'

export const getXXXList = (query?: XXXQuery) => {
  return apiClient.get<XXX[]>('/xxx', { params: query })
}

export const getXXXById = (id: number) => {
  return apiClient.get<XXX>(`/xxx/${id}`)
}

export const createXXX = (data: XXXData) => {
  return apiClient.post<XXX>('/xxx', data)
}

export const updateXXX = (id: number, data: XXXData) => {
  return apiClient.put<XXX>(`/xxx/${id}`, data)
}

export const deleteXXX = (id: number) => {
  return apiClient.delete(`/xxx/${id}`)
}
```

## 使用示例（React）

```typescript
const [list, setList] = useState<XXX[]>([])

async function loadList() {
  try {
    const data = await getXXXList({ page: 1, size: 10 })
    setList(data ?? [])
  } catch (error) {
    console.error('Load failed:', error)
  }
}
```

## 关键点

1. **类型导入** - TypeScript 类型
2. **统一封装** - apiClient 统一处理
3. **可选链** - API 响应安全访问
4. **错误处理** - try-catch

## 相关

- [API 调用模式](../patterns/api-call.md)
