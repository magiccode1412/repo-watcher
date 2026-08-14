<template>
  <div class="max-w-md mx-auto mt-20">
    <div class="glass-card rounded-xl p-8">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">初始化管理员</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">首次使用，请设置管理员账号。</p>

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">用户名</label>
          <input
            v-model="user"
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">密码（至少 6 位）</label>
          <input
            v-model="pass"
            type="password"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">确认密码</label>
          <input
            v-model="pass2"
            type="password"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {{ loading ? '初始化中...' : '初始化' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth.js'

const { apiUrl, setTokens } = useAdminAuth()
const user = ref('admin')
const pass = ref('')
const pass2 = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (pass.value.length < 6) { error.value = '密码至少 6 位'; return }
  if (pass.value !== pass2.value) { error.value = '两次密码不一致'; return }

  loading.value = true
  try {
    const res = await fetch(apiUrl('/api/admin/init'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.value, password: pass.value })
    })
    const data = await res.json()
    if (!res.ok) { error.value = data.message || '初始化失败'; return }
    // 初始化后自动登录
    const loginRes = await fetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.value, password: pass.value })
    })
    const loginData = await loginRes.json()
    if (loginRes.ok) {
      setTokens(loginData.data.accessToken, loginData.data.refreshToken, loginData.data.username)
      location.href = '/admin/console'
    } else {
      location.href = '/admin'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
