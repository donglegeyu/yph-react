import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import './PageTitle.scss'

interface PageTitleProps {
  title: string
  showBack?: boolean
  showBackText?: boolean
  showDivider?: boolean
  backText?: string
  backPath?: string
  className?: string
  backIcon?: ReactNode
  titleSuffix?: ReactNode
  actions?: ReactNode
}

export default function PageTitle({
  title,
  showBack = false,
  showBackText = true,
  showDivider = true,
  backText = '返回',
  backPath = '',
  className,
  backIcon,
  titleSuffix,
  actions,
}: PageTitleProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={`page-title${className ? ` ${className}` : ''}`}>
      <div className="left">
        {showBack && (
          <>
            <button type="button" className="back-btn" onClick={handleBack}>
              {backIcon || (
                <svg viewBox="0 0 1024 1024" style={{ width: 14, height: 14 }}>
                  <path d="M609.344 226.906667L318.250667 512l291.093333 285.094667a42.666667 42.666667 0 0 1-60.330666 60.330666l-315.733334-309.12a42.666667 42.666667 0 0 1 0-60.330666l315.392-308.373333a42.666667 42.666667 0 0 1 60.672 24.32 42.666667 42.666667 0 0 1-0.341334 36.181333z" fill="currentColor" />
                </svg>
              )}
              {showBackText && <span>{backText}</span>}
            </button>
            {showDivider && <span className="divider" />}
          </>
        )}
        <span className="title">{title}</span>
        {titleSuffix && <span className="title-suffix">{titleSuffix}</span>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}
