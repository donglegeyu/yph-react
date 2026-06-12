import { useEffect, useCallback, useState } from 'react'
import { ConfigProvider, Form } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { DownOutlined, SearchOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  CompanyButton,
  CompanyDropdown,
  CompanyInput,
  CompanyTable,
  CompanyPagination,
  CompanyMessage,
  CompanyTag,
  CompanyDrawer,
  CompanySelect,
  CompanyDatePicker,
  CompanyTooltip,
  PageTitle,
  SvgIcon,
} from '@donglegeyu/company-ui'
import type { Dayjs } from 'dayjs'
import { useMenuTitle, useListData, useColumnSettings } from '@/hooks'
import { API_ENDPOINTS } from '@/constants/api'
import './SecurityCheckQuery.scss'

interface SecurityCheckRecord {
  [key: string]: unknown
  id: number
  gasCode: string
  address: string
  checkUser: string
  checkDate: string
  checkResult: string
  hiddenDanger: string
  status: string
}

const defaultColumns = [
  { key: 'gasCode', label: '燃气编号', visible: true, width: 140 },
  { key: 'address', label: '用户地址', visible: true, width: 260 },
  { key: 'checkUser', label: '安检人员', visible: true, width: 120 },
  { key: 'checkDate', label: '安检日期', visible: true, width: 140 },
  { key: 'checkResult', label: '安检结果', visible: true, width: 120 },
  { key: 'hiddenDanger', label: '隐患项', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'action', label: '操作', visible: true, width: 120, fixed: 'right' as const },
]

const statisticCards = [
  { title: '当月安检质量 (户)', value: '1,286' },
  { title: '已完成安检 (户)', value: '1,286' },
  { title: '存在隐患 (项)', value: '12' },
  { title: '安检完成率', value: '42.3%' },
]

const statusMap: Record<string, { text: string; color: string }> = {
  pass: { text: '合格', color: 'status-approved' },
  fail: { text: '不合格', color: 'status-rejected' },
  pending: { text: '待安检', color: 'status-pending' },
}

type FilterFieldType = 'input' | 'select' | 'date'

interface FilterFieldConfig {
  key: string
  label: string
  type: FilterFieldType
  options?: Array<{ label: string; value: string }>
  placeholder?: string
}

const drawerFilterFields: FilterFieldConfig[] = [
  { key: 'gasCode', label: '燃气编号', type: 'input', placeholder: '请输入燃气编号' },
  {
    key: 'status',
    label: '安检状态',
    type: 'select',
    placeholder: '请选择安检状态',
    options: [
      { label: '已安检', value: 'checked' },
      { label: '未安检', value: 'unchecked' },
      { label: '待复检', value: 'recheck' },
    ],
  },
  {
    key: 'checkResult',
    label: '安检结果',
    type: 'select',
    placeholder: '请选择安检结果',
    options: [
      { label: '合格', value: 'pass' },
      { label: '不合格', value: 'fail' },
    ],
  },
  {
    key: 'dangerLevel',
    label: '隐患等级',
    type: 'select',
    placeholder: '请选择隐患等级',
    options: [
      { label: '一级', value: '1' },
      { label: '二级', value: '2' },
      { label: '三级', value: '3' },
    ],
  },
  {
    key: 'company',
    label: '所属公司',
    type: 'select',
    placeholder: '请选择所属公司',
    options: [
      { label: '公司A', value: 'a' },
      { label: '公司B', value: 'b' },
    ],
  },
  { key: 'checkUser', label: '安检人员', type: 'input', placeholder: '请输入安检人员' },
  {
    key: 'address',
    label: '用户地址',
    type: 'select',
    placeholder: '请选择用户地址',
    options: [],
  },
  {
    key: 'checkType',
    label: '安检类型',
    type: 'select',
    placeholder: '请选择安检类型',
    options: [
      { label: '入户安检', value: 'indoor' },
      { label: '户外安检', value: 'outdoor' },
    ],
  },
  { key: 'checkDateStart', label: '安检日期', type: 'date', placeholder: '选择日期' },
  { key: 'checkDateEnd', label: '安检日期至', type: 'date', placeholder: '选择日期' },
]

interface FilterTag {
  key: string
  label: string
  value: string
  displayText: string
}

