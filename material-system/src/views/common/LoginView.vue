<template>
  <div class="login-view">
    <div class="login-left" :style="{ width: currentImage.width + 'px' }">
      <div class="login-image-container">
        <img
          :src="currentImage.src"
          :alt="currentImage.width + 'px 登录页图片'"
          class="login-image"
        />
      </div>
    </div>

    <div class="login-right">
      <div class="brand-area">
        <img :src="logoUrl" alt="Logo" class="logo" />
      </div>

      <div class="form-area">
        <a-form :model="form" @finish="handleLogin" @finishFailed="handleFinishFailed">
          <a-form-item name="username" :rules="usernameRules">
            <a-input
              v-model:value="form.username"
              placeholder="用户名"
              size="large"
              @keydown.enter="handleEnterKey"
            >
              <template #prefix>
                <svg class="input-icon">
                  <use href="#user" />
                </svg>
              </template>
            </a-input>
          </a-form-item>
          <a-form-item name="password" :rules="passwordRules">
            <a-input-password
              v-model:value="form.password"
              placeholder="密码"
              size="large"
              :visibility-toggle="true"
              @keydown.enter="handleEnterKey"
            >
              <template #prefix>
                <svg class="input-icon">
                  <use href="#lock" />
                </svg>
              </template>
            </a-input-password>
          </a-form-item>
          <a-form-item>
            <div class="remember-row">
              <a-checkbox v-model:checked="form.remember">记住我</a-checkbox>
            </div>
          </a-form-item>
          <a-form-item v-if="errorMessage">
            <a-alert :message="errorMessage" type="error" show-icon />
          </a-form-item>
          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              block
              :loading="loading"
              :disabled="loading"
            >
              {{ loading ? '登录中...' : '登录' }}
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <div class="copyright-area">
        <p class="copyright-text">Copyright © 粤ICP备18161542号 版权所有：星际VUE责任有限公司</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import type { Rule } from 'ant-design-vue/es/form'

const router = useRouter()
const appStore = useAppStore()
const loading = ref(false)
const errorMessage = ref('')
const screenWidth = ref(window.innerWidth)

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

const STORAGE_KEYS = {
  REMEMBER_ME: 'login:remember',
  SAVED_USERNAME: 'login:username',
}

const form = reactive<LoginForm>({
  username: '',
  password: '',
  remember: false,
})

const usernameRules: Rule[] = [
  { required: true, message: '请输入用户名', trigger: 'blur' },
  { min: 2, max: 20, message: '用户名长度在 2-20 个字符', trigger: 'blur' },
]

const passwordRules: Rule[] = [
  { required: true, message: '请输入密码', trigger: 'blur' },
  { min: 6, max: 20, message: '密码长度在 6-20 个字符', trigger: 'blur' },
]

const logoUrl = new URL('../../assets/logo-dl.svg', import.meta.url).href

const imageConfigs = [
  { width: 260, src: new URL('../../assets/images/login/260@1x.png', import.meta.url).href },
  { width: 300, src: new URL('../../assets/images/login/300@1x.png', import.meta.url).href },
  { width: 396, src: new URL('../../assets/images/login/396@1x.png', import.meta.url).href },
]

const currentImage = computed(() => {
  if (screenWidth.value < 768) {
    return imageConfigs[0]
  } else if (screenWidth.value < 1024) {
    return imageConfigs[1]
  } else {
    return imageConfigs[2]
  }
})

function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, '')
}

function handleFinishFailed() {
  errorMessage.value = '请检查表单填写是否正确'
}

function handleEnterKey() {
  const usernameInput = form.username.trim()
  const passwordInput = form.password.trim()

  if (usernameInput && passwordInput && usernameInput.length >= 2 && passwordInput.length >= 6) {
    handleLogin()
  }
}

async function handleLogin() {
  if (loading.value) return

  errorMessage.value = ''
  loading.value = true

  try {
    const sanitizedUsername = sanitizeInput(form.username)
    const sanitizedPassword = sanitizeInput(form.password)

    if (!sanitizedUsername || !sanitizedPassword) {
      throw new Error('用户名或密码不能为空')
    }

    if (form.remember) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
      localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, sanitizedUsername)
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
      localStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME)
    }

    localStorage.setItem('token', 'mock-token')
    appStore.setUserInfo(sanitizedUsername)
    router.push('/home')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function handleResize() {
  screenWidth.value = window.innerWidth
}

onMounted(() => {
  const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME)
  const savedUsername = localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)

  if (remember === 'true' && savedUsername) {
    form.remember = true
    form.username = savedUsername
  } else {
    form.username = 'admin'
  }
  form.password = '123456'

  window.addEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.login-view {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.login-left {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }
}

.login-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.login-image {
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
}

.login-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
}

.brand-area {
  padding: 32px 40px 0 40px;
  text-align: left;

  .logo {
    width: auto;
    height: auto;
    max-width: 100%;
  }
}

.form-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 40px;

  :deep(.ant-form) {
    width: 100%;
    max-width: 400px;
    background: #fff;
    padding: 32px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .remember-row {
    display: flex;
    align-items: center;
  }

  .input-icon {
    width: 16px;
    height: 16px;
    color: var(--color-text-disabled-light, #999);
  }
}

.copyright-area {
  padding: 20px 40px 40px;
  text-align: center;

  .copyright-text {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-disabled-light, #999);
  }
}

@media (max-width: 768px) {
  .login-right {
    flex: 1;
  }

  .brand-area {
    padding: 32px 20px 0 20px;
  }

  .form-area {
    padding: 20px;
  }

  .copyright-area {
    padding: 20px;
  }
}
</style>
