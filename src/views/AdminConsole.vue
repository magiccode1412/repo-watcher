<template>
  <div class="max-w-4xl mx-auto">
    <header class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">配置后台</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm">欢迎，{{ username }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="testNotify" :disabled="saving"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm">
          测试通知
        </button>
        <button @click="save" :disabled="saving"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
        <button @click="doLogout"
          class="px-4 py-2 bg-slate-500 hover:bg-slate-400 text-white rounded-lg transition-colors text-sm">
          退出
        </button>
      </div>
    </header>

    <p v-if="message" class="glass-card rounded-xl p-4 mb-4 text-sm"
      :class="messageType === 'error' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'">
      {{ message }}
    </p>

    <ConfigSection title="GitHub" icon="github">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">仓库列表（逗号/换行分隔）</label>
          <textarea v-model="cfg.github.repo" rows="2"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支</label>
          <input v-model="cfg.github.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.github.token" label="Token" :masked="masked.github.token" />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="Gitee" icon="gitee">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">仓库列表</label>
          <textarea v-model="cfg.gitee.repo" rows="2"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支</label>
          <input v-model="cfg.gitee.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.gitee.token" label="Token" :masked="masked.gitee.token" />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="GitLab" icon="gitlab">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">仓库列表</label>
          <textarea v-model="cfg.gitlab.repo" rows="2"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支</label>
          <input v-model="cfg.gitlab.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">API Base</label>
          <input v-model="cfg.gitlab.apiBase"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">Host</label>
          <input v-model="cfg.gitlab.host"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.gitlab.token" label="Token" :masked="masked.gitlab.token" />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="CNB" icon="cnb">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">仓库列表</label>
          <textarea v-model="cfg.cnb.repo" rows="2"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支</label>
          <input v-model="cfg.cnb.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">API Base</label>
          <input v-model="cfg.cnb.apiBase"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.cnb.token" label="Token" :masked="masked.cnb.token" required />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="通知与其它" icon="">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">时区（如 UTC+8）</label>
          <input v-model="cfg.tz"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" v-model="cfg.notifyOnFirstCheck" class="rounded" />
            首次检测也发送通知
          </label>
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.checkToken" label="检测令牌 CHECK_TOKEN" :masked="masked.checkToken" />
        </div>
        <div class="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4">
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">MagicPush 通知</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenField v-model="cfg.magicpush.url" label="URL" :masked="masked.magicpush.url" />
            <TokenField v-model="cfg.magicpush.token" label="Token" :masked="masked.magicpush.token" />
          </div>
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="账户安全" icon="">
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        修改密码后，所有已登录设备将被强制退出，需重新登录。
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">原密码</label>
          <input type="password" v-model="oldPwd" autocomplete="current-password"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">新密码（至少 6 位）</label>
          <input type="password" v-model="newPwd" autocomplete="new-password"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">确认新密码</label>
          <input type="password" v-model="confirmPwd" autocomplete="new-password"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <button @click="changePassword" :disabled="savingPwd"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50">
            {{ savingPwd ? '修改中...' : '修改密码' }}
          </button>
        </div>
      </div>
    </ConfigSection>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ConfigSection from '../components/ConfigSection.vue'
import TokenField from '../components/TokenField.vue'
import { useAdminAuth } from '../composables/useAdminAuth.js'

const { authFetch, apiUrl, username, logout } = useAdminAuth()

const cfg = reactive({
  github: { repo: '', branch: 'main', token: '' },
  gitee: { repo: '', branch: 'master', token: '' },
  gitlab: { repo: '', branch: 'main', token: '', apiBase: 'https://gitlab.com', host: 'gitlab.com' },
  cnb: { repo: '', branch: 'main', token: '', apiBase: 'https://api.cnb.cool' },
  notifyOnFirstCheck: false,
  tz: 'UTC+8',
  checkToken: '',
  magicpush: { url: '', token: '' },
})
const masked = reactive({
  github: { token: '' }, gitee: { token: '' }, gitlab: { token: '' }, cnb: { token: '' },
  checkToken: '', magicpush: { url: '', token: '' },
})

const saving = ref(false)
const message = ref('')
const messageType = ref('info')

// 修改密码
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const savingPwd = ref(false)

function clearEmpty(obj) {
  // 提交时不发送空 token（空表示不修改）
  const out = JSON.parse(JSON.stringify(obj))
  for (const k of ['github', 'gitee', 'gitlab', 'cnb']) {
    if (out[k] && out[k].token === '') delete out[k].token
  }
  if (out.checkToken === '') delete out.checkToken
  if (out.magicpush?.url === '') delete out.magicpush.url
  if (out.magicpush?.token === '') delete out.magicpush.token
  return out
}

async function load() {
  try {
    const res = await authFetch('/api/admin/config')
    const data = await res.json()
    if (!res.ok) { message.value = data.message; messageType.value = 'error'; return }
    mergeConfig(data.data)
  } catch (e) {
    message.value = e.message
    messageType.value = 'error'
  }
}

function mergeConfig(d) {
  if (!d) return
  for (const k of ['github', 'gitee', 'gitlab', 'cnb', 'magicpush']) {
    if (d[k]) Object.assign(cfg[k], d[k])
  }
  cfg.notifyOnFirstCheck = !!d.notifyOnFirstCheck
  cfg.tz = d.tz || 'UTC+8'
  cfg.checkToken = d.checkToken || ''
  // 记录掩码
  for (const k of ['github', 'gitee', 'gitlab', 'cnb']) {
    masked[k].token = d[k]?.token || ''
  }
  masked.checkToken = d.checkToken || ''
  masked.magicpush.url = d.magicpush?.url || ''
  masked.magicpush.token = d.magicpush?.token || ''
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    const res = await authFetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clearEmpty(cfg))
    })
    const data = await res.json()
    if (!res.ok) { message.value = data.message; messageType.value = 'error'; return }
    mergeConfig(data.data)
    message.value = '配置已保存'
    messageType.value = 'success'
  } catch (e) {
    message.value = e.message
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

async function testNotify() {
  message.value = ''
  try {
    const res = await authFetch('/api/admin/test-notify', { method: 'POST' })
    const data = await res.json()
    message.value = JSON.stringify(data.data)
    messageType.value = 'success'
  } catch (e) {
    message.value = e.message
    messageType.value = 'error'
  }
}

async function doLogout() {
  await logout()
  location.href = '/admin'
}

async function changePassword() {
  message.value = ''
  if (!oldPwd.value || !newPwd.value || !confirmPwd.value) {
    message.value = '请填写完整'
    messageType.value = 'error'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    message.value = '两次新密码不一致'
    messageType.value = 'error'
    return
  }
  if (newPwd.value.length < 6) {
    message.value = '新密码至少 6 位'
    messageType.value = 'error'
    return
  }
  savingPwd.value = true
  try {
    const res = await authFetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: oldPwd.value, newPassword: newPwd.value })
    })
    const data = await res.json()
    if (!res.ok) { message.value = data.message; messageType.value = 'error'; return }
    message.value = data.message
    messageType.value = 'success'
    // 改密后所有会话已吊销，清除本地 token 并跳转重新登录
    await logout()
    location.href = '/admin'
  } catch (e) {
    message.value = e.message
    messageType.value = 'error'
  } finally {
    savingPwd.value = false
  }
}

onMounted(load)
</script>
