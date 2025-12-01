<template>
  <div dir="rtl">
    <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
      <div v-if="title" class="mb-1.5 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">{{ title }}</h2>
        <button class="flex items-center text-xs text-gray-700" aria-label="عرض المزيد" @click="goMore">
          <span class="mr-1">المزيد</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>
      <div class="overflow-x-auto no-scrollbar snap-x-start simple-row">
        <div v-if="loading" class="simple-row-inner">
          <div v-for="i in count" :key="'sk-'+i" class="text-start snap-item simple-item">
            <div class="border border-gray-200 rounded-[4px] overflow-hidden bg-gray-200 animate-pulse aspect-[192/255]" />
            <div v-if="showPrice" class="mt-1"><span class="inline-block w-12 h-3 rounded bg-gray-200" /></div>
          </div>
        </div>
        <div class="simple-row-inner">
          <button v-for="(p,i) in items" :key="'prod-'+i" class="text-start snap-item simple-item" :aria-label="'منتج '+(p.name||'')" @click="open(p)">
            <div class="border border-gray-200 rounded-[4px] overflow-hidden bg-white">
              <img
                :src="thumb(p.image, 512)"
                :srcset="`${thumb(p.image,256)} 256w, ${thumb(p.image,384)} 384w, ${thumb(p.image,512)} 512w, ${thumb(p.image,768)} 768w`"
                sizes="(max-width: 480px) 50vw, 33vw"
                :alt="String(p.name||p.price||'منتج')"
                class="w-full aspect-[192/255] object-cover"
                :loading="i < 6 ? 'eager' : 'lazy'"
                :fetchpriority="i < 6 ? 'high' : 'auto'"
                decoding="async"
              />
            </div>
            <div v-if="showPrice" class="mt-1"><span class="text-red-600 font-bold text-sm">{{ p.priceText }}</span></div>
          </button>
        </div>
      </div>
    </div>
  </div>
  </template>

<script setup lang="ts">
defineOptions({ name: 'ProductCarouselBlock' })
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/lib/api'
import { fmtPrice, initCurrency } from '@/lib/currency'
import { buildThumbUrl as thumb } from '@/lib/media'

type Filter = { sortBy?: string; limit?: number; categoryIds?: string[]; onlyDiscounted?: boolean }
type Cfg = { title?: string; showPrice?: boolean; products?: any[]; filter?: Filter }

const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const router = useRouter()
const showPrice = computed(()=> !!props.cfg?.showPrice)
const title = computed(()=> props.cfg?.title || '')
const count = computed(()=> (props.device ?? 'MOBILE') === 'MOBILE' ? 6 : 10)
const items = ref<Array<{ id:string; name:string; image:string; price:number; priceText:string }>>([])
const loading = ref(true)
function goMore(){
  const sort = String(props.cfg?.filter?.sortBy||'new')
  try{ router.push(`/products?sort=${encodeURIComponent(sort)}`) }catch{}
}
function open(p: { id?: string }){ const id = String(p?.id||''); if (id) router.push(`/p?id=${encodeURIComponent(id)}`) }

onMounted(async ()=>{
  try{ await initCurrency() }catch{}
  try{
    // 1) Explicit products override
    const provided = Array.isArray(props.cfg?.products) ? props.cfg!.products! : []
    if (provided.length){
      items.value = provided.map((p:any)=> {
        const priceNum = Number(p.price||p.basePrice||0)
        return {
          id: String(p.id||''),
          name: String(p.name||p.title||''),
          image: p.image || (Array.isArray(p.images)&&p.images[0]) || '/images/placeholder-product.jpg',
          price: priceNum,
          priceText: fmtPrice(priceNum)
        }
      })
    } else {
      // 2) Filtered fetch (supports categoryIds)
      const limit = Number(props.cfg?.filter?.limit||12)
      const sort = String(props.cfg?.filter?.sortBy||'new')
      const cats = Array.isArray(props.cfg?.filter?.categoryIds) ? (props.cfg?.filter?.categoryIds as string[]) : []
      const u = new URL(`${API_BASE}/api/products`)
      u.searchParams.set('limit', String(limit))
      u.searchParams.set('sort', sort)
      if (cats.length) u.searchParams.set('categoryIds', cats.join(','))
      const r = await fetch(u.toString())
      const j = await r.json()
      const arr = Array.isArray(j?.items)? j.items: []
      items.value = arr.map((p:any)=> {
        const priceNum = Number(p.price||0)
        return {
          id: String(p.id||''),
          name: String(p.name||''),
          image: (Array.isArray(p.images)&&p.images[0]) || '/images/placeholder-product.jpg',
          price: priceNum,
          priceText: fmtPrice(priceNum)
        }
      })
    }
    // 3) Share used IDs for downstream blocks to avoid duplicates
    try{
      const w = window as any
      if (!w.__USED_PRODUCT_IDS) w.__USED_PRODUCT_IDS = new Set<string>()
      for (const it of items.value){ if (it?.id) w.__USED_PRODUCT_IDS.add(String(it.id)) }
      const catIds = Array.isArray(props.cfg?.filter?.categoryIds)? props.cfg!.filter!.categoryIds! : []
      if (catIds.length){ w.__LAST_CAROUSEL_CATEGORY_IDS = catIds.slice() }
    }catch{}
  }catch{ items.value = [] }
  finally{ loading.value = false }
})
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
.simple-row{--visible:4.15;--gap:6px}
.simple-row-inner{display:flex;gap:var(--gap)}
.simple-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
</style>


