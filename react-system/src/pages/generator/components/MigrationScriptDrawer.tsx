import { useState, useCallback, useEffect, type ReactNode } from 'react'
import {
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanySpace,
  CompanyTable,
  CompanyTag,
  CompanyTypography,
} from '@donglegeyu/company-ui'
import {
  listMigrationScripts,
  checkMigrationReady,
  saveMigrationFileLocal,
  type MigrationScriptItem,
} from '../services'
import './MigrationScriptDrawer.scss'

/** 数据表迁移状态 → 标签文案/颜色 */
export function migrationStatusTag(status?: string | null) {
  switch (status) {
    case 'pending':
      return <CompanyTag color="orange">待入库</CompanyTag>
    case 'ready':
      return <CompanyTag color="green">已就绪</CompanyTag>
    default:
      return <CompanyTag color="default">未生成</CompanyTag>
  }
}

interface Props {
  open: boolean
  onClose: () => void
  /** 脚本被放入项目目录后回调（外部可刷新列表） */
  onChanged?: () => void
}

/**
 * 建表脚本抽屉：展示发布时生成的 Flyway 增量脚本存档
 *
 * 项目红线：系统只生成脚本文本，绝不执行 DDL。
 * 交付方式：下载到项目 db/migration/ 目录（仅本地开发），
 * 研发评审后由 Flyway 在后端启动时执行。
 */
