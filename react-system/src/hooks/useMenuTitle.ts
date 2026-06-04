import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app'

export function useMenuTitle(): string | null {
  const location = useLocation()

  const title = useMemo(() => {
    const path = location.pathname
    const key = path.split('/').filter(Boolean).pop()
    if (!key) return null
    return useAppStore.getState().getMenuLabelByKey(key)
  }, [location.pathname])

  return title
}
