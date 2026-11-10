import { useState } from 'react'
import { Input, InputNumber, Select, Switch, Space, Button } from 'antd'
import { DownOutlined, UpOutlined, DeleteOutlined } from '@ant-design/icons'
import { SectionTitle } from '@donglegeyu/company-ui'
import type { FieldConfig, FieldType, FixedSide, FieldDataSource, FormFieldGroupConfig } from '../types'
import { FIELD_TYPE_OPTIONS, DB_TYPE_OPTIONS } from '../types'
import { suggestDbColumn, suggestFieldKey } from '../services'
import StatusMapEditor from './StatusMapEditor'
import DataSourceEditor from './DataSourceEditor'

// 可作为数据源载体的字段类型
const DS_FIELD_TYPES: FieldType[] = ['select', 'select-multi', 'radio', 'cascader']

interface Props {
  value: FieldConfig
  onChange: (value: FieldConfig) => void
  /** 字段使用场景：list=列表列（默认，全部编辑项）、detail=详情字段、form=表单字段（隐藏表格列/筛选项相关编辑项） */
  mode?: 'list' | 'detail' | 'form'
  /** 已建的表单分组列表（form 模式下用于「所属分组」下拉，先建组、字段入组） */
  groups?: FormFieldGroupConfig[]
  /** 展开状态由外层 FieldCard 控制（切换按钮在卡片头部） */
  expanded: boolean
}

export default function FieldEditor({ value, onChange, mode = 'list', groups, expanded }: Props) {
  const patch = (p: Partial<FieldConfig>) => onChange({ ...value, ...p })
  // 表单字段：无表格列（列宽/固定列）与筛选/排序概念
  const isFormMode = mode === 'form'

  const handleTypeChange = (t: FieldType) => {
    if (t === 'status') {
      // 切到状态标签：初始化 statusMap，清空 dataSource
      patch({
        fieldType: t,
        dataSource: null,
        isStatusTag: true,
        statusMap: value.statusMap && value.statusMap.length > 0
          ? value.statusMap
          : [
              { value: 'pending', text: '待处理', color: 'default' },
              { value: 'processing', text: '进行中', color: 'processing' },
              { value: 'done', text: '已完成', color: 'success' },
            ],
      })
      return
    }
    if (DS_FIELD_TYPES.includes(t)) {
      // 切换到可选类型时，如果没有 dataSource，自动初始化为 static（并复用旧 options）
      if (!value.dataSource) {
        patch({
          fieldType: t,
          isStatusTag: false,
          dataSource: { kind: 'static', options: value.options ?? [] },
        })
        return
      }
    } else {
      // 切换到非可选类型时，清空 dataSource
      if (value.dataSource) {
        patch({ fieldType: t, isStatusTag: false, dataSource: null })
        return
      }
    }
    patch({ fieldType: t, isStatusTag: false })
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
          <div style={labelStyle}>中文列名</div>
          <Input
            value={value.fieldLabel}
            onChange={(e) => {
              const fieldLabel = e.target.value
              // fieldKey 为空（未手动改过）时，联动按拼音建议生成
              if (!value.fieldKey.trim()) {
                const suggested = suggestFieldKey(fieldLabel)
                patch({ fieldLabel, fieldKey: suggested, dbColumn: suggestDbColumn(suggested) })
              } else {
                patch({ fieldLabel })
              }
            }}
            placeholder="如 任务名称"
            size="small"
          />
        </div>
        {expanded && (
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
        )}
        {expanded && (
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
        )}
        {expanded && !isFormMode && (
          <>
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
          </>
        )}
        {expanded && (
          <div className="pgw-field-cell">
            <div style={labelStyle}>数据库列名</div>
            <Input
              value={value.dbColumn}
              onChange={(e) => patch({ dbColumn: e.target.value })}
              placeholder="自动生成"
              size="small"
            />
          </div>
        )}
        {expanded && (
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
        )}
        {expanded && (
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
        )}
        {isFormMode && (
          <div className="pgw-field-cell">
            <div style={labelStyle}>所属分组</div>
            <Select
              value={value.groupId || undefined}
              onChange={(v) => patch({ groupId: v || undefined })}
              placeholder="选择分组（空=不分组）"
              size="small"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={(groups ?? []).map((g) => ({ label: g.name || '未命名分组', value: g.id }))}
            />
          </div>
        )}
      </div>

      {expanded && !isFormMode && (
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
              checked={value.isRequired === true}
              onChange={(v) => patch({ isRequired: v })}
            />
            <span style={labelStyle}>必填</span>
          </Space>
        </div>
      )}

      {expanded && isFormMode && (
        <div className="pgw-switch-grid">
          <Space size={4}>
            <Switch
              size="small"
              checked={value.isRequired === true}
              onChange={(v) => patch({ isRequired: v })}
            />
            <span style={labelStyle}>必填</span>
          </Space>
        </div>
      )}

      {expanded && showDataSource && (
        <DataSourceEditor value={value.dataSource ?? null} onChange={handleDataSourceChange} />
      )}

      {expanded && value.fieldType === 'status' && (
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

interface FieldCardProps {
  value: FieldConfig
  onChange: (value: FieldConfig) => void
  mode?: 'list' | 'detail' | 'form'
  groups?: FormFieldGroupConfig[]
  /** 字段在列表中的下标（用于空名称兜底显示） */
  index: number
  onDelete: () => void
}

// 字段卡片：头部（中文名/类型标签 + 展开/收起 + 删除）+ FieldEditor；展开状态卡片内自治，默认收起
export function FieldCard({ value, onChange, mode = 'list', groups, index, onDelete }: FieldCardProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="pgw-field-item">
      <div className="pgw-field-header">
        <Space size={12}>
          <span className="pgw-field-key">{value.fieldLabel || `字段 ${index + 1}`}</span>
          <span className="pgw-field-label">
            {FIELD_TYPE_OPTIONS.find((o) => o.value === value.fieldType)?.label || value.fieldType}
          </span>
          {value.isAction && <span className="pgw-tag-action">操作列</span>}
          {value.isStatusTag && <span className="pgw-tag-status">状态列</span>}
        </Space>
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            iconPosition="end"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '收起' : '展开'}
          </Button>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onDelete} />
        </Space>
      </div>
      <FieldEditor value={value} onChange={onChange} mode={mode} groups={groups} expanded={expanded} />
    </div>
  )
}
