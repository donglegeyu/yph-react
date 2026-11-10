import { useState, useEffect, useCallback } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  CompanyButton,
  CompanyMessage,
  CompanyModal,
  CompanySpace,
  CompanyTag,
  CompanyTypography,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import {
  listPageDefinitions,
  deletePageDefinition,
  publishPageDefinition,
  unpublishPageDefinition,
  saveMigrationFileLocal,
  type PublishResultData,
} from './services'
import MigrationScriptDrawer, { migrationStatusTag } from './components/MigrationScriptDrawer'
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
  migrationStatus: string
  generateMenu: boolean
  updatedBy: string
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
  { key: 'migrationStatus', label: '数据表', type: 'select', width: 100, hideInFilter: true },
  { key: 'apiPrefix', label: 'API 前缀', type: 'input', width: 200, hideInFilter: true },
  { key: 'updatedBy', label: '更新人', type: 'input', width: 120, hideInFilter: true },
  { key: 'updatedTime', label: '更新时间', type: 'daterange', width: 160, hideInFilter: true },
  { key: 'action', label: '操作', width: 224, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'pageName', label: '页面名称', visible: true, width: 180, fixed: 'left' },
  { key: 'templateType', label: '模板', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'migrationStatus', label: '数据表', visible: true, width: 100 },
  { key: 'pageKey', label: '页面 key', visible: true, width: 200 },
  { key: 'tableName', label: '业务表', visible: true, width: 160 },
  { key: 'apiPrefix', label: 'API 前缀', visible: true, width: 200 },
  { key: 'updatedBy', label: '更新人', visible: true, width: 120 },
  { key: 'updatedTime', label: '更新时间', visible: true, width: 160 },
]

export default function PageGenerator() {
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<ListRecord[]>([])
  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [publishResult, setPublishResult] = useState<PublishResultData | null>(null)

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
          migrationStatus: item.migrationStatus || 'not_generated',
          generateMenu: item.generateMenu,
          updatedBy: item.updatedBy || '-',
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
      if (record.templateType === 'detail') {
        navigate(`/dynamic/detail/${record.pageKey}/preview`)
      } else if (record.templateType === 'form') {
        navigate(`/dynamic/form/${record.pageKey}/preview`)
      } else {
        navigate(`/dynamic/${record.pageKey}`)
      }
    },
    [navigate],
  )

  const handlePublish = useCallback(
    (record: ListRecord) => {
      modal.confirm({
        title: '确认发布',
        content: `确定发布页面配置「${record.pageName}」吗？发布后将同步创建菜单入口。`,
        okText: '发布',
        cancelText: '取消',
        centered: true,
        onOk: async () => {
          const currentDomainId = Number(localStorage.getItem('currentDomainId') || '0') || null
          const res = await publishPageDefinition(record.id, currentDomainId)
          if (res.code === 200) {
            fetchData()
            // 发布时生成了建表脚本 → 弹窗展示，引导下载到项目
            if (res.data?.content) {
              setPublishResult(res.data)
            } else {
              CompanyMessage.success('已发布')
            }
          } else {
            CompanyMessage.error(res.message)
          }
        },
      })
    },
    [modal, fetchData],
  )

  /** 下载到项目目录（仅本地开发，通过 Vite dev 中间件写文件） */
  const handleSaveLocalInModal = useCallback(async () => {
    if (!publishResult?.fileName || !publishResult.content) return
    const res = await saveMigrationFileLocal(publishResult.fileName, publishResult.content)
    if (res.code === 200) {
      CompanyMessage.success(`${res.message}，重启后端后由 Flyway 自动建表`)
      setPublishResult(null)
      fetchData()
    } else {
      CompanyMessage.error(res.message)
    }
  }, [publishResult, fetchData])

  const handleUnpublish = useCallback(
    (record: ListRecord) => {
      modal.confirm({
        title: '确认取消发布',
        content: `确定取消发布页面配置「${record.pageName}」吗？将同步移除菜单入口。`,
        okText: '取消发布',
        cancelText: '取消',
        centered: true,
        onOk: async () => {
          const res = await unpublishPageDefinition(record.id)
          if (res.code === 200) {
            CompanyMessage.success('已取消发布')
            fetchData()
          } else {
            CompanyMessage.error(res.message)
          }
        },
      })
    },
    [modal, fetchData],
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const r = record as unknown as ListRecord

      if (column.key === 'status') {
        return r.status === 'published' ? (
          <CompanyTag color="success">已发布</CompanyTag>
        ) : (
          <CompanyTag color="default">草稿</CompanyTag>
        )
      }

      if (column.key === 'migrationStatus') {
        return migrationStatusTag(r.migrationStatus)
      }

      if (column.key === 'templateType') {
        const typeMap: Record<string, string> = {
          list_basic: '基础列表',
          list_tree: '树形列表',
          detail: '详情页',
          form: '表单页',
        }
        return <span>{typeMap[r.templateType] || r.templateType}</span>
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'preview', label: '预览', onClick: () => handlePreview(r) },
          { key: 'edit', label: '编辑', onClick: () => handleEdit(r) },
          r.status === 'published'
            ? { key: 'unpublish', label: '取消发布', onClick: () => handleUnpublish(r) }
            : { key: 'publish', label: '发布', onClick: () => handlePublish(r) },
          { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [handlePreview, handleEdit, handlePublish, handleUnpublish, handleDelete],
  )

  const toolbarActions = (
    <CompanySpace size={12}>
      <CompanyButton type="primary" onClick={handleCreate}>
        新增
      </CompanyButton>
      <CompanyButton onClick={() => setDrawerOpen(true)}>建表脚本</CompanyButton>
    </CompanySpace>
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
      <MigrationScriptDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onChanged={fetchData}
      />
      <CompanyModal
        open={!!publishResult}
        title={`建表脚本已生成：${publishResult?.fileName ?? ''}`}
        width={760}
        onCancel={() => setPublishResult(null)}
        footer={
          <CompanySpace>
            {import.meta.env.DEV && publishResult?.content && (
              <CompanyButton type="primary" onClick={handleSaveLocalInModal}>
                下载到项目
              </CompanyButton>
            )}
            <CompanyButton onClick={() => setPublishResult(null)}>关闭</CompanyButton>
          </CompanySpace>
        }
      >
        <CompanyTypography.Paragraph type="warning" style={{ marginBottom: 12 }}>
          数据表还没有建。系统只生成了脚本、不会直接改数据库（项目红线）。
          请把脚本放入 db/migration/ 目录，后端重启后由 Flyway 自动执行建表。
        </CompanyTypography.Paragraph>
        <pre
          style={{
            margin: 0,
            padding: 12,
            // 背景色用公司组件库变量（布局浅灰底），不用硬编码色值
            background: 'var(--color-bg-layout)',
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {publishResult?.content}
        </pre>
      </CompanyModal>
    </PageErrorBoundary>
  )
}
