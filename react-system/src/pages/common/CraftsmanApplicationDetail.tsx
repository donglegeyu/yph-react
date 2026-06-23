import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Empty, Skeleton } from 'antd'
import { DetailPageTemplate, CompanyButton, type DetailTagItem, type DetailFieldItem } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { formatAreaCode } from '@/utils/address'
import { formatSourceChannel } from '@/constants/sourceChannels'
import { useStatusMap } from '@/hooks'
import { useSmartBack } from '@/hooks/useSmartBack'
import { DetailSection, DetailGrid, DetailImages, CapabilityTable, type CertificateItem } from './craftsman-detail-shared'
import './CraftsmanApplicationDetail.scss'

interface ApplicationDetail {
  id: number
  applicationNo: string
  applicationType: string
  status: string
  name: string
  phone: string
  userAccount: string
  email: string
  serviceProviderName: string
  sourceChannel?: string
  craftsmanCategory: string
  craftsmanType: number
  formData?: string
  rejectReason?: string
  createTime: string
}

interface FormDataType {
  name?: string
  phone?: string
  userAccount?: string
  email?: string
  serviceProviderName?: string
  sourceChannel?: string
  craftsmanCategory?: string
  craftsmanType?: number
  birthday?: string
  idCardNo?: string
  idCardValidDate?: string
  age?: number | string
  residentialAreaCode?: string
  residentialStreet?: string
  residentialDetail?: string
  residentialAddress?: string
  serviceArea?: string
  idCardImages?: string
  workCertificate?: string
  serviceRecord?: string
  noCriminalCertificate?: string
  certificates?: CertificateItem[]
  brandNames?: string
}

const categoryMap: Record<string, string> = {
  outsource: '外部员工',
  internal: '内部员工',
}

const craftsmanTypeMap: Record<number, string> = {
  1: '正式工匠',
  2: '意向工匠',
}