export default function SecurityCheckQuery() {
  const menuTitle = useMenuTitle()
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState('2026 年 4 月')
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({})
  const [filterTags, setFilterTags] = useState<FilterTag[]>([])

  const columnSettings = useColumnSettings({
    storageKey: 'security-check-columns',
  })

  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } =
    useListData<SecurityCheckRecord>({
      apiEndpoint: API_ENDPOINTS.SECURITY_CHECKS,
      defaultPageSize: 20,
    })

  const handleMonthChange = useCallback((date: Dayjs | null) => {
    if (date) {
      const label = `${date.year()} 年 ${date.month() + 1} 月`
      setSelectedMonth(label)
      setMonthDropdownOpen(false)
      CompanyMessage.info(`已切换到 ${label}`)
    }
  }, [])

  const handleSearch = useCallback(() => {
    if (!searchValue.trim()) {
      CompanyMessage.warning('请输入燃气编号')
      return
    }
    setFilterParams({ ...filterParams, gasCode: searchValue })
  }, [searchValue, filterParams, setFilterParams])

  const handleFilterConfirm = useCallback(() => {
    const newTags: FilterTag[] = []
    const newParams: Record<string, string> = { ...filterParams }

    drawerFilterFields.forEach((field) => {
      const value = tempFilters[field.key]
      if (!value) return

      if (field.type === 'date') {
        newTags.push({ key: field.key, label: field.label, value, displayText: `${field.label}：${value}` })
        newParams[field.key] = value
      } else if (field.type === 'select' && field.options) {
        const matched = field.options.find((o) => o.value === value)
        if (matched) {
          newTags.push({ key: field.key, label: field.label, value, displayText: `${field.label}：${matched.label}` })
          newParams[field.key] = value
        }
      } else {
        newTags.push({ key: field.key, label: field.label, value, displayText: `${field.label}：${value}` })
        newParams[field.key] = value
      }
    })

    setFilterTags(newTags)
    setFilterParams(newParams)
    setFilterVisible(false)
  }, [tempFilters, filterParams, setFilterParams])

  const handleRemoveFilterTag = useCallback(
    (tagKey: string) => {
      const newTags = filterTags.filter((t) => t.key !== tagKey)
      setFilterTags(newTags)
      const newParams = { ...filterParams }
      delete newParams[tagKey]
      setFilterParams(newParams)
    },
    [filterTags, filterParams, setFilterParams],
  )

  const handleClearAllFilters = useCallback(() => {
    setFilterTags([])
    setTempFilters({})
    const newParams = { ...filterParams }
    drawerFilterFields.forEach((f) => delete newParams[f.key])
    setFilterParams(newParams)
  }, [filterParams, setFilterParams])

  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      fetchData({ current: page, size: pageSize, ...filterParams })
    },
    [fetchData, filterParams],
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tableColumns = defaultColumns
    .filter((col) => col.visible)
    .map((col) => ({
      key: col.key,
      dataIndex: col.key,
      title: col.label,
      width: col.width,
      fixed: col.fixed,
      render: (text: string, _record: SecurityCheckRecord) => {
        if (col.key === 'status') {
          const status = statusMap[text]
          return status ? (
            <CompanyTag className={status.color}>{status.text}</CompanyTag>
          ) : (
            <span style={{ color: 'var(--color-text-tertiary)' }}>--</span>
          )
        }
        if (col.key === 'checkResult') {
          const colorMap: Record<string, string> = {
            '\u5408\u683c': 'var(--color-success)',
            '\u4e0d\u5408\u683c': 'var(--color-error)',
          }
          return (
            <span style={{ color: colorMap[text] || 'var(--color-text)' }}>
              {text || '--'}
            </span>
          )
        }
        if (col.key === 'checkDate') {
          if (!text) return '--'
          return text.replace('T', ' ')
        }
        if (col.key === 'action') {
          return (
            <CompanyButton
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/security-check-query/${_record.id}`)}
            >
              详情
            </CompanyButton>
          )
        }
        return text || '--'
      },
    }))

  return (
    <div className="security-check-query">
      <PageTitle
        title={menuTitle || '安检结果查询'}
        titleSuffix={
          <>
            <span className="scq-divider" />
            <CompanyDropdown
              open={monthDropdownOpen}
              onOpenChange={setMonthDropdownOpen}
              trigger={['click']}
              popupRender={() => (
                <div className="scq-month-panel" onClick={(e) => e.stopPropagation()}>
                  <CompanyDatePicker
                    picker="month"
                    open={monthDropdownOpen}
                    onChange={handleMonthChange}
                    onOpenChange={(open) => { if (!open) setMonthDropdownOpen(false) }}
                    getPopupContainer={false}
                    inputReadOnly
                  />
                </div>
              )}
            >
              <CompanyButton
                type="text"
                className="month-selector"
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
              >
                <span className="month-selector-text">{selectedMonth}</span>
                <DownOutlined
                  style={{
                    fontSize: 12,
                    color: 'var(--primary-color)',
                    transition:
                      'transform var(--motion-duration-fast) var(--motion-ease-in-out)',
                    transform: monthDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </CompanyButton>
            </CompanyDropdown>
          </>
        }
      />

      <div className="scq-statistics">
        {statisticCards.map((card) => (
          <div className="statistic-card" key={card.title}>
            <div className="statistic-card-title">{card.title}</div>
            <div className="statistic-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="scq-table-wrapper">
        <div className="scq-table-header">
          <div className="scq-table-header-left">
            <CompanyInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="请输入燃气编号进行搜索"
              style={{ width: 320 }}
              onPressEnter={handleSearch}
              suffix={
                <SvgIcon
                  href="search"
                  size={16}
                  style={{ cursor: 'pointer', color: 'var(--color-text-tertiary)' }}
                  onClick={handleSearch}
                />
              }
            />
            <CompanyButton
              icon={<SearchOutlined />}
              className="scq-filter-btn"
              onClick={() => setFilterVisible(true)}
            >
              筛选
            </CompanyButton>
          </div>
          <div className="scq-table-header-right">
            <CompanyTooltip title="列设置">
              <div className="icon-only-btn" onClick={() => columnSettings.resetToDefault()}>
                <SvgIcon href="setting" size={16} />
              </div>
            </CompanyTooltip>
          </div>
        </div>

        {filterTags.length > 0 && (
          <div className="scq-filter-tags">
            {filterTags.map((tag) => (
              <div className="scq-filter-tag" key={tag.key}>
                <span className="scq-filter-tag-text">{tag.displayText}</span>
                <CloseOutlined
                  className="scq-filter-tag-close"
                  onClick={() => handleRemoveFilterTag(tag.key)}
                />
              </div>
            ))}
            <div className="scq-filter-clear" onClick={handleClearAllFilters}>
              <DeleteOutlined style={{ fontSize: 14 }} />
              <span>清空</span>
            </div>
          </div>
        )}

        <CompanyTable
          dataSource={dataSource}
          columns={tableColumns as object[]}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ y: 'calc(100vh - 400px)' }}
          locale={{ emptyText: '暂无数据' }}
        />

        {pagination.total > 0 && (
          <div className="scq-pagination">
            <ConfigProvider locale={zhCN}>
              <CompanyPagination
                size="small"
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 条`}
              />
            </ConfigProvider>
          </div>
        )}
      </div>

      <CompanyDrawer
        title="筛选项"
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
        size={380}
        className="scq-filter-drawer"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setTempFilters({})}>
              重置
            </CompanyButton>
            <CompanyButton type="primary" onClick={handleFilterConfirm}>
              查询
            </CompanyButton>
          </div>
        }
      >
        <Form layout="vertical">
          {drawerFilterFields.map((field) => (
            <Form.Item key={field.key} label={field.label}>
              {field.type === 'input' && (
                <CompanyInput
                  value={tempFilters[field.key] || ''}
                  onChange={(e) =>
                    setTempFilters((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder || '请输入'}
                />
              )}
              {field.type === 'select' && (
                <CompanySelect
                  value={tempFilters[field.key] || undefined}
                  onChange={(value) =>
                    setTempFilters((prev) => ({ ...prev, [field.key]: value as string }))
                  }
                  placeholder={field.placeholder || '请选择'}
                  options={field.options}
                  allowClear
                />
              )}
              {field.type === 'date' && (
                <CompanyDatePicker
                  value={tempFilters[field.key] || undefined}
                  onChange={(_date, dateString) => {
                    const val = typeof dateString === 'string' ? dateString : ''
                    setTempFilters((prev) => ({ ...prev, [field.key]: val }))
                  }}
                  placeholder={field.placeholder || '选择日期'}
                  style={{ width: '100%' }}
                />
              )}
            </Form.Item>
          ))}
        </Form>
      </CompanyDrawer>
    </div>
  )
}
