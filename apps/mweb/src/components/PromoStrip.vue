<template>
  <div class="promo" role="region" aria-label="عروض سريعة">
    <div class="row" dir="rtl">
      <div v-for="p in promos" :key="p.text" class="item" tabindex="0">
        <Icon :name="p.icon" aria-hidden="true" />
        <span class="txt">{{ p.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
const promos = [
  { icon: 'truck', text: 'شحن مجاني فوق 199 ر.س' },
  { icon: 'discount', text: 'خصومات حتى 90%' },
  { icon: 'gift', text: 'نقاط ومكافآت Jeeey' },
  { icon: 'shield', text: 'دفع آمن' },
]
</script>

<style scoped>
.promo{background:var(--surface,#fff);}
.row{display:flex;gap:8px;overflow:auto;padding:8px 12px}
.item{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:8px 12px;border:1px solid var(--muted-2);border-radius:12px;background:#fff}
.item:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:2px}
.txt{white-space:nowrap;font-size:12px}
</style>

