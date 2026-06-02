import { useMemo } from 'react'
import {
  CompanyButton,
  CompanyPopconfirm,
  CompanyDropdown,
} from '@donglegeyu/company-ui'
import { Menu, Space } from 'antd'
import SvgIcon from './SvgIcon'

export interface ActionButton {
  key: string
  label: string
  danger?: boolean
  confirm?: boolean
  confirmTitle?: string
  onClick?: () => void
}

interface ActionCellProps {
  buttons: ActionButton[]
  maxVisible?: number
}

export default function ActionCell({
  buttons,
  maxVisible = 2,
}: ActionCellProps) {
  const visibleButtons = useMemo(
    () => buttons.slice(0, maxVisible),
    [buttons, maxVisible]
  )
  const moreButtons = useMemo(
    () => buttons.slice(maxVisible),
    [buttons, maxVisible]
  )

  const handleClick = (btn: ActionButton) => {
    btn.onClick?.()
  }

  const moreMenuItems = useMemo(
    () =>
      moreButtons.map((btn) => ({
        key: btn.key,
        label: btn.confirm ? (
          <CompanyPopconfirm
            title={btn.confirmTitle || '确定？'}
            onConfirm={() => handleClick(btn)}
          >
            <span>{btn.label}</span>
          </CompanyPopconfirm>
        ) : (
          <span>{btn.label}</span>
        ),
      })),
    [moreButtons]
  )

  return (
    <Space size={4}>
      {visibleButtons.map((btn) =>
        btn.confirm ? (
          <CompanyPopconfirm
            key={btn.key}
            title={btn.confirmTitle || '确定？'}
            onConfirm={() => handleClick(btn)}
          >
            <CompanyButton type="link" danger={btn.danger}>
              {btn.label}
            </CompanyButton>
          </CompanyPopconfirm>
        ) : (
          <CompanyButton
            key={btn.key}
            type="link"
            danger={btn.danger}
            onClick={() => handleClick(btn)}
          >
            {btn.label}
          </CompanyButton>
        )
      )}
      {moreButtons.length > 0 && (
        <CompanyDropdown
          placement="bottomRight"
          popupRender={() => (
            <Menu
              onClick={(info) => {
                const btn = moreButtons.find((b) => b.key === info.key)
                btn?.onClick?.()
              }}
              items={moreMenuItems}
            />
          )}
        >
          <CompanyButton type="link" className="action-more-btn">
            <SvgIcon href="more-one" size={16} />
          </CompanyButton>
        </CompanyDropdown>
      )}
    </Space>
  )
}
