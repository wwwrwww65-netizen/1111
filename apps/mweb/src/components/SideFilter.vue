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
.side{display:flex;flex-direction:column;gap:4px;max-height:calc(100vh - 140px);overflow:auto}
.row{padding:10px 12px;border-radius:10px;border:1px solid var(--muted-2,#eee);background:#fff;text-align:start}
.row.active{background:#111;color:#fff;border-color:#111}
</style>

