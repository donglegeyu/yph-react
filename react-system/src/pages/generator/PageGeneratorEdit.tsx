import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Spin } from 'antd'
import { CompanyMessage } from '@donglegeyu/company-ui'
import { getPageDefinition } from './services'
import type { PageDefinitionDTO } from './types'
import PageGeneratorWizard from './PageGeneratorWizard'
import PageErrorBoundary from '@/components/PageErrorBoundary'
import './PageGeneratorEdit.scss'

export default function PageGeneratorEdit() {
  const { id } = useParams<{ id: string }>()
  const [initial, setInitial] = useState<PageDefinitionDTO | null | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setInitial(null)
      return
    }
    let cancelled = false
    getPageDefinition(id)
      .then((res) => {
        if (cancelled) return
        if (res.code === 200 && res.data) {
          setInitial(res.data)
        } else {
          CompanyMessage.error('配置不存在或已删除')
          setInitial(null)
        }
      })
      .catch(() => {
        if (!cancelled) setInitial(null)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (initial === undefined) {
    return (
      <div className="page-generator-edit">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <PageErrorBoundary>
      <PageGeneratorWizard initial={initial} />
    </PageErrorBoundary>
  )
}
