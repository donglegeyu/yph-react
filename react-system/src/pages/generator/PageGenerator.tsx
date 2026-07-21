import { useState, useEffect, useCallback } from 'react'
import { Tag, Space, App } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { listPageDefinitions, deletePageDefinition } from './services'
import PageErrorBoundary from '@/components/PageErrorBoundary'

interface ListRecord {
  [key: string]: unknown
  id: string
  pageKey: string
  pageName: string
  tableName: string
  apiPrefix: string
  status: string
  templateType: string
  generateMenu: boolean
  updatedTime: string
}

const fields: FieldDefinition[] = [
  { key: 'pageName', label: '页面名称', type: 'input', width: 180, fixed: 'left' },
  {
    key: 'templateType',
    label: '模板',
    type: 'select',
    width: 120,
    options: [
      { label: '全部', value: '' },
      { label: '基础列表', value: 'list_basic' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    width: 100,
    options: [
      { label: '全部', value: '' },
      { label: '已发布', value: 'published' },
      { label: '草稿', value: 'draft' },
    ],
  },
  { key: 'pageKey', label: '页面 key', type: 'input', width: 200 },
  { key: 'tableName', label: '业务表', type: 'input', width: 160 },
  { key: 'apiPrefix', label: 'API 前缀', type: 'input', width: 200, hideInFilter: true },
  { key: 'updatedTime', label: '更新时间', type: 'daterange', width: 160, hideInFilter: true },
  { key: 'action', label: '操作', width: 168, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'pageName', label: '页面名称', visible: true, width: 180, fixed: 'left' },
  { key: 'templateType', label: '模板', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'pageKey', label: '页面 key', visible: true, width: 200 },
  { key: 'tableName', label: '业务表', visible: true, width: 160 },
  { key: 'apiPrefix', label: 'API 前缀', visible: true, width: 200 },
  { key: 'updatedTime', label: '更新时间', visible: true, width: 160 },
]

export default function PageGenerator() {
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<ListRecord[]>([])
  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listPageDefinitions()
      if (res.code === 200) {
        const records: ListRecord[] = (res.data || []).map((item) => ({
          id: item.id,
          pageKey: item.pageKey,
          pageName: item.pageName,
          tableName: item.tableName,
          apiPrefix: item.apiPrefix,
          status: item.status,
          templateType: item.templateType,
          generateMenu: item.generateMenu,
          updatedTime: item.updatedTime.slice(0, 19).replace('T', ' '),
        }))
        setDataSource(records)
      }
    } catch (e) {
      CompanyMessage.error('加载失败：' + String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = useCallback(() => {
    navigate('/page-generator/create')
  }, [navigate])

  const handleEdit = useCallback(
    (record: ListRecord) => {
      navigate(`/page-generator/edit/${record.id}`)
    },
    [navigate],
  )

  const handleDelete = useCallback(
    (record: ListRecord) => {
      modal.confirm({
        title: '确认删除',
        content: `确定删除页面配置「${record.pageName}」吗？此操作不可恢复。`,
        okText: '删除',
        cancelText: '取消',
        centered: true,
        onOk: async () => {
          const res = await deletePageDefinition(record.id)
          if (res.code === 200) {
            CompanyMessage.success('已删除')
            fetchData()
          } else {
            CompanyMessage.error(res.message)
          }
        },
      })
    },
    [modal, fetchData],
  )

  const handlePreview = useCallback(
    (record: ListRecord) => {
      navigate(`/dynamic/${record.pageKey}`)
    },
    [navigate],
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const r = record as unknown as ListRecord

      if (column.key === 'status') {
        return r.status === 'published' ? (
          <Tag color="success">已发布</Tag>
        ) : (
          <Tag color="default">草稿</Tag>
        )
      }

      if (column.key === 'templateType') {
        return <span>{r.templateType === 'list_basic' ? '基础列表' : r.templateType}</span>
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'preview', label: '预览', onClick: () => handlePreview(r) },
          { key: 'edit', label: '编辑', onClick: () => handleEdit(r) },
          { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [handlePreview, handleEdit, handleDelete],
  )

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={handleCreate}>
        新增
      </CompanyButton>
    </Space>
  )

  return (
    <PageErrorBoundary>
      <SmartListTemplate
        title="页面生成器"
        fields={fields}
        dataSource={dataSource as unknown as Record<string, unknown>[]}
        loading={loading}
        pagination={{ current: 1, pageSize: 50, total: dataSource.length }}
        filterParams={filterParams}
        onFilterParamsChange={setFilterParams}
        onSearch={(data) => {
          setFilterParams(data)
          fetchData()
        }}
        onReset={() => {
          setFilterParams({})
          fetchData()
        }}
        onRefresh={fetchData}
        columnFields={columnFields}
        defaultColumnFields={defaultColumnFields}
        onColumnSettingsChange={setColumnFields}
        onColumnSettingsReset={() => setColumnFields(defaultColumnFields)}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />
    </PageErrorBoundary>
  )
}
