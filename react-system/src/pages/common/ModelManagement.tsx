import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActionCell,
  BaseInfoForm,
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  type ColumnField,
  type FieldDefinition,
  type FormField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useDateFormat, useListData } from '@/hooks'

/** 新增/编辑表单值（兼容 BaseInfoForm 的 FormValues 契约） */
interface ModelConfigForm {
  id?: number
  configName?: string
  baseUrl?: string
  apiKey?: string
  modelName?: string
  systemPrompt?: string
  temperature?: number | null
  maxTokens?: number | null
  isDefault?: number
  status?: number
  remark?: string
  [key: string]: string | number | boolean | null | undefined | (string | number)[]
}

const emptyForm: ModelConfigForm = {
  configName: '',
  baseUrl: '',
  apiKey: '',
  modelName: '',
  systemPrompt: '',
  temperature: null,
  maxTokens: null,
  isDefault: 0,
  status: 1,
  remark: '',
}

const fields: FieldDefinition[] = [
  { key: 'configName', label: '配置名称', type: 'input', width: 180 },
  { key: 'status', label: '状态', type: 'select', width: 120, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]},
  // 以下字段仅作表格列，不进入筛选区：SmartListTemplate 通过 hideInFilter 控制，
  // type: 'item' 本身不会阻止筛选渲染（FilterForm 遇到未知 type 会 fallback 成 input）
  { key: 'baseUrl', label: '网关地址', type: 'item', width: 240, ellipsis: true, hideInFilter: true },
  { key: 'modelName', label: '模型名', type: 'item', width: 140, hideInFilter: true },
  { key: 'apiKey', label: 'API Key', type: 'item', width: 150, hideInFilter: true },
  { key: 'isDefault', label: '默认', type: 'item', width: 70, hideInFilter: true },
  { key: 'remark', label: '备注', type: 'item', width: 180, ellipsis: true, hideInFilter: true },
  { key: 'updateTime', label: '更新时间', type: 'item', width: 170, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 180, fixed: 'right', hideInFilter: true },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'configName', label: '配置名称', visible: true, width: 180, fixed: 'left' },
  { key: 'baseUrl', label: '网关地址', visible: true, width: 240 },
  { key: 'modelName', label: '模型名', visible: true, width: 140 },
  { key: 'apiKey', label: 'API Key', visible: true, width: 150 },
  { key: 'isDefault', label: '默认', visible: true, width: 70 },
  { key: 'status', label: '状态', visible: true, width: 80 },
  { key: 'remark', label: '备注', visible: true, width: 180 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 170 },
]

