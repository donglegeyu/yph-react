import { useState, useRef, useCallback, type ReactNode } from 'react'
import { CompanyButton, CompanyCard } from '@donglegeyu/company-ui'
import PageTitle from './PageTitle'
import './FormPageTemplate.scss'

interface FormPageTemplateProps {
  title: string
  showBack?: boolean
  backPath?: string
  loading?: boolean
  submitLoading?: boolean
  showFooter?: boolean
  footerPosition?: 'fixed' | 'static'
  onSubmit?: () => void
  onCancel?: () => void
  titleActions?: ReactNode
  children?: ReactNode
}

export default function FormPageTemplate({
  title,
  showBack = false,
  backPath = '',
  submitLoading = false,
  showFooter = true,
  footerPosition = 'fixed',
  onSubmit,
  onCancel,
  titleActions,
  children,
}: FormPageTemplateProps) {
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setIsScrolling(true)

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)

    const scrollTop = target.scrollTop
    if (scrollTop > 0) {
      target.classList.add('scrolled')
    } else {
      target.classList.remove('scrolled')
    }
  }, [])

  return (
    <div className="form-page-template">
      <PageTitle
        title={title}
        showBack={showBack}
        backPath={backPath}
        className="form-page-title"
        actions={titleActions}
      />

      <div className="form-page-container">
        <div
          className={`form-page-content${isScrolling ? ' scrolling' : ''}`}
          onScroll={handleScroll}
        >
          <CompanyCard className="form-page-card">{children}</CompanyCard>

          {showFooter && footerPosition === 'static' && (
            <div className="form-page-footer static">
              <CompanyButton onClick={onCancel}>取消</CompanyButton>
              <CompanyButton
                type="primary"
                loading={submitLoading}
                onClick={onSubmit}
                style={{ marginLeft: 8 }}
              >
                确定
              </CompanyButton>
            </div>
          )}
        </div>

        {showFooter && footerPosition === 'fixed' && (
          <div className="form-page-footer fixed">
            <CompanyButton onClick={onCancel}>取消</CompanyButton>
            <CompanyButton
              type="primary"
              loading={submitLoading}
              onClick={onSubmit}
              style={{ marginLeft: 8 }}
            >
              确定
            </CompanyButton>
          </div>
        )}
      </div>
    </div>
  )
}
