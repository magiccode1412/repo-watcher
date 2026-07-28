<template>
  <div class="glass-card rounded-xl p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-1">{{ title }}</p>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ value }}</p>
      </div>
      <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="[iconBg, iconColor]">
        <slot name="icon" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: '-' },
  iconBg: { type: String, default: '' },
  iconColor: { type: String, default: '' },
})
</script>
