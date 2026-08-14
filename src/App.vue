<template>
  <div v-if="page === 'dashboard'" class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- 头部 -->
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">仓库检测仪表盘</h1>
          <p class="text-slate-500 dark:text-slate-400">实时监控 GitHub、Gitee、GitLab 和 CNB 仓库状态</p>
        </div>
        <div class="flex items-center gap-4">
          <a href="/admin"
            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm">
            管理后台
          </a>
          <span class="text-sm text-slate-400 dark:text-slate-500">{{ lastUpdate || '加载中...' }}</span>
          <button @click="loadData"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
              </path>
            </svg>
            刷新
          </button>
        </div>
      </div>
    </header>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      <StatCard title="总仓库数" :value="data?.total ?? '-'" icon-bg="bg-blue-500/20" icon-color="text-blue-400">
        <template #icon>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
            </path>
          </svg>
        </template>
      </StatCard>
      <StatCard title="GitHub" :value="data?.github ?? '-'" icon-bg="bg-gray-500/20" icon-color="text-black-400">
        <template #icon>
          <BrandIcon platform="github" class="w-6 h-6" />
        </template>
      </StatCard>
      <StatCard title="Gitee" :value="data?.gitee ?? 0" icon-bg="bg-red-500/20" icon-color="text-red-400">
        <template #icon>
          <BrandIcon platform="gitee" class="w-6 h-6" />
        </template>
      </StatCard>
      <StatCard title="GitLab" :value="data?.gitlab ?? 0" icon-bg="bg-orange-500/20" icon-color="text-orange-400">
        <template #icon>
          <BrandIcon platform="gitlab" class="w-6 h-6" />
        </template>
      </StatCard>
      <StatCard title="CNB" :value="data?.cnb ?? '-'" icon-bg="bg-orange-500/20" icon-color="text-orange-400">
        <template #icon>
          <BrandIcon platform="cnb" class="w-6 h-6" />
        </template>
      </StatCard>
      <div class="glass-card rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 dark:text-slate-400 text-sm mb-1">状态</p>
            <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span class="status-dot bg-emerald-600 dark:bg-emerald-400"></span>
              运行中
            </p>
          </div>
          <div class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 仓库分区 -->
    <section v-for="section in sections" :key="section.key" class="mb-8">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <BrandIcon :platform="section.icon" class="w-5 h-5" />
        {{ section.title }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RepoCard v-for="repo in sortedRepos(section.key)" :key="repo.key" :repo="repo" />
        <div v-if="sortedRepos(section.key).length === 0"
          class="glass-card rounded-xl p-6 text-center text-slate-400 dark:text-slate-500 col-span-full">
          暂无 {{ section.label }} 仓库配置
        </div>
      </div>
    </section>

    <!-- 错误提示 -->
    <div v-if="error"
      class="glass-card rounded-xl p-6 text-center text-red-500 dark:text-red-400 mb-8">
      加载失败: {{ error }}
    </div>

    <!-- 页脚 -->
    <footer
      class="text-center text-slate-400 dark:text-slate-600 text-sm border-t border-slate-200 dark:border-slate-800 pt-6">
      <p>仓库检测仪表盘 &copy; <span>{{ currentYear }}</span></p>
      项目地址：
      <a href="https://cnb.cool/magiccode1412/repo-watcher" target="_blank" class="underline">CNB云原生构建</a> |
      <a href="https://github.com/magiccode1412/repo-watcher" target="_blank" class="underline">Github</a>
    </footer>
  </div>

  <!-- 管理后台：初始化 / 登录 / 控制台 -->
  <AdminInit v-if="page === 'admin' && !initialized" />
  <AdminLogin v-else-if="page === 'admin' && initialized" />
  <AdminConsole v-else-if="page === 'console'" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatCard from './components/StatCard.vue'
import RepoCard from './components/RepoCard.vue'
import BrandIcon from './components/BrandIcon.vue'
import AdminInit from './views/AdminInit.vue'
import AdminLogin from './views/AdminLogin.vue'
import AdminConsole from './views/AdminConsole.vue'
import { useRepos } from './composables/useRepos.js'

// 轻量页面切换（不引入路由库），基于 location.pathname
const pathname = ref(location.pathname)
const page = computed(() => {
  if (pathname.value.startsWith('/admin/console')) return 'console'
  if (pathname.value.startsWith('/admin')) return 'admin'
  return 'dashboard'
})

// 管理后台：是否已初始化（决定显示初始化向导还是登录页）
const initialized = ref(false)
const { apiUrl: adminApiUrl } = useAdminAuth()
async function checkInit() {
  if (page.value !== 'admin') return
  try {
    const res = await fetch(adminApiUrl('/api/admin/init'))
    const data = await res.json()
    if (res.ok) initialized.value = data.data.initialized
  } catch {
    initialized.value = false
  }
}
onMounted(checkInit)

const { data, error, lastUpdate, loadData } = useRepos()

const currentYear = new Date().getFullYear()

// 与原版保持一致的分区顺序：GitHub、CNB、Gitee、GitLab
const sections = [
  { key: 'github', icon: 'github', title: 'GitHub 仓库', label: 'GitHub' },
  { key: 'cnb', icon: 'cnb', title: 'CNB仓库', label: 'CNB' },
  { key: 'gitee', icon: 'gitee', title: 'Gitee 仓库', label: 'Gitee' },
  { key: 'gitlab', icon: 'gitlab', title: 'GitLab 仓库', label: 'GitLab' },
]

function sortedRepos(platform) {
  if (!data.value?.repos) return []
  return data.value.repos
    .filter((r) => r.platform === platform)
    .sort((a, b) => {
      const da = a.latestDate ? new Date(a.latestDate).getTime() : 0
      const db = b.latestDate ? new Date(b.latestDate).getTime() : 0
      return db - da // 倒序：最近更新的在前
    })
}
</script>
