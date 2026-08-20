<template>
  <div class="max-w-4xl mx-auto pt-8 px-4">
    <header class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">配置后台</h1>
        <RouterLink to="/" class="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">← 返回首页</RouterLink>
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

    <!-- 右下角弹出通知 -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="glass-card pointer-events-auto rounded-xl px-4 py-3 shadow-lg text-sm max-w-xs flex items-start gap-2"
          :class="t.type === 'error'
            ? 'text-red-500 border border-red-400/40'
            : 'text-emerald-600 dark:text-emerald-400 border border-emerald-400/40'">
          <svg v-if="t.type !== 'error'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="break-words">{{ t.text }}</span>
        </div>
      </transition-group>
    </div>

    <nav class="flex flex-wrap gap-2 mb-6">
      <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key"
        class="px-4 py-2 rounded-lg text-sm transition-colors"
        :class="activeTab === t.key
          ? 'bg-blue-600 text-white'
          : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'">
        {{ t.label }}
      </button>
    </nav>

    <ConfigSection title="GitHub" icon="github" v-if="activeTab === 'github'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <RepoListEditor v-model="cfg.github.repos" :default-branch="cfg.github.branch" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支（行内为空时使用）</label>
          <input v-model="cfg.github.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.github.token" label="Token" :configured="secrets.github.token" />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="Gitee" icon="gitee" v-if="activeTab === 'gitee'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <RepoListEditor v-model="cfg.gitee.repos" :default-branch="cfg.gitee.branch" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支（行内为空时使用）</label>
          <input v-model="cfg.gitee.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.gitee.token" label="Token" :configured="secrets.gitee.token" />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="GitLab" icon="gitlab" v-if="activeTab === 'gitlab'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <RepoListEditor v-model="cfg.gitlab.repos" :default-branch="cfg.gitlab.branch" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支（行内为空时使用）</label>
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
          <TokenField v-model="cfg.gitlab.token" label="Token" :configured="secrets.gitlab.token" />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="CNB" icon="cnb" v-if="activeTab === 'cnb'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <RepoListEditor v-model="cfg.cnb.repos" :default-branch="cfg.cnb.branch" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">默认分支（行内为空时使用）</label>
          <input v-model="cfg.cnb.branch"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">API Base</label>
          <input v-model="cfg.cnb.apiBase"
            class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="md:col-span-2">
          <TokenField v-model="cfg.cnb.token" label="Token" :configured="secrets.cnb.token" required />
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="通知与其它" icon="" v-if="activeTab === 'notify'">
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
          <TokenField v-model="cfg.checkToken" label="检测令牌 CHECK_TOKEN" :configured="secrets.checkToken" />
        </div>
        <div class="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4">
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">MagicPush 通知</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenField v-model="cfg.magicpush.url" label="URL" :configured="secrets.magicpush.url" />
            <TokenField v-model="cfg.magicpush.token" label="Token" :configured="secrets.magicpush.token" />
          </div>
        </div>
      </div>
    </ConfigSection>

    <ConfigSection title="账户安全" icon="" v-if="activeTab === 'security'">
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
import { RouterLink } from 'vue-router'
import ConfigSection from '../components/ConfigSection.vue'
import TokenField from '../components/TokenField.vue'
import RepoListEditor from '../components/RepoListEditor.vue'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import router from '../router'

const { authFetch, apiUrl, logout } = useAdminAuth()

// 选项卡：点击切换对应配置区块（表单数据由共享的 cfg 维护，切换不丢数据）
const tabs = [
  { key: 'github', label: 'GitHub' },
  { key: 'gitee', label: 'Gitee' },
  { key: 'gitlab', label: 'GitLab' },
  { key: 'cnb', label: 'CNB' },
  { key: 'notify', label: '通知与其它' },
  { key: 'security', label: '账户安全' },
]
const activeTab = ref('github')

