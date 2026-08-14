<template>
  <div class="max-w-md mx-auto mt-20">
    <div class="glass-card rounded-xl p-8">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">管理员登录</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">请输入管理员账号密码。</p>

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">用户名</label>
          <input
            v-model="user"
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">密码</label>
          <input
            v-model="pass"
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
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">返回仪表盘</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth.js'

const { login } = useAdminAuth()
const user = ref('')
const pass = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(user.value, pass.value)
    location.href = '/admin/console'
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
