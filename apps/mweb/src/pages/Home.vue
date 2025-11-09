<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">

    <div v-if="layoutShowHeader" ref="headerRef" :class="['fixed top-0 left-0 right-0 z-50 transition-all duration-200', scrolled ? 'bg-white/95 backdrop-blur-sm h-12' : 'bg-transparent h-16']" aria-label="رأس الصفحة">
      <div class="w-screen px-3 h-full flex items-center justify-between">
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="القائمة" @click="go('/categories')">
            <Menu :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" />
          </button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="الإشعارات" @click="go('/notifications')">
            <Bell :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" />
          </button>
        </div>
        <div :class="['text-lg sm:text-xl font-semibold', scrolled ? 'text-gray-900' : 'text-white']" aria-label="شعار المتجر">jeeey</div>
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="السلة" @click="go('/cart')">
            <ShoppingCart :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" />
          </button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="البحث" @click="go('/search')">
            <Search :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="layoutShowTopTabs" :class="[scrolled ? 'bg-white/95 backdrop-blur-sm' : 'bg-transparent','fixed left-0 right-0 z-40 transition-colors']" :style="{ top: tabsTopPx + 'px' }" role="tablist" aria-label="التبويبات">
      <div ref="tabsRef" class="w-screen px-3 overflow-x-auto no-scrollbar py-2 flex gap-4" @keydown="onTabsKeyDown">
        <button v-for="(t,i) in tabs" :key="t.slug || t.label || i" role="tab" :aria-selected="activeTab===i" tabindex="0" @click="switchTab(t.slug, i)" :class="['text-sm whitespace-nowrap relative pb-1', activeTab===i ? 'text-black font-semibold' : (scrolled ? 'text-gray-700' : 'text-white')]">
          {{ (t.label || t.slug || '') }}
          <span :class="['absolute left-0 right-0 -bottom-0.5 h-0.5 transition-all', activeTab===i ? (scrolled ? 'bg-black' : 'bg-white') : 'bg-transparent']" />
        </button>
      </div>
    </div>

    <template v-if="!tabSections.length">
    <div class="w-screen px-0">
      <!-- Skeleton Hero (exact height/spacing as real) -->
      <div class="relative w-full h-[257.172px] bg-gray-200 animate-pulse rounded-none overflow-hidden" aria-label="جاري التحميل">
        <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-transparent pointer-events-none" />
        <div class="absolute left-4 right-4 bottom-4 text-white pointer-events-none">
          <div class="w-24 h-3 bg-white/40 rounded mb-1"></div>
          <div class="w-48 h-6 bg-white/50 rounded"></div>
        </div>
        <div class="easy-pagination absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1.5" dir="rtl">
          <span v-for="i in 4" :key="'pg-sk-'+i" class="w-1.5 h-1.5 rounded-full bg-white/50"></span>
        </div>
      </div>
    </div>

    <div class="w-screen px-0">
      <!-- Skeleton promo tiles -->
      <div class="bg-white p-3">
        <div class="flex overflow-x-auto gap-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" aria-label="جاري التحميل">
          <div v-for="i in 6" :key="'sk-pt-'+i" class="relative w-[100px] h-[50px] flex-shrink-0 border border-gray-200 rounded overflow-hidden bg-gray-200 animate-pulse snap-start"></div>
        </div>
      </div>

      <!-- Skeleton mid promo -->
      <div class="px-3">
        <div class="w-full h-[90px] border border-gray-200 rounded overflow-hidden relative bg-gray-200 animate-pulse"></div>
      </div>

      <!-- Skeleton categories scroller (same layout sizes) -->
      <section class="py-3" aria-label="الفئات (تحميل)">
        <div class="overflow-x-auto no-scrollbar px-3">
          <div class="flex gap-2 pb-0.5">
            <div v-for="ci in 6" :key="'sk-col-'+ci" class="flex flex-col gap-1">
              <div v-for="ri in 3" :key="'sk-c-'+ci+'-'+ri" class="w-[96px] flex-shrink-0 text-center bg-transparent border-0 inline-block">
                <div class="w-[68px] h-[68px] border border-gray-200 rounded-full overflow-hidden mx-auto mb-2 bg-gray-200 animate-pulse"></div>
                <div class="mx-auto w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Skeleton big deals -->
      <section class="px-3 py-3" aria-label="عروض كبرى (تحميل)">
        <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
          <div class="mb-1.5 flex items-center justify-between">
            <div class="w-24 h-4 bg-gray-200 rounded"></div>
            <div class="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
          <div class="overflow-x-auto no-scrollbar snap-x-start simple-row">
            <div class="simple-row-inner">
              <div v-for="i in 6" :key="'sk-deal-'+i" class="text-start snap-item simple-item">
                <div class="border border-gray-200 rounded-[4px] overflow-hidden bg-gray-200 animate-pulse aspect-[255/192]" />
                <div class="mt-1"><span class="inline-block w-12 h-3 bg-gray-200 rounded" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Skeleton trends -->
      <section class="px-3 py-3" aria-label="أهم الترندات (تحميل)">
        <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
          <div class="mb-1.5 flex items-center justify-between">
            <div class="w-24 h-4 bg-gray-200 rounded"></div>
            <div class="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
          <div class="overflow-x-auto no-scrollbar snap-x-start simple-row">
            <div class="simple-row-inner">
              <div v-for="i in 6" :key="'sk-trend-'+i" class="text-start snap-item simple-item">
                <div class="border border-gray-200 rounded-[4px] overflow-hidden bg-gray-200 animate-pulse aspect-[255/192]" />
                <div class="mt-1"><span class="inline-block w-12 h-3 bg-gray-200 rounded" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Skeleton For You -->
      <section class="px-3 py-3" aria-label="من أجلك (تحميل)">
        <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
          <div class="w-24 h-4 bg-gray-200 rounded mx-auto"></div>
        </div>
        <div class="mt-0 masonry">
          <div v-for="i in 8" :key="'sk-fy-'+i" class="mb-1">
            <div class="w-full border border-gray-200 rounded bg-gray-200 overflow-hidden h-40 animate-pulse" />
          </div>
        </div>
      </section>

      <div style="height:80px" />
    </div>
    </template>

    <template v-else>
      <div class="w-screen px-0">
        <section v-for="(s,i) in tabSections" :key="'sec-'+i" class="px-0 py-0">
          <component :is="renderBlock(s)" :cfg="s.config||{}" @click="clickTrack()" />
        </section>
        <div style="height:80px" />
      </div>
    </template>

    <nav v-if="layoutShowBottomNav" class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 z-50" aria-label="التنقل السفلي">
      <div class="w-screen px-3 flex justify-around py-2" dir="rtl">
        <button class="w-16 text-center" aria-label="الرئيسية" @click="go('/')">
          <Home :size="24" class="mx-auto mb-1 text-gray-600" />
          <div class="text-[11px] text-gray-700">الرئيسية</div>
        </button>
        <button class="w-16 text-center" aria-label="الفئات" @click="go('/categories')">
          <LayoutGrid :size="24" class="mx-auto mb-1 text-gray-600" />
          <div class="text-[11px] text-gray-700">الفئات</div>
        </button>
        <button class="w-16 text-center" aria-label="جديد/بحث" @click="go('/search')">
          <Search :size="24" class="mx-auto mb-1 text-gray-600" />
          <div class="text-[11px] text-gray-700">جديد</div>
        </button>
        <button class="w-16 text-center" aria-label="الحقيبة" @click="go('/cart')">
          <div class="relative inline-block">
            <ShoppingBag :size="24" class="mx-auto mb-1 text-gray-600" />
            <span v-if="cart.count>0" class="absolute -top-1 right-1/2 translate-x-1/2 bg-red-500 text-white rounded-full min-w-[16px] h-4 leading-4 text-[10px] px-1 border border-white">{{ cart.count }}</span>
          </div>
          <div class="text-[11px] text-gray-700">الحقيبة</div>
        </button>
        <button class="w-16 text-center" aria-label="حسابي" @click="go('/account')">
          <User :size="24" class="mx-auto mb-1 text-gray-600" />
          <div class="text-[11px] text-gray-700">حسابي</div>
        </button>
      </div>
    </nav>

    <!-- Options Modal for For You cards -->
    <ProductOptionsModal
      v-if="optionsModal.open"
      :onClose="closeOptions"
      :onSave="onOptionsSave"
      :product="optionsProduct"
      :selectedColor="optionsModal.color"
      :selectedSize="optionsModal.size"
      :groupValues="optionsModal.groupValues"
      :hideTitle="true"
      :primaryLabel="'أضف إلى عربة التسوق'"
      :showWishlist="false"
    />
  </div>
