<template>
  <div>
    <HeaderBar />
    <div class="container">
      <h1 style="margin:12px 0">المنتجات</h1>
      <div class="space-y-12">
        <div class="row" style="justify-content:space-between">
          <div class="badge">الكل</div>
          <div class="badge">الفلترة (قريبًا)</div>
        </div>
        <div class="prod-grid">
          <ProductCard v-for="p in products" :key="p.id" :img="p.img" :title="p.title" :price="p.price + ' ر.س'" />
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import ProductCard from '@/components/ProductCard.vue'
import { onMounted, ref } from 'vue'

type P = { id:string; title:string; price:number; img:string }
const products = ref<P[]>([])

onMounted(async ()=>{
  try {
    const res = await fetch('https://api.jeeey.com/api/products')
    if (res.ok) {
      const data = await res.json()
      products.value = (data?.items||[]).map((d:any)=>({ id:d.id||d.sku||String(d.name), title:d.name, price:d.price||0, img:(d.images?.[0]||'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop') }))
      if (products.value.length) return
    }
  } catch {}
  products.value = [
    { id:'1', title:'منتج 1', price:89, img:'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop' },
    { id:'2', title:'منتج 2', price:129, img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop' },
    { id:'3', title:'منتج 3', price:59, img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop' },
  ]
})
</script>

