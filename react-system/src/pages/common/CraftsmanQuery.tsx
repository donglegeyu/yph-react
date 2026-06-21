import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Space, Upload, ConfigProvider, App } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import {
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  companyTheme,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { SERVICE_PROVIDER_LIST } from '@/constants/serviceProviders'
import { useListData, useStatusMap, useMenuTitle } from '@/hooks'
import { isCertificateExpired } from '@/utils/craftsman'
import './CraftsmanQuery.scss'

interface CraftsmanRecord {
  [key: string]: unknown
  id: number
  craftsmanCode: string
  name: string
  phone: string
  userAccount: string
  serviceProviderName: string
  craftsmanCategory: string
  craftsmanType: number
  region: string
  serviceSkillNames: string
  serviceSkillImages: string
  certificates?: { skillName: string; certificateType: string; certificateImage: string }[]
  registerTime: string
  status: number
  createTime: string
}

const fields: FieldDefinition[] = [
  { key: 'craftsmanCode', label: '工匠编码', type: 'input', width: 150 },
  { key: 'name', label: '姓名', type: 'input', width: 120 },
  { key: 'phone', label: '手机号', type: 'input', width: 130 },
  { key: 'serviceProviderName', label: '所属服务商', type: 'select', width: 180, options: [
    { label: '全部', value: '' },
    ...SERVICE_PROVIDER_LIST.map((o) => ({ label: o.name, value: o.name })),
  ]},
  { key: 'craftsmanCategory', label: '工匠类别', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '外部员工', value: 'outsource' },
    { label: '内部员工', value: 'internal' },
  ]},
  { key: 'craftsmanType', label: '工匠类型', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '正式工匠', value: 1 },
    { label: '意向工匠', value: 2 },
  ]},
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ]},
  { key: 'userAccount', label: '用户账号', type: 'input', width: 150 },
  { key: 'serviceSkillNames', label: '服务技能', type: 'input', width: 150 },
  { key: 'registerTime', label: '注册时间', type: 'input', width: 160 },
  { key: 'action', label: '操作', width: 180, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'craftsmanCode', label: '工匠编码', visible: true, width: 150 },
  { key: 'name', label: '姓名', visible: true, width: 120 },
  { key: 'phone', label: '手机号', visible: true, width: 130 },
  { key: 'serviceProviderName', label: '所属服务商', visible: true, width: 180 },
  { key: 'craftsmanCategory', label: '工匠类别', visible: true, width: 100 },
  { key: 'craftsmanType', label: '工匠类型', visible: true, width: 100 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'userAccount', label: '用户账号', visible: true, width: 150 },
  { key: 'serviceSkillNames', label: '服务技能', visible: true, width: 150 },
  { key: 'registerTime', label: '注册时间', visible: true, width: 160 },
]

const categoryMap: Record<string, string> = {
  outsource: '外部员工',
  internal: '内部员工',
}

const craftsmanTypeMap: Record<number, string> = {
  1: '正式工匠',
  2: '意向工匠',
}

