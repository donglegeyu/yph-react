# API 调用模式

> Last updated: 2026-06-16

## 场景

封装 API 调用，统一错误处理

## 推荐模式

### 基础封装

```typescript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default apiClient
```

### API 模块化

```typescript
export const getMenus = () => apiClient.get('/menus')
export const createMenu = (data) => apiClient.post('/menus', data)
```

## 关键点

1. **统一错误处理** - 拦截器处理
2. **类型安全** - TypeScript 类型定义
3. **可选链** - `response?.data` 安全访问
4. **API 地址禁止硬编码** - 从 `constants/api.ts` 引用

## 相关

- [API 模块模板](../templates/api-module.md)