const cfg = reactive({
  github: { repos: [], branch: 'main', token: '' },
  gitee: { repos: [], branch: 'master', token: '' },
  gitlab: { repos: [], branch: 'main', token: '', apiBase: 'https://gitlab.com', host: 'gitlab.com' },
  cnb: { repos: [], branch: 'main', token: '', apiBase: 'https://api.cnb.cool' },
  notifyOnFirstCheck: false,
  tz: 'UTC+8',
  checkToken: '',
  magicpush: { url: '', token: '' },
})
const secrets = reactive({
  github: { token: false }, gitee: { token: false }, gitlab: { token: false }, cnb: { token: false },
  checkToken: false, magicpush: { url: false, token: false },
})

const saving = ref(false)

// 右下角弹出通知
let toastSeq = 0
const toasts = ref([])
function showToast(text, type = 'success', duration = 3000) {
  const id = ++toastSeq
  toasts.value.push({ id, text, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

// 修改密码
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const savingPwd = ref(false)

function clearEmpty(obj) {
  // 提交时不发送空 token（空表示不修改）
  const out = JSON.parse(JSON.stringify(obj))
  for (const k of ['github', 'gitee', 'gitlab', 'cnb']) {
    if (!out[k]) continue
    if (out[k].token === '') delete out[k].token
    // 仅保留仓库名非空的行，并丢弃旧版 repo 字符串字段
    if (Array.isArray(out[k].repos)) {
      out[k].repos = out[k].repos
        .filter(r => r && (r.repo || '').trim())
        .map(r => ({ repo: r.repo.trim(), branch: (r.branch || '').trim(), note: (r.note || '').trim() }))
    }
    delete out[k].repo
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
    if (!res.ok) { showToast(data.message, 'error'); return }
    mergeConfig(data.data, data.secrets)
  } catch (e) {
    showToast(e.message, 'error')
  }
}

function mergeConfig(d, sec) {
  if (!d) return
  for (const k of ['github', 'gitee', 'gitlab', 'cnb']) {
    if (!d[k]) continue
    Object.assign(cfg[k], d[k])
    // 仅使用结构化 repos 数组（旧版 repo 字符串已废弃）
    cfg[k].repos = Array.isArray(d[k].repos) ? d[k].repos : []
  }
  if (d.magicpush) Object.assign(cfg.magicpush, d.magicpush)
  cfg.notifyOnFirstCheck = !!d.notifyOnFirstCheck
  cfg.tz = d.tz || 'UTC+8'
  cfg.checkToken = d.checkToken || ''
  // 记录敏感字段是否已配置（仅状态，不含值）
  for (const k of ['github', 'gitee', 'gitlab', 'cnb']) {
    secrets[k].token = !!(sec?.[k]?.token)
  }
  secrets.checkToken = !!(sec?.checkToken)
  secrets.magicpush.url = !!(sec?.magicpush?.url)
  secrets.magicpush.token = !!(sec?.magicpush?.token)
}

async function save() {
  saving.value = true
  try {
    const res = await authFetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clearEmpty(cfg))
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.message, 'error'); return }
    mergeConfig(data.data, data.secrets)
    showToast('配置已保存', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

async function testNotify() {
  try {
    const res = await authFetch('/api/admin/test-notify', { method: 'POST' })
    const data = await res.json()
    showToast('通知已发送：' + JSON.stringify(data.data), 'success')
  } catch (e) {
    showToast(e.message, 'error')
  }
}

async function doLogout() {
  await logout()
  router.push('/admin')
}

async function changePassword() {
  if (!oldPwd.value || !newPwd.value || !confirmPwd.value) {
    showToast('请填写完整', 'error')
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    showToast('两次新密码不一致', 'error')
    return
  }
  if (newPwd.value.length < 6) {
    showToast('新密码至少 6 位', 'error')
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
    if (!res.ok) { showToast(data.message, 'error'); return }
    showToast(data.message || '密码已修改', 'success')
    // 改密后所有会话已吊销，清除本地 token 并跳转重新登录
    await logout()
    router.push('/admin')
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    savingPwd.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* 右下角通知弹出/消失动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