export default function CraftsmanQuery() {
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<CraftsmanRecord>({
    apiEndpoint: API_ENDPOINTS.CRAFTSMEN,
    defaultPageSize: 20,
  })

  const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

  const menuTitle = useMenuTitle()

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const initializedRef = useRef(false)

  const handleColumnSettingsChange = useCallback((fields: ColumnField[]) => {
    const savedKeys = new Set(fields.map((f) => f.key))
    const missingFields = defaultColumnFields.filter((f) => !savedKeys.has(f.key))
    setColumnFields([...fields, ...missingFields])
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
  }, [])

  const [importOpen, setImportOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleImportClick = useCallback(() => {
    setFileList([])
    setImportOpen(true)
  }, [])

  const handleDownloadTemplate = useCallback(() => {
    CompanyMessage.info('下载模板功能开发中')
  }, [])

  const handleBeforeUpload = useCallback((file: File) => {
    const isValidType = file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')
    if (!isValidType) {
      CompanyMessage.error('仅支持 xls、xlsx 格式的文件')
      return Upload.LIST_IGNORE
    }
    const isLt5M = file.size / 1024 / 1024 <= 5
    if (!isLt5M) {
      CompanyMessage.error('文件大小不能超过 5M')
      return Upload.LIST_IGNORE
    }
    return false
  }, [])

  const handleUploadChange = useCallback((info: any) => {
    setFileList(info.fileList.slice(-1))
  }, [])

  const handleUploadSubmit = useCallback(async () => {
    if (fileList.length === 0) {
      CompanyMessage.warning('请先选择文件')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', fileList[0].originFileObj as Blob)
      const res = await fetch(`${API_ENDPOINTS.CRAFTSMEN}/import`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('导入成功')
        setImportOpen(false)
        setFileList([])
        refresh()
      } else {
        CompanyMessage.error(json.message || '导入失败，请检查文件格式')
      }
    } catch {
      CompanyMessage.error('导入失败，请稍后重试')
    } finally {
      setUploading(false)
    }
  }, [fileList, refresh])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => navigate('/craftsman-search/create', { state: { from: '/craftsman-search' } })}>
        新增工匠
      </CompanyButton>
      <CompanyButton onClick={handleImportClick}>导入</CompanyButton>
    </Space>
  )

  const handleToggleStatus = useCallback(async (record: CraftsmanRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    try {
      const res = await fetch(`${API_ENDPOINTS.CRAFTSMEN}/${record.id}/status`, {
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

  const showDetail = useCallback((record: CraftsmanRecord) => {
    navigate(`/craftsman-search/${record.id}`, { state: { from: '/craftsman-search' } })
  }, [navigate])

  useEffect(() => {
    registerStatusMap({
      1: { text: '启用', color: 'status-approved' },
      0: { text: '停用', color: 'status-rejected' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const currentKeys = new Set(columnFields.map((f) => f.key))
    const missingFields = defaultColumnFields.filter((f) => !currentKeys.has(f.key))
    if (missingFields.length > 0) {
      setColumnFields((prev) => [...prev, ...missingFields])
    }
  }, [])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const craftsmanRecord = record as unknown as CraftsmanRecord

      if (column.key === 'serviceProviderName') {
        return craftsmanRecord.craftsmanCategory === 'external'
          ? <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
          : <span>{craftsmanRecord.serviceProviderName}</span>
      }

      if (column.key === 'craftsmanCategory') {
        return <span>{categoryMap[craftsmanRecord.craftsmanCategory] || craftsmanRecord.craftsmanCategory}</span>
      }

      if (column.key === 'serviceSkillNames') {
        const raw = craftsmanRecord.serviceSkillNames as string
        if (!raw) return <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
        const certs = craftsmanRecord.certificates || []
        const validNames = raw.split(',').filter((_, idx) => {
          const cert = certs[idx]
          if (!cert) return true
          return !isCertificateExpired(cert.certificateType, idx)
        })
        return <span>{validNames.length > 0 ? validNames.join('、') : '--'}</span>
      }

      if (column.key === 'craftsmanType') {
        return <span>{craftsmanTypeMap[craftsmanRecord.craftsmanType] || craftsmanRecord.craftsmanType}</span>
      }

      if (column.key === 'status') {
        return (
          <Tag className={getStatusColor(String(craftsmanRecord.status))}>
            {getStatusText(String(craftsmanRecord.status))}
          </Tag>
        )
      }

      if (column.key === 'action') {
        const toggleLabel = craftsmanRecord.status === 1 ? '停用' : '启用'
        const buttons = [
          {
            key: 'detail',
            label: '详情',
            onClick: () => showDetail(craftsmanRecord),
          },
          {
            key: 'edit',
            label: '编辑',
            onClick: () => navigate(`/craftsman-search/${craftsmanRecord.id}/edit`, { state: { from: '/craftsman-search' } }),
          },
          {
            key: 'toggle',
            label: toggleLabel,
            onClick: () => {
              const isDisable = craftsmanRecord.status === 1
              modal.confirm({
                title: isDisable ? '确认要禁用这项内容吗？' : '确认要启用这项内容吗？',
                content: isDisable
                  ? '禁用后相关业务流程可能受影响，请核实无误后再操作。是否确定禁用？'
                  : '启用后该条目将恢复正常使用权限，相关功能可正常操作。是否确定执行？',
                okText: '确定',
                cancelText: '取消',
                centered: true,
                width: 360,
                onOk: () => handleToggleStatus(craftsmanRecord),
              })
            },
          },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [getStatusText, getStatusColor, handleToggleStatus, showDetail]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '工匠查询'}
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
        viewEndpoint={API_ENDPOINTS.CRAFTSMAN_VIEWS}
        columnFields={columnFields}
        defaultColumnFields={defaultColumnFields}
        onColumnSettingsChange={handleColumnSettingsChange}
        onColumnSettingsReset={handleColumnSettingsReset}
        onRefresh={refresh}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />
      <CompanyDrawer
        title="导入"
        open={importOpen}
        onClose={() => setImportOpen(false)}
        width={380}
        footer={null}
      >
        <div className="craftsman-import-body">
          <div className="craftsman-import-header">
            <span className="craftsman-import-hint">
              支持 xls、xlsx 格式，文件大小不超过 5M
            </span>
            <CompanyButton type="link" className="craftsman-import-template-btn" onClick={handleDownloadTemplate}>
              下载模板
            </CompanyButton>
          </div>
          <ConfigProvider theme={companyTheme}>
            <Upload.Dragger
              accept=".xls,.xlsx"
              maxCount={1}
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              onChange={handleUploadChange}
              onRemove={() => { setFileList([]); return true }}
            >
              <p className="ant-upload-drag-icon craftsman-upload-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text craftsman-upload-text">
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint craftsman-upload-subhint">
                支持单次上传，上传内容后需清空再继续上传
              </p>
            </Upload.Dragger>
          </ConfigProvider>
          <div className="craftsman-import-footer">
            <CompanyButton type="primary" loading={uploading} onClick={handleUploadSubmit}>
              确定
            </CompanyButton>
            <CompanyButton onClick={() => setFileList([])}>重置</CompanyButton>
          </div>
        </div>
      </CompanyDrawer>
    </>
  )
}
