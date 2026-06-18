import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Empty, Skeleton, Row, Col, Image, type TableColumnsType } from 'antd'
const { PreviewGroup } = Image
import { DetailPageTemplate, CompanyButton, CompanyMessage, CompanyTable, CompanyTag, SectionTitle, type DetailFieldItem, type DetailTagItem } from '@donglegeyu/company-ui'
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
      { label: '服务技能', value: allSkillNames || '--' },
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
          children: <CapabilityTable craftsmanName={detail.name} />,
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

interface CertificateRecord {
  id: number
  certificateType: string
  certificateNo: string
  certificateImage: string
  skillNames: string[]
  status: 'valid' | 'expiring' | 'expired'
  effectiveDate: string
  expiryDate: string
  remind: string
}

const certificateStatusMap: Record<CertificateRecord['status'], { text: string; color: string }> = {
  valid: { text: '有效', color: 'success' },
  expiring: { text: '即将过期', color: 'warning' },
  expired: { text: '已过期', color: 'default' },
}

const certificateDataSource: CertificateRecord[] = [
  {
    id: 1,
    certificateType: '燃气具安装维修工证',
    certificateNo: 'RQ202103150001',
    certificateImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?fit=crop',
    skillNames: ['燃气具安装', '燃气具维修'],
    status: 'valid',
    effectiveDate: '2023-03-15',
    expiryDate: '2026-03-14',
    remind: '到期前30天提醒',
  },
  {
    id: 2,
    certificateType: '燃气安全操作证',
    certificateNo: 'GA202205100001',
    certificateImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?fit=crop',
    skillNames: ['燃气安全检查'],
    status: 'expiring',
    effectiveDate: '2022-05-10',
    expiryDate: '2025-07-09',
    remind: '即将到期，请尽快更换',
  },
  {
    id: 3,
    certificateType: '管道工职业资格证',
    certificateNo: 'GD202301200001',
    certificateImage: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?fit=crop',
    skillNames: ['管道安装', '管道维修'],
    status: 'valid',
    effectiveDate: '2023-01-20',
    expiryDate: '2028-01-19',
    remind: '到期前30天提醒',
  },
  {
    id: 4,
    certificateType: 'PE管焊接操作证',
    certificateNo: 'PE202111050001',
    certificateImage: 'https://images.unsplash.com/photo-1565728744382-61accd4aa148?fit=crop',
    skillNames: ['PE管焊接'],
    status: 'expired',
    effectiveDate: '2021-11-05',
    expiryDate: '2024-11-04',
    remind: '已过期，请立即更换',
  },
]

const allSkillNames = Array.from(new Set(certificateDataSource.flatMap((c) => c.skillNames))).join('、')

function CapabilityTable({ craftsmanName }: { craftsmanName: string }) {
  const dataSource = useMemo(() => certificateDataSource, [])

  const columns: TableColumnsType<CertificateRecord> = [
    {
      title: '证照图片',
      dataIndex: 'certificateImage',
      key: 'certificateImage',
      width: 100,
      render: (url: string) => {
        if (!url) return <span style={{ color: 'rgba(0,0,0,0.25)' }}>-</span>
        return (
          <PreviewGroup preview={{ maxScale: 3 }}>
            <Image
              src={`${url}&w=96&h=96`}
              preview={{ src: `${url}&w=1200&q=85` }}
              height={32}
              style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            />
          </PreviewGroup>
        )
      },
    },
    { title: '证照类型', dataIndex: 'certificateType', key: 'certificateType', width: 180, ellipsis: true },
    { title: '证照编号', dataIndex: 'certificateNo', key: 'certificateNo', width: 160 },
    { title: '对应技能', dataIndex: 'skillNames', key: 'skillNames', width: 160, ellipsis: true, render: (skills: string[]) => (skills && skills.length > 0 ? skills.join('、') : '--') },
    {
      title: '证照状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CertificateRecord['status']) => {
        const conf = certificateStatusMap[status]
        return <CompanyTag color={conf.color}>{conf.text}</CompanyTag>
      },
    },
    { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 120 },
    { title: '失效日期', dataIndex: 'expiryDate', key: 'expiryDate', width: 120 },
    { title: '提醒', dataIndex: 'remind', key: 'remind', width: 180, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: () => (
        <CompanyButton type="link" style={{ padding: 0 }} onClick={() => CompanyMessage.info(`${craftsmanName} 的更换证照功能开发中`)}>
          更换证照
        </CompanyButton>
      ),
    },
  ]

  return (
    <div style={{ padding: '0 0 16px' }}>
      <CompanyTable
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 1200 }}
        locale={{ emptyText: '暂无证照数据' }}
      />
    </div>
  )
}
