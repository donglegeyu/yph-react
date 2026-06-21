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

function formatServiceArea(raw: string | undefined): string {
  if (!raw) return '--'
  return raw
    .split(/[,，]/)
    .map((s) => s.trim().replace(/\//g, ' / '))
    .filter(Boolean)
    .join('，')
}

function formatResidentialAddress(raw: string | undefined): string {
  if (!raw) return '--'
  const match = raw.match(/^(.+?[市省])(.+?[市区县])(.+?(?:街道|镇|乡))?(.*)$/s)
  if (!match) return raw
  const [, province, district, street = '', detail = ''] = match
  return [province, district, street, detail].filter(Boolean).join(' ')
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
    <div className="craftsman-detail-page" style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
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
                  { label: '常住地址', value: formatResidentialAddress(detail.residentialAddress) },
                  { label: '接单区域', value: formatServiceArea(detail.serviceArea) },
                ]} />
                <DetailImages title="身份证图片" urls={detail.idCardImages} background topGap={12} />
              </DetailSection>

              <DetailSection title="佐证材料">
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
          children: <WorkorderTable craftsmanName={detail.name} />,
        },
        {
          key: 'changelog',
          label: '变更记录',
          children: <ChangelogTable />,
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
  skillName: string
  status: 'valid' | 'expiring' | 'expired' | ''
  effectiveDate: string
  expiryDate: string
}

const certificateStatusMap: Record<CertificateRecord['status'], { text: string; color: string }> = {
  '': { text: '-', color: 'default' },
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
    skillName: '燃气具安装',
    status: 'valid',
    effectiveDate: '2023-03-15',
    expiryDate: '2026-03-14',
  },
  {
    id: 2,
    certificateType: '燃气安全操作证',
    certificateNo: 'GA202205100001',
    certificateImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?fit=crop',
    skillName: '燃气安全检查',
    status: 'expiring',
    effectiveDate: '2022-05-10',
    expiryDate: '2025-07-09',
  },
  {
    id: 3,
    certificateType: '',
    certificateNo: '',
    certificateImage: '',
    skillName: '保洁服务',
    status: '',
    effectiveDate: '',
    expiryDate: '',
  },
  {
    id: 4,
    certificateType: 'PE管焊接操作证',
    certificateNo: 'PE202111050001',
    certificateImage: 'https://images.unsplash.com/photo-1565728744382-61accd4aa148?fit=crop',
    skillName: 'PE管焊接',
    status: 'expired',
    effectiveDate: '2021-11-05',
    expiryDate: '2024-11-04',
  },
]

const allSkillNames = Array.from(new Set(certificateDataSource.map((c) => c.skillName))).join('、')

