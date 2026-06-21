import { useEffect, useState } from 'react'
import { Input, Upload, ConfigProvider, Image, type UploadFile, type UploadProps } from 'antd'
import { CompanyDrawer, CompanyButton, CompanyMessage, CompanyForm } from '@donglegeyu/company-ui'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { API_ENDPOINTS } from '@/constants/api'
import './CertManageDrawer.scss'

type CertOption = { id?: number; label: string; value: string }

const defaultCertOptions: CertOption[] = [
  { label: '上岗证', value: '上岗证' },
  { label: '特种作业操作证', value: '特种作业操作证' },
]

interface CertManageDrawerProps {
  open: boolean
  onClose: () => void
  onOptionsChange?: (options: CertOption[]) => void
}

export default function CertManageDrawer({ open, onClose, onOptionsChange }: CertManageDrawerProps) {
  const [certOptions, setCertOptions] = useState<CertOption[]>(defaultCertOptions)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.CERTIFICATE_TYPES)
        const json = await res.json()
        const list = (json.data || []) as Array<{ id: number; name: string }>
        if (list.length > 0) {
          const merged = list.map((item) => ({ id: item.id, label: item.name, value: item.name }))
          setCertOptions(merged)
          onOptionsChange?.(merged)
        } else {
          setCertOptions(defaultCertOptions)
          onOptionsChange?.(defaultCertOptions)
        }
      } catch {
        setCertOptions(defaultCertOptions)
      }
    }
    load()
  }, [open])

  const handleAdd = async (name: string, imageUrls: string[]) => {
    const value = name.trim()
    if (!value) {
      CompanyMessage.error('请输入证件类型')
      return false
    }
    if (certOptions.some((o) => o.value === value)) {
      CompanyMessage.error('该证件类型已存在')
      return false
    }
    setSaving(true)
    try {
      const res = await fetch(API_ENDPOINTS.CERTIFICATE_TYPES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value, sortOrder: certOptions.length + 1 }),
      })
      const json = await res.json()
      if (json.code !== 200) {
        CompanyMessage.error(json.message || '新增失败')
        return false
      }
      if (imageUrls.length > 0) {
        await fetch(API_ENDPOINTS.CERTIFICATE_IMAGES, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certificateType: value,
            exampleImage: imageUrls.join(','),
            sortOrder: 0,
          }),
        })
      }
      const next = [...certOptions, { id: json.data?.id, label: value, value }]
      setCertOptions(next)
      onOptionsChange?.(next)
      setAdding(false)
      CompanyMessage.success('新增成功')
      return true
    } catch {
      CompanyMessage.error('新增失败，请稍后重试')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleCertUpdated = (oldKey: string, newOption: CertOption) => {
    const next = certOptions.map((o) => (o.value === oldKey ? { ...o, ...newOption } : o))
    setCertOptions(next)
    onOptionsChange?.(next)
  }

  const handleClose = () => {
    setAdding(false)
    onClose()
  }

  return (
    <CompanyDrawer
      title="证件类型管理"
      open={open}
      onClose={handleClose}
      width={420}
      destroyOnClose
    >
      <div className="cert-manage-drawer">
        {adding ? (
          <CertAddCard saving={saving} onAdd={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <CompanyButton
            className="cmd-add-trigger"
            block
            onClick={() => setAdding(true)}
          >
            <PlusOutlined /> 添加证件类型
          </CompanyButton>
        )}
        <div className="cmd-list">
          {certOptions.map((o) => (
            <CertItem
              key={o.value}
              option={o}
              saving={saving}
              setSaving={setSaving}
              onUpdated={handleCertUpdated}
            />
          ))}
        </div>
      </div>
    </CompanyDrawer>
  )
}

interface CertItemProps {
  option: CertOption
  saving: boolean
  setSaving: (s: boolean) => void
  onUpdated: (oldKey: string, newOption: CertOption) => void
}

function CertItem({ option, setSaving, onUpdated }: CertItemProps) {
  const [editing, setEditing] = useState(false)
  const [editingName, setEditingName] = useState(option.label)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imgLoading, setImgLoading] = useState(true)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const loadImages = async (certType: string) => {
    setImgLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.CERTIFICATE_IMAGES}/by-type?certificateType=${encodeURIComponent(certType)}`)
      const json = await res.json()
      const images = json.data?.exampleImage || ''
      const urls = images.split(',').map((u: string) => u.trim()).filter(Boolean)
      setExistingImages(urls)
    } catch {
      setExistingImages([])
    } finally {
      setImgLoading(false)
    }
  }

  useEffect(() => {
    if (!editing) {
      loadImages(option.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, option.value])

  const startEdit = () => {
    setEditingName(option.label)
    const uploadFiles = existingImages.map((url, index) => ({
      uid: `existing-${index}`,
      name: `示例图${index + 1}`,
      status: 'done' as const,
      url,
      response: { data: url },
    }))
    setFileList(uploadFiles)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setFileList([])
  }

  const confirmEdit = async () => {
    const newName = editingName.trim()
    if (!newName) {
      CompanyMessage.error('请输入证件类型')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(API_ENDPOINTS.CERTIFICATE_TYPES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: option.id, name: newName, sortOrder: 0 }),
      })
      const json = await res.json()
      if (json.code !== 200) {
        CompanyMessage.error(json.message || '修改失败')
        return
      }
      const urls = fileList
        .filter((f) => f.status === 'done')
        .map((f) => (f.url ? f.url : (f.response?.data as string)))
        .filter(Boolean)
      await fetch(API_ENDPOINTS.CERTIFICATE_IMAGES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateType: newName,
          exampleImage: urls.join(','),
          sortOrder: 0,
        }),
      })
      onUpdated(option.value, { ...option, label: newName, value: newName })
      setEditing(false)
      setFileList([])
      CompanyMessage.success('保存成功')
    } catch {
      CompanyMessage.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    setFileList(newList)
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: API_ENDPOINTS.FILE_UPLOAD,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    listType: 'picture-card',
    maxCount: 5,
    multiple: true,
    fileList,
    onChange: handleUploadChange,
    onPreview: (file) => {
      const url = file.url || (file.response?.data as string)
      if (url) window.open(url, '_blank')
    },
  }

  return (
    <div className="cmd-card" onMouseDown={(e) => e.stopPropagation()}>
      {!editing && (
        <div className="cmd-card-header">
          <div className="cmd-title-row">
            <span className="cmd-title">{option.label}</span>
            {!imgLoading && existingImages.length > 0 && (
              <span className="cmd-count">({existingImages.length}张)</span>
            )}
          </div>
          <span className="cmd-actions">
            <EditOutlined
              className="cmd-icon-edit"
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
              onClick={(e) => { e.stopPropagation(); startEdit() }}
            />
            <DeleteOutlined
              className="cmd-icon-delete"
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
            />
          </span>
        </div>
      )}
      <div className="cmd-body">
        {editing ? (
          <CompanyForm layout="vertical" className="cmd-edit-form" component="div">
            <CompanyForm.Item label="证件类型" className="cmd-form-item" required>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onPressEnter={confirmEdit}
                autoFocus
              />
            </CompanyForm.Item>
            <CompanyForm.Item label="示例图" className="cmd-form-item">
              <ConfigProvider
                theme={{
                  components: {
                    Upload: {
                      pictureCardSize: 64,
                    },
                  },
                }}
              >
                <Upload {...uploadProps}>
                  {fileList.length >= 5 ? null : (
                    <div className="cmd-upload-trigger">
                      <PlusOutlined className="cmd-upload-icon" />
                      <div className="cmd-upload-text">上传图片</div>
                    </div>
                  )}
                </Upload>
              </ConfigProvider>
            </CompanyForm.Item>
            <div className="cmd-edit-actions">
              <CompanyButton type="primary" size="small" onClick={confirmEdit}>保存</CompanyButton>
              <CompanyButton size="small" onClick={cancelEdit}>取消</CompanyButton>
            </div>
          </CompanyForm>
        ) : (
          <div className="cmd-view">
            {imgLoading ? (
              <div className="cmd-img-loading">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="cmd-skeleton" />
                ))}
              </div>
            ) : existingImages.length === 0 ? (
              <div className="cmd-empty">暂无示例图</div>
            ) : (
              <Image.PreviewGroup>
                <div className="cmd-img-grid">
                  {existingImages.map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      width={64}
                      height={64}
                      placeholder={<div className="cmd-skeleton" />}
                      fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHRoPSI2NCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjMyIiB5PSIzNiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Zu+54mHPHRleHQ+PC9zdmc+"
                      style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(5,5,5,0.06)' }}
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface CertAddCardProps {
  saving: boolean
  onAdd: (name: string, imageUrls: string[]) => Promise<boolean>
  onCancel: () => void
}

function CertAddCard({ saving, onAdd, onCancel }: CertAddCardProps) {
  const [name, setName] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleSave = async () => {
    const urls = fileList
      .filter((f) => f.status === 'done')
      .map((f) => (f.url ? f.url : (f.response?.data as string)))
      .filter(Boolean)
    const ok = await onAdd(name, urls)
    if (ok) {
      setName('')
      setFileList([])
    }
  }

  const handleCancel = () => {
    setName('')
    setFileList([])
    onCancel()
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: API_ENDPOINTS.FILE_UPLOAD,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    listType: 'picture-card',
    maxCount: 5,
    multiple: true,
    fileList,
    onChange: ({ fileList: newList }) => setFileList(newList),
    onPreview: (file) => {
      const url = file.url || (file.response?.data as string)
      if (url) window.open(url, '_blank')
    },
  }

  return (
    <div className="cmd-card" onMouseDown={(e) => e.stopPropagation()}>
      <div className="cmd-body">
        <CompanyForm layout="vertical" className="cmd-edit-form" component="div">
          <CompanyForm.Item label="证件类型" className="cmd-form-item" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={handleSave}
              placeholder="请输入证件类型名称"
              autoFocus
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="示例图" className="cmd-form-item">
            <ConfigProvider
              theme={{
                components: {
                  Upload: {
                    pictureCardSize: 64,
                  },
                },
              }}
            >
              <Upload {...uploadProps}>
                {fileList.length >= 5 ? null : (
                  <div className="cmd-upload-trigger">
                    <PlusOutlined className="cmd-upload-icon" />
                    <div className="cmd-upload-text">上传图片</div>
                  </div>
                )}
              </Upload>
            </ConfigProvider>
          </CompanyForm.Item>
          <div className="cmd-edit-actions">
            <CompanyButton type="primary" size="small" loading={saving} onClick={handleSave}>保存</CompanyButton>
            <CompanyButton size="small" onClick={handleCancel}>取消</CompanyButton>
          </div>
        </CompanyForm>
      </div>
    </div>
  )
}

export type { CertOption }
