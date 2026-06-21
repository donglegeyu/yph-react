import { useEffect, useState } from 'react'
import { Input, Upload, ConfigProvider, Image, type UploadFile, type UploadProps } from 'antd'
import { CompanyDrawer, CompanyButton, CompanyMessage } from '@donglegeyu/company-ui'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { API_ENDPOINTS } from '@/constants/api'

type CertOption = { id?: number; label: string; value: string }

const defaultCertOptions: CertOption[] = [
  { label: '特种作业操作证', value: '特种作业操作证' },
  { label: '上岗证', value: '上岗证' },
]

interface CertManageDrawerProps {
  open: boolean
  onClose: () => void
  onOptionsChange?: (options: CertOption[]) => void
}

export default function CertManageDrawer({ open, onClose, onOptionsChange }: CertManageDrawerProps) {
  const [certOptions, setCertOptions] = useState<CertOption[]>(defaultCertOptions)
  const [addingValue, setAddingValue] = useState('')
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

  const handleDelete = async (key: string) => {
    const target = certOptions.find((o) => o.value === key)
    if (!target) return
    setSaving(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.CERTIFICATE_TYPES}/${target.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.code !== 200) {
        CompanyMessage.error(json.message || '删除失败')
        return
      }
      const next = certOptions.filter((o) => o.value !== key)
      setCertOptions(next)
      onOptionsChange?.(next)
      CompanyMessage.success('删除成功')
    } catch {
      CompanyMessage.error('删除失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const confirmAdd = async () => {
    const value = addingValue.trim()
    if (!value) {
      CompanyMessage.error('请输入证件类型')
      return
    }
    if (certOptions.some((o) => o.value === value)) {
      CompanyMessage.error('该证件类型已存在')
      return
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
        return
      }
      const next = [...certOptions, { id: json.data?.id, label: value, value }]
      setCertOptions(next)
      onOptionsChange?.(next)
      setAddingValue('')
      CompanyMessage.success('新增成功')
    } catch {
      CompanyMessage.error('新增失败，请稍后重试')
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
    setAddingValue('')
    onClose()
  }

  return (
    <CompanyDrawer
      title="管理证件类型"
      open={open}
      onClose={handleClose}
      width={420}
      destroyOnClose
    >
      <div style={{ paddingBlock: 4 }}>
        <div style={{ display: 'flex', gap: 8, paddingBlock: 8 }}>
          <Input
            placeholder="新增证件类型"
            value={addingValue}
            onChange={(e) => setAddingValue(e.target.value)}
            onPressEnter={confirmAdd}
            style={{ flex: 1 }}
          />
          <CompanyButton type="primary" loading={saving} onClick={confirmAdd}>
            <PlusOutlined /> 新增
          </CompanyButton>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {certOptions.map((o) => (
            <CertItem
              key={o.value}
              option={o}
              saving={saving}
              setSaving={setSaving}
              onDelete={handleDelete}
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
  onDelete: (key: string) => void
  onUpdated: (oldKey: string, newOption: CertOption) => void
}

function CertItem({ option, setSaving, onDelete, onUpdated }: CertItemProps) {
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
    <div
      style={{
        border: '1px solid rgba(5,5,5,0.1)',
        borderRadius: 6,
        padding: '12px 16px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <Input
              size="small"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onPressEnter={confirmEdit}
              style={{ flex: 1 }}
              autoFocus
            />
            <CheckOutlined
              style={{ color: 'var(--color-success, #00B42A)', cursor: 'pointer' }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={confirmEdit}
            />
            <CloseOutlined
              style={{ color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={cancelEdit}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{option.label}</span>
              {!imgLoading && existingImages.length > 0 && (
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                  ({existingImages.length}张)
                </span>
              )}
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <EditOutlined
                style={{ color: 'var(--color-primary, #F95914)', cursor: 'pointer', fontSize: 13 }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                onClick={(e) => { e.stopPropagation(); startEdit() }}
              />
              <DeleteOutlined
                style={{ color: 'var(--color-error, #F53F3F)', cursor: 'pointer', fontSize: 13 }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                onClick={(e) => { e.stopPropagation(); onDelete(option.value) }}
              />
            </span>
          </>
        )}
      </div>
      <div>
        {editing ? (
          <>
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
                  <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                    <PlusOutlined style={{ fontSize: 16 }} />
                    <div style={{ marginTop: 2, fontSize: 12 }}>上传图片</div>
                  </div>
                )}
              </Upload>
            </ConfigProvider>
          </>
        ) : (
          <div>
            {imgLoading ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{ width: 64, height: 64, borderRadius: 4, background: 'rgba(5,5,5,0.04)' }}
                  />
                ))}
              </div>
            ) : existingImages.length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>暂无示例图</div>
            ) : (
              <Image.PreviewGroup>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {existingImages.map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      width={64}
                      height={64}
                      placeholder={
                        <div style={{ width: 64, height: 64, background: 'rgba(5,5,5,0.04)' }} />
                      }
                      fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMzIiIHk9IjM2IiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lm77niYc8L3RleHQ+PC9zdmc+"
                      style={{ objectFit: 'cover', borderRadius: 4 }}
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

export type { CertOption }
