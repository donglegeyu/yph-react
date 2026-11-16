import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { CompanyPopover, SvgIcon } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useUnreadCount } from '@/hooks'
import { get, put } from '@/utils/request'
import './NotifyBell.scss'

interface NotifyRecentItem {
  id: number
  title: string
  content: string
  readStatus: number
  createTime: string
}

/** 消息铃铛（一级侧边栏底部、审批中心上方）：未读数轮询（useUnreadCount）+ 点击展开最近 5 条；
 * 触发器复用 .system-bottom-item 条目样式（与审批中心同源）；未读徽标独立 sup 定位（不用 antd Badge
 * 包裹图标——Badge 容器自带黑色 color 会把 currentColor 图标染黑）。
 * 弹层用 CompanyPopover（与左下角"退出登录"弹层同组件同配置），卡片外观（白底/圆角/投影/内边距/箭头）
 * 由容器提供，与图一保持一致 */
export default function NotifyBell() {
  const navigate = useNavigate()
  const unreadCount = useAppStore((s) => s.unreadCount)
  const { refreshUnreadCount } = useUnreadCount()
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<NotifyRecentItem[]>([])

  const fetchRecent = useCallback(async () => {
    try {
      const res = await get<{ records: NotifyRecentItem[] }>(API_ENDPOINTS.NOTIFY_MESSAGES_MY, {
        current: 1,
        size: 5,
      })
      if (res.code === 200) {
        setRecent(res.data?.records || [])
      }
    } catch {
      /* 静默失败 */
    }
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) fetchRecent()
    },
    [fetchRecent],
  )

  const handleClickItem = useCallback(
    async (item: NotifyRecentItem) => {
      setOpen(false)
      if (item.readStatus === 0) {
        try {
          await put(`${API_ENDPOINTS.NOTIFY_MESSAGES}/read/${item.id}`)
          refreshUnreadCount()
        } catch {
          /* 静默失败，不阻断跳转 */
        }
      }
      navigate('/message-center')
    },
    [navigate, refreshUnreadCount],
  )

  const goInbox = useCallback(() => {
    setOpen(false)
    navigate('/message-center')
  }, [navigate])

  const panel = (
    <div className="notify-bell-panel">
      <div className="notify-bell-header">消息通知</div>
      {recent.length === 0 ? (
        <div className="notify-bell-empty">暂无消息</div>
      ) : (
        recent.map((item) => (
          <div
            key={item.id}
            className={`notify-bell-item${item.readStatus === 0 ? ' unread' : ''}`}
            onClick={() => handleClickItem(item)}
          >
            <div className="notify-bell-item-title">{item.title}</div>
            <div className="notify-bell-item-content">{item.content}</div>
            <div className="notify-bell-item-time">
              {item.createTime ? String(item.createTime).replace('T', ' ').slice(0, 16) : ''}
            </div>
          </div>
        ))
      )}
      <div className="notify-bell-footer" onClick={goInbox}>
        查看全部消息
      </div>
    </div>
  )

  return (
    <CompanyPopover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="rightBottom"
      content={panel}
    >
      <span className="system-bottom-item notify-bell-trigger" aria-label="消息通知">
        <SvgIcon href="bell" className="menu-icon" />
        <span className="menu-label">消息通知</span>
        {unreadCount > 0 && (
          <sup className="notify-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</sup>
        )}
      </span>
    </CompanyPopover>
  )
}
