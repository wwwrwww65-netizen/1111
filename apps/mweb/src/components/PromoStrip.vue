<template>
  <div class="promo" role="region" aria-label="عروض سريعة">
    <div class="row" dir="rtl">
      <div class="tray">
        <div v-for="p in promos" :key="p.text" class="item" tabindex="0">
          <Icon :name="p.icon" aria-hidden="true" />
          <span class="txt">{{ p.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
const promos = [
  { icon: 'truck', text: 'شحن مجاني فوق 199 ر.س' },
  { icon: 'tag', text: 'خصومات حتى 90%' },
  { icon: 'gift', text: 'نقاط ومكافآت Jeeey' },
]
</script>

<style scoped>
.promo{padding:8px 12px}
.row{display:block}
.tray{display:flex;gap:8px;overflow:auto;background:#fff;border-radius:8px;padding:8px}
.item{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:8px 12px}
.item:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:2px}
.txt{white-space:nowrap;font-size:12px}
</style>

