<template>
  <div class="glass-card rounded-xl p-6 mb-4">
    <div class="flex items-center gap-2 mb-4">
      <BrandIcon :platform="icon" class="w-5 h-5" />
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
    </div>
    <div class="space-y-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
import BrandIcon from './BrandIcon.vue'

defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
})
</script>
