import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from 'antd'
import {
  CompanyTag,
  DetailPageTemplate,
  type DetailFieldItem,
  type DetailTagItem,
  type DetailTabItem,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'

interface DomainBrief {
  id: number
  domainName: string
}

interface RoleBrief {
  id: number
  roleName: string
  roleCode: string
}

interface UserRecord {
  [key: string]: unknown
  id: number
  username: string
  nickname: string
  realName?: string
  deptId?: number
  deptName?: string
  companyId?: number
  companyName?: string
  phone?: string
  email?: string
  status: number
  domains?: DomainBrief[]
  roles?: RoleBrief[]
  createTime: string
  updateTime: string
}

interface PermissionMenu {
  id: number
  name?: string
  label?: string
  key?: string
  children?: PermissionMenu[]
}

interface RbacPermission {
  roles?: Array<{ id: number; roleName: string; roleCode: string }>
  menus?: PermissionMenu[]
  permissions?: string[]
}

interface PermissionData {
  user?: Record<string, unknown>
  domains?: Array<{ id: number; domainName: string }>
  menuTree?: PermissionMenu[]
  rbac?: RbacPermission
}

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<UserRecord | null>(null)
  const [permission, setPermission] = useState<PermissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [permLoading, setPermLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.SYS_USERS}/${id}`)
        const json = await res.json()
        if (!cancelled && json.code === 200 && json.data) {
          setDetail(json.data as UserRecord)
        }
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (activeTab !== 'permission' || !id) return
    let cancelled = false
    void (async () => {
      setPermLoading(true)
      try {
        const res = await fetch(`/api/sys/users/${id}/permissions`)
        const json = await res.json()
        if (!cancelled && json.code === 200 && json.data) {
          setPermission(json.data as PermissionData)
        }
      } catch {
        if (!cancelled) setPermission(null)
      } finally {
        if (!cancelled) setPermLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [activeTab, id])

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  if (!detail) {
    return (
      <DetailPageTemplate
        title="用户详情"
        showBack
        onBack={() => navigate('/user-management')}
        primaryName="用户不存在"
      />
    )
  }

  const roles = detail.roles || []
  const domains = detail.domains || []

  const infoFields: DetailFieldItem[] = [
    { label: '用户名', value: detail.username },
    { label: '真实姓名', value: detail.realName || '--' },
    { label: '所属部门', value: detail.deptName || '--' },
    { label: '关联域', value: domains.length === 0 ? '--' : domains.map((d) => d.domainName).join('、') },
    { label: '更新时间', value: detail.updateTime },
  ]

  const tags: DetailTagItem[] = [
    {
      text: detail.status === 1 ? '启用' : '禁用',
      variant: detail.status === 1 ? 'success' : 'default',
    },
    ...roles.map((role) => ({
      text: role.roleName,
      variant: 'warning' as const,
    })),
  ]

  const rbacRoles = permission?.rbac?.roles || []
  const rbacMenus = permission?.rbac?.menus || []
  const rbacPerms = permission?.rbac?.permissions || []

  const allFields: DetailFieldItem[] = [
    { label: '用户名', value: detail.username },
    { label: '昵称', value: detail.nickname },
    { label: '真实姓名', value: detail.realName || '--' },
    { label: '所属公司', value: detail.companyName || '--' },
    { label: '所属部门', value: detail.deptName || '--' },
    { label: '手机号', value: detail.phone || '--' },
    { label: '邮箱', value: detail.email || '--' },
    { label: '关联域', value: domains.length === 0 ? '--' : domains.map((d) => d.domainName).join('、') },
    { label: '用户ID', value: detail.id },
    { label: '创建时间', value: detail.createTime },
    { label: '更新时间', value: detail.updateTime },
  ]

  const tabs: DetailTabItem[] = [
    {
      key: 'detail',
      label: '详情',
      children: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 32px', padding: '16px 0' }}>
          {allFields.map((field) => (
            <div key={field.label} style={{ display: 'flex', lineHeight: '22px' }}>
              <span style={{ color: 'rgba(0,0,0,0.45)', marginRight: 4 }}>{field.label}：</span>
              <span style={{ color: 'rgba(0,0,0,0.88)' }}>{field.value}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'permission',
      label: '菜单权限',
      children: permLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>角色权限</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {rbacRoles.length === 0 ? (
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
              ) : (
                rbacRoles.map((r) => (
                  <CompanyTag key={r.id} color="warning">
                    {r.roleName}
                  </CompanyTag>
                ))
              )}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>可访问菜单</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {rbacMenus.length === 0 ? (
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
              ) : (
                rbacMenus.map((m) => (
                  <CompanyTag key={m.id} color="processing">
                    {m.label || m.name || '--'}
                  </CompanyTag>
                ))
              )}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>按钮权限标识</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {rbacPerms.length === 0 ? (
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
              ) : (
                rbacPerms.map((p, idx) => (
                  <CompanyTag key={idx} className="ud-tag-default">
                    {p}
                  </CompanyTag>
                ))
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'history',
      label: '变更记录',
      children: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            color: 'rgba(0,0,0,0.45)',
          }}
        >
          暂无变更记录
        </div>
      ),
    },
  ]

  return (
    <DetailPageTemplate
      title="用户详情"
      showBack
      onBack={() => navigate('/user-management')}
      primaryName={detail.nickname}
      tags={tags}
      infoFields={infoFields}
      infoColumns={3}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  )
}
