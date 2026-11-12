import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'

interface PermissionGuardProps {
  code: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * 按钮/局部区域级权限控制。无权限时默认不渲染，可传 fallback。
 */
export default function PermissionGuard({
  code,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPerm } = usePermission()
  return hasPerm(code) ? <>{children}</> : <>{fallback}</>
}
