<script setup lang="ts">
import type { Employee } from '@/types'
import { computed } from 'vue'

const props = defineProps<{ employee: Employee }>()

function luminance(hex: string) {
  const c = hex.replace('#','')
  const r = parseInt(c.substring(0,2), 16) / 255
  const g = parseInt(c.substring(2,4), 16) / 255
  const b = parseInt(c.substring(4,6), 16) / 255
  const a = [r,g,b].map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4))
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]
}

const textColor = computed(() => luminance(props.employee.color) > 0.5 ? 'text-black' : 'text-white')
</script>

<template>
  <span
    class="badge-text flex w-full items-center justify-center px-4 py-2 rounded-md text-lg font-bold shadow"
    :style="{ backgroundColor: props.employee.color }"
    :class="textColor"
  >
    {{ props.employee.name }}
  </span>
</template>


