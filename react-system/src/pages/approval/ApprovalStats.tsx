import { useCallback, useEffect, useState } from 'react'
import {
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
import {
  fetchStatsByProcess,
  fetchStatsOverview,
  fetchStatsTrend,
  type ProcessStat,
  type StatsOverview,
  type TrendPoint,
} from './api'

/** 状态中文名（图表展示用），取值来自 appr_business_link.status */
const STATUS_TEXT: Record<string, string> = {
  running: '进行中',
  approved: '已完成',
  rejected: '已驳回',
  withdrawn: '已撤回',
}

export default function ApprovalStats() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [byProcess, setByProcess] = useState<ProcessStat[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])

  const load = useCallback(async () => {
    try {
      const [overviewRes, processRes, trendRes] = await Promise.all([
        fetchStatsOverview(),
        fetchStatsByProcess(),
        fetchStatsTrend(14),
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
    void load()
  }, [load])

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
            <CompanyStatistic title="本月发起" value={overview ? overview.monthStarted : '-'} suffix="单" />
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
      </CompanyRow>
    </CompanySpin>
  )
}
