<template>
  <section class="rec" dir="rtl">
    <h3 class="h">منتجات موصى بها</h3>
    <ProductGrid :items="items" />
  </section>
</template>

<script setup lang="ts">
import ProductGrid from '@/components/ProductGrid.vue'
const items = Array.from({length:10}).map((_,i)=>({ id:`rp${i}`, title:`منتج ${i+1}`, img:`https://picsum.photos/seed/rp${i}/500/600`, price:`$${(12+i).toFixed(2)}`, original:`$${(24+i).toFixed(2)}`, badge: i%2?'خصم':'جديد' }))
</script>

<style scoped>
.h{font-size:16px;margin:8px 12px}
</style>

