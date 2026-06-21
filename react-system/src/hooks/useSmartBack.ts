import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export function useSmartBack(fallback = '/craftsman-search') {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return useCallback(() => {
    if (from) {
      navigate(from)
    } else {
      navigate(fallback)
    }
  }, [from, navigate, fallback])
}
