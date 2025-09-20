<template>
  <nav class="tabs-wrap">
    <a v-for="t in tabs" :key="t.label" class="tab" :href="t.href">{{ t.label }}</a>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{ tabs?: Array<{ label: string; href: string }> }>();
const tabs = props.tabs || [
  { label: 'نساء', href: '/c/women' },
  { label: 'رجال', href: '/c/men' },
  { label: 'أطفال', href: '/c/kids' },
  { label: 'مقاسات كبيرة', href: '/c/plus' },
  { label: 'الكل', href: '/c/all' },
];
</script>

<style scoped>
.tabs-wrap{display:flex;gap:12px;overflow:auto;padding:8px 12px;border-top:1px solid var(--muted-2);border-bottom:1px solid var(--muted-2);background:#fff}
.tab{flex:0 0 auto;padding:6px 12px;border:1px solid var(--muted-2);border-radius:999px;text-decoration:none;color:inherit;background:#fff;font-size:13px}
.tab:active{transform:scale(.98)}
</style>

