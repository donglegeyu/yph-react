import { Space, Button } from 'antd'
import './FormFooterActions.scss'

interface FormFooterActionsProps {
  submitLoading?: boolean
  submitText?: string
  cancelText?: string
  showSubmit?: boolean
  showCancel?: boolean
  submitDisabled?: boolean
  cancelDisabled?: boolean
  onSubmit?: () => void
  onCancel?: () => void
}

export default function FormFooterActions({
  submitLoading = false,
  submitText = '确定',
  cancelText = '取消',
  showSubmit = true,
  showCancel = true,
  submitDisabled = false,
  cancelDisabled = false,
  onSubmit,
  onCancel,
}: FormFooterActionsProps) {
  return (
    <div className="form-footer-actions">
      <Space>
        {showCancel && (
          <Button disabled={cancelDisabled} onClick={onCancel}>
            {cancelText}
          </Button>
        )}
        {showSubmit && (
          <Button
            type="primary"
            loading={submitLoading}
            disabled={submitDisabled}
            onClick={onSubmit}
          >
            {submitText}
          </Button>
        )}
      </Space>
    </div>
  )
}
