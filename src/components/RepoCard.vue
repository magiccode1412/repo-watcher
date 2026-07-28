<template>
  <div class="glass-card repo-card rounded-xl p-5 cursor-pointer" @click="openRepo"
    title="点击打开仓库页面">
    <div class="flex items-start justify-between mb-3">
      <div>
        <span class="platform-badge" :class="badgeClass">{{ platformLabel }}</span>
        <h3 class="text-slate-900 dark:text-white font-semibold mt-2">{{ repo.name }}</h3>
        <p v-if="!isCnb" class="text-slate-500 dark:text-slate-400 text-sm">{{ repo.branch }}</p>
      </div>
      <div class="status-dot"
        :class="statusActive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'">
      </div>
    </div>
    <div class="space-y-2">
      <template v-if="isCnb">
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500 dark:text-slate-500">最新构建:</span>
          <code class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{{ repo.latestBuildId || '未检测' }}</code>
        </div>
        <div v-if="repo.latestDate" class="flex items-center gap-2 text-sm">
          <span class="text-slate-500 dark:text-slate-500">构建时间:</span>
          <span class="text-slate-600 dark:text-slate-300">{{ formatRelativeTime(repo.latestDate) }}</span>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500 dark:text-slate-500">最新 SHA:</span>
          <code :class="[shaClass, 'px-2 py-0.5 rounded text-xs']">{{ repo.latestSha ? repo.latestSha.substring(0, 8) : '未检测' }}</code>
        </div>
        <div v-if="repo.latestDate" class="flex items-center gap-2 text-sm">
          <span class="text-slate-500 dark:text-slate-500">更新时间:</span>
          <span class="text-slate-600 dark:text-slate-300">{{ formatRelativeTime(repo.latestDate) }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '../utils/time.js'

const props = defineProps({
  repo: { type: Object, required: true },
})

const isCnb = computed(() => props.repo.platform === 'cnb')

const platformLabel = computed(() => ({
  github: 'GitHub',
  gitee: 'Gitee',
  gitlab: 'GitLab',
  cnb: 'CNB',
}[props.repo.platform] || props.repo.platform))

const badgeClass = computed(() => ({
  github: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  gitee: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  gitlab: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  cnb: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
}[props.repo.platform] || 'bg-slate-100 text-slate-600'))

const shaClass = computed(() => ({
  github: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  gitee: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
  gitlab: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10',
  cnb: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
}[props.repo.platform] || 'text-slate-600 dark:text-slate-300'))

const statusActive = computed(() =>
  isCnb.value ? !!props.repo.latestBuildId : !!props.repo.latestSha
)

function openRepo() {
  if (props.repo.url) window.open(props.repo.url, '_blank')
}
</script>
