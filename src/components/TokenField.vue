<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <label class="block text-sm text-slate-500 dark:text-slate-400">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <span class="text-xs px-2 py-0.5 rounded-full"
        :class="configured
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
        {{ configured ? '● 已配置' : '○ 未配置' }}
      </span>
    </div>
    <div class="relative">
      <input
        :type="show ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        autocomplete="new-password"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        @click="show = !show"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
      >
        {{ show ? '隐藏' : '显示' }}
      </button>
    </div>
    <p class="text-xs text-slate-400 mt-1">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '留空表示不修改' },
  configured: { type: Boolean, default: false }, // 是否已配置（状态，不含值）
})
defineEmits(['update:modelValue'])

const show = ref(false)
const hint = computed(() =>
  props.configured ? '当前已配置，留空则不修改' : '尚未配置，填写后将保存'
)
</script>
