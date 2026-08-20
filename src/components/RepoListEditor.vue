<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="block text-sm text-slate-500 dark:text-slate-400">
        仓库列表（仓库名 / 分支 / 备注）
      </label>
      <div class="flex gap-2">
        <button type="button" @click="showPaste = true"
          class="px-3 py-1.5 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          批量粘贴
        </button>
        <button type="button" @click="addRow"
          class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          + 添加仓库
        </button>
      </div>
    </div>

    <div v-if="!rows.length" class="text-sm text-slate-400 dark:text-slate-500 py-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
      暂无仓库，点击「添加仓库」或「批量粘贴」导入
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <tr>
            <th class="text-left font-medium px-3 py-2 w-[34%]">仓库名 (owner/repo)</th>
            <th class="text-left font-medium px-3 py-2 w-[20%]">分支</th>
            <th class="text-left font-medium px-3 py-2">备注</th>
            <th class="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i" class="border-t border-slate-200 dark:border-slate-700">
            <td class="px-2 py-1.5">
              <input v-model.trim="row.repo"
                placeholder="owner/repo"
                class="w-full px-2 py-1.5 rounded-md bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </td>
            <td class="px-2 py-1.5">
              <input v-model.trim="row.branch"
                :placeholder="defaultBranch"
                class="w-full px-2 py-1.5 rounded-md bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </td>
            <td class="px-2 py-1.5">
              <input v-model.trim="row.note"
                placeholder="可选备注"
                class="w-full px-2 py-1.5 rounded-md bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </td>
            <td class="px-2 py-1.5 text-center">
              <button type="button" @click="removeRow(i)" title="删除"
                class="text-slate-400 hover:text-rose-500 transition-colors">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 批量粘贴弹窗 -->
    <div v-if="showPaste"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="showPaste = false">
      <div class="glass-card w-full max-w-lg rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">批量粘贴解析</h3>
          <button type="button" @click="showPaste = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          每行一个仓库，支持格式：<code>owner/repo</code>、<code>owner/repo@branch</code>，
          备注可用空格 / 逗号 / # / - 与仓库名分隔，例如
          <code>owner/repo my-app</code> 或 <code>owner/repo@main 后端服务</code>。
        </p>
        <textarea v-model="pasteText" rows="8" placeholder="owner/repo@main 备注\nowner2/repo2"
          class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"></textarea>
        <p v-if="parseHint" class="text-xs" :class="parseOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'">
          {{ parseHint }}
        </p>
        <div class="flex justify-end gap-2">
          <button type="button" @click="showPaste = false"
            class="px-4 py-2 text-sm rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            取消
          </button>
          <button type="button" @click="applyPaste"
            class="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            解析并添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  defaultBranch: { type: String, default: 'main' },
})
const emit = defineEmits(['update:modelValue'])

const rows = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const showPaste = ref(false)
const pasteText = ref('')
const parseHint = ref('')
const parseOk = ref(true)

function addRow() {
  emit('update:modelValue', [...props.modelValue, { repo: '', branch: '', note: '' }])
}

function removeRow(i) {
  const next = props.modelValue.slice()
  next.splice(i, 1)
  emit('update:modelValue', next)
}

/**
 * 解析粘贴文本为多行仓库条目
 * - 先按 @ 提取分支
 * - 再按 owner/repo 匹配，剩余部分作为备注（去除前导分隔符）
 */
function parsePasted(text) {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const result = []
  let invalid = 0
  for (const line of lines) {
    const atIdx = line.indexOf('@')
    let main = line
    let branch = ''
    if (atIdx !== -1) {
      main = line.slice(0, atIdx)
      branch = line.slice(atIdx + 1).trim()
    }
    const m = main.match(/^([\w.\-]+)\/([\w.\-]+)(.*)$/)
    if (!m) { invalid++; continue }
    let note = m[3].replace(/^[\s,#\-:：]+/, '').trim()
    result.push({ repo: `${m[1]}/${m[2]}`, branch, note })
  }
  return { result, invalid }
}

function applyPaste() {
  const { result, invalid } = parsePasted(pasteText.value)
  if (!result.length) {
    parseOk.value = false
    parseHint.value = invalid ? '未解析到有效仓库（格式应为 owner/repo）' : '请输入仓库内容'
    return
  }
  emit('update:modelValue', [...props.modelValue, ...result])
  parseOk.value = true
  parseHint.value = `已添加 ${result.length} 个仓库${invalid ? `，${invalid} 行格式无效已忽略` : ''}`
  pasteText.value = ''
  setTimeout(() => { showPaste.value = false; parseHint.value = '' }, 600)
}

// 关闭弹窗时清空提示
watch(showPaste, (v) => { if (!v) { parseHint.value = ''; parseOk.value = true } })
</script>