export default function ModelManagement() {
  const { formatDateTime } = useDateFormat()

  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData({
    apiEndpoint: API_ENDPOINTS.AI_MODEL_CONFIGS,
    defaultPageSize: 20,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ModelConfigForm>(emptyForm)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 表单字段：编辑态 API Key 留空表示不修改 */
  const formFields = useMemo<FormField[]>(
    () => [
      { name: 'configName', label: '配置名称', type: 'input', required: true },
      { name: 'baseUrl', label: '网关地址', type: 'input', required: true, placeholder: 'https://api.deepseek.com/v1' },
      { name: 'apiKey', label: 'API Key', type: 'input', required: editingId === null, placeholder: editingId === null ? '' : '留空则不修改' },
      { name: 'modelName', label: '模型名', type: 'input', required: true, placeholder: 'deepseek-chat' },
      { name: 'systemPrompt', label: '系统提示词', type: 'textarea', rows: 3, placeholder: '留空使用内置默认提示词' },
      { name: 'temperature', label: '温度', type: 'input-number', placeholder: '默认 0.7' },
      { name: 'maxTokens', label: '最大 tokens', type: 'input-number', placeholder: '留空不限制' },
      { name: 'isDefault', label: '设为默认', type: 'select', options: [
        { label: '默认', value: 1 },
        { label: '否', value: 0 },
      ]},
      { name: 'status', label: '状态', type: 'select', options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ]},
      { name: 'remark', label: '备注', type: 'input' },
    ],
    [editingId]
  )

  const handleOpenCreate = useCallback(() => {
    setEditingId(null)
    setFormData(emptyForm)
    setModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((record: Record<string, unknown>) => {
    setEditingId(record.id as number)
    setFormData({
      id: record.id as number,
      configName: record.configName as string,
      baseUrl: record.baseUrl as string,
      // API Key 为脱敏值，不回填（留空提交 = 不修改）
      apiKey: '',
      modelName: record.modelName as string,
      systemPrompt: (record.systemPrompt as string) ?? '',
      temperature: record.temperature == null ? null : Number(record.temperature),
      maxTokens: record.maxTokens == null ? null : Number(record.maxTokens),
      isDefault: record.isDefault as number,
      status: record.status as number,
      remark: (record.remark as string) ?? '',
    })
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!formData.configName || !formData.baseUrl || !formData.modelName) {
      CompanyMessage.error('配置名称、网关地址、模型名为必填')
      return
    }
    if (editingId === null && !formData.apiKey) {
      CompanyMessage.error('API Key 为必填')
      return
    }
    setSaving(true)
    try {
      const isCreate = editingId === null
      const url = isCreate ? API_ENDPOINTS.AI_MODEL_CONFIGS : `${API_ENDPOINTS.AI_MODEL_CONFIGS}/${editingId}`
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = (await res.json()) as { code: number; message?: string }
      if (json.code === 200) {
        CompanyMessage.success(isCreate ? '新增成功' : '保存成功')
        setModalOpen(false)
        refresh()
      } else {
        CompanyMessage.error(json.message || '保存失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }, [formData, editingId, refresh])

  const handleSetDefault = useCallback(async (record: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.AI_MODEL_CONFIGS}/${record.id}/default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = (await res.json()) as { code: number; message?: string }
      if (json.code === 200) {
        CompanyMessage.success('已设为默认配置')
        refresh()
      } else {
        CompanyMessage.error(json.message || '操作失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('操作失败，请稍后重试')
    }
  }, [refresh])

  const handleDelete = useCallback(async (record: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.AI_MODEL_CONFIGS}/${record.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = (await res.json()) as { code: number; message?: string }
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
    <CompanyButton type="primary" onClick={handleOpenCreate}>
      新增
    </CompanyButton>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      if (column.key === 'status') {
        const status = record.status as number
        return <CompanyTag color={status === 1 ? 'success' : 'default'}>{status === 1 ? '启用' : '禁用'}</CompanyTag>
      }
      if (column.key === 'isDefault') {
        return record.isDefault === 1 ? <CompanyTag color="processing">默认</CompanyTag> : <>—</>
      }
      if (column.key === 'updateTime') {
        return <>{formatDateTime(record.updateTime as string)}</>
      }
      if (column.key === 'action') {
        const buttons = [
          ...(record.isDefault === 1
            ? []
            : [{ key: 'default', label: '设为默认', onClick: () => handleSetDefault(record) }]),
          { key: 'edit', label: '编辑', onClick: () => handleOpenEdit(record) },
          {
            key: 'delete',
            label: '删除',
            confirm: true,
            confirmTitle: '确定删除该模型配置？',
            onClick: () => handleDelete(record),
          },
        ]
        return <ActionCell buttons={buttons} />
      }
      return null
    },
    [formatDateTime, handleSetDefault, handleOpenEdit, handleDelete]
  )

  return (
    <>
      <SmartListTemplate
        title="模型管理"
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
        columnFields={defaultColumnFields}
        defaultColumnFields={defaultColumnFields}
        onRefresh={refresh}
      />
      <CompanyDrawer
        title={editingId === null ? '新增模型配置' : '编辑模型配置'}
        open={modalOpen}
        width={440}
        onClose={() => setModalOpen(false)}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <CompanyButton onClick={() => setModalOpen(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={saving} onClick={handleSave}>
              保存
            </CompanyButton>
          </div>
        }
      >
        <BaseInfoForm layout="vertical" value={formData} fields={formFields} onChange={(value) => setFormData(value as ModelConfigForm)} />
      </CompanyDrawer>
    </>
  )
}
