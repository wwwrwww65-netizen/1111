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
      <section class="px-0 py-0" aria-label="من أجلك">
        <div class="columns-2 gap-1 [column-fill:_balance]">
          <div v-for="(p,i) in forYouShein" :key="'fy-'+i" class="mb-1 break-inside-avoid">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden cursor-pointer" role="button" :aria-label="'افتح '+(p.title||'المنتج')" tabindex="0" @click="openProduct(p)" @keydown.enter="openProduct(p)" @keydown.space.prevent="openProduct(p)">
              <div class="relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                <div class="flex">
                  <img v-for="(img,idx) in (p.images && p.images.length ? p.images : [p.image])" :key="'img-'+idx" :src="img" :alt="p.title" class="w-full h-auto object-cover block flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" />
                </div>
              </div>
              <div v-if="p.overlayBannerSrc" class="w-full h-7 relative"><img :src="p.overlayBannerSrc" :alt="p.overlayBannerAlt||'شريط تسويقي'" class="absolute inset-0 w-full h-full object-cover" loading="lazy" /></div>
              <div class="relative p-2">
                <div class="inline-flex items-center border border-gray-200 rounded overflow-hidden"><span class="inline-flex items-center h-[18px] px-1.5 text-[11px] text-white bg-violet-700">ترندات</span><span class="inline-flex items-center h-[18px] px-1.5 text-[11px] bg-gray-100 text-violet-700"><Store :size="14" color="#6D28D9" :stroke-width="2" /><span class="max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap">{{ p.brand||'' }}</span><span class="text-violet-700 ms-0.5">&gt;</span></span></div>
                <div class="flex items-center gap-1 mt-1.5"><div v-if="typeof p.discountPercent==='number'" class="px-1 h-4 rounded text-[11px] font-bold border border-orange-300 text-orange-500 flex items-center leading-none">-%{{ p.discountPercent }}</div><div class="text-[12px] text-gray-900 font-medium leading-tight truncate">{{ p.title }}</div></div>
                <div v-if="(typeof p.bestRank==='number') || p.bestRankCategory" class="mt-1 inline-flex items-stretch rounded overflow-hidden"><div v-if="typeof p.bestRank==='number'" class="px-1 text-[9px] font-semibold flex items-center leading-none bg-[rgb(255,232,174)] text-[#c77210]">#{{ p.bestRank }} الأفضل مبيعاً</div><button v-if="p.bestRankCategory" class="px-1 text-[9px] font-bold flex items-center gap-1 leading-none bg-[rgba(254,243,199,.2)] text-[#d58700] border-0"><span>في {{ p.bestRankCategory }}</span><span>&gt;</span></button></div>
                <div v-if="p.basePrice || p.soldPlus" class="mt-1 flex items-center gap-1"><span v-if="p.basePrice" class="text-red-600 font-bold text-[13px]">{{ p.basePrice }} ريال</span><span v-if="p.soldPlus" class="text-[11px] text-gray-700">{{ p.soldPlus }}</span></div>
                <button v-if="p.basePrice || p.soldPlus" class="absolute left-2 bottom-6 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black bg-white" aria-label="أضف إلى السلة" @click.stop="addToCartFY(p)"><ShoppingCart :size="16" class="text-black" /><span class="text-[11px] font-bold text-black">1+</span></button>
                <div v-if="p.couponPrice" class="mt-1 h-7 inline-flex items-center gap-1 px-2 rounded bg-[rgba(249,115,22,.10)]"><span class="text-[13px] font-extrabold text-orange-500">{{ p.couponPrice }} ريال</span><span class="text-[11px] text-orange-500">/بعد الكوبون</span></div>
              </div>
            </div>
          </div>
        </div>
        <div style="height:80px" />
      </section>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { ShoppingCart, Store } from 'lucide-vue-next'
import { apiGet } from '@/lib/api'
import { useCart } from '@/store/cart'

const router = useRouter()
const cart = useCart()

const sort = ref('reco')
const openFilters = ref(false)

function setSort(v:string){ sort.value = v }

type ForYouShein = { id?:string; image:string; images?:string[]; overlayBannerSrc?:string; overlayBannerAlt?:string; title:string; brand?:string; discountPercent?:number; bestRank?:number; bestRankCategory?:string; basePrice?:string; soldPlus?:string; couponPrice?:string; colors?:string[]; colorCount?:number; imageAspect?:string }
const forYouShein = ref<ForYouShein[]>([])

function parsePrice(s: string): number { const n = Number(String(s).replace(/[^0-9.]/g,'')); return isFinite(n)? n : 0 }

function openProduct(p: ForYouShein){ const id = p.id || ''; if (id) router.push(`/p?id=${encodeURIComponent(id)}`); else router.push('/products') }
function addToCartFY(p: ForYouShein){ try{ const id = p.id || p.title || 'item'; const title = p.title || ' '; const price = parsePrice(String(p.basePrice||0)); const img = p.image; cart.add({ id, title, price, img }, 1) }catch{} }

onMounted(async ()=>{
  try{
    const data = await apiGet<any>('/api/products?limit=24')
    const items: Array<{ id?:string; image:string; price:string; name?:string; images?:string[] }> = (data?.items||[]).map((p:any)=>({ id: p.id, images: p.images||[], image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', price: String(p.price||0) + ' ر.س', name: p.name }))
    const fy = (data?.items||[]).slice(12, 20)
    forYouShein.value = fy.map((p:any, i:number)=>({ id: p.id, images: p.images, image: p.images?.[0] || items[i]?.image, title: p.name || '', brand: 'JEEEY', basePrice: String(p.price || 0), colors: ['#111827','#9CA3AF','#FCD34D'], colorCount: 3 }))
    if (!forYouShein.value.length && items.length){
      forYouShein.value = items.slice(0,8).map((p:any)=>({ id: p.id, images: p.images||[p.image], image: p.image, title: p.name || '', brand: 'JEEEY', basePrice: p.price.replace(/[^0-9.]/g,'') || '0', colors: ['#111827','#9CA3AF','#FCD34D'], colorCount: 3 }))
    }
  }catch{}
})
</script>

<style scoped>
.toolbar{position:sticky;top:56px;background:#fff;z-index:10;padding:8px 0;border-bottom:1px solid var(--muted-2)}
.tabs{display:flex;gap:8px;overflow:auto}
.tab{flex:0 0 auto;padding:8px 10px;border:1px solid var(--muted-2);border-radius:999px;background:#fff}
.tab.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
.actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.btn{padding:8px 12px;border:1px solid var(--muted-2);border-radius:10px;background:#fff}
.grid-wrap{padding:12px 0}
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
</style>

