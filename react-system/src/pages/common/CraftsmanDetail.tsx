import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Empty, Skeleton, type TableColumnsType } from 'antd'
import { DetailPageTemplate, CompanyButton, CompanyMessage, CompanyTable, CompanyTag, type DetailTagItem, type DetailFieldItem } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { formatAreaCode } from '@/utils/address'
import { formatSourceChannel } from '@/constants/sourceChannels'
import { useStatusMap } from '@/hooks'
import { useSmartBack } from '@/hooks/useSmartBack'
import { DetailSection, DetailGrid, DetailImages, CapabilityTable, type CertificateItem } from './craftsman-detail-shared'
import './CraftsmanDetail.scss'

interface CraftsmanRecord {
  [key: string]: unknown
  id: number
  craftsmanCode: string
  name: string
  phone: string
  userAccount: string
  email: string
  serviceProviderName: string
  sourceChannel?: string
  craftsmanCategory: string
  craftsmanType: number
  region: string
  serviceSkillNames?: string
  serviceSkillImages?: string
  brandNames?: string
  certificates?: CertificateItem[]
  registerTime: string
  status: number
  createTime: string
  birthday?: string
  idCardNo?: string
  idCardValidDate?: string
  age?: number | string
  residentialAddress?: string
  residentialAreaCode?: string
  residentialStreet?: string
  residentialDetail?: string
  serviceArea?: string
  idCardImages?: string
  workCertificate?: string
  serviceRecord?: string
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

function formatIdCardValidDate(raw: string | undefined): string {
  if (!raw) return '--'
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return '--'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ~ ${parts[1]}`
}


export default function CraftsmanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const handleSmartBack = useSmartBack()
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
      { label: '来源渠道', value: formatSourceChannel(detail.sourceChannel) },
      { label: '邮箱', value: detail.email || '--' },
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
      onBack={handleSmartBack}
      titleActions={
        <CompanyButton type="primary" onClick={() => navigate(`/craftsman-search/${detail.id}/edit`, { state: { from: location.pathname } })}>
          变更
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
              <DetailSection title="常住地址">
                <DetailGrid items={[
                  { label: '省市区', value: formatAreaCode(detail.residentialAreaCode) },
                  { label: '街道', value: detail.residentialStreet || '--' },
                  { label: '详细地址', value: detail.residentialDetail || '--' },
                ]} />
              </DetailSection>

              <DetailSection title="身份证信息">
                <DetailImages title="身份证图片" urls={detail.idCardImages} background width={152} height={96} />
                <DetailGrid items={[
                  { label: '出生日期', value: detail.birthday || '--' },
                  { label: '身份证号', value: detail.idCardNo || '--' },
                  { label: '年龄', value: detail.age != null ? `${detail.age}岁` : '--' },
                  { label: '有效期', value: formatIdCardValidDate(detail.idCardValidDate) },
                ]} />
              </DetailSection>

              <DetailSection title="佐证材料">
                <DetailImages title="工作证明" urls={detail.workCertificate} background width={116} height={155} />
                {detail.serviceRecord && <DetailImages title="服务记录" urls={detail.serviceRecord} background width={116} height={155} topGap={12} />}
                <DetailImages title="无犯罪证明" urls={detail.noCriminalCertificate} background width={116} height={155} topGap={12} />
              </DetailSection>
            </div>
          ),
        },
        {
          key: 'capability',
          label: '接单能力',
          children: (
            <CapabilityTable
              craftsmanName={detail.name}
              certificates={detail.certificates}
              serviceArea={detail.serviceArea}
              brandNames={detail.brandNames}
            />
          ),
        },
        {
          key: 'workorder',
          label: '工单列表',
          children: <WorkorderTable craftsmanName={detail.name} />,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
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