</template>

<script setup lang="ts">
import PromoPopup from '@/components/PromoPopup.vue'
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { apiGet, API_BASE } from '@/lib/api'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { Menu, Bell, ShoppingCart, Heart, Search, ShoppingBag, Star, LayoutGrid, User, Home, ChevronLeft, Store } from 'lucide-vue-next'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import PromoTilesBlock from '@/components/blocks/PromoTilesBlock.vue'
import MidPromoBlock from '@/components/blocks/MidPromoBlock.vue'
import ProductCarouselBlock from '@/components/blocks/ProductCarouselBlock.vue'
import CategoriesBlock from '@/components/blocks/CategoriesBlock.vue'
import MasonryForYouBlock from '@/components/blocks/MasonryForYouBlock.vue'
import ProductOptionsModal from '../components/ProductOptionsModal.vue'
import { fmtPrice } from '@/lib/currency'

const router = useRouter()
const route = useRoute()
const cart = useCart()
const wishlist = useWishlist()
const headerRef = ref<HTMLElement|null>(null)
const headerH = ref<number>(64)
const scrolled = ref(false)
const activeTab = ref(0)
const tabs = ref<Array<{ label:string; slug:string }>>([])
const tabsRef = ref<HTMLDivElement|null>(null)
const homeAutoplayCfg: any = { delay: 5000, disableOnInteraction: true, reverseDirection: false }
// Preview controls (for Admin live preview compatibility)
const previewActive = ref<boolean>(false)
const previewLayout = ref<any>(null)
const layoutShowHeader = computed(()=> previewActive.value ? (previewLayout.value?.showHeader !== false) : true)
const layoutShowTopTabs = computed(()=> previewActive.value ? (previewLayout.value?.showTopTabs !== false) : true)
const layoutShowBottomNav = computed(()=> previewActive.value ? (previewLayout.value?.showBottomNav !== false) : true)
function measureHeader(){ try{ const h = headerRef.value?.getBoundingClientRect().height; if (typeof h === 'number' && h > 0) headerH.value = Math.round(h) }catch{} }
const tabsTopPx = computed(()=> layoutShowHeader.value ? headerH.value : 0)

