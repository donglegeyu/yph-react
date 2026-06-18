import { useState, useMemo, useEffect } from 'react'
import { Dropdown, Radio, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { Column } from '@ant-design/charts'
import { CompanyButton, useCompanyToken } from '@donglegeyu/company-ui'
import goldMedal from '../../assets/icons/gold-medal.svg'
import silverMedal from '../../assets/icons/silver-medal.svg'
import bronzeMedal from '../../assets/icons/bronze-medal.svg'
import './SalesDashboard.scss'

interface SalesSummary {
  totalAmount: string
  yoyChange: string
  yoyDirection: 'up' | 'down'
  targetRate: number
  nationalRank: number
  provinceRank: number
}

interface TrendItem {
  month: string
  amount: number
  momRate: number
}

interface ProductRank {
  id: number
  name: string
  amount: string
  momChange: string
  momDirection: 'up' | 'down'
  salesCount: number
}

interface CompanyRank {
  id: number
  name: string
  amount: string
  momChange: string
  momDirection: 'up' | 'down'
  targetRate: number
}

const mockSummary: SalesSummary = {
  totalAmount: '235,325,678.99',
  yoyChange: '-1.5',
  yoyDirection: 'down',
  targetRate: 32.6,
  nationalRank: 16,
  provinceRank: 2,
}

const mockTrends: TrendItem[] = [
  { month: '1月', amount: 450, momRate: 12 },
  { month: '2月', amount: 880, momRate: 95 },
  { month: '3月', amount: 450, momRate: -49 },
  { month: '4月', amount: 450, momRate: 0 },
  { month: '5月', amount: 1200, momRate: 167 },
  { month: '6月', amount: 680, momRate: -43 },
  { month: '7月', amount: 920, momRate: 35 },
  { month: '8月', amount: 1100, momRate: 20 },
  { month: '9月', amount: 780, momRate: -29 },
  { month: '10月', amount: 1350, momRate: 73 },
  { month: '11月', amount: 980, momRate: -27 },
  { month: '12月', amount: 1500, momRate: 53 },
]

const productNames = [
  '燃气热水器',
  '抽油烟机',
  '嵌入式燃气灶',
  '电热水器',
  '消毒柜',
  '集成灶',
  '壁挂炉',
  '洗碗机',
  '蒸烤一体机',
  '净水器',
]

const mockProducts: ProductRank[] = productNames.map((name, i) => {
  const baseAmount = 2541 - i * 180
  const amount = (baseAmount * 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const momChange = (Math.random() * 60 - 15).toFixed(1)
  const direction = Number(momChange) >= 0 ? 'up' : 'down'
  return {
    id: i + 1,
    name,
    amount,
    momChange,
    momDirection: direction as 'up' | 'down',
    salesCount: Math.round(baseAmount / 40),
  }
})

const companyNames = [
  '广西壹品慧电子商务有限公司南宁分公司',
  '深圳市壹品慧到家科技有限公司',
  '广西壹品慧电子商务有限公司柳州分公司',
  '广西壹品慧电子商务有限公司桂林分公司',
  '广西壹品慧电子商务有限公司玉林分公司',
  '广西壹品慧电子商务有限公司梧州分公司',
  '广西壹品慧电子商务有限公司北海分公司',
  '广西壹品慧电子商务有限公司钦州分公司',
  '广西壹品慧电子商务有限公司贵港分公司',
  '广西壹品慧电子商务有限公司贺州分公司',
]

const mockCompanyRanks: CompanyRank[] = companyNames.map((name, i) => {
  const baseAmount = 1280 - i * 95
  const amount = (baseAmount * 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const momChange = (Math.random() * 50 - 12).toFixed(1)
  const direction = Number(momChange) >= 0 ? 'up' : 'down'
  return {
    id: i + 1,
    name,
    amount,
    momChange,
    momDirection: direction as 'up' | 'down',
    targetRate: Math.round(85 - i * 6 + Math.random() * 5),
  }
})

const channelItems: MenuProps['items'] = [
  { key: 'all', label: '全部渠道' },
  { key: 'online', label: '线上渠道' },
  { key: 'offline', label: '线下渠道' },
]

const categoryItems: MenuProps['items'] = [
  { key: 'all', label: '全部渠道大类/全部渠道小类' },
]

const financeItems: MenuProps['items'] = [
  { key: 'finance', label: '财务口径' },
  { key: 'business', label: '业务口径' },
]

const periodItems: MenuProps['items'] = [
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
]

export default function SalesDashboard() {
  const [activeView, setActiveView] = useState<'default' | 'sales'>('sales')
  const [trendMode, setTrendMode] = useState<'amount' | 'count'>('amount')
  const [colorKey, setColorKey] = useState(0)

  const token = useCompanyToken()
  const primaryColor = token?.colorPrimary || '#F95914'

  useEffect(() => {
    if (token?.colorPrimary) {
      setColorKey((k) => k + 1)
    }
  }, [token?.colorPrimary])

  const renderRankBadge = (index: number) => {
    if (index === 0) return <img className="rank-medal" src={goldMedal} alt="金牌" />
    if (index === 1) return <img className="rank-medal" src={silverMedal} alt="银牌" />
    if (index === 2) return <img className="rank-medal" src={bronzeMedal} alt="铜牌" />
    return <span>{index + 1}.</span>
  }

  const chartData = mockTrends.map((t) => ({
    month: t.month,
    value: t.amount,
  }))

  const chartConfig = useMemo(() => ({
    data: chartData,
    xField: 'month',
    yField: 'value',
    color: primaryColor,
    autoFit: true,
    height: 430,
    axis: {
      x: {
        title: false,
        labelAutoRotate: false,
        labelFill: '#1D2129',
        labelFontSize: 12,
        labelOpacity: 1,
      },
      y: {
        title: false,
        labelFormatter: (v: string) => v,
        labelFill: '#1D2129',
        labelFontSize: 12,
        labelOpacity: 1,
        gridLineDash: [2, 2],
        gridStroke: 'rgba(0,0,0,0.06)',
      },
    },
    style: {
      fill: primaryColor,
      radiusTopLeft: 2,
      radiusTopRight: 2,
      maxWidth: 24,
    },
    state: {
      active: {
        fill: primaryColor,
        fillOpacity: 0.8,
      },
    },
    interaction: {
      tooltip: {
        marker: false,
      },
    },
  }), [primaryColor])

  const renderSummarySection = () => (
    <div className="summary-card">
      <div className="summary-header">
        <span className="summary-title">销售额</span>
      </div>
      <div className="summary-body">
        <div className="summary-item">
          <div className="summary-amount">
            <span className="amount-value">￥{mockSummary.totalAmount}</span>
          </div>
          <div className="summary-desc">
            <span className="desc-label">销售额(元)</span>
          </div>
          <div className="summary-yoy">
            <span className="yoy-label">同比</span>
            <span className={`yoy-value ${mockSummary.yoyDirection}`}>
              {mockSummary.yoyChange} %
            </span>
            <span className={`yoy-arrow ${mockSummary.yoyDirection}`}>
              {mockSummary.yoyDirection === 'up' ? '↑' : '↓'}
            </span>
          </div>
        </div>
        <div className="summary-divider" />
        <div className="summary-item target-section">
          <div className="target-rate-value">
            <span className="rate-number">{mockSummary.targetRate}</span>
            <span className="rate-unit"> %</span>
          </div>
          <div className="target-rate-label">目标达成率</div>
          <div className="target-progress-track">
            <div
              className="target-progress-bar"
              style={{ width: `${mockSummary.targetRate}%` }}
            />
          </div>
        </div>
        <div className="summary-divider" />
        <div className="summary-item rank-section">
          <div className="rank-row">
            <span className="rank-label">全国排名</span>
            <span className="rank-value">{mockSummary.nationalRank}</span>
          </div>
          <div className="rank-row">
            <span className="rank-label">省排名</span>
            <span className="rank-value">{mockSummary.provinceRank}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTrendChart = () => (
    <div className="trend-card">
      <div className="trend-header">
        <span className="trend-title">销售额趋势图</span>
        <Radio.Group
          value={trendMode}
          onChange={(e) => setTrendMode(e.target.value)}
          size="small"
          optionType="button"
          buttonStyle="outline"
        >
          <Radio.Button value="amount">销售额</Radio.Button>
          <Radio.Button value="count">订单量</Radio.Button>
        </Radio.Group>
      </div>
      <div className="trend-chart-wrapper">
        <Column key={colorKey} {...chartConfig} />
      </div>
    </div>
  )

  const renderProductRank = () => (
    <div className="product-rank-card">
      <div className="section-header">
        <span className="section-title">产品销售TOP10</span>
      </div>
      <div className="rank-list">
        {mockProducts.map((product, index) => (
          <div className="rank-item" key={product.id}>
            <div className="rank-index">{renderRankBadge(index)}</div>
            <div className="rank-content">
              <div className="rank-name">{product.name}</div>
              <div className="rank-detail">
                <div className="rank-amount-area">
                  <span className="rank-amount">￥{product.amount}</span>
                  <div className="rank-meta">
                    <span className="meta-label">销售额(万元)</span>
                    <div className="meta-mom">
                      <span className="mom-label">环比 </span>
                      <span className={`mom-value ${product.momDirection}`}>
                        {product.momChange}%
                      </span>
                      <span className={`mom-icon ${product.momDirection}`}>
                        {product.momDirection === 'up' ? '↗' : '↘'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rank-separator" />
                <div className="rank-sales-count">
                  <span className="count-number">{product.salesCount}</span>
                  <span className="count-label">销售件数</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCompanyRank = () => (
    <div className="company-rank-card">
      <div className="section-header">
        <span className="section-title">指标公司排名</span>
      </div>
      <div className="rank-list">
        {mockCompanyRanks.map((company, index) => (
          <div className="rank-item company" key={company.id}>
            <div className="rank-index">{renderRankBadge(index)}</div>
            <div className="rank-content">
              <div className="rank-name">{company.name}</div>
              <div className="rank-detail">
                <div className="rank-amount-area">
                  <span className="rank-amount">￥{company.amount}</span>
                  <div className="rank-meta">
                    <span className="meta-label">本月销售额(万元)</span>
                    <div className="meta-mom">
                      <span className="mom-label">环比 </span>
                      <span className={`mom-value ${company.momDirection}`}>
                        {company.momChange}%
                      </span>
                      <span className={`mom-icon ${company.momDirection}`}>
                        {company.momDirection === 'up' ? '↗' : '↘'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rank-separator" />
                <div className="rank-target-rate">
                  <span className="target-number">{company.targetRate}%</span>
                  <span className="target-label">目标达成率</span>
                </div>
              </div>
            </div>
            <div className="rank-arrow"><RightOutlined /></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="sales-dashboard">
      <div className="dashboard-toolbar">
        <div className="toolbar-left">
          <div className="view-tabs">
            <div
              className={`view-tab ${activeView === 'default' ? 'active' : ''}`}
              onClick={() => setActiveView('default')}
            >
              <svg className="view-icon" aria-hidden="true">
                <use href="#view-list" />
              </svg>
              默认视图
            </div>
            <div
              className={`view-tab ${activeView === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveView('sales')}
            >
              <svg className="view-icon" aria-hidden="true">
                <use href="#chart-histogram" />
              </svg>
              销售数据视图
            </div>
          </div>
        </div>
        <div className="toolbar-right">
          <span className="guide-text">快速上手系统，请查看</span>
          <span className="guide-link">系统使用指南</span>
        </div>
      </div>

      {activeView === 'default' ? (
        <div className="dashboard-content">
          <div className="developing-placeholder">
            <div className="developing-text">开发中</div>
            <div className="developing-desc">该功能正在开发中，敬请期待</div>
          </div>
        </div>
      ) : (
        <>
        <div className="dashboard-filters">
          <div className="filters-left">
            <span className="company-name">深圳市壹品慧到家科技有限公司</span>
            <Tag className="company-tag">省公司</Tag>
            <Dropdown menu={{ items: channelItems }} trigger={['click']}>
              <CompanyButton type="link" className="filter-dropdown">
                渠道 <DownOutlined />
              </CompanyButton>
            </Dropdown>
            <Dropdown menu={{ items: categoryItems }} trigger={['click']}>
              <CompanyButton type="link" className="filter-dropdown">
                全部渠道大类/全部渠道小类 <DownOutlined />
              </CompanyButton>
            </Dropdown>
            <Dropdown menu={{ items: financeItems }} trigger={['click']}>
              <CompanyButton type="link" className="filter-dropdown">
                财务口径 <DownOutlined />
              </CompanyButton>
            </Dropdown>
            <Dropdown menu={{ items: periodItems }} trigger={['click']}>
              <CompanyButton type="link" className="filter-dropdown">
                本月 <DownOutlined />
              </CompanyButton>
            </Dropdown>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="content-main">
            {renderSummarySection()}
            {renderTrendChart()}
            {renderProductRank()}
          </div>
          <div className="content-side">
            {renderCompanyRank()}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