function CapabilityTable({ craftsmanName }: { craftsmanName: string }) {
  const dataSource = useMemo(() => certificateDataSource, [])

  const renderText = (v: string) => v || <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span>

  const columns: TableColumnsType<CertificateRecord> = [
    { title: '服务技能', dataIndex: 'skillName', key: 'skillName', width: 160, ellipsis: true },
    { title: '证件类型', dataIndex: 'certificateType', key: 'certificateType', width: 180, ellipsis: true, render: renderText },
    {
      title: '证照图片',
      dataIndex: 'certificateImage',
      key: 'certificateImage',
      width: 100,
      render: (url: string) => {
        if (!url) return <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span>
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
    { title: '证照编号', dataIndex: 'certificateNo', key: 'certificateNo', width: 160, render: renderText },
    {
      title: '证照状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CertificateRecord['status']) => {
        if (!status) return <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span>
        const conf = certificateStatusMap[status]
        return <CompanyTag color={conf.color}>{conf.text}</CompanyTag>
      },
    },
    { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 120, render: renderText },
    { title: '失效日期', dataIndex: 'expiryDate', key: 'expiryDate', width: 120, render: renderText },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: CertificateRecord) => {
        const hasCert = !!record.certificateNo
        return (
          <CompanyButton
            type="link"
            disabled={!hasCert}
            style={{ padding: 0 }}
            onClick={() => CompanyMessage.info(`${craftsmanName} 的更换证照功能开发中`)}
          >
            更换证照
          </CompanyButton>
        )
      },
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

interface WorkorderRecord {
  id: number
  orderNo: string
  region: string
  orderType: string
  userName: string
  userPhone: string
  userAddress: string
  status: 'completed' | 'processing' | 'pending' | 'cancelled'
  serviceProvider: string
  saleOrderNo: string
  createTime: string
  dispatchTime: string
  completeTime: string
  urgency: 'normal' | 'urgent' | 'veryUrgent'
  orderSource: string
}

const workorderStatusMap: Record<WorkorderRecord['status'], { text: string; color: string }> = {
  completed: { text: '已完成', color: 'success' },
  processing: { text: '处理中', color: 'processing' },
  pending: { text: '待接单', color: 'warning' },
  cancelled: { text: '已取消', color: 'default' },
}

const urgencyMap: Record<WorkorderRecord['urgency'], { text: string; color: string }> = {
  normal: { text: '普通', color: 'default' },
  urgent: { text: '紧急', color: 'warning' },
  veryUrgent: { text: '非常紧急', color: 'error' },
}

const workorderDataSource: WorkorderRecord[] = [
  { id: 1, orderNo: 'WGD20230615001', region: '北京-朝阳区', orderType: '安装', userName: '张先生', userPhone: '138****1234', userAddress: '北京市朝阳区建国路88号', status: 'completed', serviceProvider: '北京燃气服务公司', saleOrderNo: 'SO20230615001', createTime: '2023-06-14 16:30', dispatchTime: '2023-06-14 17:00', completeTime: '2023-06-15 10:30', urgency: 'normal', orderSource: '400热线' },
  { id: 2, orderNo: 'WGD20230620001', region: '上海-浦东新区', orderType: '维修', userName: '李女士', userPhone: '139****5678', userAddress: '上海市浦东新区张江路100号', status: 'processing', serviceProvider: '上海燃气服务公司', saleOrderNo: 'SO20230620001', createTime: '2023-06-19 09:15', dispatchTime: '2023-06-19 10:00', completeTime: '', urgency: 'urgent', orderSource: 'APP下单' },
  { id: 3, orderNo: 'WGD20230701001', region: '广州-天河区', orderType: '检修', userName: '王先生', userPhone: '137****8888', userAddress: '广州市天河区体育西路50号', status: 'completed', serviceProvider: '广州燃气服务公司', saleOrderNo: 'SO20230701001', createTime: '2023-06-30 14:00', dispatchTime: '2023-06-30 14:30', completeTime: '2023-07-01 11:00', urgency: 'normal', orderSource: '小程序' },
  { id: 4, orderNo: 'WGD20230705001', region: '深圳-南山区', orderType: '安装', userName: '赵女士', userPhone: '136****6666', userAddress: '深圳市南山区科技园南区', status: 'pending', serviceProvider: '深圳燃气服务公司', saleOrderNo: 'SO20230705001', createTime: '2023-07-04 18:20', dispatchTime: '', completeTime: '', urgency: 'veryUrgent', orderSource: '400热线' },
  { id: 5, orderNo: 'WGD20230710001', region: '成都-武侯区', orderType: '维修', userName: '钱先生', userPhone: '135****3333', userAddress: '成都市武侯区人民南路四段', status: 'cancelled', serviceProvider: '成都燃气服务公司', saleOrderNo: 'SO20230710001', createTime: '2023-07-09 10:45', dispatchTime: '', completeTime: '', urgency: 'normal', orderSource: 'APP下单' },
  { id: 6, orderNo: 'WGD20230715001', region: '杭州-西湖区', orderType: '焊接', userName: '孙女士', userPhone: '134****7777', userAddress: '杭州市西湖区文三路200号', status: 'completed', serviceProvider: '杭州燃气服务公司', saleOrderNo: 'SO20230715001', createTime: '2023-07-14 08:00', dispatchTime: '2023-07-14 08:30', completeTime: '2023-07-15 10:00', urgency: 'urgent', orderSource: '小程序' },
]

function WorkorderTable({ craftsmanName }: { craftsmanName: string }) {
  const dataSource = useMemo(() => workorderDataSource, [])

  const columns: TableColumnsType<WorkorderRecord> = [
    { title: '工单号', dataIndex: 'orderNo', key: 'orderNo', width: 150, fixed: 'left' },
    { title: '所属区域', dataIndex: 'region', key: 'region', width: 130, ellipsis: true },
    { title: '工单类型', dataIndex: 'orderType', key: 'orderType', width: 90 },
    {
      title: '工单状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: WorkorderRecord['status']) => {
        const conf = workorderStatusMap[status]
        return <CompanyTag color={conf.color}>{conf.text}</CompanyTag>
      },
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 90,
      render: (urgency: WorkorderRecord['urgency']) => {
        const conf = urgencyMap[urgency]
        return <CompanyTag color={conf.color}>{conf.text}</CompanyTag>
      },
    },
    { title: '用户姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '用户主叫电话', dataIndex: 'userPhone', key: 'userPhone', width: 130 },
    { title: '用户地址', dataIndex: 'userAddress', key: 'userAddress', width: 200, ellipsis: true },
    { title: '服务商', dataIndex: 'serviceProvider', key: 'serviceProvider', width: 150, ellipsis: true },
    { title: '销售订单号', dataIndex: 'saleOrderNo', key: 'saleOrderNo', width: 150 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    { title: '派单时间', dataIndex: 'dispatchTime', key: 'dispatchTime', width: 150 },
    { title: '完工时间', dataIndex: 'completeTime', key: 'completeTime', width: 150 },
    { title: '工单来源', dataIndex: 'orderSource', key: 'orderSource', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: () => (
        <CompanyButton type="link" style={{ padding: 0 }} onClick={() => CompanyMessage.info(`${craftsmanName} 的工单详情开发中`)}>
          详情
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
        scroll={{ x: 1900 }}
        locale={{ emptyText: '暂无工单数据' }}
      />
    </div>
  )
}

interface ChangelogRecord {
  id: number
  updateTime: string
  before: string
  after: string
  operator: string
}

const changelogDataSource: ChangelogRecord[] = [
  { id: 1, updateTime: '2026-01-15 10:30:00', before: '-', after: '创建工匠账号（张建国）', operator: 'system' },
  { id: 2, updateTime: '2026-01-15 10:35:00', before: '-', after: '工匠类型：意向工匠', operator: 'system' },
  { id: 3, updateTime: '2026-02-03 14:20:00', before: '工匠类型：意向工匠', after: '工匠类型：正式工匠', operator: 'admin001' },
  { id: 4, updateTime: '2026-02-03 14:22:00', before: '状态：启用', after: '状态：禁用', operator: 'admin001' },
  { id: 5, updateTime: '2026-02-10 09:15:00', before: '状态：禁用', after: '状态：启用', operator: 'admin002' },
  { id: 6, updateTime: '2026-03-01 16:40:00', before: '手机号：138****1234', after: '手机号：139****5678', operator: 'zhangjianguo' },
  { id: 7, updateTime: '2026-03-05 11:00:00', before: '常住地址：北京市朝阳区建国路1号', after: '常住地址：北京市朝阳区建国路88号', operator: 'zhangjianguo' },
  { id: 8, updateTime: '2026-03-12 15:30:00', before: '服务技能：燃气具安装', after: '服务技能：燃气具安装、燃气具维修、管道安装', operator: 'admin001' },
  { id: 9, updateTime: '2026-04-08 10:10:00', before: '-', after: '新增证照：燃气安全操作证（GA202205100001）', operator: 'admin002' },
  { id: 10, updateTime: '2026-05-20 13:45:00', before: '身份证号：110*****0001', after: '身份证号：110*****0002', operator: 'admin001' },
]

function ChangelogTable() {
  const dataSource = useMemo(() => changelogDataSource, [])

  const columns: TableColumnsType<ChangelogRecord> = [
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
    { title: '变更前', dataIndex: 'before', key: 'before', width: 320, ellipsis: true, render: (v: string) => v || <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span> },
    { title: '变更后', dataIndex: 'after', key: 'after', width: 360, ellipsis: true, render: (v: string) => v || <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span> },
    { title: '变更人', dataIndex: 'operator', key: 'operator', width: 150, ellipsis: true },
  ]

  return (
    <div style={{ padding: '0 0 16px' }}>
      <CompanyTable
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 1100 }}
        locale={{ emptyText: '暂无变更记录' }}
      />
    </div>
  )
}
