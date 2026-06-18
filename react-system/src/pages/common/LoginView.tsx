import { CloseOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import {
  CompanyButton,
  CompanyCheckbox,
  CompanyForm,
  CompanyInput,
} from '@donglegeyu/company-ui'
import { message as messageStatic } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoUrl from '@/assets/logo-login.svg'
import img260 from '@/assets/images/login/260@1x.png'
import img300 from '@/assets/images/login/300@1x.png'
import img396 from '@/assets/images/login/396@1x.png'
import { API_ENDPOINTS } from '@/constants/api'
import { post } from '@/utils/request'
import { useAppStore } from '@/store/app'
import type { LoginResult } from '@/types'
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

type LoginTab = 'password' | 'sms'

interface LoginFormValues {
  username: string
  password: string
  remember: boolean
}

export default function LoginView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setUserInfo = useAppStore((s) => s.setUserInfo)
  const [messageApi, contextHolder] = messageStatic.useMessage({ top: 80 })
  const [activeTab, setActiveTab] = useState<LoginTab>('password')
  const [loading, setLoading] = useState(false)
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  )

  const currentImage = useMemo(() => {
    if (screenWidth < 768) return IMAGE_CONFIGS[0]
    if (screenWidth < 1024) return IMAGE_CONFIGS[1]
    return IMAGE_CONFIGS[2]
  }, [screenWidth])

  const initialValues = useMemo<LoginFormValues>(() => {
    const remember =
      localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
    const savedUsername = localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)
    return {
      username: remember && savedUsername ? savedUsername : '',
      password: '',
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
    setLoading(true)

    try {
      const username = sanitizeInput(values.username)
      const password = values.password

      if (!username || !password) throw new Error('用户名或密码不能为空')

      const res = await post<LoginResult>(
        API_ENDPOINTS.AUTH_LOGIN,
        { username, password },
        { skipAuthRedirect: true },
      )

      if (res.code !== 200 || !res.data) {
        throw new Error(res.message || '登录失败，请稍后重试')
      }

      const { token, id, nickname, realName, username: uname } = res.data

      if (values.remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
        localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
        localStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME)
      }

      localStorage.setItem('token', token)
      localStorage.removeItem('login:user')
      setUserInfo({ id, username: uname, nickname, realName })
      messageApi.success('登录成功')
      const redirect = searchParams.get('redirect')
      navigate(redirect ? decodeURIComponent(redirect) : '/home', {
        replace: true,
      })
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '登录失败，请稍后重试'
      messageApi.open({
        key: 'login-error',
        type: 'error',
        content: (
          <span className="login-error-message">
            <span>{msg}</span>
            <CloseOutlined
              className="login-error-close"
              onClick={() => messageApi.destroy('login-error')}
            />
          </span>
        ),
        duration: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-view">
      <div
        className="login-left"
        style={{ ['--login-left-width' as string]: `${currentImage.width}px` }}
      >
        <div className="login-image-container">
          <img
            src={currentImage.src}
            alt={`${currentImage.width}px 登录页图片`}
            className="login-image"
          />
        </div>
      </div>

      <div className="login-right">
        {contextHolder}
        <div className="brand-area">
          <img src={logoUrl} alt="Logo" className="logo" />
        </div>

        <div className="login-content">
          <div className="login-card">
            <div className="login-tabs">
              <div
                className={`login-tab ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <span className="tab-text">密码登录</span>
                <span className="tab-indicator" />
              </div>
              <div
                className={`login-tab ${activeTab === 'sms' ? 'active' : ''}`}
                onClick={() => setActiveTab('sms')}
              >
                <span className="tab-text">验证码登录</span>
                <span className="tab-indicator" />
              </div>
            </div>

          {activeTab === 'password' ? (
            <CompanyForm<LoginFormValues>
              initialValues={initialValues}
              onFinish={handleLogin}
              layout="vertical"
              requiredMark={false}
            >
              <CompanyForm.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名', trigger: 'onBlur' },
                  { min: 2, max: 20, message: '用户名长度在 2-20 个字符', trigger: 'onBlur' },
                ]}
              >
                <CompanyInput
                  prefix={<UserOutlined />}
                  placeholder="请输入您的账号"
                  size="large"
                  autoComplete="username"
                />
              </CompanyForm.Item>

              <CompanyForm.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码', trigger: 'onBlur' },
                  { min: 6, max: 20, message: '密码长度在 6-20 个字符', trigger: 'onBlur' },
                ]}
              >
                <CompanyInput.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  size="large"
                  autoComplete="current-password"
                />
              </CompanyForm.Item>

              <div className="form-extra-row">
                <CompanyForm.Item name="remember" valuePropName="checked" noStyle>
                  <CompanyCheckbox>记住我</CompanyCheckbox>
                </CompanyForm.Item>
                <span className="reset-link">重置密码</span>
              </div>

              <CompanyButton
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </CompanyButton>
            </CompanyForm>
          ) : (
            <div className="sms-placeholder">
              <CompanyInput
                prefix={<UserOutlined />}
                placeholder="请输入手机号"
                size="large"
              />
              <div className="sms-code-row">
                <CompanyInput
                  prefix={<LockOutlined />}
                  placeholder="请输入验证码"
                  size="large"
                />
                <CompanyButton size="large">获取验证码</CompanyButton>
              </div>
              <CompanyButton type="primary" size="large" block disabled>
                验证码登录（演示，暂未接入）
              </CompanyButton>
            </div>
          )}

          <div className="demo-account">
            <div className="demo-divider">
              <span className="divider-line" />
              <span className="divider-text">下方是演示账号信息</span>
              <span className="divider-line" />
            </div>
            <div className="demo-info">
              <span>账号：craftsman</span>
              <span>密码：123123</span>
            </div>
          </div>
        </div>
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
