<template>
  <div>
    <HeaderBar />
    <div class="container">
      <HeroBanner />
      <CategoryScroller class="space-y-16" />
      <section class="space-y-12">
        <h2 style="margin:0">الأكثر رواجًا</h2>
        <div class="prod-grid">
          <ProductCard v-for="p in products" :key="p.title" :img="p.img" :title="p.title" :price="p.price" />
        </div>
      </section>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import HeroBanner from '@/components/HeroBanner.vue'
import CategoryScroller from '@/components/CategoryScroller.vue'
import ProductCard from '@/components/ProductCard.vue'

const products = [
  { img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', title: 'منتج 1', price: '89 ر.س' },
  { img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop', title: 'منتج 2', price: '129 ر.س' },
  { img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop', title: 'منتج 3', price: '59 ر.س' },
];
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

