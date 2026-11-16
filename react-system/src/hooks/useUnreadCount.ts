import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app'
import { API_ENDPOINTS } from '@/constants/api'
import { get } from '@/utils/request'

const POLL_INTERVAL = 60_000

/** 未读消息数轮询：登录后每 60s 拉一次 unread-count，未登录不轮询；
 * 计数写入全局 store（铃铛 TabBar 与收件箱页共用同一真相源，已读操作后即时联动）；
 * 静默失败（网络异常/未登录）不打扰用户，暴露 refreshUnreadCount 供已读操作后立即刷新 */
export function useUnreadCount() {
  const setUnreadCount = useAppStore((s) => s.setUnreadCount)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCount = useCallback(async () => {
    try {
      const res = await get<number>(API_ENDPOINTS.NOTIFY_MESSAGES_UNREAD_COUNT)
      if (res.code === 200) {
        setUnreadCount(res.data ?? 0)
      }
    } catch {
      // 静默失败
    }
  }, [setUnreadCount])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined
    fetchCount()
    timerRef.current = setInterval(fetchCount, POLL_INTERVAL)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [fetchCount])

  return { refreshUnreadCount: fetchCount }
}
