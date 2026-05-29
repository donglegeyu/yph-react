import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Row, Col, DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  CompanyForm,
  CompanyInput,
  CompanySelect,
  CompanyDatePicker,
  CompanyButton,
} from '@donglegeyu/company-ui'
import SvgIcon from './SvgIcon'
import type { FilterItem, DisplayItem } from '@/types'
import './FilterForm.scss'

const presets: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: '近一周', value: [dayjs().subtract(1, 'week'), dayjs()] },
  { label: '近一月', value: [dayjs().subtract(1, 'month'), dayjs()] },
  { label: '近三月', value: [dayjs().subtract(3, 'month'), dayjs()] },
  { label: '近一年', value: [dayjs().subtract(1, 'year'), dayjs()] },
]

interface FilterFormProps {
  modelValue?: Record<string, unknown>
  items?: FilterItem[]
  onSearch?: (data: Record<string, unknown>) => void
  onReset?: () => void
  onChange?: (data: Record<string, unknown>) => void
  onUpdateModelValue?: (data: Record<string, unknown>) => void
}

export default function FilterForm({
  modelValue = {},
  items = [],
  onSearch,
  onReset,
  onChange,
  onUpdateModelValue,
}: FilterFormProps) {
  const [formModel, setFormModel] = useState<Record<string, unknown>>({})
  const [expanded, setExpanded] = useState(false)
  const [contentWidth, setContentWidth] = useState(1200)
  const containerRef = useRef<HTMLDivElement>(null)

  const colSpans = useMemo(() => {
    const w = contentWidth
    if (w < 560) return { xs: 24 }
    if (w < 860) return { xs: 24, sm: 12 }
    if (w < 1200) return { xs: 24, sm: 12, md: 8 }
    return { xs: 24, sm: 12, md: 8, lg: 6 }
  }, [contentWidth])

  const colsPerRow = useMemo(() => {
    const spans = colSpans
    if ('lg' in spans) return 4
    if ('md' in spans) return 3
    if ('sm' in spans) return 2
    return 1
  }, [colSpans])

  const needExpand = useMemo(() => {
    return items.length > colsPerRow
  }, [items.length, colsPerRow])

  const visibleItems = useMemo(() => {
    if (expanded) return items
    const maxItems = colsPerRow - 1
    return items.slice(0, maxItems)
  }, [expanded, items, colsPerRow])

  const displayItems = useMemo<DisplayItem[]>(() => {
    return [
      ...visibleItems.map((item) => ({
        key: item.key,
        label: item.label,
        type: 'item',
        inputType: item.type,
        placeholder:
          item.placeholder || (item.type === 'select' ? '请选择' : '请输入'),
        options: item.options,
      })),
      { key: 'btn', type: 'button' },
    ] as DisplayItem[]
  }, [visibleItems])

  const handleSearch = useCallback(() => {
    const searchData: Record<string, unknown> = {}
    Object.keys(formModel).forEach((key) => {
      const val = formModel[key]
      if (val !== undefined && val !== null && val !== '') {
        searchData[key] = val
      }
    })
    onSearch?.(searchData)
  }, [formModel, onSearch])

  const handleReset = useCallback(() => {
    const cleared: Record<string, unknown> = {}
    Object.keys(formModel).forEach((key) => {
      cleared[key] = ''
    })
    setFormModel(cleared)
    onReset?.()
  }, [formModel, onReset])

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      setFormModel((prev) => {
        const next = { ...prev, [key]: value }
        onUpdateModelValue?.(next)
        onChange?.(next)
        return next
      })
    },
    [onUpdateModelValue, onChange]
  )

  useEffect(() => {
    if (items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormModel((prev) => {
        const next = { ...prev }
        items.forEach((item) => {
          if (item.type !== 'button') {
            const val = modelValue[item.key]
            if (val !== undefined) {
              next[item.key] = val
            } else if (item.type === 'daterange') {
              next[item.key] = next[item.key] ?? []
            } else if (item.type === 'select') {
              next[item.key] = next[item.key] ?? undefined
            } else {
              next[item.key] = next[item.key] ?? ''
            }
          }
        })
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  useEffect(() => {
    if (Object.keys(modelValue).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormModel((prev) => {
        const next = { ...prev }
        Object.entries(modelValue).forEach(([key, val]) => {
          next[key] = val
        })
        return next
      })
    }
  }, [modelValue])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      const parentWidth =
        container.parentElement?.clientWidth || window.innerWidth
      setContentWidth(parentWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container.parentElement || container)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="filter-form"
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSearch()
      }}
    >
      <Row gutter={24}>
        {displayItems.map((item) => {
          if (item.type === 'button') {
            return (
              <Col
                key="btn"
                {...colSpans}
                style={{ marginLeft: 'auto', display: 'flex', justifyContent: 'flex-end' }}
              >
                <CompanyForm.Item className="filter-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CompanyButton type="primary" onClick={handleSearch}>
                      查询
                    </CompanyButton>
                    <CompanyButton onClick={handleReset}>
                      重置
                    </CompanyButton>
                    {needExpand && (
                      <span
                        onClick={() => setExpanded(!expanded)}
                        className="expand-btn"
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="expand-text">
                          {expanded ? '收起' : '展开'}
                        </span>
                        <SvgIcon href={expanded ? 'up' : 'down'} size={14} />
                      </span>
                    )}
                  </div>
                </CompanyForm.Item>
              </Col>
            )
          }

          return (
            <Col key={item.key} {...colSpans} className="filter-col">
              <CompanyForm.Item label={item.label} className="filter-item">
                {item.inputType === 'input' && (
                  <CompanyInput
                    value={(formModel[item.key] as string) || ''}
                    onChange={(e) =>
                      handleFieldChange(item.key, e.target.value)
                    }
                    placeholder={item.placeholder || '请输入'}
                  />
                )}
                {item.inputType === 'select' && (
                  <CompanySelect
                    value={formModel[item.key] as string | undefined}
                    onChange={(val) => handleFieldChange(item.key, val)}
                    placeholder={item.placeholder || '请选择'}
                    options={item.options}
                    allowClear
                  />
                )}
                {item.inputType === 'date' && (
                  <CompanyDatePicker
                    value={
                      formModel[item.key]
                        ? dayjs(formModel[item.key] as string)
                        : undefined
                    }
                    onChange={(_val, dateString) =>
                      handleFieldChange(item.key, dateString)
                    }
                    style={{ width: '100%' }}
                  />
                )}
                {item.inputType === 'daterange' && (
                  <DatePicker.RangePicker
                    value={
                      Array.isArray(formModel[item.key]) &&
                      (formModel[item.key] as string[]).length === 2
                        ? [
                            dayjs((formModel[item.key] as string[])[0]),
                            dayjs((formModel[item.key] as string[])[1]),
                          ]
                        : undefined
                    }
                    onChange={(_val, dateStrings) =>
                      handleFieldChange(item.key, dateStrings)
                    }
                    style={{ width: '100%' }}
                    placeholder={['开始日期', '结束日期']}
                    presets={presets}
                  />
                )}
              </CompanyForm.Item>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
