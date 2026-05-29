import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompanyButton } from '@donglegeyu/company-ui'

interface PageTitleProps {
  title: string
  description?: string
  showBack?: boolean
  backPath?: string
  className?: string
  actions?: ReactNode
}

export default function PageTitle({
  title,
  description,
  showBack = false,
  backPath = '',
  className,
  actions,
}: PageTitleProps) {
  const navigate = useNavigate()

  return (
    <div className={className} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showBack && (
          <CompanyButton
            type="text"
            onClick={() => navigate(backPath || -1 as unknown as string)}
          >
            ← 返回
          </CompanyButton>
        )}
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
        {actions && <div style={{ marginLeft: 'auto' }}>{actions}</div>}
      </div>
      {description && (
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#999' }}>
          {description}
        </p>
      )}
    </div>
  )
}
