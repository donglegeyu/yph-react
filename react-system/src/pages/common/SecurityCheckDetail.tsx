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
      } else {
        setDetail(mockDetail(id))
      }
    } catch {
      setDetail(mockDetail(id))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    setCheckItems(mockCheckItems)
  }, [])

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

const mockCheckItems: CheckItem[] = [
  { id: 1, projectName: '燃气表检查', checkContent: '检查燃气表是否正常运行', checkResult: '合格', status: '合格', remark: '燃气表读数正常' },
  { id: 2, projectName: '管道密封性', checkContent: '检查管道接口密封情况', checkResult: '合格', status: '合格', remark: '' },
  { id: 3, projectName: '阀门检查', checkContent: '检查阀门开关是否灵活', checkResult: '合格', status: '合格', remark: '' },
  { id: 4, projectName: '报警器检查', checkContent: '检查燃气报警器是否正常', checkResult: '不合格', status: '不合格', remark: '报警器电池电量不足，建议更换' },
  { id: 5, projectName: '通风检查', checkContent: '检查厨房通风情况', checkResult: '合格', status: '合格', remark: '' },
  { id: 6, projectName: '软管检查', checkContent: '检查燃气软管是否老化', checkResult: '待检查', status: '待检查', remark: '软管使用已超2年，建议更换' },
]

function mockDetail(id: string): DetailInfo {
  return {
    id: Number(id) || 1,
    orderNo: 'GD20260415001',
    gasCode: 'RQ2026001234',
    phone: '138****8888',
    reportBook: '第3册',
    area: '城东片区',
    company: '城市燃气有限公司',
    checkUser: '张三',
    status: '已安检',
    userType: '居民用户',
    uploadStatus: '已上传',
    avatarName: '张三',
  }
}
