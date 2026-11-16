import { useEffect, useState } from 'react'
import { theme } from 'antd'
import {
  CompanyDescriptions,
  CompanyMessage,
  CompanyTag,
  DrawerDetailTemplate,
  SectionTitle,
} from '@donglegeyu/company-ui'
import {
  fetchProcessDefinitionDiagram,
  fetchProcessDefinitionXml,
  fmtTime,
  type ProcessDefItem,
} from './api'

interface ProcessDefDetailDrawerProps {
  open: boolean
  record: ProcessDefItem | null
  onClose: () => void
}

/** 流程定义详情抽屉：流程图 + 基本信息 + BPMN XML，启用/停用均可查看 */
export default function ProcessDefDetailDrawer({ open, record, onClose }: ProcessDefDetailDrawerProps) {
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null)
  const [xml, setXml] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !record) {
      return
    }
    let ignore = false
    let objectUrl: string | null = null
    setLoading(true)
    setDiagramUrl(null)
    setXml(null)
    // 流程图是 PNG 裸字节（非 ApiResult 包装），走 fetch + blob
    fetchProcessDefinitionDiagram(record.id)
      .then((blob) => {
        if (ignore) {
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setDiagramUrl(objectUrl)
      })
      .catch(() => {
        if (!ignore) setDiagramUrl(null)
      })
    fetchProcessDefinitionXml(record.id)
      .then((res) => {
        if (ignore) return
        if (res.code === 200 && res.data) {
          setXml(res.data)
        } else {
          CompanyMessage.error(res.message || '流程 XML 加载失败')
        }
      })
      .catch(() => {
        if (!ignore) CompanyMessage.error('流程 XML 加载失败')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, record])

  return (
    <DrawerDetailTemplate
      title="流程定义详情"
      width={720}
      open={open}
      loading={loading}
      onClose={onClose}
      headerContent={record ? <span style={{ fontWeight: 600 }}>{record.name || record.key}</span> : null}
    >
      {record ? (
        <>
          <CompanyDescriptions
            column={2}
            size="small"
            bordered
            items={[
              { key: 'name', label: '流程名称', children: record.name || '-' },
              { key: 'key', label: '流程标识', children: record.key },
              { key: 'version', label: '版本', children: `v${record.version}` },
              {
                key: 'suspended',
                label: '状态',
                children: record.suspended ? (
                  <CompanyTag color="warning">已停用</CompanyTag>
                ) : (
                  <CompanyTag color="success">已启用</CompanyTag>
                ),
              },
              { key: 'deployTime', label: '发布时间', children: fmtTime(record.deployTime) },
              { key: 'deploymentId', label: '部署 ID', children: <span style={{ fontSize: 12 }}>{record.deploymentId}</span> },
            ]}
          />

          <SectionTitle title="流程图" />
          {diagramUrl ? (
            <img
              src={diagramUrl}
              alt="流程图"
              style={{ maxWidth: '100%', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 4 }}
            />
          ) : (
            <div style={{ color: token.colorTextTertiary, fontSize: 13 }}>流程图加载失败或流程文件缺少图形信息</div>
          )}

          {xml ? (
            <>
              <SectionTitle title="BPMN XML" />
              <pre
                style={{
                  margin: 0,
                  maxHeight: 320,
                  overflow: 'auto',
                  padding: 12,
                  fontSize: 12,
                  lineHeight: 1.6,
                  background: token.colorFillTertiary,
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {xml}
              </pre>
            </>
          ) : null}
        </>
      ) : null}
    </DrawerDetailTemplate>
  )
}
