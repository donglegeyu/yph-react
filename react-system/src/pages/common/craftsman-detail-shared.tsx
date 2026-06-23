import { useMemo } from 'react'
import { Row, Col, Image, type TableColumnsType } from 'antd'
const { PreviewGroup } = Image
import { CompanyTable, CompanyTag, CompanyButton, CompanyMessage, SectionTitle } from '@donglegeyu/company-ui'
import { mockCertificateInfo } from '@/utils/craftsman'
import { buildCategoryPath } from '@/pages/common/categoryOptions'
import { formatBrandNames } from '@/constants/brands'

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionTitle title={title} />
      {children}
    </div>
  )
}

export function DetailGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <Row className="detail-info-grid" gutter={[24, 16]}>
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

function formatServiceArea(raw: string | undefined): string {
  if (!raw) return '--'
  return raw
    .split(/[,，;；]/)
    .map((s) => s.trim().replace(/\//g, ' / '))
    .filter(Boolean)
    .join('、')
}

export function DetailImages({ title, urls, background = false, width, height, objectFit = 'contain', topGap = 0 }: { title: string; urls?: string | string[]; background?: boolean; width?: number; height?: number; objectFit?: 'contain' | 'cover'; topGap?: number }) {
  const rawList = Array.isArray(urls) ? urls : (urls || '').split(',')
  const list = rawList.map((u) => String(u).trim()).filter(Boolean)
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

export interface CertificateItem {
  skillName: string
  certificateType: string
  certificateImage: string
  category1?: string
  category2?: string
  category3?: string
}

interface CertificateRecord {
  id: number
  certificateType: string
  certificateNo: string
  certificateImage: string
  skillName: string
  category1?: string
  category2?: string
  category3?: string
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

export function CapabilityTable({
  craftsmanName,
  certificates,
  serviceArea,
  brandNames,
}: {
  craftsmanName: string
  certificates?: CertificateItem[]
  serviceArea?: string
  brandNames?: string
}) {
  const dataSource = useMemo<CertificateRecord[]>(() => {
    if (!certificates || certificates.length === 0) return []
    return certificates.map((c, i) => {
      const info = mockCertificateInfo(c.certificateType, i)
      return {
        id: i + 1,
        certificateType: c.certificateType || '',
        certificateNo: info.certificateNo,
        certificateImage: c.certificateImage || '',
        skillName: c.skillName || '',
        category1: c.category1 || '',
        category2: c.category2 || '',
        category3: c.category3 || '',
        status: info.status,
        effectiveDate: info.effectiveDate,
        expiryDate: info.expiryDate,
      }
    })
  }, [certificates])

  const renderText = (v: string) => v || <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span>

  const columns: TableColumnsType<CertificateRecord> = [
    { title: '服务技能', dataIndex: 'skillName', key: 'skillName', width: 160, ellipsis: true, render: renderText },
    { title: '三级品类', dataIndex: 'category3', key: 'category3', width: 320, ellipsis: true, render: (_: unknown, record: CertificateRecord) => {
      const path = buildCategoryPath(record.category1, record.category2, record.category3)
      return path || <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span>
    }},
    { title: '证件类型', dataIndex: 'certificateType', key: 'certificateType', width: 180, ellipsis: true, render: renderText },
    {
      title: '证照图片',
      dataIndex: 'certificateImage',
      key: 'certificateImage',
      width: 100,
      render: (raw: string) => {
        if (!raw) return <span style={{ color: 'rgba(0,0,0,0.25)' }}>--</span>
        const urls = raw.split(',').filter(Boolean)
        return (
          <PreviewGroup>
            {urls.map((url, idx) => (
              <Image
                key={idx}
                src={url}
                width={32}
                height={32}
                style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', marginRight: 4, border: '1px solid rgba(0,0,0,0.08)' }}
              />
            ))}
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
      render: (_: unknown, record: CertificateRecord) => (
        <CompanyButton
          type="link"
          disabled={!record.certificateNo}
          style={{ padding: 0 }}
          onClick={() => CompanyMessage.info(`${craftsmanName} 的更换证照功能开发中`)}
        >
          更换证照
        </CompanyButton>
      ),
    },
  ]

  return (
    <div className="capability-tab-wrap">
      <div className="capability-info-bar">
        <div className="capability-info-item">
          <span className="capability-info-label">接单区域</span>
          <span className="capability-info-value">
            {serviceArea ? formatServiceArea(serviceArea) : '--'}
          </span>
        </div>
        <div className="capability-info-item">
          <span className="capability-info-label">品牌</span>
          <span className="capability-info-value">
            {brandNames ? formatBrandNames(brandNames) : '--'}
          </span>
        </div>
      </div>
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
