import { useEffect, useCallback, useState } from 'react'
import { Form, Input, Radio, Checkbox, Descriptions, Tag, Space } from 'antd'
import {
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useMenuTitle, useSysUsers, useDomains } from '@/hooks'
import type { Domain } from '@/hooks'

interface DomainBrief {
  id: number
  domainName: string
}

interface UserRecord {
  [key: string]: unknown
  id: number
  username: string
  nickname: string
  status: number
  domains?: DomainBrief[]
  createTime: string
  updateTime: string
}

interface UserFormValues {
  username: string
  nickname: string
  password?: string
  status: number
}

const fields: FieldDefinition[] = [
  { key: 'username', label: '用户名', type: 'input', placeholder: '请输入用户名', width: 160 },
  { key: 'nickname', label: '昵称', type: 'input', placeholder: '请输入昵称', width: 160 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]},
  { key: 'domains', label: '关联域', width: 240 },
  { key: 'action', label: '操作', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'username', label: '用户名', visible: true, width: 160 },
  { key: 'nickname', label: '昵称', visible: true, width: 160 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'domains', label: '关联域', visible: true, width: 240 },
  { key: 'createTime', label: '创建时间', visible: true, width: 180 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 180 },
]

const STORAGE_KEY = 'user-management-column-settings'

