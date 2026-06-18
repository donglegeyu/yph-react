import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Empty, Skeleton, Row, Col } from 'antd'
import { DetailPageTemplate, CompanyButton, CompanyMessage, SectionTitle, type DetailFieldItem, type DetailTagItem } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useStatusMap } from '@/hooks'

interface CraftsmanRecord {
  [key: string]: unknown
  id: number
  craftsmanCode: string
  name: string
  phone: string
  userAccount: string
  serviceProviderName: string
  craftsmanCategory: string
  craftsmanType: number
  region: string
  serviceSkills: string
  registerTime: string
  status: number
  createTime: string
  birthday?: string
  idCardNo?: string
  age?: number | string
  residentialAddress?: string
  serviceArea?: string
  idCardImages?: string
  workCertificate?: string
  noCriminalCertificate?: string
}

const categoryMap: Record<string, string> = {
  outsource: '外部员工',
  internal: '内部员工',
}

const craftsmanTypeMap: Record<number, string> = {
  1: '正式工匠',
  2: '意向工匠',
}

function maskPhone(phone: string | undefined): string {
  if (!phone || phone.length < 11) return phone || '--'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

export default function CraftsmanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { registerStatusMap, getStatusText } = useStatusMap()
  const [detail, setDetail] = useState<CraftsmanRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('detail')

  useEffect(() => {
    registerStatusMap({
      1: { text: '启用', color: 'status-approved' },
      0: { text: '停用', color: 'status-rejected' },
    })
  }, [registerStatusMap])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.CRAFTSMEN}/${id}`)
        const json = await res.json()
        if (!cancelled && json.code === 200 && json.data) {
          setDetail(json.data as CraftsmanRecord)
        }
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const tags: DetailTagItem[] = useMemo(() => {
    if (!detail) return []
    const statusVariant = detail.status === 1 ? 'success' : 'default'
    return [
      { text: getStatusText(String(detail.status)), variant: statusVariant },
      { text: categoryMap[detail.craftsmanCategory] || detail.craftsmanCategory, variant: 'default' },
      { text: craftsmanTypeMap[detail.craftsmanType] || String(detail.craftsmanType), variant: 'default' },
    ]
  }, [detail, getStatusText])

  const infoFields: DetailFieldItem[] = useMemo(() => {
    if (!detail) return []
    return [
      { label: '工匠编号', value: detail.craftsmanCode || '--' },
      { label: '所属服务商', value: detail.craftsmanCategory === 'external' ? '--' : (detail.serviceProviderName || '--') },
      { label: '手机号', value: maskPhone(detail.phone) },
      { label: '用户账号', value: detail.userAccount || '--' },
      { label: '服务技能', value: detail.serviceSkills || '--' },
    ]
  }, [detail])

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  if (!detail) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Empty description="工匠不存在或已删除" />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
    <DetailPageTemplate
      title="工匠详情"
      showBack
      onBack={() => navigate('/craftsman-search')}
      titleActions={
        <CompanyButton type="primary" onClick={() => CompanyMessage.info('编辑功能开发中')}>
          编辑
        </CompanyButton>
      }
      avatar={(detail.name || '?').charAt(0)}
      primaryName={detail.name}
      tags={tags}
      infoFields={infoFields}
      tabs={[
        {
          key: 'detail',
          label: '详情',
          children: (
            <div style={{ padding: '0 0 16px' }}>
              <DetailSection title="个人信息">
                <DetailGrid items={[
                  { label: '出生日期', value: detail.birthday || '--' },
                  { label: '身份证号', value: detail.idCardNo || '--' },
                  { label: '年龄', value: detail.age != null ? `${detail.age}岁` : '--' },
                  { label: '常住地址', value: detail.residentialAddress || '--' },
                  { label: '接单区域', value: detail.serviceArea || '--' },
                ]} />
                <DetailImages title="身份证图片" urls={detail.idCardImages} background topGap={12} />
              </DetailSection>

              <DetailSection title="证明">
                <DetailImages title="工作证明" urls={detail.workCertificate} background width={116} />
                <DetailImages title="无犯罪证明" urls={detail.noCriminalCertificate} background width={116} topGap={12} />
              </DetailSection>
            </div>
          ),
        },
        {
          key: 'capability',
          label: '接单能力',
          children: (
            <div style={{ padding: '32px 0' }}>
              <Empty description="接单能力数据开发中" />
            </div>
          ),
        },
        {
          key: 'workorder',
          label: '工单列表',
          children: (
            <div style={{ padding: '32px 0' }}>
              <Empty description="工单列表数据开发中" />
            </div>
          ),
        },
        {
          key: 'changelog',
          label: '变更记录',
          children: (
            <div style={{ padding: '32px 0' }}>
              <Empty description="变更记录数据开发中" />
            </div>
          ),
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionTitle title={title} />
      {children}
    </div>
  )
}

function DetailGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <Row gutter={[24, 16]}>
      {items.map((item) => (
        <Col key={item.label} xs={24} sm={12} md={8} lg={6}>
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '22px' }}>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap', lineHeight: '22px' }}>{item.label}：</span>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.88)', wordBreak: 'break-all', lineHeight: '22px' }}>{item.value}</span>
          </div>
        </Col>
      ))}
    </Row>
  )
}

function DetailImages({ title, urls, background = false, width, height, objectFit = 'contain', topGap = 0 }: { title: string; urls?: string; background?: boolean; width?: number; height?: number; objectFit?: 'contain' | 'cover'; topGap?: number }) {
  const list = (urls || '').split(',').map((u) => u.trim()).filter(Boolean)
  const sizeStyle = width != null && height != null
    ? { width, height }
    : width != null
      ? { width, height: 'auto' }
      : height != null
        ? { height, width: 'auto', maxWidth: '100%' }
        : { height: 96, width: 'auto', maxWidth: '100%' }
  return (
    <div style={{ marginTop: 12 + topGap }}>
      <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>{title}：</div>
      {list.length === 0 ? (
        <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.88)' }}>--</span>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {list.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`${title}${index + 1}`}
              style={{
                ...sizeStyle,
                objectFit,
                borderRadius: 4,
                padding: 4,
                boxSizing: 'border-box',
                background: background ? 'rgba(0,0,0,0.04)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
