<template>
  <section :aria-label="label || 'منتجات'" dir="rtl">
    <div class="grid">
      <ProductCard v-for="p in items" :key="p.id || p.title" v-bind="p" />
    </div>
  </section>
</template>

<script setup lang="ts">
import ProductCard from '@/components/ProductCard.vue'
defineProps<{ label?: string; items: Array<any> }>()
</script>

<style scoped>
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
</style>

