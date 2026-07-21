import { Input, InputNumber, Select, Switch, Space } from 'antd'
import { SectionTitle } from '@donglegeyu/company-ui'
import type { FieldConfig, FieldType, FixedSide, FieldDataSource } from '../types'
import { FIELD_TYPE_OPTIONS, DB_TYPE_OPTIONS } from '../types'
import { suggestDbColumn } from '../services'
import StatusMapEditor from './StatusMapEditor'
import DataSourceEditor from './DataSourceEditor'

// 可作为数据源载体的字段类型
const DS_FIELD_TYPES: FieldType[] = ['select', 'select-multi', 'radio', 'cascader']

interface Props {
  value: FieldConfig
  onChange: (value: FieldConfig) => void
}

export default function FieldEditor({ value, onChange }: Props) {
  const patch = (p: Partial<FieldConfig>) => onChange({ ...value, ...p })

  const handleTypeChange = (t: FieldType) => {
    if (DS_FIELD_TYPES.includes(t)) {
      // 切换到可选类型时，如果没有 dataSource，自动初始化为 static（并复用旧 options）
      if (!value.dataSource) {
        patch({
          fieldType: t,
          dataSource: { kind: 'static', options: value.options ?? [] },
        })
        return
      }
    } else {
      // 切换到非可选类型时，清空 dataSource
      if (value.dataSource) {
        patch({ fieldType: t, dataSource: null })
        return
      }
    }
    patch({ fieldType: t })
  }

  const handleDataSourceChange = (ds: FieldDataSource | null) => {
    patch({
      dataSource: ds,
      // 兼容旧逻辑：static 时同步到 options
      options: ds?.kind === 'static' ? ds.options : [],
    })
  }

  const showDataSource = DS_FIELD_TYPES.includes(value.fieldType) && !value.isAction

  return (
    <div className="pgw-field-editor">
      <div className="pgw-field-grid">
        <div className="pgw-field-cell">
          <div style={labelStyle}>字段 key (camelCase)</div>
          <Input
            value={value.fieldKey}
            onChange={(e) => {
              const fieldKey = e.target.value
              patch({ fieldKey, dbColumn: suggestDbColumn(fieldKey) })
            }}
            placeholder="如 taskName"
            size="small"
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>中文列名</div>
          <Input
            value={value.fieldLabel}
            onChange={(e) => patch({ fieldLabel: e.target.value })}
            placeholder="如 任务名称"
            size="small"
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>字段类型</div>
          <Select
            value={value.fieldType}
            onChange={handleTypeChange}
            style={{ width: '100%' }}
            size="small"
            options={FIELD_TYPE_OPTIONS}
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>列宽</div>
          <InputNumber
            value={value.width}
            onChange={(v) => patch({ width: v ?? 120 })}
            style={{ width: '100%' }}
            size="small"
            min={60}
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>固定列</div>
          <Select
            value={value.fixed ?? ''}
            onChange={(v: string) => patch({ fixed: (v || null) as FixedSide })}
            style={{ width: '100%' }}
            size="small"
            allowClear
            options={[
              { label: '不固定', value: '' },
              { label: '固定左', value: 'left' },
              { label: '固定右', value: 'right' },
            ]}
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>数据库列名</div>
          <Input
            value={value.dbColumn}
            onChange={(e) => patch({ dbColumn: e.target.value })}
            placeholder="自动生成"
            size="small"
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>数据库类型</div>
          <Select
            value={value.dbType}
            onChange={(v) => patch({ dbType: v })}
            style={{ width: '100%' }}
            size="small"
            options={DB_TYPE_OPTIONS}
          />
        </div>
        <div className="pgw-field-cell">
          <div style={labelStyle}>字段长度</div>
          <InputNumber
            value={value.dbLength}
            onChange={(v) => patch({ dbLength: v ?? 255 })}
            style={{ width: '100%' }}
            size="small"
            min={1}
          />
        </div>
      </div>

      <div className="pgw-switch-grid">
        <Space size={4}>
          <Switch
            size="small"
            checked={value.isFilter}
            onChange={(v) => patch({ isFilter: v })}
          />
          <span style={labelStyle}>作为筛选项</span>
        </Space>
        <Space size={4}>
          <Switch
            size="small"
            checked={value.sortable}
            onChange={(v) => patch({ sortable: v })}
          />
          <span style={labelStyle}>支持排序</span>
        </Space>
        <Space size={4}>
          <Switch
            size="small"
            checked={value.isStatusTag}
            onChange={(v) => patch({ isStatusTag: v })}
          />
          <span style={labelStyle}>状态标签</span>
        </Space>
        <Space size={4}>
          <Switch
            size="small"
            checked={value.isAction}
            onChange={(v) => {
              if (v) {
                patch({ isAction: true, isFilter: false, fieldKey: 'action', fieldLabel: '操作', fixed: 'right' })
              } else {
                patch({ isAction: false })
              }
            }}
          />
          <span style={labelStyle}>操作列</span>
        </Space>
      </div>

      {showDataSource && (
        <DataSourceEditor value={value.dataSource ?? null} onChange={handleDataSourceChange} />
      )}

      {value.isStatusTag && (
        <>
          <div style={{ margin: '12px 0' }}>
            <SectionTitle title="状态映射" />
          </div>
          <StatusMapEditor value={value.statusMap} onChange={(statusMap) => patch({ statusMap })} />
        </>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(0,0,0,0.45)',
  marginBottom: 4,
}
