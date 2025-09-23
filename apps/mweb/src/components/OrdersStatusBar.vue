<template>
  <nav class="orders" dir="rtl">
    <button v-for="o in rows" :key="o.label" class="cell" role="button" :aria-label="`عرض ${o.label}`">
      <span class="ico">{{ o.emoji }}</span>
      <span class="tx">{{ o.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const rows = [
  { emoji:'🕑', label:'غير مدفوع' },
  { emoji:'📦', label:'قيد التجهيز' },
  { emoji:'🚚', label:'تم الشحن' },
  { emoji:'🔄', label:'المسترجعات' }
]
</script>

<style scoped>
.orders{display:flex;justify-content:space-between}
.cell{width:72px;min-height:72px;border:1px solid var(--muted-2,#eee);border-radius:12px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ico{font-size:28px;line-height:1}
.tx{font-size:12px;margin-top:6px}
</style>

