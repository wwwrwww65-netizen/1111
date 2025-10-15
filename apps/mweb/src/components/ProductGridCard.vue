<template>
  <div class="w-full border border-gray-200 rounded bg-white overflow-hidden cursor-pointer" role="button"
       :aria-label="'افتح '+(title||'المنتج')" tabindex="0"
       @click="open()" @keydown.enter.prevent="open()" @keydown.space.prevent="open()">
    <div class="relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
      <div class="flex">
        <img v-for="(img,idx) in gallery" :key="'img-'+idx" :src="img" :alt="title" class="w-full h-auto object-cover block flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" />
      </div>
    </div>
    <div v-if="overlayBannerSrc" class="w-full h-7 relative">
      <img :src="overlayBannerSrc" :alt="overlayBannerAlt||'شريط تسويقي'" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    </div>
    <div class="relative p-2 pb-4">
      <div v-if="brand" class="inline-flex items-center border border-gray-200 rounded overflow-hidden">
        <span class="inline-flex items-center h-[18px] px-1.5 text-[11px] text-white bg-violet-700">ترندات</span>
        <span class="inline-flex items-center h-[18px] px-1.5 text-[11px] bg-gray-100 text-violet-700">
          <Store :size="14" color="#6D28D9" :stroke-width="2" />
          <span class="max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap">{{ brand }}</span>
          <span class="text-violet-700 ms-0.5">&gt;</span>
        </span>
      </div>
      <div class="flex items-center gap-1 mt-1.5">
        <div v-if="typeof discountPercent==='number'" class="px-1 h-4 rounded text-[11px] font-bold border border-orange-300 text-orange-500 flex items-center leading-none">-%{{ discountPercent }}</div>
        <div class="text-[12px] text-gray-900 font-medium leading-tight truncate">{{ title }}</div>
      </div>
      <div v-if="(typeof bestRank==='number') || bestRankCategory" class="mt-1 inline-flex items-stretch rounded overflow-hidden">
        <div v-if="typeof bestRank==='number'" class="px-1 text-[9px] font-semibold flex items-center leading-none bg-[rgb(255,232,174)] text-[#c77210]">#{{ bestRank }} الأفضل مبيعاً</div>
        <button v-if="bestRankCategory" class="px-1 text-[9px] font-bold flex items-center gap-1 leading-none bg-[rgba(254,243,199,.2)] text-[#d58700] border-0"><span>في {{ bestRankCategory }}</span><span>&gt;</span></button>
      </div>
      <div class="mt-1 flex items-center gap-1">
        <span v-if="displayPrice" class="text-red-600 font-bold text-[13px]">{{ displayPrice }}</span>
        <span v-if="soldPlus" class="text-[11px] text-gray-700">{{ soldPlus }}</span>
      </div>
      <button class="absolute left-2 bottom-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black bg-white" aria-label="أضف إلى السلة" @click.stop="add()">
        <ShoppingCart :size="16" class="text-black" /><span class="text-[11px] font-bold text-black">1+</span>
      </button>
      <div v-if="displayCoupon" class="mt-1 h-7 inline-flex items-center gap-1 px-2 rounded bg-[rgba(249,115,22,.10)]"><span class="text-[13px] font-extrabold text-orange-500">{{ displayCoupon }}</span><span class="text-[11px] text-orange-500">/بعد الكوبون</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { fmtPrice, initCurrency } from '@/lib/currency'
import { useRouter } from 'vue-router'
import { useCart } from '@/store/cart'
import { ShoppingCart, Store } from 'lucide-vue-next'

type P = {
  id: string
  title: string
  image?: string
  images?: string[]
  overlayBannerSrc?: string
  overlayBannerAlt?: string
  brand?: string
  discountPercent?: number
  colors?: string[]
  colorCount?: number
  bestRank?: number
  bestRankCategory?: string
  basePrice?: string
  soldPlus?: string
  couponPrice?: string
}

const props = defineProps<{ product: P }>()
const router = useRouter()
const cart = useCart()

const id = computed(()=> String(props.product?.id||''))
const title = computed(()=> String(props.product?.title||''))
const overlayBannerSrc = computed(()=> props.product?.overlayBannerSrc||'')
const overlayBannerAlt = computed(()=> props.product?.overlayBannerAlt||'')
const brand = computed(()=> props.product?.brand||'')
const discountPercent = computed(()=> props.product?.discountPercent as number|undefined)
const bestRank = computed(()=> props.product?.bestRank as number|undefined)
const bestRankCategory = computed(()=> props.product?.bestRankCategory||'')
const basePrice = computed(()=> props.product?.basePrice||'')
const displayPrice = computed(()=>{
  const n = Number((basePrice.value||'0').toString().replace(/[^\d.]/g,''))||0
  return fmtPrice(n)
})
const soldPlus = computed(()=> props.product?.soldPlus||'')
const couponPrice = computed(()=> props.product?.couponPrice||'')
const displayCoupon = computed(()=>{
  if (!couponPrice.value) return ''
  const n = Number((couponPrice.value||'0').toString().replace(/[^\d.]/g,''))||0
  return fmtPrice(n)
})
const gallery = computed(()=> {
  const list = Array.isArray(props.product?.images) ? props.product!.images! : []
  if (list.length) return list
  return [props.product?.image || '/images/placeholder-product.jpg']
})

function open(){ if (id.value) router.push(`/p?id=${encodeURIComponent(id.value)}`) }
function add(){ cart.add({ id: id.value, title: title.value, price: Number((basePrice.value||'0').toString().replace(/[^\d.]/g,''))||0, img: gallery.value[0]||'' }, 1) }
</script>

<style scoped>
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>


