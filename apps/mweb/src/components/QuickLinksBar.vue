<template>
  <nav class="ql" dir="rtl">
    <a v-for="q in qs" :key="q.label" href="#" class="item" :aria-label="q.label">
      <span class="ico">{{ q.emoji }}</span>
      <span class="tx">{{ q.label }}</span>
      <span v-if="q.badge" class="badge">{{ q.badge }}</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
const qs = [
  { emoji:'❤️', label:'قائمة الأمنيات', badge: 3 },
  { emoji:'📜', label:'تاريخ الطلبات' },
  { emoji:'👥', label:'المتابعون' }
]
</script>

<style scoped>
.ql{display:flex;gap:8px;justify-content:space-between}
.item{position:relative;width:60px;height:60px;border:1px solid var(--muted-2,#eee);border-radius:12px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;color:inherit}
.ico{font-size:18px}
.tx{font-size:11px;margin-top:4px}
.badge{position:absolute;top:6px;left:6px;background:#111;color:#fff;border-radius:999px;min-width:16px;height:16px;line-height:16px;font-size:10px;text-align:center;padding:0 4px}
</style>

