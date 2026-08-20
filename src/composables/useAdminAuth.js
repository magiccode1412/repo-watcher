import { ref, computed } from 'vue'
import router from '../router'

/**
 * 管理后台鉴权组合式函数
 * - access / refresh token 存储于 sessionStorage
 * - 受保护请求自动注入 Authorization 头
 * - 401 时自动用 refresh 续期，失败则跳登录
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const ACCESS_KEY = 'rw_access_token'
const REFRESH_KEY = 'rw_refresh_token'

const accessToken = ref(sessionStorage.getItem(ACCESS_KEY) || '')
const refreshToken = ref(sessionStorage.getItem(REFRESH_KEY) || '')
const username = ref('')

function persist() {
  if (accessToken.value) sessionStorage.setItem(ACCESS_KEY, accessToken.value)
  else sessionStorage.removeItem(ACCESS_KEY)
  if (refreshToken.value) sessionStorage.setItem(REFRESH_KEY, refreshToken.value)
  else sessionStorage.removeItem(REFRESH_KEY)
}

function setTokens(access, refresh, user) {
  accessToken.value = access
  refreshToken.value = refresh
  username.value = user || ''
  persist()
}

function clearTokens() {
  accessToken.value = ''
  refreshToken.value = ''
  username.value = ''
  persist()
}

const isLoggedIn = computed(() => !!accessToken.value)

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

/**
 * 发起受保护请求，自动处理 401 续期
 */
async function authFetch(path, options = {}) {
  options.headers = options.headers || {}
  if (accessToken.value) options.headers['Authorization'] = `Bearer ${accessToken.value}`

  let res = await fetch(apiUrl(path), options)

  if (res.status === 401 && refreshToken.value) {
    // 尝试 refresh
    const refreshed = await tryRefresh()
    if (refreshed) {
      if (accessToken.value) options.headers['Authorization'] = `Bearer ${accessToken.value}`
      res = await fetch(apiUrl(path), options)
    }
  }

  if (res.status === 401) {
    clearTokens()
    if (router.currentRoute.value.path.startsWith('/admin')) {
      router.push('/admin')
    }
    throw new Error('未登录或会话已失效')
  }

  return res
}

async function tryRefresh() {
  try {
    const res = await fetch(apiUrl('/api/admin/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${refreshToken.value}` }
    })
    if (!res.ok) return false
    const data = await res.json()
    accessToken.value = data.data.accessToken
    persist()
    return true
  } catch {
    return false
  }
}

async function login(user, pass) {
  const res = await fetch(apiUrl('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || '登录失败')
  setTokens(data.data.accessToken, data.data.refreshToken, data.data.username)
  return data
}

async function logout() {
  try {
    await authFetch('/api/admin/logout', { method: 'POST' })
  } catch { /* ignore */ }
  clearTokens()
}

export function useAdminAuth() {
  return {
    accessToken, refreshToken, username, isLoggedIn,
    setTokens, clearTokens, authFetch, login, logout, apiUrl
  }
}
