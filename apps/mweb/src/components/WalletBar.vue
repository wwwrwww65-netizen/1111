<template>
  <nav class="wallet" dir="rtl">
    <button v-for="it in items" :key="it.label" class="item" :aria-label="it.label">
      <Icon :name="it.icon" />
      <div class="txt">{{ it.label }}</div>
    </button>
  </nav>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
const items = [
  { icon:'card', label:'المحفظة' },
  { icon:'coupon', label:'القسائم' },
  { icon:'gift', label:'النقاط' },
  { icon:'support', label:'الدعم' }
]
</script>

<style scoped>
.wallet{display:flex;justify-content:space-between;gap:6px}
.item{width:72px;min-height:72px;border:1px solid var(--muted-2,#eee);border-radius:12px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}
.txt{font-size:12px;margin-top:6px}
</style>

