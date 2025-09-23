<template>
  <div :style="rootStyle" dir="rtl">
    <HeaderBar />
    <TopTabs />
    <div class="container" style="padding-top:112px">
      <HeroBanner :style="heroTokens" />
      <PromoStrip />
      <DiscountRow />
      <Carousel :slides="heroSlides" />
      <SectionHeading title="الفئات" href="/categories" />
      <CategoryGrid />
      <SectionHeading title="اهم الترندات" href="/products?sort=reco" />
      <HorizontalProducts :label="'اهم الترندات'" />
      <SectionHeading title="عروض كبرى" href="/products?sort=top" />
      <HorizontalProducts :label="'عروض كبرى'" />
      <SectionHeading title="وصل حديثًا" href="/products?sort=new" />
      <ProductGrid :items="newItems" label="وصل حديثًا" />
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import HeroBanner from '@/components/HeroBanner.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import PromoStrip from '@/components/PromoStrip.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import HorizontalProducts from '@/components/HorizontalProducts.vue'
import ProductCard from '@/components/ProductCard.vue'
import ProductGrid from '@/components/ProductGrid.vue'
import { apiGet } from '@/lib/api'
import { ref, computed, onMounted } from 'vue'
import DiscountRow from '@/components/DiscountRow.vue'
import TopTabs from '@/components/TopTabs.vue'
import Carousel from '@/components/Carousel.vue'
import SvgBanner from '@/components/SvgBanner.vue'
// duplicate removed

// Apply Figma tokens if present
const rootStyle = computed(()=> ({ background: '#fde9eb' }))
const heroTokens = computed(()=> ({
  boxShadow: 'var(--figma-shadow-hero-shadow, var(--shadow))',
  borderRadius: 'var(--figma-radius-hero-radius, 12px)'
}))

const newItems = ref<any[]>([])
const bestItems = newItems
const saleItems = newItems
const heroSlides = [
  { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop' },
  { img: 'https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1200&auto=format&fit=crop' },
  { img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop' },
]

onMounted(async ()=>{
  const data = await apiGet<any>('/api/products?limit=20&sort=new')
  if (data && Array.isArray(data.items)){
    newItems.value = data.items.map((p:any)=> ({
      id: p.id, title: p.name, img: p.images?.[0] || 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=480&auto=format&fit=crop',
      price: (p.price||0)+' ر.س', original: p.original? (p.original+' ر.س') : undefined,
      discountPercent: p.discountPercent || undefined,
    }))
  } else {
    newItems.value = [
      { img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=480&auto=format&fit=crop', title: 'فستان صيفي', original: '199 ر.س', price: '129 ر.س', badge: '-35%' },
      { img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=480&auto=format&fit=crop', title: 'سماعات بلوتوث', original: '349 ر.س', price: '279 ر.س', badge: '-20%' },
      { img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=480&auto=format&fit=crop', title: 'ساعة ذكية', original: '399 ر.س', price: '329 ر.س', badge: '-18%' },
      { img: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=480&auto=format&fit=crop', title: 'حقيبة يد', original: '299 ر.س', price: '249 ر.س', badge: '-17%' },
    ]
  }
})
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

