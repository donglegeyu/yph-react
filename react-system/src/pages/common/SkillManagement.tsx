import { useEffect, useCallback, useState, useMemo, type ReactNode } from 'react'
import { Space, Image, App } from 'antd'
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
import CertManageDrawer, { type CertOption } from './CertManageDrawer'
import { category1Options, buildCategoryPath } from './categoryOptions'

const baseFields: FieldDefinition[] = [
  { key: 'skillName', label: '服务技能', type: 'input', width: 160, fixed: 'left' },
  { key: 'category1', label: '一级品类', type: 'select', width: 140, options: [
    { label: '全部', value: '' },
    ...category1Options,
  ]},
  { key: 'category2', label: '二级品类', type: 'input', width: 140 },
  { key: 'category3', label: '三级品类', type: 'input', width: 160 },
  { key: 'certificateType', label: '证件类型', type: 'select', width: 160, options: [
    { label: '全部', value: '' },
  ]},
  { key: 'exampleImage', label: '示例图', type: 'input', width: 260, hideInFilter: true },
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
  const { modal } = App.useApp()
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
  const [certImageMap, setCertImageMap] = useState<Record<string, string>>({})
  const [certOptions, setCertOptions] = useState<CertOption[]>([
    { label: '特种作业操作证', value: '特种作业操作证' },
    { label: '上岗证', value: '上岗证' },
  ])
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false)

  const openManageDrawer = useCallback(() => {
    setManageDrawerOpen(true)
  }, [])

  const fetchCertImages = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CERTIFICATE_IMAGES)
      const json = await res.json()
      const list = (json.data || []) as Array<{ certificateType: string; exampleImage: string }>
      const map: Record<string, string> = {}
      list.forEach((item) => {
        if (item.certificateType) {
          map[item.certificateType] = item.exampleImage || ''
        }
      })
      setCertImageMap(map)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchCertImages()
  }, [fetchCertImages, dataSource])

  const loadCertOptions = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CERTIFICATE_TYPES)
      const json = await res.json()
      const list = (json.data || []) as Array<{ id: number; name: string }>
      if (list.length > 0) {
        setCertOptions(list.map((item) => ({ id: item.id, label: item.name, value: item.name })))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadCertOptions()
  }, [loadCertOptions])

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

  const titleRightActions: ReactNode = (
    <Space size={4}>
      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>证件类型及示例图管理</span>
      <CompanyButton type="link" size="small" style={{ padding: 0, height: 'auto', fontSize: 13 }} onClick={openManageDrawer}>
        立即前往
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
        const certType = record.certificateType as string
        const raw = certType ? (certImageMap[certType] || '') : ''
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
                  width={32}
                  height={32}
                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid rgba(5,5,5,0.06)' }}
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
            onClick: () => {
              modal.confirm({
                title: '确认要删除这项内容吗？',
                content: '删除后数据将永久消失，无法恢复。是否确定执行删除操作？',
                okText: '确定',
                cancelText: '取消',
                centered: true,
                width: 360,
                onOk: () => handleDelete(record),
              })
            },
          },
        ]
        return <ActionCell buttons={buttons} />
      }
      return null
    },
    [handleDelete, handleEdit, certImageMap]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fields = useMemo(() => baseFields.map((f) => {
    if (f.key === 'certificateType') {
      return {
        ...f,
        options: [{ label: '全部', value: '' }, ...certOptions.map((o) => ({ label: o.label, value: o.value }))],
      }
    }
    return f
  }), [certOptions])

  return (
    <>
    <SmartListTemplate
      title="技能管理"
      titleRightActions={titleRightActions}
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
      certOptions={certOptions}
      onOpenManageDrawer={openManageDrawer}
      manageDrawerOpen={manageDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      onSuccess={refresh}
    />
    <CertManageDrawer
      open={manageDrawerOpen}
      onClose={() => setManageDrawerOpen(false)}
      onOptionsChange={(next) => { setCertOptions(next); fetchCertImages() }}
    />
    </>
  )
}
