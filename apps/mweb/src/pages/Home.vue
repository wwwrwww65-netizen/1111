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

    <template v-if="isTabLoading || !tabSections.length">
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

    <BottomNav v-if="layoutShowBottomNav" active="home" />

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
import { useHead } from '@unhead/vue'

// SEO Setup
const seoHead = ref<any>({ title: 'Jeeey', meta: [] })
useHead(seoHead)
import { apiGet, API_BASE } from '@/lib/api'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { Menu, Bell, ShoppingCart, Heart, Search, ShoppingBag, Star, LayoutGrid, User, Home, ChevronLeft, Store } from 'lucide-vue-next'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import PromoTilesBlock from '@/components/blocks/PromoTilesBlock.vue'
import MidPromoBlock from '@/components/blocks/MidPromoBlock.vue'
import ProductCarouselBlock from '@/components/blocks/ProductCarouselBlock.vue'
import CategoriesBlock from '@/components/blocks/CategoriesBlock.vue'
import MasonryForYouBlock from '@/components/blocks/MasonryForYouBlock.vue'
import ProductOptionsModal from '../components/ProductOptionsModal.vue'
import BottomNav from '@/components/BottomNav.vue'
import { fmtPrice } from '@/lib/currency'
import { buildCdnThumb } from '@/lib/cdn'

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
    // استعادة موضع التمرير إن وجد
    try{ const sy = Number(sessionStorage.getItem('home:scrollY')||'0'); if (sy>0) setTimeout(()=> window.scrollTo(0, sy), 0) }catch{}
    return
  }
  isTabLoading.value = true
  await fetchTab(slug, false)
  isTabLoading.value = false
  const idx = tabs.value.findIndex(t=> t.slug === slug)
  if (idx >= 0) activeTab.value = idx
  // استعادة موضع التمرير إن وجد
  try{ const sy = Number(sessionStorage.getItem('home:scrollY')||'0'); if (sy>0) setTimeout(()=> window.scrollTo(0, sy), 0) }catch{}
}

async function fetchTab(slug:string, silent:boolean){
  try{
    if (currentTabController) { try{ currentTabController.abort() }catch{} }
    currentTabController = new AbortController()
    const ctrl = currentTabController
    const timer = setTimeout(()=>{ try{ ctrl.abort() }catch{} }, 10000)
    const j = await apiGet<any>(`/api/tabs/${encodeURIComponent(slug)}`)
    clearTimeout(timer)
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
  // Update URL to reflect the active tab (improves shareability and back/forward navigation)
  // Always show the tab slug in URL when clicking on any tab
  try{ router.push(`/tabs/${encodeURIComponent(slug)}`) }catch{}
  void loadTab(slug)
}
function clickTrack(){ try{ if(currentSlug.value) fetch(`${API_BASE}/api/tabs/track`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug: currentSlug.value, type:'click' }) }) }catch{} }

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
// احفظ موضع التمرير والتبويب النشط عند مغادرة الصفحة
onBeforeUnmount(()=>{
  try{
    sessionStorage.setItem('home:scrollY', String(window.scrollY||0))
    const slug = currentSlug.value || tabs.value[activeTab.value]?.slug || ''
    // احفظ محتوى التبويب الحالي في ذاكرة الجلسة (لتفادي إعادة جلبه عند الرجوع)
    if (slug && (tabSections.value||[]).length){
      const payload = { [slug]: tabSections.value }
      const prevRaw = sessionStorage.getItem('home:tabs_cache')
      const prev = prevRaw ? JSON.parse(prevRaw) : {}
      sessionStorage.setItem('home:tabs_cache', JSON.stringify({ ...prev, ...payload }))
    }
  }catch{}
})
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



