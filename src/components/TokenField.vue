<template>
  <div>
    <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <input
        :type="show ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
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
    <p v-if="maskHint" class="text-xs text-slate-400 mt-1">{{ maskHint }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '留空表示不修改' },
  masked: { type: String, default: '' }, // 后端返回的掩码值
})
defineEmits(['update:modelValue'])

const show = ref(false)
const maskHint = computed(() =>
  props.masked && props.masked.includes('•') ? '当前已配置（已脱敏），留空则不修改' : ''
)
</script>
