import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from 'antd'
import { CompanyTabs, CompanyTag, PageTitle } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import './UserDetail.scss'

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
  name: string
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

const baseFields = [
  { label: '用户名', key: 'username' },
  { label: '真实姓名', key: 'realName' },
  { label: '所属公司', key: 'companyName' },
  { label: '所属部门', key: 'deptName' },
  { label: '手机号', key: 'phone' },
  { label: '邮箱', key: 'email' },
  { label: '用户ID', key: 'id' },
  { label: '创建时间', key: 'createTime' },
  { label: '更新时间', key: 'updateTime' },
] as const

function renderMenuTree(menus: PermissionMenu[] | undefined): React.ReactNode {
  if (!menus || menus.length === 0) {
    return <span style={{ color: 'var(--color-text-tertiary)' }}>--</span>
  }
  return (
    <div className="ud-perm-tags">
      {menus.map((menu) => (
        <CompanyTag key={menu.id} color="processing">
          {menu.name}
        </CompanyTag>
      ))}
    </div>
  )
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
      <div className="user-detail">
        <PageTitle title="用户详情" showBack onBack={() => navigate('/user-management')} />
        <div className="ud-content">
          <div className="ud-empty">用户不存在</div>
        </div>
      </div>
    )
  }

  const detailRecord = detail as unknown as Record<string, string | number>
  const roles = detail.roles || []
  const domains = detail.domains || []
  const rbacRoles = permission?.rbac?.roles || []
  const rbacMenus = permission?.rbac?.menus

  return (
    <div className="user-detail">
      <PageTitle title="用户详情" showBack onBack={() => navigate('/user-management')} />

      <div className="ud-user-card">
        <div className="ud-user-top">
          <div className="ud-user-info">
            <div className="ud-avatar">
              {(detail.nickname || detail.username || '?').charAt(0)}
            </div>
            <span className="ud-username">{detail.nickname || detail.username || '--'}</span>
          </div>
          <div className="ud-user-tags">
            <CompanyTag className="ud-tag-default">
              {detail.status === 1 ? '启用' : '禁用'}
            </CompanyTag>
            {roles.map((role) => (
              <CompanyTag key={role.id} className="ud-tag-default">
                {role.roleName}
              </CompanyTag>
            ))}
          </div>
        </div>
        <div className="ud-user-fields">
          {baseFields.map((field) => (
            <div className="ud-field-item" key={field.key}>
              <span className="ud-field-label">{field.label}：</span>
              <span className="ud-field-value">
                {String(detailRecord[field.key] ?? '--')}
              </span>
            </div>
          ))}
        </div>
        <div className="ud-user-relations">
          <div className="ud-relation-row">
            <span className="ud-relation-label">关联域：</span>
            <span className="ud-relation-value">
              {domains.length === 0 ? (
                <span style={{ color: 'var(--color-text-tertiary)' }}>--</span>
              ) : (
                domains.map((d) => (
                  <CompanyTag key={d.id} className="ud-tag-default">
                    {d.domainName}
                  </CompanyTag>
                ))
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="ud-divider" />

      <div className="ud-content">
        <CompanyTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'detail',
              label: '详情',
              children: (
                <div className="ud-tab-pane">
                  <div className="ud-user-fields">
                    {baseFields.map((field) => (
                      <div className="ud-field-item" key={field.key}>
                        <span className="ud-field-label">{field.label}：</span>
                        <span className="ud-field-value">
                          {String(detailRecord[field.key] ?? '--')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'permission',
              label: '菜单权限',
              children: (
                <div className="ud-tab-pane">
                  {permLoading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                  ) : (
                    <>
                      <div className="ud-perm-section">
                        <div className="ud-perm-title">角色权限</div>
                        <div className="ud-perm-tags">
                          {rbacRoles.length === 0 ? (
                            <span style={{ color: 'var(--color-text-tertiary)' }}>--</span>
                          ) : (
                            rbacRoles.map((r) => (
                              <CompanyTag key={r.id} color="warning">
                                {r.roleName}
                              </CompanyTag>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="ud-perm-section">
                        <div className="ud-perm-title">可访问菜单</div>
                        {renderMenuTree(rbacMenus)}
                      </div>
                      <div className="ud-perm-section">
                        <div className="ud-perm-title">按钮权限标识</div>
                        <div className="ud-perm-tags">
                          {(permission?.rbac?.permissions || []).length === 0 ? (
                            <span style={{ color: 'var(--color-text-tertiary)' }}>--</span>
                          ) : (
                            (permission?.rbac?.permissions || []).map((p, idx) => (
                              <CompanyTag key={idx} className="ud-tag-default">
                                {p}
                              </CompanyTag>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'history',
              label: '变更记录',
              children: (
                <div className="ud-tab-pane">
                  <div className="ud-empty">暂无变更记录</div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
