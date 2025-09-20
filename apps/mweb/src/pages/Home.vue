<template>
  <div :style="rootStyle">
    <HeaderBar />
    <TopTabs />
    <div class="container">
      <HeroBanner :style="heroTokens" />
      <PromoBanners />
      <SectionHeading title="الفئات" href="/categories" />
      <CategoryScroller class="space-y-16" />
      <SectionHeading title="الأكثر رواجًا" href="/products?sort=trending" />
      <HorizontalProducts />
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import HeroBanner from '@/components/HeroBanner.vue'
import CategoryScroller from '@/components/CategoryScroller.vue'
import PromoBanners from '@/components/PromoBanners.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import HorizontalProducts from '@/components/HorizontalProducts.vue'
import TopTabs from '@/components/TopTabs.vue'

import { computed } from 'vue'
// Apply Figma tokens if present
const rootStyle = computed(()=> ({ background: 'var(--figma-color-background, var(--bg))' }))
const heroTokens = computed(()=> ({
  boxShadow: 'var(--figma-shadow-hero-shadow, var(--shadow))',
  borderRadius: 'var(--figma-radius-hero-radius, 12px)'
}))
</script>

<style scoped>
.hero{display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px}
.hero-text{background:#0f172a;color:#fff;border-radius:12px;padding:16px}
.hero-text h1{margin:0 0 6px 0;font-size:20px}
.hero-text p{margin:0 0 10px 0;color:#cbd5e1}
.hero-img{width:100%;border-radius:12px;border:1px solid #e5e7eb}
.categories{margin-top:16px}
.categories h2,.products h2{font-size:16px;margin:0 0 10px 0}
.cat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.cat{display:grid;place-items:center;height:44px;border:1px solid #e5e7eb;border-radius:12px;color:#0f172a;text-decoration:none;background:#fff;font-size:13px}
.products{margin:16px 0}
.prod-grid{display:grid;grid-template-columns:1fr;gap:12px}
.prod{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
.prod img{width:100%;height:180px;object-fit:cover}
.prod .info{display:flex;justify-content:space-between;align-items:center;padding:10px 12px}
.prod .title{font-weight:600}
.prod .price{color:#0B5FFF;font-weight:700}
.btn-add{width:calc(100% - 24px);margin:0 12px 12px}
@media (min-width:420px){
  .prod-grid{grid-template-columns:1fr 1fr}
  .cat-grid{grid-template-columns:repeat(6,1fr)}
}
</style>

