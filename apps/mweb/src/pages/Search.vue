<template>
  <div dir="rtl">
    <HeaderBar />
    <div class="container page">
      <div class="searchbar">
        <input class="input" v-model="q" placeholder="ابحث عن منتج..." @keyup.enter="runSearch" />
        <button class="btn" @click="runSearch">بحث</button>
        <button class="btn btn-outline" @click="openFilters=true">فلترة</button>
      </div>

      <div v-if="!q && (historyList.length || trending.length)" class="cards">
        <div class="card">
          <div class="card-title">الأكثر بحثًا</div>
          <div class="chips">
            <button v-for="t in trending" :key="t" class="chip" @click="applyQuick(t)">{{ t }}</button>
          </div>
        </div>
        <div v-if="historyList.length" class="card">
          <div class="card-title">سجل البحث</div>
          <div class="chips">
            <button v-for="t in historyList" :key="t" class="chip" @click="applyQuick(t)">{{ t }}</button>
          </div>
        </div>
      </div>

      <div v-if="items.length" class="grid">
        <ProductCard v-for="p in items" :key="p.id" :img="p.img" :title="p.title" :price="p.price + ' ر.س'" />
      </div>
      <div v-else class="muted" v-if="searched">لا توجد نتائج</div>
    </div>

    <BottomSheet v-model="openFilters">
      <div class="sheet-title">الفلاتر</div>
      <div class="filter-block">
        <div class="block-title">السعر</div>
        <div class="row">
          <input class="input" type="number" v-model.number="priceMin" placeholder="من" />
          <input class="input" type="number" v-model.number="priceMax" placeholder="إلى" />
        </div>
      </div>
      <button class="btn" @click="runSearch">تطبيق</button>
    </BottomSheet>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import ProductCard from '@/components/ProductCard.vue'
import { ref } from 'vue'

type P = { id:string; title:string; price:number; img:string }
const q = ref('')
const items = ref<P[]>([])
const openFilters = ref(false)
const priceMin = ref<number|undefined>()
const priceMax = ref<number|undefined>()
const searched = ref(false)
const trending = ['فساتين','أحذية','ساعات','سماعات','ملابس رياضية']
const historyList = JSON.parse(localStorage.getItem('search_history')||'[]') as string[]
function saveHistory(term:string){
  const list = Array.from(new Set([term, ...historyList])).slice(0,10)
  localStorage.setItem('search_history', JSON.stringify(list))
}
function applyQuick(term:string){ q.value = term; runSearch() }
async function runSearch(){
  searched.value = true
  if(q.value.trim()) saveHistory(q.value.trim())
  const sp = new URLSearchParams({ q: q.value })
  if(priceMin.value!=null) sp.set('min', String(priceMin.value))
  if(priceMax.value!=null) sp.set('max', String(priceMax.value))
  try{
    const res = await fetch(`https://api.jeeey.com/api/search?${sp.toString()}`)
    if(res.ok){
      const data = await res.json()
      items.value = (data?.items||[]).map((d:any)=>({ id:d.id||d.sku||String(d.name), title:d.name, price:d.price||0, img:(d.images?.[0]||'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop') }))
      if(items.value.length) return
    }
  }catch{}
  items.value = Array.from({length:6}).map((_,i)=>({ id:String(i+1), title:`${q.value||'منتج'} ${i+1}`, price: 49 + i*7, img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop' }))
}
</script>

<style scoped>
.page{padding-top:68px}
.searchbar{display:grid;grid-template-columns:1fr auto auto;gap:8px}
.input{padding:10px 12px;border:1px solid var(--muted-2);border-radius:10px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{padding:8px 12px;border:1px solid var(--muted-2);border-radius:999px;background:#fff}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.muted{color:#64748b;margin-top:12px}
.cards{display:grid;gap:12px;margin-top:12px}
.card-title{font-weight:700;margin-bottom:6px}
.sheet-title{font-weight:700;margin-bottom:8px}
</style>