const applicationTypeMap: Record<string, string> = {
  add: '新增',
  edit: '修改',
  delete: '删除',
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

export default function CraftsmanApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const handleSmartBack = useSmartBack()
  const { registerStatusMap, getStatusText } = useStatusMap()
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    registerStatusMap({
      draft: { text: '草稿', color: 'status-draft' },
      pending: { text: '审批中', color: 'status-pending' },
      approved: { text: '审批通过', color: 'status-approved' },
      rejected: { text: '已驳回', color: 'status-rejected' },
    })
  }, [registerStatusMap])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.CRAFTSMAN_APPLICATIONS}/${id}`)
        const json = await res.json()
        if (!cancelled && json.code === 200 && json.data) {
          const app = json.data as ApplicationDetail
          if (app.status === 'approved' && !app.formData) {
            try {
              const searchRes = await fetch(`${API_ENDPOINTS.CRAFTSMEN}?current=1&size=1&keyword=${encodeURIComponent(app.name || '')}&phone=${encodeURIComponent(app.phone || '')}`)
              const searchJson = await searchRes.json()
              if (!cancelled && searchJson.code === 200 && searchJson.data?.records?.[0]) {
                const craftsmanId = searchJson.data.records[0].id
                const detailRes = await fetch(`${API_ENDPOINTS.CRAFTSMEN}/${craftsmanId}`)
                const detailJson = await detailRes.json()
                if (!cancelled && detailJson.code === 200 && detailJson.data) {
                  app.formData = JSON.stringify(detailJson.data)
                }
              }
            } catch {
              // ignore fallback
            }
          }
          if (!cancelled) setDetail(app)
        } else if (!cancelled) {
          setDetail(null)
        }
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const formDataObj = useMemo<FormDataType>(() => {
    if (!detail?.formData) return {}
    try {
      return JSON.parse(detail.formData) as FormDataType
    } catch {
      return {}
    }
  }, [detail])

  const merged = useMemo<FormDataType>(() => ({
    ...formDataObj,
    name: detail?.name || formDataObj.name,
    phone: detail?.phone || formDataObj.phone,
    userAccount: detail?.userAccount || formDataObj.userAccount,
    serviceProviderName: detail?.serviceProviderName || formDataObj.serviceProviderName,
    craftsmanCategory: detail?.craftsmanCategory || formDataObj.craftsmanCategory,
    craftsmanType: detail?.craftsmanType || formDataObj.craftsmanType,
  }), [detail, formDataObj])

  const capabilityData = useMemo(() => {
    const rawCerts = merged.certificates as unknown
    const certList: CertificateItem[] = (() => {
      if (Array.isArray(rawCerts)) return rawCerts as CertificateItem[]
      if (rawCerts && typeof rawCerts === 'object') {
        return Object.entries(rawCerts as Record<string, string>).map(([type, urls]) => ({
          certificateType: type,
          certificateImage: urls,
          skillName: '',
        }))
      }
      return []
    })()
    const rawServiceArea = (merged as Record<string, unknown>).serviceAreas
    const serviceAreaStr = Array.isArray(rawServiceArea) ? rawServiceArea.join(',') : merged.serviceArea
    const rawBrands = (merged as Record<string, unknown>).brands
    const brandNamesStr = Array.isArray(rawBrands) ? rawBrands.join(',') : merged.brandNames
    return { certList, serviceAreaStr, brandNamesStr }
  }, [merged])

  const tags: DetailTagItem[] = useMemo(() => {
    if (!detail) return []
    return [
      { text: getStatusText(detail.status), variant: detail.status === 'approved' ? 'success' : 'default' },
      { text: applicationTypeMap[detail.applicationType] || detail.applicationType, variant: 'default' },
      { text: categoryMap[merged.craftsmanCategory || ''] || merged.craftsmanCategory || '--', variant: 'default' },
      { text: craftsmanTypeMap[merged.craftsmanType || 0] || '--', variant: 'default' },
    ]
  }, [detail, merged, getStatusText])

  const infoFields: DetailFieldItem[] = useMemo(() => {
    if (!detail) return []
    return [
      { label: '申请单号', value: detail.applicationNo || '--' },
      { label: '所属服务商', value: merged.craftsmanCategory === 'external' ? '--' : (merged.serviceProviderName || '--') },
      { label: '手机号', value: maskPhone(merged.phone) },
      { label: '用户账号', value: merged.userAccount || '--' },
      { label: '来源渠道', value: formatSourceChannel(merged.sourceChannel) },
      { label: '邮箱', value: merged.email || '--' },
    ]
  }, [detail, merged])

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
        <Empty description="申请单不存在或已删除" />
      </div>
    )
  }

  const canEdit = detail.status === 'draft' || detail.status === 'rejected'

  return (
    <div className="craftsman-application-detail-page" style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
      <DetailPageTemplate
        title="申请单详情"
        showBack
        onBack={handleSmartBack}
        titleActions={
          canEdit ? (
            <CompanyButton
              type="primary"
              onClick={() => navigate(`/craftsman-application/${detail.id}/edit`, { state: { from: location.pathname, mode: 'application' } })}
            >
              编辑
            </CompanyButton>
          ) : null
        }
        avatar={(merged.name || '?').charAt(0)}
        primaryName={merged.name}
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
                    { label: '省市区', value: formatAreaCode(merged.residentialAreaCode) },
                    { label: '街道', value: merged.residentialStreet || '--' },
                    { label: '详细地址', value: merged.residentialDetail || '--' },
                  ]} />
                </DetailSection>

                <DetailSection title="身份证信息">
                  <DetailImages title="身份证图片" urls={merged.idCardImages} background width={152} height={96} />
                  <DetailGrid items={[
                    { label: '出生日期', value: merged.birthday || '--' },
                    { label: '身份证号', value: merged.idCardNo || '--' },
                    { label: '年龄', value: merged.age != null ? `${merged.age}岁` : '--' },
                    { label: '有效期', value: formatIdCardValidDate(merged.idCardValidDate) },
                  ]} />
                </DetailSection>

                <DetailSection title="佐证材料">
                  <DetailImages title="工作证明" urls={merged.workCertificate} background width={116} height={155} />
                  {merged.serviceRecord && <DetailImages title="服务记录" urls={merged.serviceRecord} background width={116} height={155} topGap={12} />}
                  <DetailImages title="无犯罪证明" urls={merged.noCriminalCertificate} background width={116} height={155} topGap={12} />
                </DetailSection>

                {detail.rejectReason && (
                  <DetailSection title="驳回原因">
                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>{detail.rejectReason}</div>
                  </DetailSection>
                )}
              </div>
            ),
          },
          {
            key: 'capability',
            label: '接单能力',
            children: (
              <CapabilityTable
                craftsmanName={merged.name || ''}
                certificates={capabilityData.certList}
                serviceArea={capabilityData.serviceAreaStr}
                brandNames={capabilityData.brandNamesStr}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
