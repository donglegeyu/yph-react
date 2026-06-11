import { useEffect, useCallback, useState } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { DownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  CompanyButton,
  CompanyDropdown,
  CompanyInput,
  CompanyTable,
  CompanyPagination,
  CompanyMessage,
  CompanyTag,
  CompanySpace,
  CompanyDatePicker,
  PageTitle,
  SvgIcon,
} from '@donglegeyu/company-ui'
import type { Dayjs } from 'dayjs'
import { useMenuTitle, useListData } from '@/hooks'
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

export default function SecurityCheckQuery() {
  const menuTitle = useMenuTitle()
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState('2026 年 4 月')
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

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
          <CompanySpace size={12}>
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
          </CompanySpace>
          <CompanySpace size={8}>
            <div className="icon-only-btn" onClick={refresh}>
              <SvgIcon href="refresh" size={16} />
            </div>
          </CompanySpace>
        </div>

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
    </div>
  )
}
