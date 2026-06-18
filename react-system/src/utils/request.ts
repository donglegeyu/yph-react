import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

declare module 'axios' {
  interface AxiosRequestConfig {
    // 业务级 401（如登录密码错误）是否触发整页跳转登录页。
    // 默认 true：会话过期自动跳登录；登录接口需传 false 以便正常返回错误给页面处理。
    skipAuthRedirect?: boolean
  }
}

// 注意：API_ENDPOINTS 已包含完整的 /api 前缀（原生 fetch 与 axios 共用），
// 因此此处不再设置 baseURL，避免拼接出 /api/api/xxx 的重复路径。
const request = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code === 401 && !response.config.skipAuthRedirect) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(new Error(res.message || '未授权'))
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

export async function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await request.get<ApiResponse<T>>(url, { params, ...config })
  return res.data
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await request.post<ApiResponse<T>>(url, data, config)
  return res.data
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await request.put<ApiResponse<T>>(url, data, config)
  return res.data
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await request.delete<ApiResponse<T>>(url, config)
  return res.data
}

export default request
