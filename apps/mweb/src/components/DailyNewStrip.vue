<template>
  <section class="dnew" dir="rtl" role="region" aria-label="الجديد اليومي">
    <div class="date" aria-label="تاريخ اليوم">
      <div class="d">{{ day }}</div>
      <div class="m">{{ month }}</div>
    </div>
    <div class="thumbs" ref="wrap">
      <img v-for="(t,i) in items" :key="i" class="t" :src="t" :alt="`جديد اليوم ${i+1}`" loading="lazy" />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ items?: string[]; day?: string | number; month?: string }>()
const day = props.day ?? new Date().getDate()
const month = props.month ?? (new Date().toLocaleDateString('ar', { month:'short' }))
const items = props.items ?? Array.from({ length: 8 }).map((_,i)=> `https://picsum.photos/seed/dn${i}/128/128`)
</script>

<style scoped>
.dnew{display:grid;grid-template-columns:64px 1fr;gap:12px;padding:12px 16px;align-items:center;height:96px}
.date{width:64px;height:64px;border-radius:8px;background:#E8F8EF;display:flex;flex-direction:column;align-items:center;justify-content:center}
.d{font-weight:800;font-size:18px}
.m{font-size:12px;color:#2c7}
.thumbs{display:flex;gap:8px;overflow:auto}
.t{width:64px;height:64px;border-radius:6px;object-fit:cover;background:#f3f3f3;flex:0 0 auto}
</style>

