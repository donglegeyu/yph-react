import { useCallback, useEffect, useState } from 'react'
import { Dropdown } from 'antd'
import {
  CompanyButton,
  CompanyCard,
  CompanyCol,
  CompanyDonutChart,
  CompanyLineChart,
  CompanyMessage,
  CompanyRow,
  CompanySpin,
  CompanyStackedBarChart,
  CompanyStatistic,
} from '@donglegeyu/company-ui'
import { DownOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/app'
import { API_ENDPOINTS } from '@/constants/api'
import { get } from '@/utils/request'
import {
  fetchStatsByProcess,
  fetchStatsOverview,
  fetchStatsTrend,
  type ProcessStat,
  type StatsFilter,
  type StatsOverview,
  type TrendPoint,
} from './api'
import './ApprovalStats.scss'

/** 状态中文名（图表展示用），取值来自 appr_business_link.status */
const STATUS_TEXT: Record<string, string> = {
  running: '进行中',
  approved: '已完成',
  rejected: '已驳回',
  withdrawn: '已撤回',
}

/** 主库部门树节点（/api/sys/depts 返回） */
interface DeptTreeNode {
  id: number
  deptName: string
  children?: DeptTreeNode[]
}

/** 时间周期选项 */
const PERIOD_OPTIONS = [
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
]

export default function ApprovalStats() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [byProcess, setByProcess] = useState<ProcessStat[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])
  // 筛选条件：公司（部门树顶级节点）+ 时间周期
  const [filter, setFilter] = useState<StatsFilter>({ period: 'month' })
  const [companies, setCompanies] = useState<DeptTreeNode[]>([])
  // 图表等菜单加载完成后再渲染：二级侧边栏随菜单异步出现会让内容区宽度变化
  // （1537→1317），G2 图表只监听 window resize 不监听容器变化，过早渲染会按
  // 旧宽度固定 canvas 宽度导致超宽 183px + 横向滚动条；延迟渲染让首次测量即正确
  const menusLoaded = useAppStore((s) => s.menusLoaded)

  const load = useCallback(async (f: StatsFilter) => {
    try {
      const [overviewRes, processRes, trendRes] = await Promise.all([
        fetchStatsOverview(f),
        fetchStatsByProcess(f),
        fetchStatsTrend(14, f),
      ])
      if (overviewRes.code === 200 && overviewRes.data) {
        setOverview(overviewRes.data)
      } else {
        CompanyMessage.error(overviewRes.message || '审批总览加载失败')
      }
      if (processRes.code === 200 && processRes.data) {
        setByProcess(processRes.data)
      } else {
        CompanyMessage.error(processRes.message || '按流程统计加载失败')
      }
      if (trendRes.code === 200 && trendRes.data) {
        setTrend(trendRes.data)
      } else {
        CompanyMessage.error(trendRes.message || '审批趋势加载失败')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // 公司下拉数据源：主库部门树顶级节点（公司）
  useEffect(() => {
    get<DeptTreeNode[]>(API_ENDPOINTS.SYS_DEPTS, { status: 1 })
      .then((res) => {
        if (res.code === 200 && Array.isArray(res.data)) {
          setCompanies(res.data)
        }
      })
      .catch(() => {
        // 公司下拉加载失败不阻塞统计展示
      })
  }, [])

  const companyLabel = filter.companyId
    ? companies.find((c) => c.id === filter.companyId)?.deptName || '全部公司'
    : '全部公司'
  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === filter.period)?.label || '本月'

  const trendData = trend.flatMap((point) => [
    { date: point.date, type: '发起', count: point.started },
    { date: point.date, type: '完成', count: point.completed },
  ])

  const statusData = overview
    ? [
        { status: STATUS_TEXT.running, count: overview.runningCount },
        { status: STATUS_TEXT.approved, count: overview.approvedCount },
        { status: STATUS_TEXT.rejected, count: overview.rejectedCount },
        { status: STATUS_TEXT.withdrawn, count: overview.withdrawnCount },
      ]
    : []

  const processData = byProcess.flatMap((stat) => {
    const name = stat.defName || stat.defKey
    return [
      { process: name, status: STATUS_TEXT.running, count: stat.running },
      { process: name, status: STATUS_TEXT.approved, count: stat.approved },
      { process: name, status: STATUS_TEXT.rejected, count: stat.rejected },
      { process: name, status: STATUS_TEXT.withdrawn, count: stat.withdrawn },
    ]
  })

  return (
    <CompanySpin spinning={loading}>
      {/* 筛选条：样式对齐首页销售数据视图（橙色下拉 + 竖线分隔） */}
      <div className="stats-filters">
        <div className="filters-left">
          <Dropdown
            menu={{
              items: [
                { key: 'all', label: '全部公司' },
                ...companies.map((c) => ({ key: String(c.id), label: c.deptName })),
              ],
              onClick: ({ key }) => {
                setFilter((prev) => ({
                  ...prev,
                  companyId: key === 'all' ? undefined : Number(key),
                }))
              },
              selectedKeys: filter.companyId ? [String(filter.companyId)] : ['all'],
            }}
            trigger={['click']}
          >
            <span className="company-name">
              {companyLabel} <DownOutlined />
            </span>
          </Dropdown>
          <Dropdown
            menu={{
              items: PERIOD_OPTIONS.map((p) => ({ key: p.key, label: p.label })),
              onClick: ({ key }) => {
                setFilter((prev) => ({ ...prev, period: key as StatsFilter['period'] }))
              },
              selectedKeys: [filter.period || 'month'],
            }}
            trigger={['click']}
          >
            <CompanyButton type="link" className="filter-dropdown">
              {periodLabel} <DownOutlined />
            </CompanyButton>
          </Dropdown>
        </div>
      </div>

      {/* 外层 padding 吸收 gutter 负 margin，避免行超出容器产生横向滚动条 */}
      <div style={{ paddingInline: 12 }}>

        <CompanyRow gutter={[16, 16]}>
        <CompanyCol span={6}>
          <CompanyCard>
            <CompanyStatistic title="待办任务" value={overview ? overview.todoCount : '-'} suffix="项" />
          </CompanyCard>
        </CompanyCol>
        <CompanyCol span={6}>
          <CompanyCard>
            <CompanyStatistic title="进行中实例" value={overview ? overview.runningCount : '-'} suffix="个" />
          </CompanyCard>
        </CompanyCol>
        <CompanyCol span={6}>
          <CompanyCard>
            <CompanyStatistic title="周期内发起" value={overview ? overview.monthStarted : '-'} suffix="单" />
          </CompanyCard>
        </CompanyCol>
        <CompanyCol span={6}>
          <CompanyCard>
            <CompanyStatistic
              title="平均耗时"
              value={overview && overview.avgDurationHours != null ? overview.avgDurationHours : '-'}
              suffix="小时"
            />
          </CompanyCard>
        </CompanyCol>

        {/* 菜单加载完成（二级侧边栏已出现、布局稳定）后再渲染图表，避免 canvas 按旧宽度测量 */}
        {menusLoaded && (
          <>
            <CompanyCol span={16}>
              <CompanyCard title="近 14 天发起/完成趋势">
                <CompanyLineChart data={trendData} xField="date" yField="count" colorField="type" height={300} />
              </CompanyCard>
            </CompanyCol>
            <CompanyCol span={8}>
              <CompanyCard title="实例状态分布">
                <CompanyDonutChart data={statusData} colorField="status" angleField="count" height={300} />
              </CompanyCard>
            </CompanyCol>

            <CompanyCol span={24}>
              <CompanyCard title="按流程统计">
                <CompanyStackedBarChart
                  data={processData}
                  xField="process"
                  yField="count"
                  colorField="status"
                  height={300}
                />
              </CompanyCard>
            </CompanyCol>
          </>
        )}
        </CompanyRow>
      </div>
    </CompanySpin>
  )
}
