import { useState, useMemo } from 'react'
import { CompanyInput, CompanyButton } from '@donglegeyu/company-ui'
import SvgIcon from './SvgIcon'

const ICON_LIST = [
  'id-card-v-klbe0a04', 'tag', 'shopping-cart-add', 'more-two', 'theme',
  'logout', 'check-one', 'down-c', 'home', 'favorites', 'settings',
  'user', 'file', 'folder', 'calendar', 'search', 'bell', 'star',
  'heart', 'share', 'download', 'upload', 'edit', 'delete', 'copy',
  'link', 'lock', 'unlock', 'eye', 'eye-close', 'menu', 'grid',
  'list', 'chart', 'pie-chart', 'bar-chart', 'line-chart', 'area-chart',
  'table', 'form', 'image', 'video', 'music', 'mail', 'phone',
  'message', 'comment', 'like', 'dislike', 'flag', 'bookmark',
  'bookmark-fill', 'tag-fill', 'star-fill', 'heart-fill', 'bell-fill',
  'mail-fill', 'phone-fill', 'message-fill', 'comment-fill',
]

interface IconSelectProps {
  value?: string
  onChange?: (value: string) => void
}

export default function IconSelect({ value, onChange }: IconSelectProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return ICON_LIST
    return ICON_LIST.filter((i) => i.includes(search.toLowerCase()))
  }, [search])

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 11px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          cursor: 'pointer',
          minHeight: 32,
        }}
        onClick={() => setOpen(!open)}
      >
        {value ? <SvgIcon href={value} size={20} /> : <span style={{ color: '#bfbfbf' }}>请选择图标</span>}
      </div>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 1000,
              width: 320,
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              marginTop: 4,
              padding: 12,
            }}
          >
            <CompanyInput
              placeholder="搜索图标"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, maxHeight: 240, overflow: 'auto' }}>
              {filtered.map((icon) => (
                <div
                  key={icon}
                  onClick={() => {
                    onChange?.(icon)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: value === icon ? 'var(--ant-color-primary, #f95914)' : 'transparent',
                  }}
                  title={icon}
                >
                  <SvgIcon href={icon} size={20} style={{ color: value === icon ? '#fff' : undefined }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