export default function UserManagement() {
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<UserRecord>({
    apiEndpoint: API_ENDPOINTS.SYS_USERS,
    defaultPageSize: 20,
  })

  const menuTitle = useMenuTitle()

  const { createUser, updateUser, updateUserStatus, fetchUserDomains, assignDomains } = useSysUsers()
  const { fetchAllDomains } = useDomains()

  const [columnFields, setColumnFields] = useState<ColumnField[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return defaultColumnFields
  })

  const [formVisible, setFormVisible] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<UserFormValues>()

  const [domainVisible, setDomainVisible] = useState(false)
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainUserId, setDomainUserId] = useState<number | null>(null)
  const [allDomains, setAllDomains] = useState<Domain[]>([])
  const [selectedDomainIds, setSelectedDomainIds] = useState<number[]>([])

  const [detailVisible, setDetailVisible] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<UserRecord | null>(null)

  const handleColumnSettingsConfirm = useCallback((nextFields: ColumnField[]) => {
    setColumnFields(nextFields)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFields))
    } catch { /* ignore */ }
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultColumnFields))
    } catch { /* ignore */ }
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ status: 1 })
    setFormVisible(true)
  }, [form])

  const openEdit = useCallback((record: UserRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      username: record.username,
      nickname: record.nickname,
      status: record.status,
    })
    setFormVisible(true)
  }, [form])

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setFormLoading(true)

      if (editingId === null) {
        const newId = await createUser(values)
        if (newId !== null) {
          CompanyMessage.success('新增成功')
          setFormVisible(false)
          refresh()
        } else {
          CompanyMessage.error('新增失败，请稍后重试')
        }
      } else {
        const ok = await updateUser(editingId, values)
        if (ok) {
          CompanyMessage.success('编辑成功')
          setFormVisible(false)
          refresh()
        } else {
          CompanyMessage.error('编辑失败，请稍后重试')
        }
      }
    } catch {
      /* 校验失败，忽略 */
    } finally {
      setFormLoading(false)
    }
  }, [form, editingId, createUser, updateUser, refresh])

  const handleToggleStatus = useCallback(async (record: UserRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    const ok = await updateUserStatus(record.id, newStatus)
    if (ok) {
      CompanyMessage.success(newStatus === 1 ? '已启用' : '已禁用')
      refresh()
    } else {
      CompanyMessage.error('操作失败，请稍后重试')
    }
  }, [updateUserStatus, refresh])

  const openAssignDomains = useCallback(async (record: UserRecord) => {
    setDomainUserId(record.id)
    setSelectedDomainIds([])
    setDomainVisible(true)
    const [domains, userDomains] = await Promise.all([
      fetchAllDomains(),
      fetchUserDomains(record.id),
    ])
    setAllDomains(domains)
    setSelectedDomainIds(userDomains.map((d) => d.id))
  }, [fetchAllDomains, fetchUserDomains])

  const handleAssignDomains = useCallback(async () => {
    if (domainUserId === null) return
    setDomainLoading(true)
    const ok = await assignDomains(domainUserId, selectedDomainIds)
    setDomainLoading(false)
    if (ok) {
      CompanyMessage.success('域分配已更新')
      setDomainVisible(false)
      refresh()
    } else {
      CompanyMessage.error('分配失败，请稍后重试')
    }
  }, [domainUserId, selectedDomainIds, assignDomains, refresh])

  const showDetail = useCallback((record: UserRecord) => {
    setCurrentDetail(record)
    setDetailVisible(true)
  }, [])

  const toolbarActions = (
    <CompanyButton type="primary" onClick={openCreate}>
      新增用户
    </CompanyButton>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const userRecord = record as unknown as UserRecord

      if (column.key === 'status') {
        return (
          <CompanyTag color={userRecord.status === 1 ? 'success' : 'default'}>
            {userRecord.status === 1 ? '启用' : '禁用'}
          </CompanyTag>
        )
      }

      if (column.key === 'domains') {
        const domains = userRecord.domains || []
        if (domains.length === 0) {
          return <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
        }
        return (
          <Space size={[4, 4]} wrap>
            {domains.map((domain) => (
              <CompanyTag key={domain.id} color="processing">
                {domain.domainName}
              </CompanyTag>
            ))}
          </Space>
        )
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'detail', label: '详情', onClick: () => showDetail(userRecord) },
          { key: 'edit', label: '编辑', onClick: () => openEdit(userRecord) },
          {
            key: 'domain',
            label: '分配域',
            onClick: () => openAssignDomains(userRecord),
          },
          {
            key: 'toggle',
            label: userRecord.status === 1 ? '禁用' : '启用',
            onClick: () => handleToggleStatus(userRecord),
          },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [showDetail, openEdit, openAssignDomains, handleToggleStatus]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '用户管理'}
        fields={fields}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        filterParams={filterParams}
        onFilterParamsChange={setFilterParams}
        onSearch={(data) => fetchData(data)}
        onReset={() => {
          setFilterParams({})
          fetchData({})
        }}
        columnFields={columnFields}
        defaultColumnFields={defaultColumnFields}
        onColumnSettingsChange={handleColumnSettingsConfirm}
        onColumnSettingsReset={handleColumnSettingsReset}
        onRefresh={refresh}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />

      <CompanyDrawer
        title={editingId === null ? '新增用户' : '编辑用户'}
        open={formVisible}
        onClose={() => setFormVisible(false)}
        size={420}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setFormVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={formLoading} onClick={handleFormSubmit}>
              确定
            </CompanyButton>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 1 }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={editingId === null ? [{ required: true, message: '请输入密码' }] : []}
            extra={editingId !== null ? '留空则不修改密码' : undefined}
          >
            <Input.Password placeholder="请输入密码" maxLength={50} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </CompanyDrawer>

      <CompanyDrawer
        title="分配域"
        open={domainVisible}
        onClose={() => setDomainVisible(false)}
        size={420}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setDomainVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={domainLoading} onClick={handleAssignDomains}>
              确定
            </CompanyButton>
          </div>
        }
      >
        {allDomains.length === 0 ? (
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>暂无可分配的域</span>
        ) : (
          <Checkbox.Group
            value={selectedDomainIds}
            onChange={(values) => setSelectedDomainIds(values as number[])}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {allDomains.map((domain) => (
                <Checkbox key={domain.id} value={domain.id}>
                  {domain.domainName}
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>
                    ({domain.domainKey})
                  </span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        )}
      </CompanyDrawer>

      <CompanyDrawer
        title="用户详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        size={480}
        destroyOnHidden
      >
        {currentDetail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="用户名">{currentDetail.username}</Descriptions.Item>
            <Descriptions.Item label="昵称">{currentDetail.nickname}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentDetail.status === 1 ? 'success' : 'default'}>
                {currentDetail.status === 1 ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">{currentDetail.id}</Descriptions.Item>
            <Descriptions.Item label="关联域" span={2}>
              {(currentDetail.domains || []).length === 0 ? (
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
              ) : (
                <Space size={[4, 4]} wrap>
                  {(currentDetail.domains || []).map((domain) => (
                    <Tag key={domain.id} color="processing">
                      {domain.domainName}
                    </Tag>
                  ))}
                </Space>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {currentDetail.createTime}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={2}>
              {currentDetail.updateTime}
            </Descriptions.Item>
          </Descriptions>
        )}
      </CompanyDrawer>
    </>
  )
}