// Selected tab content from Admin Tabs Designer
const tabSections = ref<any[]>([])
const currentSlug = ref<string>('')
const isTabLoading = ref(false)
const tabCache = ref<Record<string, any[]>>({})
let currentTabController: AbortController | null = null
function renderBlock(s:any){ 
  const t=String(s?.type||'').toLowerCase();
  if (t==='hero') return HeroBlock; 
  if (t==='promotiles' || t==='promotitles') return PromoTilesBlock; 
  if (t==='midpromo') return MidPromoBlock; 
  if (t==='productcarousel') return ProductCarouselBlock; 
  if (t==='categories'||t==='brands') return CategoriesBlock; 
  if (t==='masonryforyou' || t==='masonry') return MasonryForYouBlock; 
  return Unknown 
}
async function loadTab(slug:string){
  currentSlug.value = slug
  const cached = tabCache.value[slug]
  if (cached && cached.length){
    tabSections.value = cached
    void fetchTab(slug, true)
    const idx1 = tabs.value.findIndex(t=> t.slug === slug); if (idx1>=0) activeTab.value = idx1
    return
  }
  isTabLoading.value = true
  await fetchTab(slug, false)
  isTabLoading.value = false
  const idx = tabs.value.findIndex(t=> t.slug === slug)
  if (idx >= 0) activeTab.value = idx
}

async function fetchTab(slug:string, silent:boolean){
  try{
    if (currentTabController) { try{ currentTabController.abort() }catch{} }
    currentTabController = new AbortController()
    const ctrl = currentTabController
    const timer = setTimeout(()=>{ try{ ctrl.abort() }catch{} }, 10000)
    const r = await fetch(`${API_BASE}/api/tabs/${encodeURIComponent(slug)}`, { signal: ctrl.signal as any })
    clearTimeout(timer)
    const j = await r.json()
    const sections = Array.isArray(j?.content?.sections) ? j.content.sections : (Array.isArray(j?.sections)? j.sections : [])
    tabCache.value[slug] = sections
    if (!silent){ tabSections.value = sections }
    // Impression tracking
    fetch(`${API_BASE}/api/tabs/track`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug, type:'impression' }) }).catch(()=>{})
  }catch{
    // keep previous content
  }
}

function switchTab(slug:string, idx:number){
  activeTab.value = idx
  void loadTab(slug)
}
function clickTrack(){ try{ if(currentSlug.value) fetch(`${API_BASE}/api/tabs/track`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug: currentSlug.value, type:'click' }) }) }catch{} }

