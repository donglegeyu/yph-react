import {
  CompanyButton as Button,
  CompanyCard as Card,
  CompanyForm as Form,
  CompanyMessage as message,
} from '@donglegeyu/company-ui'
import { Input } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginView() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      localStorage.setItem('token', 'mock-token')
      message.success('登录成功')
      navigate('/home', { replace: true })
    } catch {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f5',
      }}
    >
      <Card title="材料管理系统" style={{ width: 400 }}>
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
