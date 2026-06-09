import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Select, Modal, Input } from 'antd'
import type { SelectProps } from 'antd'
import { CompanyMessage } from '@donglegeyu/company-ui'
import SvgIcon from './SvgIcon'
import { ICON_API } from '@/constants/api'

interface IconData {
  value: string
  label: string
}

interface IconSelectProps {
  value?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  style?: React.CSSProperties
  onChange?: (value: string) => void
}

const iconMap: Record<string, string> = {
  commodity: 'commodity',
  shopping: 'shopping-cart-del',
  buy: 'buy',
  goods: 'tag',
  file: 'file-cabinet',
  search: 'doc-search',
  user: 'people-top-card',
  safe: 'message-security',
  tool: 'setting',
  app: 'all-application',
  'work-order': 'order',
  alert: 'comments',
  'check-circle': 'list',
  phone: 'comments',
  barcode: 'scan-setting',
  edit: 'edit',
  warning: 'comments',
  'info-circle': 'comments',
  wrench: 'setting',
  package: 'box',
  rule: 'config',
  link: 'database-config',
  'check-square': 'list',
  clipboard: 'table',
  layers: 'category-management',
  team: 'people-top-card',
  award: 'bookmark',
  'file-application': 'doc-search',
  'search-user': 'user-positioning',
  list: 'list',
  star: 'star',
  home: 'home',
  setting: 'setting',
}

function getIconName(icon: string): string {
  return iconMap[icon] || icon
}