// Banner responsive sources
const bannerSrc = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60'
const bannerSrcSet = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60&fm=webp 1200w, https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=2400&q=60&fm=webp 2400w'
type Banner = { src: string; srcset?: string; alt: string }
const banners = reactive<Banner[]>([
  { src: bannerSrc, srcset: bannerSrcSet, alt: 'عرض تخفيضات' },
  { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop', alt: 'عروض جديدة' },
  { src: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1600&auto=format&fit=crop', alt: 'ترندات الموسم' }
])
const activeBanner = ref<number>(0)
let swiperInstance: any = null

function goToBanner(i: number){ 
  if (swiperInstance) {
    swiperInstance.slideTo(i)
  }
}

function onSwiper(swiper: any) {
  swiperInstance = swiper
}

function onSlideChange(swiper: any) {
  activeBanner.value = swiper.realIndex
}

function go(path: string){ router.push(path) }
function onScroll(){ scrolled.value = window.scrollY > 60; nextTick(measureHeader) }
onMounted(()=>{ onScroll(); measureHeader(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', measureHeader) })
// live preview updates from Admin via postMessage
function onPreviewMessage(e: MessageEvent){
  try{
    const data:any = e.data
    if (data && typeof data==='object' && data.__tabs_preview){
      previewActive.value = true
      const payload = data.content || {}
      const sections = Array.isArray(payload?.sections) ? payload.sections : (Array.isArray(payload?.content?.sections)? payload.content.sections : [])
      if (sections && sections.length) tabSections.value = sections
      previewLayout.value = payload?.layout || null
    }
  }catch{}
}
onMounted(()=>{ try{ window.addEventListener('message', onPreviewMessage) }catch{} })
onBeforeUnmount(()=>{ window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measureHeader); try{ window.removeEventListener('message', onPreviewMessage) }catch{} })
watch(scrolled, ()=> nextTick(measureHeader))
function onTabsKeyDown(e: KeyboardEvent){
  if (e.key === 'ArrowRight') {
    const i = Math.min(activeTab.value + 1, tabs.value.length - 1)
    const next = tabs.value[i]; if (next) switchTab(next.slug, i)
  }
  if (e.key === 'ArrowLeft') {
    const i = Math.max(activeTab.value - 1, 0)
    const prev = tabs.value[i]; if (prev) switchTab(prev.slug, i)
  }
  const el = tabsRef.value?.children[activeTab.value] as HTMLElement | undefined
  el?.scrollIntoView({ inline: 'center', behavior: 'smooth' })
}

type Prod = { id?: string; title: string; image: string; price: string; oldPrice?: string; rating: number; reviews: number; brand?: string; coupon?: string }
type Cat = { name: string; image: string; slug?: string; id?: string }

const promoTiles = reactive([
  { title: 'شحن مجاني', sub: `للطلبات فوق ${fmtPrice(99)}`, image: 'https://csspicker.dev/api/image/?q=free+shipping+icon&image_type=photo', bg: '#ffffff' },
  { title: 'خصم 90%', sub: 'لفترة محدودة', image: 'https://csspicker.dev/api/image/?q=sale+tag&image_type=photo', bg: '#fff6f1' },
  { title: 'الدفع عند الاستلام', sub: 'متاح لمدن مختارة', image: 'https://csspicker.dev/api/image/?q=cod+payment&image_type=photo', bg: '#f7faff' },
  { title: 'نقاط ومكافآت', sub: 'اكسب مع كل شراء', image: 'https://csspicker.dev/api/image/?q=reward+points&image_type=photo', bg: '#f9f9ff' },
  { title: 'خصم الطلاب', sub: 'تحقق من الأهلية', image: 'https://csspicker.dev/api/image/?q=student+discount&image_type=photo', bg: '#fffaf3' },
  { title: 'عروض اليوم', sub: 'لا تفوّت الفرصة', image: 'https://csspicker.dev/api/image/?q=deal+of+the+day&image_type=photo', bg: '#f5fffb' },
])
const midPromo = reactive({ image: 'https://images.unsplash.com/photo-1512203492609-8b0f0b52f483?w=1600&q=60', alt: 'عرض منتصف الصفحة', text: 'قسائم إضافية + شحن مجاني' })

const categories = ref<Cat[]>([])
const bigDeals = ref<Array<{ id?:string; image:string; price:string }>>([])
const hotTrends = ref<Array<{ id?:string; image:string; price:string }>>([])
const dealsLoading = ref(true)
const trendsLoading = ref(true)
const fyLoading = ref(true)
const dealsRef = ref<HTMLElement|null>(null)
const trendsRef = ref<HTMLElement|null>(null)
const fyRef = ref<HTMLElement|null>(null)
type ForYouShein = { id?:string; image:string; images?:string[]; overlayBannerSrc?:string; overlayBannerAlt?:string; title:string; brand?:string; discountPercent?:number; bestRank?:number; bestRankCategory?:string; basePrice?:string; soldPlus?:string; couponPrice?:string; colors?:string[]; colorCount?:number; imageAspect?:string }
const forYouShein = ref<ForYouShein[]>([])

function aspectClassByIndex(i: number): string {
  const variants = ['aspect-[4/5]','aspect-[5/4]','aspect-[3/4]']
  return variants[i % variants.length]
}

function parsePrice(s: string): number { const n = Number(String(s).replace(/[^0-9.]/g,'')); return isFinite(n)? n : 0 }
function toProd(p:any): Prod { 
  const priceNum = (p.price!=null? p.price : p.priceMin||0)
  return { id: p.id, title: p.name||p.title, image: p.images?.[0]||p.image, price: fmtPrice(priceNum), oldPrice: p.original!=null ? fmtPrice(p.original) : undefined, rating: Number(p.rating||4.6), reviews: Number(p.reviews||0), brand: p.brand||'JEEEY' }
}

// Top-level loaders for lazy content
async function loadDeals(){ if (!dealsLoading.value) return; try{
  const [deals, trends] = await Promise.all([
    apiGet<any>('/api/products?limit=12&sort=price_desc'),
    apiGet<any>('/api/products?limit=12&sort=new')
  ])
  const mapItems = (data:any)=> (data?.items||[]).map((p:any)=>({ id: p.id, image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', price: fmtPrice(Number(p.price||0)), name: p.name }))
  bigDeals.value = mapItems(deals)
  if (!hotTrends.value.length) hotTrends.value = mapItems(trends)
  const fy = (trends?.items||[]).slice(0, 8)
  function extractColors(prod:any): string[]{
    const c1 = Array.isArray(prod.colorsHex)? prod.colorsHex : undefined
    const c2 = Array.isArray(prod.colors)? prod.colors.filter((x:any)=> typeof x === 'string' && /^#?[0-9a-fA-F]{3,6}$/.test(String(x))).map((x:string)=> x.startsWith('#')? x : '#'+x) : undefined
    const c3 = Array.isArray(prod.variants)? prod.variants.map((v:any)=> v?.colorHex).filter((x:any)=> typeof x==='string') : undefined
    const merged = (c1||[]).concat(c2||[]).concat(c3||[]).filter(Boolean)
    const uniq: string[] = []
    for (const hex of merged){ const h = String(hex).startsWith('#')? String(hex) : '#'+String(hex); if (!uniq.includes(h)) uniq.push(h); if (uniq.length>=6) break }
    return uniq
  }
  forYouShein.value = fy.map((p:any, i:number)=>({
    id: p.id,
    image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop',
    images: Array.isArray(p.images) && p.images.length ? p.images.slice(0,5) : undefined,
    title: p.name || '',
    brand: p.brand || 'JEEEY',
    basePrice: String(p.price || 0),
    couponPrice: undefined,
    colors: extractColors(p),
    colorCount: Array.isArray(p.colors)? p.colors.length : undefined,
    imageAspect: aspectClassByIndex(i)
  }))
  if (!forYouShein.value.length){
    const base = hotTrends.value.length ? hotTrends.value : bigDeals.value
    if (base.length){
      forYouShein.value = base.slice(0,8).map((p:any, i:number)=>({
        id: p.id,
        image: p.image,
        images: [p.image],
        title: p.name || '',
        brand: 'JEEEY',
        basePrice: String(parsePrice(p.price)),
        colors: [],
        colorCount: undefined,
        imageAspect: aspectClassByIndex(i)
      }))
    }
  }
  dealsLoading.value = false
}catch{ dealsLoading.value = false }
}
async function loadTrends(){ if (!trendsLoading.value) return; try{
  const t = await apiGet<any>('/api/products?limit=12&sort=new')
  const mapItems = (data:any)=> (data?.items||[]).map((p:any)=>({ id: p.id, image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', price: fmtPrice(Number(p.price||0)), name: p.name }))
  hotTrends.value = mapItems(t)
  trendsLoading.value = false
}catch{ trendsLoading.value = false }
}
async function loadFY(){ if (!fyLoading.value) return; try{
  if (!forYouShein.value.length){
    const t = await apiGet<any>('/api/products?limit=12&sort=new')
    const arr = (t?.items||[]).slice(0,8)
    forYouShein.value = arr.map((p:any, i:number)=>({ id: p.id, image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', images: Array.isArray(p.images)&&p.images.length? p.images: undefined, title: p.name||'', brand: 'JEEEY', basePrice: String(p.price||0), colors: [], colorCount: undefined, imageAspect: aspectClassByIndex(i) }))
  }
  fyLoading.value = false
}catch{ fyLoading.value = false }
}

onMounted(async ()=>{
  // Detect admin preview token (optional): render preview content without affecting live design defaults
  try{
    const u = new URL(location.href)
    const tok = u.searchParams.get('previewToken') || u.searchParams.get('token') || ''
    const raw = u.searchParams.get('payload') || ''
    if (raw) {
      try{
        const payload = JSON.parse(decodeURIComponent(raw))
        const sections = Array.isArray(payload?.sections) ? payload.sections : (Array.isArray(payload?.content?.sections)? payload.content.sections : [])
        if (sections && sections.length){
          previewActive.value = true
          tabSections.value = sections
          previewLayout.value = payload?.layout || null
        }
      }catch{}
    }
    if (tok) {
      try{
        const r = await fetch(`${API_BASE}/api/admin/tabs/preview/${encodeURIComponent(tok)}`, { credentials:'omit' })
        const j = await r.json()
        const payload = j?.content || j
        const sections = Array.isArray(payload?.sections) ? payload.sections : (Array.isArray(payload?.content?.sections)? payload.content.sections : [])
        if (sections && sections.length){
          previewActive.value = true
          tabSections.value = sections
          previewLayout.value = payload?.layout || null
        }
      }catch{}
    }
  }catch{}
  // Load published tabs for device, then exclude categories tabs
  try{
    const [allResp, catsResp] = await Promise.all([
      fetch(`${API_BASE}/api/tabs/list?device=MOBILE`).then(r=>r.json()).catch(()=>({ tabs: [] })),
      fetch(`${API_BASE}/api/tabs/categories/list`).then(r=>r.json()).catch(()=>({ tabs: [] }))
    ])
    const all = Array.isArray(allResp?.tabs)? allResp.tabs: []
    const cats = new Set((Array.isArray(catsResp?.tabs)? catsResp.tabs: []).map((t:any)=> String(t.slug||'')))
    const filtered = all.filter((t:any)=> !cats.has(String(t.slug||'')))
    tabs.value = filtered.map((t:any)=> ({ label: t.label, slug: String(t.slug||'') }))
    const paramSlug = String(route.params.slug||'')
    const initial = paramSlug || (tabs.value[0]?.slug || '')
    if (!previewActive.value && initial) await loadTab(initial)
    setTimeout(()=>{
      try{
        const ahead = tabs.value.slice(1, 3).map(t=> t.slug)
        ahead.forEach(s=> { if (s && !tabCache.value[s]) fetchTab(s, true) })
      }catch{}
    }, 300)
  }catch{}
  // Notify admin that preview is ready (parent iframe or opener window)
  try{ if (window.parent) window.parent.postMessage({ __tabs_preview_ready: true }, '*') }catch{}
  try{ if (window.opener) window.opener.postMessage({ __tabs_preview_ready: true }, '*') }catch{}
  // Categories
  try {
    const cats = await apiGet<any>('/api/categories?limit=15')
    const arr = Array.isArray(cats?.categories) ? cats.categories : Array.isArray(cats?.items) ? cats.items : []
    categories.value = arr.map((c:any)=> ({ name: c.name||c.title, image: c.image||`https://csspicker.dev/api/image/?q=${encodeURIComponent(c.name||'fashion')}&image_type=photo`, slug: c.slug||undefined, id: c.id||undefined }))
  } catch {}
  // لا نملأ فئات افتراضية بصور خارجية؛ نعرض هيكل التحميل حتى تصل البيانات الفعلية

  // Products to sections (lazy on visibility)
  async function loadDeals(){ if (!dealsLoading.value) return; try{
    const [deals, trends] = await Promise.all([
      apiGet<any>('/api/products?limit=12&sort=price_desc'),
      apiGet<any>('/api/products?limit=12&sort=new')
    ])
    const mapItems = (data:any)=> (data?.items||[]).map((p:any)=>({ id: p.id, image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', price: fmtPrice(Number(p.price||0)), name: p.name }))
    bigDeals.value = mapItems(deals)
    if (!hotTrends.value.length) hotTrends.value = mapItems(trends)
    // For You section (use same items, map to structure)
    const fy = (trends?.items||[]).slice(0, 8)
    function extractColors(prod:any): string[]{
      const c1 = Array.isArray(prod.colorsHex)? prod.colorsHex : undefined
      const c2 = Array.isArray(prod.colors)? prod.colors.filter((x:any)=> typeof x === 'string' && /^#?[0-9a-fA-F]{3,6}$/.test(String(x))).map((x:string)=> x.startsWith('#')? x : '#'+x) : undefined
      const c3 = Array.isArray(prod.variants)? prod.variants.map((v:any)=> v?.colorHex).filter((x:any)=> typeof x==='string') : undefined
      const merged = (c1||[]).concat(c2||[]).concat(c3||[]).filter(Boolean)
      const uniq: string[] = []
      for (const hex of merged){ const h = String(hex).startsWith('#')? String(hex) : '#'+String(hex); if (!uniq.includes(h)) uniq.push(h); if (uniq.length>=6) break }
      return uniq
    }
    forYouShein.value = fy.map((p:any, i:number)=>({
      id: p.id,
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop',
      images: Array.isArray(p.images) && p.images.length ? p.images.slice(0,5) : undefined,
      title: p.name || '',
      brand: p.brand || 'JEEEY',
      basePrice: String(p.price || 0),
      couponPrice: undefined,
      colors: extractColors(p),
      colorCount: Array.isArray(p.colors)? p.colors.length : undefined,
      imageAspect: aspectClassByIndex(i)
    }))
    if (!forYouShein.value.length){
      const base = hotTrends.value.length ? hotTrends.value : bigDeals.value
      if (base.length){
        forYouShein.value = base.slice(0,8).map((p:any, i:number)=>({
          id: p.id,
          image: p.image,
          images: [p.image],
          title: p.name || '',
          brand: 'JEEEY',
          basePrice: String(parsePrice(p.price)),
          colors: [],
          colorCount: undefined,
          imageAspect: aspectClassByIndex(i)
        }))
      }
    }
    dealsLoading.value = false
  }catch{ dealsLoading.value = false }
  }

  async function loadTrends(){ if (!trendsLoading.value) return; try{
    const t = await apiGet<any>('/api/products?limit=12&sort=new')
    const mapItems = (data:any)=> (data?.items||[]).map((p:any)=>({ id: p.id, image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', price: String(p.price||0) + ' ر.س', name: p.name }))
    hotTrends.value = mapItems(t)
    trendsLoading.value = false
  }catch{ trendsLoading.value = false }
  }

  async function loadFY(){ if (!fyLoading.value) return; try{
    if (!forYouShein.value.length){
      const t = await apiGet<any>('/api/products?limit=12&sort=new')
      const arr = (t?.items||[]).slice(0,8)
      forYouShein.value = arr.map((p:any, i:number)=>({ id: p.id, image: p.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', images: Array.isArray(p.images)&&p.images.length? p.images: undefined, title: p.name||'', brand: 'JEEEY', basePrice: String(p.price||0), colors: [], colorCount: undefined, imageAspect: aspectClassByIndex(i) }))
    }
    fyLoading.value = false
  }catch{ fyLoading.value = false }
  }

  const io = new IntersectionObserver((entries)=>{
    for (const e of entries){
      if (e.isIntersecting){
        if (e.target === dealsRef.value) loadDeals()
        if (e.target === trendsRef.value) loadTrends()
        if (e.target === fyRef.value) loadFY()
      }
    }
  }, { rootMargin: '100px' })
  try{ if (dealsRef.value) io.observe(dealsRef.value); if (trendsRef.value) io.observe(trendsRef.value); if (fyRef.value) io.observe(fyRef.value) }catch{}
  // Fallback: load trends quickly after first paint
  setTimeout(()=>{ try{ loadTrends() }catch{} }, 250)
  
  // End lazy products
  
})
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


// React to route param change (navigating between tabs)
watch(()=> route.params.slug, (nv, ov)=>{
  if (previewActive.value) return
  const slug = String(nv||'')
  if (slug && slug !== String(ov||'')) loadTab(slug)
})

const rows = 3
const catRows = computed(()=>{
  const list = categories.value || []
  const perRow = Math.ceil(list.length / rows) || 1
  const out: any[] = []
  for (let r=0; r<rows; r++){
    out[r] = list.slice(r * perRow, (r + 1) * perRow)
  }
  return out
})
// columns for unified 3-row scroller (4.5 visible per row)
const catColsLocked = computed(()=>{
  const list = categories.value || []
  const perCol = 3 // 3 rows
  const cols = Math.ceil(list.length / perCol) || 1
  const out: any[] = []
  for (let c=0;c<cols;c++){
    out[c] = list.slice(c*perCol, (c+1)*perCol)
  }
  return out
})

function hasWish(p: Prod){ return wishlist.has(p.id || p.title) }
function toggleWish(p: Prod){ const id = p.id || p.title; wishlist.toggle({ id, title: p.title, price: parsePrice(p.price), img: p.image }) }
function quickAdd(p: Prod){ const id = p.id || p.title; cart.add({ id, title: p.title, price: parsePrice(p.price), img: p.image }, 1) }
function openProduct(p: Partial<Prod>){
  const id = p.id || ''
  if (id) return router.push(`/p?id=${encodeURIComponent(id)}`)
  router.push('/products')
}

function addToCartFY(p: any){
  try{
    const id = p.id || p.title || 'item'
    const title = p.title || ' '
    const price = parsePrice(String(p.basePrice||0))
    const img = p.image
    cart.add({ id, title, price, img }, 1)
  }catch{}
}

// Options modal for For You cards
const optionsModal = reactive({ open:false, productId:'', color:'', size:'', groupValues:{} as Record<string,string>, source:'suggest' as const })
const optionsCache = reactive<Record<string, any>>({})
const optionsProduct = computed(()=> optionsCache[optionsModal.productId] || null)
async function fetchProductDetails(id: string){
  try{
    if (optionsCache[id]) return optionsCache[id]
    const base = API_BASE
    const res = await fetch(`${base}/api/product/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } })
    if (!res.ok) return
    const d = await res.json()
    const imgs = Array.isArray(d.images)? d.images : []
    const filteredImgs = imgs.filter((u:string)=> /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
    const galleries = Array.isArray(d.colorGalleries) ? d.colorGalleries : []
    const normalizeImage = (u: any): string => {
      const s = String(u || '').trim()
      if (!s) return filteredImgs[0] || '/images/placeholder-product.jpg'
      if (/^https?:\/\//i.test(s)) return s
      if (s.startsWith('/uploads')) return `${base}${s}`
      if (s.startsWith('uploads/')) return `${base}/${s}`
      return s
    }
    let colors: Array<{ label: string; img: string }> = []
    if (galleries.length){ colors = galleries.map((g:any)=> ({ label: String(g.name||'').trim(), img: normalizeImage(g.primaryImageUrl || (Array.isArray(g.images)&&g.images[0]) || '') })).filter(c=> !!c.label) }
    optionsCache[id] = { id: d.id||id, title: d.name||'', price: Number(d.price||0), images: filteredImgs.length? filteredImgs: ['/images/placeholder-product.jpg'], colors, sizes: Array.isArray(d.sizes)? d.sizes: [] }
    return optionsCache[id]
  }catch{}
}
async function openSuggestOptions(id: string){
  try{
    optionsModal.productId = id
    optionsModal.color = ''
    optionsModal.size = ''
    optionsModal.groupValues = {}
    optionsModal.open = true
    await fetchProductDetails(id)
  }catch{}
}
function closeOptions(){ optionsModal.open = false }
function onOptionsSave(payload: { color: string; size: string }){
  try{
    const prod = optionsProduct.value
    const img = (prod?.images && prod.images[0]) || '/images/placeholder-product.jpg'
    cart.add({ id: prod?.id || optionsModal.productId, title: prod?.title || '', price: Number(prod?.price||0), img, variantColor: payload.color||undefined, variantSize: payload.size||undefined }, 1)
  }catch{}
  optionsModal.open = false
}

const Unknown = { template:`<div class=\"p-3 text-xs text-gray-500\">قسم غير مدعوم</div>` }
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
.simple-row{--visible:4.15;--gap:6px}
.simple-row-inner{display:flex;gap:var(--gap)}
.simple-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
/* categories: show 4.5 items per row */
.cat-row{--visible:4.5;--gap:12px}
.cat-row-inner{display:flex;gap:var(--gap)}
.cat-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
/* Grid Masonry alternative for mobile friendliness */
.masonry{ display:grid; grid-template-columns: repeat(2, 1fr); gap:6px }
@media (min-width: 768px){ .masonry{ grid-template-columns: repeat(3, 1fr) } }
.masonry > *{ break-inside: avoid }
.x-snap{ scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain }

/* Easy pagination styles */
.easy-pagination {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  z-index: 10;
}
</style>

