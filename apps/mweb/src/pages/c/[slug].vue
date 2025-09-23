<template>
  <div dir="rtl">
    <HeaderBar />
    <div class="toolbar container">
      <div class="tabs" role="tablist">
        <button class="tab" :class="{active: sort==='reco'}" @click="setSort('reco')">موصى به</button>
        <button class="tab" :class="{active: sort==='new'}" @click="setSort('new')">الأحدث</button>
        <button class="tab" :class="{active: sort==='top'}" @click="setSort('top')">الأكثر مبيعًا</button>
        <button class="tab" :class="{active: sort==='price_asc'}" @click="setSort('price_asc')">السعر ↑</button>
        <button class="tab" :class="{active: sort==='price_desc'}" @click="setSort('price_desc')">السعر ↓</button>
      </div>
      <div class="actions">
        <button class="btn" @click="openFilters=true">فلترة</button>
      </div>
    </div>

    <div class="container grid-wrap">
      <ProductGrid :items="items" />
    </div>

    <BottomSheet v-model="openFilters" @apply="applyFilters">
      <div class="filter-block">
        <div class="block-title">السعر</div>
        <div class="row">
          <label class="field">
            <span>من</span>
            <input type="number" v-model.number="priceMin" inputmode="numeric" />
          </label>
          <label class="field">
            <span>إلى</span>
            <input type="number" v-model.number="priceMax" inputmode="numeric" />
          </label>
        </div>
      </div>
      <div class="filter-block">
        <div class="block-title">المقاس</div>
        <div class="chips">
          <button class="chip" v-for="s in sizes" :key="s" :class="{active: selectedSizes.includes(s)}" @click="toggleSize(s)">{{ s }}</button>
        </div>
      </div>
    </BottomSheet>

    <BottomNav />
  </div>
  
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import ProductGrid from '@/components/ProductGrid.vue'
import { API_BASE } from '@/lib/api'

type Product = { id:string; title:string; price:number; img:string }
const items = ref<Product[]>([])
const route = useRoute()
const router = useRouter()

const sort = ref<string>((route.query.sort as string) || 'reco')
const openFilters = ref(false)
const priceMin = ref<number|undefined>(undefined)
const priceMax = ref<number|undefined>(undefined)
const sizes = ['XS','S','M','L','XL','2XL']
const selectedSizes = ref<string[]>([])

function toggleSize(s:string){
  const idx = selectedSizes.value.indexOf(s)
  if (idx >= 0) selectedSizes.value.splice(idx,1)
  else selectedSizes.value.push(s)
}

function setSort(v:string){
  sort.value = v
  router.replace({ query: { ...route.query, sort: v } })
  fetchData()
}

function applyFilters(){
  fetchData()
}

async function fetchData(){
  const slug = route.params.slug as string
  const query = new URLSearchParams()
  if (sort.value) query.set('sort', sort.value)
  if (priceMin.value != null) query.set('priceMin', String(priceMin.value))
  if (priceMax.value != null) query.set('priceMax', String(priceMax.value))
  if (selectedSizes.value.length) query.set('sizes', selectedSizes.value.join(','))
  const url = `${API_BASE}/api/catalog/${encodeURIComponent(slug)}?${query.toString()}`
  try{
    const res = await fetch(url, { credentials:'omit', headers:{ 'Accept':'application/json' } })
    if (res.ok){
      const data = await res.json()
      items.value = (data?.items||[]).map((d:any)=>({ id:d.id||d.sku||String(d.name), title:d.name, price:d.price||0, img:(d.images?.[0]||'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop') }))
      if (items.value.length) return
    }
  }catch{}
  // fallback demo data
  items.value = Array.from({length:12}).map((_,i)=>({ id:String(i+1), title:`عنصر ${i+1}`, price: 49 + i*3, img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop' }))
}

onMounted(fetchData)
watch(()=>route.fullPath, fetchData)
</script>

<style scoped>
.toolbar{position:sticky;top:56px;background:#fff;z-index:10;padding:8px 0;border-bottom:1px solid var(--muted-2)}
.tabs{display:flex;gap:8px;overflow:auto}
.tab{flex:0 0 auto;padding:8px 10px;border:1px solid var(--muted-2);border-radius:999px;background:#fff}
.tab.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
.actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.btn{padding:8px 12px;border:1px solid var(--muted-2);border-radius:10px;background:#fff}
.grid-wrap{padding:12px 0}
.filter-block{padding:8px 0}
.block-title{font-weight:700;margin-bottom:6px}
.row{display:flex;gap:8px}
.field{display:grid;gap:4px}
.field input{padding:10px 12px;border:1px solid #ddd;border-radius:10px;width:120px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{padding:8px 12px;border:1px solid #ddd;border-radius:999px;background:#fff}
.chip.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
</style>

