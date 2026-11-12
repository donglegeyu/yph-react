import { useCallback } from 'react'
import { useAppStore } from '@/store/app'

/**
 * 权限码判断。权限码来自登录接口返回的 perms，ROLE_ADMIN 返回 ["*"]。
 * 用法：const { hasPerm } = usePermission(); hasPerm('approval:todo:approve')
 */
export function usePermission() {
  const permissions = useAppStore((s) => s.permissions)

  const hasPerm = useCallback(
    (code: string) => permissions.includes('*') || permissions.includes(code),
    [permissions],
  )

  const hasAnyPerm = useCallback(
    (codes: string[]) =>
      permissions.includes('*') || codes.some((code) => permissions.includes(code)),
    [permissions],
  )

  return { permissions, hasPerm, hasAnyPerm }
}
