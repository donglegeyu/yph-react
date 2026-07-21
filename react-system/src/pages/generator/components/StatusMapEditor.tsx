import { Input, Button, Space, Select } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { StatusMapItem, StatusColor } from '../types'
import { STATUS_COLOR_OPTIONS } from '../types'

interface Props {
  value: StatusMapItem[]
  onChange: (value: StatusMapItem[]) => void
}

export default function StatusMapEditor({ value, onChange }: Props) {
  const handleAdd = () => {
    onChange([...value, { value: '', text: '', color: 'default' }])
  }

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const handleChange = (idx: number, patch: Partial<StatusMapItem>) => {
    const next = value.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value.length === 0 && (
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>暂无状态，点击下方新增</span>
      )}
      {value.map((item, idx) => (
        <Space key={idx} size={6} style={{ width: '100%' }} wrap>
          <Input
            placeholder="状态值 value"
            value={item.value}
            onChange={(e) => handleChange(idx, { value: e.target.value })}
            style={{ width: 100 }}
            size="small"
          />
          <Input
            placeholder="显示文字 text"
            value={item.text}
            onChange={(e) => handleChange(idx, { text: e.target.value })}
            style={{ width: 100 }}
            size="small"
          />
          <Select
            placeholder="颜色"
            value={item.color}
            onChange={(v: StatusColor) => handleChange(idx, { color: v })}
            style={{ width: 120 }}
            size="small"
            options={STATUS_COLOR_OPTIONS}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(idx)}
          />
        </Space>
      ))}
      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAdd} block>
        新增状态
      </Button>
    </div>
  )
}
