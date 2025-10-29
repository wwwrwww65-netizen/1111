<template>
  <section class="py-3" dir="rtl">
    <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
      <h2 class="text-sm font-semibold text-gray-900 text-center">من أجلك</h2>
    </div>
    <div class="px-2 py-2">
      <div class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="(p,i) in products" :key="'fy-'+(p.id||i)" class="mb-1 break-inside-avoid">
          <ProductGridCard :product="p" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ProductGridCard from '@/components/ProductGridCard.vue'
import { apiGet, API_BASE } from '@/lib/api'

type GridP = { id: string; title: string; image?: string; images?: string[]; overlayBannerSrc?: string; overlayBannerAlt?: string; brand?: string; discountPercent?: number; bestRank?: number; bestRankCategory?: string; basePrice?: string; soldPlus?: string; couponPrice?: string }
type Cfg = { columns?: number; products?: any[]; items?: any[] }
const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const fallbackCount = computed(()=> (props.device ?? 'MOBILE') === 'MOBILE' ? 8 : 9)
const products = ref<GridP[]>([])

function toGridP(p:any, i:number): GridP{
  return {
    id: String(p.id || p.title || i),
    title: String(p.title || p.name || ''),
    image: p.image || (Array.isArray(p.images)? p.images[0] : undefined),
    images: Array.isArray(p.images)? p.images : undefined,
    overlayBannerSrc: p.overlayBannerSrc,
    overlayBannerAlt: p.overlayBannerAlt,
    brand: p.brand,
    discountPercent: typeof p.discountPercent==='number'? p.discountPercent : undefined,
    bestRank: typeof p.bestRank==='number'? p.bestRank : undefined,
    bestRankCategory: p.bestRankCategory,
    basePrice: typeof p.basePrice==='string'? p.basePrice : (p.price!=null? String(p.price) : undefined),
    soldPlus: p.soldPlus,
    couponPrice: p.couponPrice
  }
}

function uniqById(list:any[]): any[]{
  const seen: Record<string, boolean> = {}
  const out: any[] = []
  for (const it of list){ const id=String(it.id||''); if (!seen[id]){ seen[id]=true; out.push(it) } }
  return out
}

async function loadRecommendations(){
  const cfg = props.cfg || {}
  const provided = Array.isArray(cfg.products) && cfg.products.length ? cfg.products : (Array.isArray(cfg.items) ? cfg.items : [])
  if (provided.length){ products.value = provided.map(toGridP); return }

  try{
    let lastId: string|undefined
    try{ lastId = window.localStorage?.getItem('last_view_product_id') || undefined }catch{}
    const [recent, newest, similar] = await Promise.all([
      apiGet<any>('/api/recommendations/recent'),
      apiGet<any>('/api/products?limit=24&sort=new'),
      lastId ? apiGet<any>(`/api/recommendations/similar/${encodeURIComponent(lastId)}`) : Promise.resolve(null)
    ])
    const a = Array.isArray(recent?.items)? recent.items : []
    const b = Array.isArray(newest?.items)? newest.items : []
    const c = Array.isArray(similar?.items)? similar.items : []
    // Interleave recent and new to balance exploration/exploitation
    const mixed:any[] = []
    const max = Math.max(a.length, b.length, c.length)
    for (let i=0;i<max;i++){ if (c[i]) mixed.push(c[i]); if (a[i]) mixed.push(a[i]); if (b[i]) mixed.push(b[i]) }
    const dedup = uniqById(mixed)
    products.value = dedup.slice(0, fallbackCount.value).map(toGridP)
  }catch{
    products.value = Array.from({ length: fallbackCount.value }).map((_,i)=> ({ id: `ph-${i}`, title: 'منتج', image: '/images/placeholder-product.jpg' }))
  }
}

onMounted(()=>{ loadRecommendations() })
</script>

<style scoped>
.break-inside-avoid{ break-inside: avoid }
</style>


