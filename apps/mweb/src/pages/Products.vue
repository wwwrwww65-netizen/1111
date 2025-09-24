<template>
  <div>
    <HeaderBar />
    <div class="container">
      <h1 style="margin:12px 0">المنتجات</h1>
      <div class="space-y-12">
        <div class="row" style="justify-content:space-between;gap:8px;align-items:center">
          <div class="filters">
            <input class="input small" type="number" v-model.number="priceMin" placeholder="السعر من" />
            <input class="input small" type="number" v-model.number="priceMax" placeholder="السعر إلى" />
            <select class="input small" v-model="color">
              <option value="">اللون</option>
              <option>أسود</option>
              <option>أبيض</option>
              <option>أحمر</option>
            </select>
            <select class="input small" v-model="brand">
              <option value="">الماركة</option>
              <option>Jeeey</option>
              <option>Adidas</option>
              <option>Nike</option>
            </select>
            <select class="input small" v-model="availability">
              <option value="">التوافر</option>
              <option value="in">متاح</option>
              <option value="out">غير متاح</option>
            </select>
            <button class="btn btn-outline" @click="applyFilters">تطبيق</button>
          </div>
          <div class="sort">
            <select class="input small" v-model="sort">
              <option value="reco">موصى به</option>
              <option value="new">الأحدث</option>
              <option value="top">الأكثر مبيعًا</option>
              <option value="price_asc">السعر ↑</option>
              <option value="price_desc">السعر ↓</option>
            </select>
          </div>
        </div>
        <SkeletonGrid v-if="loading" :count="6" :cols="2" />
        <div v-else class="prod-grid">
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
import SkeletonGrid from '@/components/SkeletonGrid.vue'
import { onMounted, ref } from 'vue'
import { apiGet } from '@/lib/api'

type P = { id:string; title:string; price:number; img:string }
const products = ref<P[]>([])
const loading = ref(true)
const priceMin = ref<number|undefined>()
const priceMax = ref<number|undefined>()
const color = ref('')
const brand = ref('')
const availability = ref('')
const sort = ref('reco')

onMounted(async ()=>{
  try {
    const data = await apiGet<any>('/api/products')
    if (data) {
      products.value = (data?.items||[]).map((d:any)=>({ id:d.id||d.sku||String(d.name), title:d.name, price:d.price||0, img:(d.images?.[0]||'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop') }))
      if (products.value.length) return
    }
  } catch {}
  products.value = [
    { id:'1', title:'منتج 1', price:89, img:'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop' },
    { id:'2', title:'منتج 2', price:129, img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop' },
    { id:'3', title:'منتج 3', price:59, img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop' },
  ]
  loading.value = false
})
async function applyFilters(){
  loading.value = true
  const sp = new URLSearchParams()
  if (priceMin.value!=null) sp.set('min', String(priceMin.value))
  if (priceMax.value!=null) sp.set('max', String(priceMax.value))
  if (color.value) sp.set('color', color.value)
  if (brand.value) sp.set('brand', brand.value)
  if (availability.value) sp.set('availability', availability.value)
  if (sort.value) sp.set('sort', sort.value)
  try{
    const data = await apiGet<any>(`/api/products?${sp.toString()}`)
    products.value = (data?.items||[]).map((d:any)=>({ id:d.id||d.sku||String(d.name), title:d.name, price:d.price||0, img:(d.images?.[0]||'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop') }))
  }finally{ loading.value = false }
}
</script>

