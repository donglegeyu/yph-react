import { useEffect, useState } from 'react'
import { theme } from 'antd'
import {
  CompanyDescriptions,
  CompanyEmpty,
  CompanyMessage,
  CompanyTag,
  CompanyTimeline,
  DrawerDetailTemplate,
  SectionTitle,
} from '@donglegeyu/company-ui'
import {
  actionText,
  fetchInstanceDetail,
  fmtTime,
  INSTANCE_STATUS_META,
  type InstanceDetail,
} from './api'

interface InstanceDetailDrawerProps {
  open: boolean
  instanceId: string | null
  onClose: () => void
}

/** 审批实例详情抽屉：我发起的 / 已办 / 抄送列表共用 */
export function InstanceDetailDrawer({ open, instanceId, onClose }: InstanceDetailDrawerProps) {
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InstanceDetail | null>(null)

  // 状态重置依赖父组件用 key 重挂载（key 随 open/instanceId 变化），effect 只负责拉取数据
  useEffect(() => {
    if (!open || !instanceId) {
      return
    }
    let ignore = false
    fetchInstanceDetail(instanceId)
      .then((res) => {
        if (ignore) return
        if (res.code === 200 && res.data) {
          setDetail(res.data)
        } else {
          CompanyMessage.error(res.message || '实例详情加载失败')
        }
      })
      .catch(() => {
        if (!ignore) CompanyMessage.error('实例详情加载失败')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [open, instanceId])

  const statusMeta = detail
    ? INSTANCE_STATUS_META[detail.status] || { text: detail.status, color: 'default' as const }
    : null

  return (
    <DrawerDetailTemplate
      title="审批实例详情"
      width={640}
      open={open}
      loading={loading}
      onClose={onClose}
      headerContent={
        detail ? <span style={{ fontWeight: 600 }}>{detail.title || '未关联业务单据'}</span> : null
      }
    >
      {detail ? (
        <>
          <CompanyDescriptions
            column={1}
            size="small"
            bordered
            items={[
              { key: 'processName', label: '流程', children: detail.processName || '-' },
              { key: 'title', label: '申请标题', children: detail.title || '-' },
              { key: 'businessNo', label: '业务单号', children: detail.businessNo || '-' },
              {
                key: 'status',
                label: '状态',
                children: <CompanyTag color={statusMeta?.color}>{statusMeta?.text || detail.status}</CompanyTag>,
              },
              {
                key: 'currentNodes',
                label: '当前节点',
                children: detail.currentNodes.length
                  ? detail.currentNodes.map((node) => node.nodeName || node.nodeKey).join('、')
                  : '-',
              },
              { key: 'startTime', label: '发起时间', children: fmtTime(detail.startTime) },
              { key: 'endTime', label: '结束时间', children: fmtTime(detail.endTime) },
              {
                key: 'formData',
                label: '表单内容',
                children: detail.formData ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{detail.formData}</pre>
                ) : (
                  '-'
                ),
              },
            ]}
          />

          <SectionTitle title="处理记录" />
          {detail.timeline.length ? (
            <CompanyTimeline
              items={detail.timeline.map((item) => ({
                color: item.action === 'reject' ? 'red' : 'green',
                children: (
                  <div>
                    <div>
                      {item.operatorName || '-'} · {actionText(item.action)}
                    </div>
                    <div style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                      {fmtTime(item.time)} {item.comment ? `· ${item.comment}` : ''}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <CompanyEmpty image={CompanyEmpty.PRESENTED_IMAGE_SIMPLE} description="暂无处理记录" />
          )}
        </>
      ) : null}
    </DrawerDetailTemplate>
  )
}