export default function IconSelect({ value, placeholder = '请选择图标', size = 'middle', style, onChange }: IconSelectProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [presetIcons, setPresetIcons] = useState<IconData[]>([])
  const [customIcons, setCustomIcons] = useState<IconData[]>([])
  const [newIconLabel, setNewIconLabel] = useState('')
  const [newIconValue, setNewIconValue] = useState('')
  const [newIconSvgUrl, setNewIconSvgUrl] = useState('')
  const loadedScriptsRef = useRef<Set<string>>(new Set())
  const [addBtnHover, setAddBtnHover] = useState(false)

  useEffect(() => {
    loadIconConfig()
  }, [])

  async function loadIconConfig() {
    try {
      const res = await fetch(ICON_API.BASE)
      const text = await res.text()
      if (!text.trim()) return
      const json = JSON.parse(text)
      if (json.code === 200 && json.data) {
        setPresetIcons(json.data.preset || [])
        setCustomIcons(json.data.custom || [])
      }
    } catch (e) {
      console.error('[IconSelect] loadIconConfig 失败:', e)
    }
  }

  async function saveIconConfig(data: { preset: IconData[]; custom: IconData[] }) {
    try {
      await fetch(ICON_API.BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (e) {
      console.error('[IconSelect] saveIconConfig 失败:', e)
    }
  }

  const iconList = useMemo(() => [...presetIcons, ...customIcons], [presetIcons, customIcons])

  const filteredIconList = useMemo(() => {
    if (!searchText) return iconList
    const search = searchText.toLowerCase()
    return iconList.filter(
      (icon) => icon.label.toLowerCase().includes(search) || icon.value.toLowerCase().includes(search),
    )
  }, [iconList, searchText])

  const handleChange = useCallback(
    (val: string) => {
      setSearchText('')
      onChange?.(val)
    },
    [onChange],
  )

  async function loadSvgScript(url: string): Promise<boolean> {
    if (loadedScriptsRef.current.has(url)) return true
    try {
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${url}"]`)
        if (existing) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = url
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('加载失败'))
        document.body.appendChild(script)
      })
      loadedScriptsRef.current.add(url)
      return true
    } catch {
      return false
    }
  }

  async function handleAddIcon() {
    if (!newIconLabel.trim()) {
      CompanyMessage.error('请输入图标名称')
      return
    }
    if (!newIconValue.trim()) {
      CompanyMessage.error('请输入图标标识')
      return
    }
    if (!newIconSvgUrl.trim()) {
      CompanyMessage.error('请输入 SVG Symbol URL')
      return
    }

    const valueRegex = /^[a-zA-Z0-9-_]+$/
    if (!valueRegex.test(newIconValue)) {
      CompanyMessage.error('图标标识只能包含英文、数字、连字符和下划线')
      return
    }

    if (presetIcons.some((i) => i.value === newIconValue) || customIcons.some((i) => i.value === newIconValue)) {
      CompanyMessage.error('该图标标识已存在')
      return
    }

    const loaded = await loadSvgScript(newIconSvgUrl)
    if (!loaded) {
      CompanyMessage.error('SVG Symbol URL 加载失败，请检查链接是否正确')
      return
    }

    const newData = { value: newIconValue, label: newIconLabel }
    const updatedCustom = [...customIcons, newData]
    setCustomIcons(updatedCustom)
    await saveIconConfig({ preset: presetIcons, custom: updatedCustom })
    CompanyMessage.success('图标添加成功')
    closeAddModal()
  }

  function closeAddModal() {
    setShowAddModal(false)
    setNewIconLabel('')
    setNewIconValue('')
    setNewIconSvgUrl('')
  }

  const selectOptions = useMemo(
    () =>
      filteredIconList.map((icon) => ({
        value: icon.value,
        label: icon.label,
      })),
    [filteredIconList],
  )

  const labelRender: SelectProps['labelRender'] = (props) => {
    if (props.value) {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', height: '100%', lineHeight: 1 }}>
          <SvgIcon href={getIconName(props.value as string)} size={16} />
        </div>
      )
    }
    return props.label
  }

  const optionRender: SelectProps['optionRender'] = (option) => {
    const icon = option.data
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: '100%',
          minHeight: 32,
        }}
      >
        <SvgIcon href={getIconName(icon.value as string)} size={18} />
        <span style={{ fontSize: 13, lineHeight: 1 }}>{icon.label as string}</span>
      </div>
    )
  }

  const popupRender: SelectProps['popupRender'] = (menu) => (
    <>
      {menu}
      <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 12px',
          color: addBtnHover ? '#FF7043' : '#F95914',
          fontSize: 13,
          cursor: 'pointer',
          backgroundColor: addBtnHover ? '#FBE9E7' : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onClick={(e) => {
          e.stopPropagation()
          setShowAddModal(true)
        }}
        onMouseEnter={() => setAddBtnHover(true)}
        onMouseLeave={() => setAddBtnHover(false)}
      >
        <span>+ 添加自定义图标</span>
      </div>
    </>
  )

  return (
    <>
      <Select
        value={value || undefined}
        placeholder={placeholder}
        size={size}
        style={{ width: '100%', ...style }}
        allowClear
        showSearch
        filterOption={false}
        onSearch={setSearchText}
        onChange={handleChange}
        labelRender={labelRender}
        optionRender={optionRender}
        popupRender={popupRender}
        options={selectOptions}
      />
      <Modal
        open={showAddModal}
        title="添加自定义图标"
        width={480}
        onOk={handleAddIcon}
        onCancel={closeAddModal}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 14 }}>图标名称</div>
            <Input
              value={newIconLabel}
              onChange={(e) => setNewIconLabel(e.target.value)}
              placeholder="例如：我的图标"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 14 }}>图标标识</div>
            <Input
              value={newIconValue}
              onChange={(e) => setNewIconValue(e.target.value)}
              placeholder="例如：my-icon"
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              用于引用图标的唯一标识，只能是英文、数字、连字符
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 14 }}>SVG Symbol URL</div>
            <Input
              value={newIconSvgUrl}
              onChange={(e) => setNewIconSvgUrl(e.target.value)}
              placeholder="https://lf1-cdn-tos.bytegoofy.com/obj/iconpark/svg_xxx.js"
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              IconPark 的 SVG Symbol JS 文件地址，会自动从中提取图标
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 14 }}>预览</div>
            {newIconSvgUrl && newIconValue ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 4,
                }}
              >
                <SvgIcon href={getIconName(newIconValue)} size={48} />
                <span style={{ fontSize: 12, color: '#999' }}>如果预览为空，说明图标标识不存在</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  background: '#fafafa',
                  borderRadius: 4,
                  color: '#999',
                  fontSize: 13,
                }}
              >
                <span>请填写完整信息后预览</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
