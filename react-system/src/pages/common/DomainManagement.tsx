import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Space } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  SvgIcon,
  type FieldDefinition,
} from '@donglegeyu/company-ui'
import ActionCell from '@/components/ActionCell'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel'
import type { ColumnField } from '@/components/ColumnSettingsPanel'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData } from '@/hooks'

interface DomainRecord {
  id: number
  domainKey: string
  domainName: string
  description: string
  isDefault: number
  menuCount?: number
  userCount?: number
  status: number
  createTime: string
  updateTime: string
}

const fields: FieldDefinition[] = [
  { key: 'domainKey', label: '域标识', type: 'input', placeholder: '请输入域标识', width: 150 },
  { key: 'domainName', label: '域名称', type: 'input', placeholder: '请输入域名称', width: 150 },
  { key: 'isDefault', label: '域类型', type: 'input', width: 100 },
  { key: 'menuCount', label: '包含菜单数', type: 'input', width: 100 },
  { key: 'userCount', label: '用户数', type: 'input', width: 80 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]},
  { key: 'action', label: '操作', width: 148, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'domainKey', label: '域标识', visible: true, width: 150 },
  { key: 'domainName', label: '域名称', visible: true, width: 150 },
  { key: 'isDefault', label: '域类型', visible: true, width: 100 },
  { key: 'menuCount', label: '包含菜单数', visible: true, width: 100 },
  { key: 'userCount', label: '用户数', visible: true, width: 80 },
  { key: 'status', label: '状态', visible: true, width: 100 },
]

const STORAGE_KEY = 'domain-management-column-settings'

export default function DomainManagement() {
  const navigate = useNavigate()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<DomainRecord>({
    apiEndpoint: API_ENDPOINTS.DOMAINS,
    defaultPageSize: 20,
  })

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

  const handleColumnSettingsConfirm = useCallback((fields: ColumnField[]) => {
    setColumnFields(fields)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
    } catch { /* ignore */ }
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultColumnFields))
    } catch { /* ignore */ }
  }, [])

  const handleAdd = useCallback(() => {
    navigate('/domain-manage/create')
  }, [navigate])

  const handleEdit = useCallback((record: DomainRecord) => {
    navigate(`/domain-manage/${record.id}`)
  }, [navigate])

  const handleToggleStatus = useCallback(async (record: DomainRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    try {
      const res = await fetch(`${API_ENDPOINTS.DOMAINS}/${record.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(newStatus === 1 ? '已启用' : '已禁用')
        refresh()
      } else {
        CompanyMessage.error(json.message || '操作失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('操作失败，请稍后重试')
    }
  }, [refresh])

  const handleDelete = useCallback(async (record: DomainRecord) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.DOMAINS}/${record.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('删除成功')
        refresh()
      } else {
        CompanyMessage.error(json.message || '删除失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('删除失败，请稍后重试')
    }
  }, [refresh])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={handleAdd}>
        新增域
      </CompanyButton>
      <ColumnSettingsPanel
        fields={columnFields}
        defaultFields={defaultColumnFields}
        excludeKeys={[]}
        onConfirm={handleColumnSettingsConfirm}
        onReset={handleColumnSettingsReset}
      />
      <CompanyButton
        onClick={refresh}
        style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        <SvgIcon href="refresh" size={16} />
      </CompanyButton>
    </Space>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const domainRecord = record as unknown as DomainRecord

      if (column.key === 'isDefault') {
        return <>{domainRecord.isDefault === 1 ? '默认域' : '自定义域'}</>
      }

      if (column.key === 'menuCount') {
        return <>{domainRecord.menuCount || 0}个</>
      }

      if (column.key === 'userCount') {
        return <>{domainRecord.userCount || 0}人</>
      }

      if (column.key === 'status') {
        return (
          <Tag color={domainRecord.status === 1 ? 'success' : 'default'}>
            {domainRecord.status === 1 ? '启用' : '禁用'}
          </Tag>
        )
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'edit', label: '编辑', onClick: () => handleEdit(domainRecord) },
          {
            key: 'toggle',
            label: domainRecord.status === 1 ? '禁用' : '启用',
            onClick: () => handleToggleStatus(domainRecord),
          },
        ]
        if (domainRecord.isDefault !== 1) {
          buttons.push({
            key: 'delete',
            label: '删除',
            danger: true,
            confirm: true,
            confirmTitle: '确定删除？',
            onClick: () => handleDelete(domainRecord),
          })
        }
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [handleEdit, handleToggleStatus, handleDelete]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SmartListTemplate
      title="域管理"
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
  )
}