const categories = ref<Cat[]>([])


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
      apiGet<any>('/api/tabs/list?device=MOBILE').catch(()=>({ tabs: [] })),
      apiGet<any>('/api/tabs/categories/list').catch(()=>({ tabs: [] }))
    ])
    const all = Array.isArray(allResp?.tabs)? allResp.tabs: []
    const cats = new Set((Array.isArray(catsResp?.tabs)? catsResp.tabs: []).map((t:any)=> String(t.slug||'')))
    const filtered = all.filter((t:any)=> !cats.has(String(t.slug||'')))
    tabs.value = filtered.map((t:any)=> ({ label: t.label, slug: String(t.slug||'') }))
    const paramSlug = String(route.params.slug||'')
    // استخدم أول تبويبة كإعداد افتراضي
    const initial = paramSlug || (tabs.value[0]?.slug || '')
    if (!previewActive.value && initial) {
      // If landing on root '/', redirect to the first available tab to ensure content loads correctly
      if (route.path === '/') {
        try {
          await router.replace('/tabs/')
          // return // Stop execution here, let the redirect trigger a reload/watch
        } catch (err) {
          console.error('Failed to redirect to tab:', err)
        }
      }
      
      // Hydrate tab cache from sessionStorage if available
      try{
        const raw = sessionStorage.getItem('home:tabs_cache')
        if (raw){
          const saved = JSON.parse(raw)||{}
          Object.assign(tabCache.value, saved)
        }
      }catch{}
      await loadTab(initial)
    }
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

  // SEO: Fetch metadata for Homepage (Root)
  try {
     const seo = await apiGet<any>('/api/seo/meta?slug=/')
    if (seo) {
       seoHead.value = {
         title: seo.titleSeo || 'Jeeey',
         meta: [
           { name: 'description', content: seo.metaDescription },
           { name: 'robots', content: seo.metaRobots },
           { property: 'og:title', content: seo.ogTags?.title || seo.titleSeo },
           { property: 'og:description', content: seo.ogTags?.description || seo.metaDescription },
           { property: 'og:image', content: seo.ogTags?.image || seo.siteLogo },
           { property: 'og:url', content: seo.canonicalUrl || 'https://jeeey.com' },
           { name: 'twitter:card', content: seo.twitterCard?.card || 'summary_large_image' },
           { name: 'twitter:title', content: seo.twitterCard?.title || seo.titleSeo },
           { name: 'twitter:description', content: seo.twitterCard?.description || seo.metaDescription },
           { name: 'twitter:image', content: seo.twitterCard?.image || seo.ogTags?.image || seo.siteLogo },
         ].filter(Boolean),
         link: [
           { rel: 'canonical', href: seo.canonicalUrl || 'https://jeeey.com' }
         ],
         script: [
           seo.schema ? { type: 'application/ld+json', innerHTML: seo.schema } : ''
         ].filter(Boolean)
       }
    }
  } catch (e) {
    console.error('SEO Fetch Error:', e)
  }
  
})

// React to route param change (navigating between tabs)
watch(()=> route.params.slug, (nv, ov)=>{
  if (previewActive.value) return
  const slug = String(nv||'')
  if (slug && slug !== String(ov||'')) loadTab(slug)
})

// React to navigating back to root path '/'
watch(()=> route.path, (newPath)=>{
  if (previewActive.value) return
  // If navigating to root '/', load the first tab
  if (newPath === '/' && tabs.value.length > 0) {
    const firstSlug = tabs.value[0]?.slug
    if (firstSlug) {
      activeTab.value = 0
      void loadTab(firstSlug)
    }
  }
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
    const res = await fetch(`${base}/api/product/${encodeURIComponent(id)}`, { credentials:'omit' })
    if (!res.ok) throw new Error('failed')
    const j = await res.json()
    optionsCache[id] = j?.product || j || null
    return optionsCache[id]
  }catch{
    return null
  }
}

const Unknown = {}

function openOptions(p: any){
  try{
    const id = String(p?.id || '')
    if (!id) return
    optionsModal.productId = id
    optionsModal.color = ''
    optionsModal.size = ''
    optionsModal.groupValues = {}
    optionsModal.open = true
    void fetchProductDetails(id)
  }catch{}
}

function closeOptions(){ optionsModal.open = false }

async function onOptionsSave(payload: { color?: string; size?: string; groupValues?: Record<string,string> }){
  try{
    const id = optionsModal.productId || ''
    if (!id) return closeOptions()
    const prod = optionsCache[id] || {}
    const price = parsePrice(String(prod?.price ?? 0))
    const title = String(prod?.name || prod?.title || ' ')
    const img = String((Array.isArray(prod?.images) ? prod.images[0] : prod?.image) || '')
    cart.add({ id, title, price, img }, 1)
  }catch{} finally{
    closeOptions()
  }
}



</script>