export default function MigrationScriptDrawer({ open, onClose, onChanged }: Props) {
  const isDev = import.meta.env.DEV
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [scripts, setScripts] = useState<MigrationScriptItem[]>([])
  /** 当前查看详情的脚本（null = 详情弹窗关闭） */
  const [detailItem, setDetailItem] = useState<MigrationScriptItem | null>(null)

  const fetchScripts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMigrationScripts()
      if (res.code === 200) {
        setScripts(res.data)
      } else {
        CompanyMessage.error(res.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchScripts()
  }, [open, fetchScripts])

  /** 检查就绪状态：对仍「待入库」的页面逐个校验表/列是否已存在 */
  const handleCheckReady = useCallback(async () => {
    const pendingIds = Array.from(
      new Set(
        scripts
          .filter((s) => s.migrationStatus === 'pending')
          .map((s) => String(s.pageDefinitionId)),
      ),
    )
    if (pendingIds.length === 0) {
      CompanyMessage.info('当前没有待入库的页面需要检查')
      return
    }
    setChecking(true)
    try {
      let readyCount = 0
      for (const id of pendingIds) {
        const res = await checkMigrationReady(id)
        if (res.code === 200 && res.data.status === 'ready') readyCount++
      }
      CompanyMessage.success(`检查完成：${readyCount}/${pendingIds.length} 个页面已就绪`)
      fetchScripts()
      onChanged?.()
    } finally {
      setChecking(false)
    }
  }, [scripts, fetchScripts, onChanged])

  /** 下载到项目 db/migration/ 目录（仅本地开发可用） */
  const handleSaveLocal = useCallback(
    async (item: MigrationScriptItem) => {
      const res = await saveMigrationFileLocal(item.fileName, item.content)
      if (res.code === 200) {
        CompanyMessage.success(`${res.message}，重启后端后由 Flyway 自动建表`)
        fetchScripts()
        onChanged?.()
      } else {
        CompanyMessage.error(res.message)
      }
    },
    [fetchScripts, onChanged],
  )

  const columns = [
    {
      key: 'fileName',
      title: '脚本文件',
      width: 260,
      render: (record: MigrationScriptItem) => (
        <CompanyTypography.Text code style={{ fontSize: 12 }}>
          {record.fileName}
        </CompanyTypography.Text>
      ),
    },
    {
      key: 'pageName',
      title: '所属页面',
      width: 140,
      render: (record: MigrationScriptItem) => (
        <span>
          {record.pageName}
          <CompanyTypography.Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
            {record.pageKey}
          </CompanyTypography.Text>
        </span>
      ),
    },
    {
      key: 'scriptType',
      title: '类型',
      width: 80,
      render: (record: MigrationScriptItem) =>
        record.scriptType === 'create' ? '建表' : '加字段',
    },
    {
      key: 'migrationStatus',
      title: '数据表状态',
      width: 100,
      render: (record: MigrationScriptItem) => migrationStatusTag(record.migrationStatus),
    },
    {
      key: 'action',
      title: '操作',
      width: 180,
      render: (record: MigrationScriptItem) => (
        <CompanySpace size={4}>
          <CompanyButton type="link" size="small" onClick={() => setDetailItem(record)}>
            详情
          </CompanyButton>
          {isDev && (
            <CompanyButton type="link" size="small" onClick={() => handleSaveLocal(record)}>
              下载到项目
            </CompanyButton>
          )}
        </CompanySpace>
      ),
    },
  ]

  /** 详情抽屉里脚本信息用的字段清单（信息卡片展示，与详情页模板 dpt-info-card 视觉一致） */
  const detailRows: Array<{ label: string; value: ReactNode }> = detailItem
    ? [
        { label: '所属页面', value: `${detailItem.pageName}（${detailItem.pageKey}）` },
        { label: '类型', value: detailItem.scriptType === 'create' ? '建表' : '加字段' },
        { label: '版本号', value: `V${detailItem.version}` },
        { label: '数据表状态', value: migrationStatusTag(detailItem.migrationStatus) },
        { label: '生成时间', value: detailItem.createdTime },
        { label: '生成人', value: detailItem.createdBy },
      ]
    : []

  return (
    <CompanyDrawer
      title="建表脚本（Flyway 增量脚本）"
      width={880}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <CompanyTypography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        系统只生成脚本、绝不直接改数据库。点「下载到项目」把脚本放进项目 db/migration/
        目录，后端重启后由 Flyway 自动执行建表。
      </CompanyTypography.Paragraph>
      <CompanySpace style={{ marginBottom: 12 }}>
        <CompanyButton onClick={handleCheckReady} loading={checking}>
          检查就绪状态
        </CompanyButton>
        <CompanyButton onClick={fetchScripts} loading={loading}>
          刷新
        </CompanyButton>
      </CompanySpace>
      <CompanyTable<MigrationScriptItem>
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={scripts}
        pagination={false}
        scroll={{ x: 800 }}
      />

      {/* 脚本详情二次抽屉（叠在列表抽屉上）：普通表格展示基本信息 + pre 展示脚本内容 */}
      <CompanyDrawer
        title="脚本详情"
        width={640}
        open={detailItem !== null}
        onClose={() => setDetailItem(null)}
        destroyOnHidden
      >
        {detailItem && (
          <>
            {/* 信息卡片：视觉规范与详情页模板 dpt-info-card 一致 */}
            <div className="msd-info-card">
              {/* 脚本文件名：纯文本展示（不加标签、不用代码样式） */}
              <div className="msd-file-name">{detailItem.fileName}</div>
              <div className="msd-info-fields">
                {detailRows.map((row) => (
                  <div className="msd-field-item" key={row.label}>
                    <span className="msd-field-label">{row.label}：</span>
                    <span className="msd-field-value">{row.value ?? '--'}</span>
                  </div>
                ))}
              </div>
            </div>
            <CompanyTypography.Paragraph
              type="secondary"
              style={{ marginBottom: 8, fontSize: 12 }}
            >
              脚本内容（放入项目 db/migration/ 目录后由 Flyway 执行）
            </CompanyTypography.Paragraph>
            <pre
              style={{
                margin: 0,
                padding: 12,
                // 背景色用公司组件库变量（布局浅灰底），不用硬编码色值
                background: 'var(--color-bg-layout)',
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {detailItem.content}
            </pre>
          </>
        )}
      </CompanyDrawer>
    </CompanyDrawer>
  )
}
