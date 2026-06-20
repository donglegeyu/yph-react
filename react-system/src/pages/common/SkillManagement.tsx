import { useEffect, useCallback, useState } from 'react'
import { Space, Image } from 'antd'
const { PreviewGroup } = Image
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData } from '@/hooks'
import { useColumnSettings } from '@/hooks/useColumnSettings'
import SkillDrawer, { type SkillFormData } from './SkillDrawer'
import { category1Options, buildCategoryPath } from './categoryOptions'

const fields: FieldDefinition[] = [
  { key: 'skillName', label: '服务技能', type: 'input', width: 160, fixed: 'left' },
  { key: 'category1', label: '一级品类', type: 'select', width: 140, options: [
    { label: '全部', value: '' },
    ...category1Options,
  ]},
  { key: 'category2', label: '二级品类', type: 'input', width: 140 },
  { key: 'category3', label: '三级品类', type: 'input', width: 160 },
  { key: 'certificateType', label: '证件类型', type: 'select', width: 160, options: [
    { label: '全部', value: '' },
    { label: '特种作业操作证', value: '特种作业操作证' },
    { label: '上岗证', value: '上岗证' },
  ]},
  { key: 'exampleImage', label: '示例图', type: 'input', width: 260 },
  { key: 'action', label: '操作', width: 104, fixed: 'right' },
]

const thumbUrl = (base: string) =>
  base.startsWith('/uploads') ? base : `${base}&w=48&h=48`
const largeUrl = (base: string) =>
  base.startsWith('/uploads') ? base : `${base}&w=1200&q=85`

const defaultColumnFields: ColumnField[] = [
  { key: 'skillName', label: '服务技能', visible: true, width: 160, fixed: 'left' },
  { key: 'category3', label: '三级品类', visible: true, width: 320 },
  { key: 'certificateType', label: '证件类型', visible: true, width: 160 },
  { key: 'exampleImage', label: '示例图', visible: true, width: 260 },
]

export default function SkillManagement() {
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData({
    apiEndpoint: API_ENDPOINTS.SKILLS,
    defaultPageSize: 100,
  })

  const columnSettings = useColumnSettings<ColumnField>({
    pageKey: 'skill-management',
    storageType: 'api',
    apiEndpoint: API_ENDPOINTS.USER_PREFERENCES,
  })

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [drawerInitialValues, setDrawerInitialValues] = useState<Partial<SkillFormData>>({})

  const handleCreate = useCallback(() => {
    setDrawerMode('create')
    setDrawerInitialValues({})
    setDrawerOpen(true)
  }, [])

  const handleEdit = useCallback((record: Record<string, unknown>) => {
    setDrawerMode('edit')
    setDrawerInitialValues({
      id: record.id as number,
      skillName: record.skillName as string,
      category1: record.category1 as string,
      category2: record.category2 as string,
      category3: record.category3 as string,
      certificateType: record.certificateType as string,
      exampleImage: record.exampleImage as string,
    })
    setDrawerOpen(true)
  }, [])

  useEffect(() => {
    columnSettings.initFields(defaultColumnFields)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    columnSettings.loadFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setColumnFields(columnSettings.columnFields)
  }, [columnSettings.columnFields])

  const handleDelete = useCallback(async (record: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SKILLS}/${record.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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

  const handleColumnSettingsChange = useCallback((newColumnFields: ColumnField[]) => {
    columnSettings.confirmChanges(newColumnFields)
    CompanyMessage.success('列设置已保存')
  }, [columnSettings])

  const handleColumnSettingsReset = useCallback(() => {
    columnSettings.resetToDefault()
    CompanyMessage.success('列设置已重置')
  }, [columnSettings])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={handleCreate}>
        新增
      </CompanyButton>
    </Space>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      if (column.key === 'category3') {
        const path = buildCategoryPath(
          record.category1 as string,
          record.category2 as string,
          record.category3 as string,
        )
        return path
          ? <span>{path}</span>
          : <span style={{ color: 'rgba(0,0,0,0.25)' }}>-</span>
      }
      if (column.key === 'exampleImage') {
        const raw = record.exampleImage as string
        if (!raw) {
          return <span style={{ color: 'rgba(0,0,0,0.45)' }}>-</span>
        }
        const images = raw.split(',').map((u) => u.trim()).filter(Boolean).slice(0, 5)
        if (images.length === 0) {
          return <span style={{ color: 'rgba(0,0,0,0.25)' }}>-</span>
        }
        return (
          <PreviewGroup
            preview={{
              maxScale: 3,
            }}
          >
            <Space size={4} wrap>
              {images.map((src) => (
                <Image
                  key={src}
                  src={thumbUrl(src)}
                  preview={{ src: largeUrl(src) }}
                  height={24}
                  style={{ height: 24, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                />
              ))}
            </Space>
          </PreviewGroup>
        )
      }
      if (column.key === 'action') {
        const buttons = [
          { key: 'edit', label: '编辑', onClick: () => handleEdit(record) },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            confirm: true,
            confirmTitle: '确定删除？',
            onClick: () => handleDelete(record),
          },
        ]
        return <ActionCell buttons={buttons} />
      }
      return null
    },
    [handleDelete, handleEdit]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
    <SmartListTemplate
      title="技能管理"
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
      toolbarActions={toolbarActions}
      bodyCell={bodyCell}
      columnFields={columnFields}
      defaultColumnFields={defaultColumnFields}
      onColumnSettingsChange={handleColumnSettingsChange}
      onColumnSettingsReset={handleColumnSettingsReset}
      onRefresh={refresh}
    />
    <SkillDrawer
      open={drawerOpen}
      mode={drawerMode}
      initialValues={drawerInitialValues}
      onClose={() => setDrawerOpen(false)}
      onSuccess={refresh}
    />
    </>
  )
}
