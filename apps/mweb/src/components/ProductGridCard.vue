<template>
  <a class="w-full border border-gray-200 rounded bg-white overflow-hidden cursor-pointer block no-underline" role="link"
       :aria-label="'افتح '+(title||'المنتج')" tabindex="0" :href="href"
       @click.prevent="open($event)" @keydown.enter.prevent="open($event)" @keydown.space.prevent="open($event)">
    <!-- صورة: هيكل عظمي حتى تحميل أول صورة -->
    <div v-if="!imgLoaded" class="w-full bg-gray-200 animate-pulse aspect-[255/192]"></div>
    <div class="relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
      <div class="flex">
        <img
          v-for="(img,idx) in gallery"
          :key="'img-'+idx"
          :src="thumb(img, 512)"
          :srcset="`${thumb(img,256)} 256w, ${thumb(img,384)} 384w, ${thumb(img,512)} 512w, ${thumb(img,768)} 768w`"
          sizes="(max-width: 480px) 50vw, 33vw"
          :alt="title"
          class="w-full h-auto object-cover block flex-shrink-0 snap-start"
          style="min-width:100%"
          :loading="priority && idx===0 ? 'eager' : 'lazy'"
          :fetchpriority="priority && idx===0 ? 'high' : 'auto'"
          decoding="async"
          @load="idx===0 && onImgLoad()"
        />
      </div>
      <!-- عمود الألوان: نقاط ألوان عند توفر قائمة ألوان، وإلا تعرض مصغرات صور الألوان -->
      <div v-if="colorsHex.length || colorThumbs.length" class="absolute top-1 left-1 flex gap-1">
        <template v-if="colorsHex.length">
          <span v-for="(c,i) in colorsHex.slice(0,5)" :key="'cx-'+i" class="w-4 h-4 rounded-full border border-white shadow" :style="{ backgroundColor: c }" />
          <span v-if="colorsHex.length>5" class="text-[10px] bg-white/90 rounded px-1 border">+{{ colorsHex.length-5 }}</span>
        </template>
        <template v-else>
          <img v-for="(u,i) in colorThumbs.slice(0,5)" :key="'c-'+i" :src="u" alt="لون" class="w-4 h-4 rounded-full border border-white shadow" loading="lazy" />
          <span v-if="colorThumbs.length>5" class="text-[10px] bg-white/90 rounded px-1 border">+{{ colorThumbs.length-5 }}</span>
        </template>
      </div>
    </div>
    <div v-if="overlayBannerSrc" class="w-full h-7 relative">
      <img :src="overlayBannerSrc" :alt="overlayBannerAlt||'شريط تسويقي'" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    </div>
    <div class="relative p-2 pb-4">
      <!-- شارة ترندات: تظهر فقط إذا كان المنتج موسوم كترند من لوحة التحكم -->
      <div v-if="isTrending" class="inline-flex items-center border border-gray-200 rounded overflow-hidden">
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
      <div v-if="(typeof bestRank==='number') || bestRankCategoryDisplay" class="mt-1 inline-flex items-stretch rounded overflow-hidden">
        <div v-if="typeof bestRank==='number'" class="px-1 text-[9px] font-semibold flex items-center leading-none bg-[rgb(255,232,174)] text-[#c77210]">#{{ bestRank }} الأفضل مبيعاً</div>
        <button v-if="bestRankCategoryDisplay" class="px-1 text-[9px] font-bold flex items-center gap-1 leading-none bg-[rgba(254,243,199,.2)] text-[#d58700] border-0"><span>في {{ bestRankCategoryDisplay }}</span><span>&gt;</span></button>
      </div>
      <div class="mt-1 flex items-center gap-1">
        <span v-if="displayPrice" class="text-red-600 font-bold text-[13px]">{{ displayPrice }}</span>
        <span v-if="soldDisplay" class="text-[11px] text-gray-700">{{ soldDisplay }}</span>
      </div>
      <button class="absolute left-2 bottom-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black bg-white" aria-label="أضف إلى السلة" @click.stop.prevent="add()">
        <ShoppingCart :size="16" class="text-black" /><span class="text-[11px] font-bold text-black">1+</span>
      </button>
      <div v-if="displayCoupon" class="mt-1 h-7 inline-flex items-center gap-1 px-2 rounded bg-[rgba(249,115,22,.10)]"><span class="text-[13px] font-extrabold text-orange-500">{{ displayCoupon }}</span><span class="text-[11px] text-orange-500">/بعد الكوبون</span></div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fmtPrice, initCurrency } from '@/lib/currency'
import { useRouter } from 'vue-router'
import { useCart } from '@/store/cart'
import { setPrefetchPayload } from '@/lib/nav'
import { ShoppingCart, Store } from 'lucide-vue-next'
import { apiGet, API_BASE } from '@/lib/api'
import { buildThumbUrl as thumb } from '@/lib/media'

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
  isTrending?: boolean
}

const props = defineProps<{ product: P; priority?: boolean }>()
const emit = defineEmits<{ (e:'add', id: string): void }>()
const router = useRouter()
const cart = useCart()

