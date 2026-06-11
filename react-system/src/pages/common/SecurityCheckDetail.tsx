import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CompanyButton, CompanyTable, CompanyTabs, CompanyTag, CompanyMessage, PageTitle } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import request from '@/utils/request'
import './SecurityCheckDetail.scss'

interface CheckItem {
  [key: string]: unknown
  id: number
  projectName: string
  checkContent: string
  checkResult: string
  status: string
  remark: string
}

interface DetailInfo {
  id: number
  orderNo: string
  gasCode: string
  phone: string
  reportBook: string
  area: string
  company: string
  checkUser: string
  status: string
  userType: string
  uploadStatus: string
  avatarName: string
}

const checkItemColumns = [
  { key: 'projectName', label: '检查项目', visible: true, width: 180 },
  { key: 'checkContent', label: '检查内容', visible: true, width: 260 },
  { key: 'checkResult', label: '检查结果', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'remark', label: '备注', visible: true, width: 200 },
]

const infoFields = [
  { label: '工单编号', key: 'orderNo' },
  { label: '燃气编号', key: 'gasCode' },
  { label: '联系电话', key: 'phone' },
  { label: '报表册', key: 'reportBook' },
  { label: '安检片区', key: 'area' },
  { label: '所属公司', key: 'company' },
]

export default function SecurityCheckDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<DetailInfo | null>(null)
  const [checkItems, setCheckItems] = useState<CheckItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('result')

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await request.get(`${API_ENDPOINTS.SECURITY_CHECKS}/${id}`)
      if (res?.data) {
        setDetail(res.data as DetailInfo)
      }
    } catch {
      CompanyMessage.error('获取详情失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const tableColumns = checkItemColumns
    .filter((col) => col.visible)
    .map((col) => ({
      key: col.key,
      dataIndex: col.key,
      title: col.label,
      width: col.width,
      render: (text: string) => {
        if (col.key === 'status') {
          const statusColor: Record<string, string> = {
            '\u5408\u683c': 'status-approved',
            '\u4e0d\u5408\u683c': 'status-rejected',
            '\u5f85\u68c0\u67e5': 'status-pending',
          }
          return text ? (
            <CompanyTag className={statusColor[text] || 'status-pending'}>{text}</CompanyTag>
          ) : (
            <span style={{ color: 'var(--color-text-tertiary)' }}>--</span>
          )
        }
        return text || '--'
      },
    }))

  const tabs = [
    { key: 'result', label: '安检结果' },
    { key: 'photos', label: '现场照片' },
    { key: 'history', label: '历史记录' },
  ]

  return (
    <div className="security-check-detail">
      <PageTitle title="安检详情" showBack onBack={() => navigate('/security-check-query')} />

      {detail && (
        <div className="scd-user-card">
          <div className="scd-user-top">
            <div className="scd-user-info">
              <div className="scd-avatar">
                {detail.avatarName?.charAt(0) || '?'}
              </div>
              <span className="scd-username">{detail.checkUser || '--'}</span>
            </div>
            <div className="scd-user-tags">
              {detail.status && (
                <CompanyTag className="scd-tag-default">{detail.status}</CompanyTag>
              )}
              {detail.userType && (
                <CompanyTag className="scd-tag-default">{detail.userType}</CompanyTag>
              )}
              {detail.uploadStatus && (
                <CompanyTag className="scd-tag-volcano">{detail.uploadStatus}</CompanyTag>
              )}
            </div>
          </div>
          <div className="scd-user-fields">
            {infoFields.map((field) => (
              <div className="scd-field-item" key={field.key}>
                <span className="scd-field-label">{field.label}：</span>
                <span className="scd-field-value">
                  {(detail as Record<string, string>)[field.key] || '--'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="scd-divider" />

      <div className="scd-content">
        <CompanyTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'result',
              label: '安检结果',
              children: (
                <CompanyTable
                  dataSource={checkItems}
                  columns={tableColumns as object[]}
                  loading={loading}
                  pagination={false}
                  rowKey="id"
                  locale={{ emptyText: '暂无数据' }}
                />
              ),
            },
            {
              key: 'photos',
              label: '现场照片',
              children: <div className="scd-empty">暂无照片</div>,
            },
            {
              key: 'history',
              label: '历史记录',
              children: <div className="scd-empty">暂无历史记录</div>,
            },
          ]}
        />
      </div>
    </div>
  )
}
