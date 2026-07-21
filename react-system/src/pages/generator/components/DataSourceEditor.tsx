import { Radio, Input } from 'antd'
import { SectionTitle } from '@donglegeyu/company-ui'
import {
  DATA_SOURCE_KIND_OPTIONS,
  type FieldDataSource,
  type FieldDataSourceKind,
} from '../types'
import OptionsEditor from './OptionsEditor'

interface Props {
  value: FieldDataSource | null
  onChange: (v: FieldDataSource | null) => void
}

export default function DataSourceEditor({ value, onChange }: Props) {
  const kind: FieldDataSourceKind | '' = value?.kind ?? ''

  const switchKind = (k: FieldDataSourceKind) => {
    if (k === 'static') {
      onChange({ kind: 'static', options: value?.kind === 'static' ? value.options : [] })
    } else if (k === 'tableRef') {
      onChange({
        kind: 'tableRef',
        table: '',
        labelKey: 'name',
        valueKey: 'id',
      })
    } else if (k === 'api') {
      onChange({ kind: 'api', apiPath: '', labelKey: 'label', valueKey: 'value' })
    } else if (k === 'dict') {
      onChange({ kind: 'dict', dictKey: '' })
    }
  }

  return (
    <div className="pgw-ds-editor">
      <div style={{ margin: '12px 0' }}>
        <SectionTitle title="数据源" />
      </div>

      <Radio.Group
        value={kind}
        onChange={(e) => switchKind(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
      >
        {DATA_SOURCE_KIND_OPTIONS.map((opt) => (
          <Radio.Button key={opt.value} value={opt.value}>
            {opt.label}
          </Radio.Button>
        ))}
      </Radio.Group>

      <div style={{ marginTop: 12 }}>
        {value?.kind === 'static' && (
          <OptionsEditor
            value={value.options}
            onChange={(options) => onChange({ ...value, options })}
          />
        )}

        {value?.kind === 'tableRef' && (
          <div className="pgw-ds-grid">
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">关联表名</div>
              <Input
                value={value.table}
                onChange={(e) => onChange({ ...value, table: e.target.value })}
                placeholder="如 product_category"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">显示字段</div>
              <Input
                value={value.labelKey}
                onChange={(e) => onChange({ ...value, labelKey: e.target.value })}
                placeholder="如 name"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">值字段</div>
              <Input
                value={value.valueKey}
                onChange={(e) => onChange({ ...value, valueKey: e.target.value })}
                placeholder="如 id"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">过滤条件（可选）</div>
              <Input
                value={value.filterExpr ?? ''}
                onChange={(e) =>
                  onChange({ ...value, filterExpr: e.target.value || undefined })
                }
                placeholder="如 status === 1"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">自定义接口（可选）</div>
              <Input
                value={value.apiPath ?? ''}
                onChange={(e) =>
                  onChange({ ...value, apiPath: e.target.value || undefined })
                }
                placeholder="如 /api/product-category/list"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">级联依赖字段（可选）</div>
              <Input
                value={value.cascadeFrom ?? ''}
                onChange={(e) =>
                  onChange({ ...value, cascadeFrom: e.target.value || undefined })
                }
                placeholder="如 parentCategory"
                size="small"
              />
            </div>
          </div>
        )}

        {value?.kind === 'api' && (
          <div className="pgw-ds-grid">
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">接口路径</div>
              <Input
                value={value.apiPath}
                onChange={(e) => onChange({ ...value, apiPath: e.target.value })}
                placeholder="如 /api/users/options"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">显示字段</div>
              <Input
                value={value.labelKey}
                onChange={(e) => onChange({ ...value, labelKey: e.target.value })}
                placeholder="label"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">值字段</div>
              <Input
                value={value.valueKey}
                onChange={(e) => onChange({ ...value, valueKey: e.target.value })}
                placeholder="value"
                size="small"
              />
            </div>
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">参数（key=value 逗号分隔）</div>
              <Input
                value={Object.entries(value.params ?? {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join(',')}
                onChange={(e) => {
                  const params: Record<string, string> = {}
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .forEach((pair) => {
                      const [k, v] = pair.split('=')
                      if (k) params[k.trim()] = (v ?? '').trim()
                    })
                  onChange({ ...value, params })
                }}
                placeholder="如 type=1, enabled=true"
                size="small"
              />
            </div>
          </div>
        )}

        {value?.kind === 'dict' && (
          <div className="pgw-ds-grid">
            <div className="pgw-ds-cell">
              <div className="pgw-action-label">字典 key</div>
              <Input
                value={value.dictKey}
                onChange={(e) => onChange({ ...value, dictKey: e.target.value })}
                placeholder="如 product_unit"
                size="small"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