const id = computed(()=> String(props.product?.id||''))
const title = computed(()=> String(props.product?.title||''))
const overlayBannerSrc = computed(()=> props.product?.overlayBannerSrc||'')
const overlayBannerAlt = computed(()=> props.product?.overlayBannerAlt||'')
const brand = computed(()=> props.product?.brand||'')
const isTrending = computed(()=> !!(props.product as any)?.isTrending)
const discountPercent = computed(()=> props.product?.discountPercent as number|undefined)
const bestRank = computed(()=> props.product?.bestRank as number|undefined)
const bestRankCategory = computed(()=> props.product?.bestRankCategory||'')
const bestRankCategoryDisplay = computed(()=> bestRankCategory.value || bestRankCategoryLocal.value)
const basePrice = computed(()=> props.product?.basePrice||'')
const displayPrice = computed(()=>{
  const n = Number((basePrice.value||'0').toString().replace(/[^\d.]/g,''))||0
  return fmtPrice(n)
})
const soldPlus = computed(()=> props.product?.soldPlus||'')
const soldDisplay = computed(()=>{
  const raw = String(soldPlus.value||'').replace(/[^0-9]/g,'')
  const qty = Number(raw||0)
  if (qty>=10) return `تم بيع +${qty}`
  return ''
})
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
const href = computed(()=> `/p?id=${encodeURIComponent(id.value)}`)
const imgLoaded = ref(false)
function onImgLoad(){ imgLoaded.value = true }

// Lazy enrichment: colors + category label if missing
import { ref, onMounted } from 'vue'
const colorThumbs = ref<string[]>([])
const bestRankCategoryLocal = ref<string>('')
const colorsHex = computed(()=>{
  try{
    const arr = Array.isArray((props.product as any)?.colors) ? ((props.product as any).colors as any[]) : []
    const valid = arr.map((s:any)=> String(s||'').trim()).filter((v:string)=> /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v))
    return valid
  }catch{ return [] as string[] }
})
onMounted(async ()=>{
  try{
    if (!id.value) return
    if (bestRankCategory.value && colorThumbs.value.length) return
    const d:any = await apiGet(`/api/product/${encodeURIComponent(id.value)}`)
    if (d){
      try{
        const g = Array.isArray(d.colorGalleries)? d.colorGalleries as any[] : []
        const imgs = g.map(x=> x.primaryImageUrl || (Array.isArray(x.images)&&x.images[0]) || '').filter(Boolean)
        // normalize to absolute URLs
        colorThumbs.value = imgs.map((u:any)=>{
          const s = String(u||'').trim()
          if (!s) return ''
          if (/^https?:\/\//i.test(s)) return s
          if (s.startsWith('/uploads')) return `${API_BASE}${s}`
          if (s.startsWith('uploads/')) return `${API_BASE}/${s}`
          return s
        }).filter(Boolean)
      }catch{}
      try{ if (!bestRankCategory.value && d.category?.name) bestRankCategoryLocal.value = String(d.category.name) }catch{}
    }
  }catch{}
})

function open(ev?: Event){
  if (!id.value) return
  const go = ()=> {
    try{
      // اختر الصورة الأكثر ظهوراً داخل شريط البطاقة لتكون مصدر الانتقال
      const root = (ev?.currentTarget as HTMLElement) || null
      const scroller = root ? (root.querySelector('.snap-x') as HTMLElement | null) : null
      let imgEl: HTMLElement | null = null
      if (scroller){
        const contRect = scroller.getBoundingClientRect()
        const imgs = Array.from(scroller.querySelectorAll('img')) as HTMLElement[]
        let best: { el: HTMLElement; w: number } | null = null
        for (const el of imgs){
          const r = el.getBoundingClientRect()
          const inter = Math.min(r.right, contRect.right) - Math.max(r.left, contRect.left)
          const visibleW = Math.max(0, inter)
          if (!best || visibleW > best.w) best = { el, w: visibleW }
        }
        imgEl = best?.el || (root.querySelector('img') as HTMLElement | null)
      }else{
        imgEl = (root?.querySelector('img') as HTMLElement | null)
      }
      const rect = imgEl ? imgEl.getBoundingClientRect() : undefined
      setPrefetchPayload(id.value, { imgUrl: (gallery.value?.[0]||''), rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : undefined })
    }catch{}
    router.push(`/p?id=${encodeURIComponent(id.value)}`)
  }
  try{
    // عيّن اسم الانتقال على الصورة الأكثر ظهوراً لضمان تطابق الاسم مع الهيرو في صفحة المنتج
    const root = (ev?.currentTarget as HTMLElement) || null
    const scroller = root ? (root.querySelector('.snap-x') as HTMLElement | null) : null
    let img: HTMLElement | null = null
    if (scroller){
      const contRect = scroller.getBoundingClientRect()
      const imgs = Array.from(scroller.querySelectorAll('img')) as HTMLElement[]
      let best: { el: HTMLElement; w: number } | null = null
      for (const el of imgs){
        const r = el.getBoundingClientRect()
        const inter = Math.min(r.right, contRect.right) - Math.max(r.left, contRect.left)
        const visibleW = Math.max(0, inter)
        if (!best || visibleW > best.w) best = { el, w: visibleW }
      }
      img = best?.el || (root.querySelector('img') as HTMLElement | null)
    }else{
      img = (root?.querySelector('img') as HTMLElement | null)
    }
    if ((document as any).startViewTransition && img){
      // استخدم اسمًا حتميًا يطابق صفحة المنتج لتمكين انتقال سلس بين الصفحات
      const name = `p-img-${id.value}`
      ;(img as any).style.viewTransitionName = name
      try{ ;(document as any).startViewTransition(()=>{ go() }) } finally {
        // امسح الاسم مباشرة بعد جدولة الانتقال
        setTimeout(()=>{ try{ ;(img as any).style.viewTransitionName = '' }catch{} }, 0)
      }
      return
    }
  }catch{}
  go()
}
function add(){ if (id.value){ emit('add', id.value); return } cart.add({ id: id.value, title: title.value, price: Number((basePrice.value||'0').toString().replace(/[^\d.]/g,''))||0, img: gallery.value[0]||'' }, 1) }
</script>

<style scoped>
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>


