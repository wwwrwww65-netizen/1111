<template>
<nav class="side" role="list" dir="rtl">
    <button v-for="c in items" :key="c.id" class="row" :class="{ active: c.id===modelValue }" :aria-current="c.id===modelValue ? 'true' : 'false'" @click="$emit('update:modelValue', c.id)">{{ c.name }}</button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ items: Array<{id:string;name:string}>; modelValue?: string }>()
defineEmits(['update:modelValue'])
</script>

<style scoped>
.side{display:flex;flex-direction:column;gap:2px;height:100%;max-height:100%;overflow:auto;background:#f6f6f6;padding:12px}
.row{padding:12px;border-radius:6px;border:0;background:transparent;text-align:start;width:100%}
.row.active{background:#111;color:#fff}
@media (max-width: 768px){
  .side{flex-direction:row;align-items:center;height:auto;max-height:none;overflow-x:auto;overflow-y:hidden;border-radius:0;padding:8px 12px;gap:8px}
  .row{width:auto;flex:0 0 auto;white-space:nowrap;border-radius:999px}
}
</style>

