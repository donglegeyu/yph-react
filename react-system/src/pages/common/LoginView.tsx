import { CompanyMessage as message } from '@donglegeyu/company-ui'
import { Button, Checkbox, Form, Input } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/logo-login.svg'
import img260 from '@/assets/images/login/260@1x.png'
import img300 from '@/assets/images/login/300@1x.png'
import img396 from '@/assets/images/login/396@1x.png'
import './LoginView.scss'

const STORAGE_KEYS = {
  REMEMBER_ME: 'login:remember',
  SAVED_USERNAME: 'login:username',
} as const

const IMAGE_CONFIGS = [
  { width: 260, src: img260 },
  { width: 300, src: img300 },
  { width: 396, src: img396 },
] as const

interface LoginFormValues {
  username: string
  password: string
  remember: boolean
}

export default function LoginView() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )

  const currentImage = useMemo(() => {
    if (screenWidth < 768) return IMAGE_CONFIGS[0]
    if (screenWidth < 1024) return IMAGE_CONFIGS[1]
    return IMAGE_CONFIGS[2]
  }, [screenWidth])

  const initialValues = useMemo<LoginFormValues>(() => {
    const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
    const savedUsername = localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)
    return {
      username: remember && savedUsername ? savedUsername : 'admin',
      password: '123456',
      remember,
    }
  }, [])

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sanitizeInput = (value: string) => value.trim().replace(/[<>]/g, '')

  const handleLogin = async (values: LoginFormValues) => {
    if (loading) return
    setErrorMessage('')
    setLoading(true)

    try {
      const username = sanitizeInput(values.username)
      const password = sanitizeInput(values.password)

      if (!username || !password) throw new Error('用户名或密码不能为空')

      if (values.remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
        localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
        localStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME)
      }

      localStorage.setItem('token', 'mock-token')
      message.success('登录成功')
      navigate('/home', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-view">
      <div className="login-left" style={{ width: currentImage.width }}>
        <div className="login-image-container">
          <img
            src={currentImage.src}
            alt={`${currentImage.width}px 登录页图片`}
            className="login-image"
          />
        </div>
      </div>

      <div className="login-right">
        <div className="brand-area">
          <img src={logoUrl} alt="Logo" className="logo" />
        </div>

        <div className="form-area">
          <Form<LoginFormValues>
            initialValues={initialValues}
            onFinish={handleLogin}
            onFinishFailed={() => setErrorMessage('请检查表单填写是否正确')}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, max: 20, message: '用户名长度在 2-20 个字符' },
              ]}
            >
              <Input placeholder="用户名" size="large" autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, max: 20, message: '密码长度在 6-20 个字符' },
              ]}
            >
              <Input.Password
                placeholder="密码"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <div className="remember-row">
                <Checkbox>记住我</Checkbox>
              </div>
            </Form.Item>

            {errorMessage && (
              <Form.Item>
                <div className="error-alert" role="alert">
                  {errorMessage}
                </div>
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="copyright-area">
          <p className="copyright-text">
            Copyright © 粤ICP备18161542号 版权所有：星际造梦责任有限公司
          </p>
        </div>
      </div>
    </div>
  )
}
