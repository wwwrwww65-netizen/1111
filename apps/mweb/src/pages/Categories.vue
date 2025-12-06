<template>
  <div class="page" dir="rtl" lang="ar">
    <!-- Promo Popup -->
    <div v-if="showPromoPopup" class="popup-overlay" @click="closePopup">
      <div class="popup-content" @click.stop>
        <button class="popup-close" @click="closePopup" aria-label="إغلاق">×</button>
        <div class="popup-body">
          <h2 class="popup-title">سجل واحصل على</h2>
          <div class="popup-discount">
            <span class="discount-percent">%15</span>
            <span class="discount-text">خصم إضافي</span>
          </div>
          <div class="popup-subtitle">الدفع عند الاستلام للطلبات +75₪</div>
          <input type="email" class="popup-input" placeholder="أدخلي عنوان بريدك الإلكتروني" v-model="promoEmail" />
          <button class="popup-btn" @click="subscribePromo">تسجيل</button>
          <p class="popup-terms">بالتسجيل، فإنك توافق على سياسة الخصوصية ونلتزم بالشروط والأحكام الخاصة بنا.</p>
      </div>
      </div>
    </div>

    <!-- Header -->
    <div v-if="showHeader" class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm h-14" aria-label="رأس الصفحة">
      <div class="w-screen px-3 h-full flex items-center justify-between">
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="الإشعارات" @click="go('/notifications')">
            <Bell class="text-gray-800 w-6 h-6" />
          </button>
        </div>
        <div class="text-lg sm:text-xl font-semibold text-gray-900" aria-label="شعار المتجر">jeeey</div>
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="السلة" @click="go('/cart')">
            <ShoppingCart class="text-gray-800 w-6 h-6" />
          </button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="البحث" @click="go('/search')">
            <Search class="text-gray-800 w-6 h-6" />
          </button>
        </div>
      </div>
      </div>

    <!-- Tabs (ملتصقة بالهيدر) -->
    <nav v-if="showTabs" class="tabs fixed left-0 right-0 z-40 bg-white border-t border-b border-gray-200" :style="{ top: navTop }">
      <button v-for="t in tabsList" :key="t.key" :class="{on: currentTabKey===t.key}" @click="setTab(t.key)">{{ t.label }}</button>
    </nav>

    <!-- أثناء تحديد التبويب والانتقال إليه، اعرض هيكل عظمي -->
    <div class="layout" :style="{ marginTop: layoutTop, height: layoutHeight }">
      <!-- Sidebar -->
      <aside v-if="showSidebar" class="side">
        <button 
          class="it" 
          v-for="(item,i) in sidebarItems" 
          :key="i" 
          type="button" 
          @click="applySide(item, i)"
          :class="{active: i === selectedSidebarIndex}"
        >
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <!-- Main grid -->
      <main class="main">
        <!-- Promo Banner (tab override -> global). لا نستخدم صور خارجية احتياطية -->
        <div class="promo-banner" v-if="activePromoBanner.enabled && activePromoBanner.image">
          <div class="promo-content">
            <h3>{{ activePromoBanner.title || 'بانر ترويجي' }}</h3>
            <img :src="thumb(activePromoBanner.image, 960)" alt="بانر ترويجي" class="promo-img" />
          </div>
        </div>
        <!-- Skeleton للبنر عند التفعيل بدون صورة بعد -->
        <div class="promo-banner" v-else-if="activePromoBanner.enabled">
          <div class="promo-content">
            <div class="w-24 h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
            <div class="w-full h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- عنوان القسم أو Skeleton أثناء التحميل/التحويل -->
        <h2 v-if="!redirecting && !loading" class="ttl">{{ currentSectionTitle }}</h2>
        <div v-else class="ttl">
          <span class="inline-block w-40 h-4 bg-gray-200 rounded animate-pulse"></span>
        </div>
        
        <!-- Featured Categories with subcategories -->
        <div v-if="showFeaturedSection && featuredCategories.length > 0" class="featured-section">
          <div class="subcategories-scroll">
            <button 
              v-for="sub in featuredCategories" 
              :key="sub.id" 
              class="subcat-btn"
              @click="selectSubcategory(sub.id)"
            >
              {{ sub.name }}
            </button>
          </div>
        </div>
        <!-- Skeleton لشرائح مميزة عند التحميل/التحويل -->
        <div v-else-if="redirecting || loading" class="featured-section">
          <div class="subcategories-scroll">
            <span v-for="i in 6" :key="'sk-chip-'+i" class="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-transparent animate-pulse">placeholder</span>
          </div>
        </div>

        <div v-if="loading" class="grid">
          <div v-for="i in 12" :key="'sk-circ2-'+i" class="cell">
            <div class="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
            <div class="name"><span class="inline-block w-16 h-3 bg-gray-200 rounded mt-2"></span></div>
          </div>
        </div>
        <div v-else class="grid">
          <div 
            v-for="c in displayedCategories" 
            :key="c.id" 
            class="cell cursor-pointer" 
            @click="go(resolveLink(c.id)); trackCategoryClick(c)"
          >
            <img :src="thumb(c.image, 160)" :alt="c.name" loading="lazy" />
            <div class="name">{{ c.name }}</div>
            <div v-if="c.badge" class="badge">{{ c.badge }}</div>
          </div>
        </div>

        <!-- Suggestions Section -->
        <template v-if="activeSuggestions.length">
          <h3 class="ttl2">{{ activeSuggestionsTitle }}</h3>
          <div class="grid suggestions">
            <div 
              v-for="(sug, idx) in activeSuggestions" 
              :key="idx" 
              class="cell cursor-pointer"
              @click="go(resolveLink(sug.id)); trackSuggestionClick(sug)"
            >
              <img :src="thumb(sug.image, 180)" :alt="sug.name" loading="lazy" />
              <div class="name">{{ sug.name }}</div>
            </div>
          </div>
        </template>
      </main>
    </div>

    <BottomNav active="categories" />
  </div>
  
</template>

<script setup lang="ts">
defineOptions({ name: 'CategoriesIndex' })
import BottomNav from '@/components/BottomNav.vue'
import Icon from '@/components/Icon.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, API_BASE } from '@/lib/api'
import { buildThumbUrl } from '@/lib/media'
import { Bell, ShoppingCart, Search } from 'lucide-vue-next'

// Types
type Cat = { 
  id: string
  name: string
  image: string
  badge?: string
  categoryType?: string
  subcategories?: Cat[]
  parent?: string
}

type SidebarItem = {
  label: string
  icon?: string
  tab?: string
  href?: string
}

type Mini = { id: string; name: string; image?: string }
type GridExplicit = { mode: 'explicit'; categories: Mini[] }
type GridFilter = { mode: 'filter'; categoryIds?: string[]; limit?: number; sortBy?: 'name_asc'|'name_desc'|'created_desc' }
type Grid = GridExplicit | GridFilter
type Suggestions = { enabled?: boolean; title?: string; items?: Mini[] } | Mini[]
type PageData = { layout?: { showHeader?: boolean; showSidebar?: boolean }; promoBanner?: any; title?: string; featured?: Mini[]; grid?: Grid; sidebarItems?: SidebarItem[]; suggestions?: Suggestions; seo?: { title?: string; description?: string } }

// State
const cats = ref<Cat[]>([])
const loading = ref(true)
const active = ref('all')
const selectedSidebarIndex = ref<number>(0)
const selectedSubcategory = ref<string | null>(null)
const showPromoPopup = ref(false)
const redirecting = ref(false)
const promoEmail = ref('')
// Config/preview
const catConfig = ref<any>(null)
const previewActive = ref<boolean>(false)
const publishedTabs = ref<Array<{ slug: string; label: string }>>([])
const activePublishedSlug = ref<string>('')
const page = ref<PageData>({})
const showHeader = computed(()=> catConfig.value?.layout?.showHeader!==false)
// أظهر شريط التبويبات دائماً إذا كانت هناك تبويبات منشورة من API،
// وإلا اتبع إعدادات التصميم (showTabs !== false)
const showTabs = computed(()=> (publishedTabs.value.length>0) || (catConfig.value?.layout?.showTabs!==false))
// عند وجود تبويبات منشورة: اتبع إعداد التبويب/الصفحة لعرض الشريط الجانبي (لا نخفيه)
const showSidebar = computed(()=> {
  if (publishedTabs.value.length>0) return page.value?.layout?.showSidebar !== false
  return (catConfig.value?.layout?.showSidebar!==false)
})
const navTop = computed(()=> showHeader.value ? '56px' : '0px')
const layoutTop = computed(()=> {
  const headerH = showHeader.value ? 56 : 0
  const tabsH = showTabs.value ? 48 : 0
  return `${headerH + tabsH}px`
})
const layoutHeight = computed(()=> {
  const headerH = showHeader.value ? 56 : 0
  const tabsH = showTabs.value ? 48 : 0
  return `calc(100dvh - ${headerH + tabsH}px - 60px)`
})
const tabsList = computed(()=>{
  // أعرض فقط التبويبات المنشورة الحقيقية من API
  if (publishedTabs.value.length) return publishedTabs.value.map((t:any)=> ({ key: String(t.slug||''), label: String(t.label||t.slug||'') }))
  // بدون تبويبات منشورة، لا نعرض تبويبات وهمية
  return []
})
const currentTabKey = computed(()=> usingPublishedTabs.value ? activePublishedSlug.value : active.value)
const usingPublishedTabs = computed(()=> publishedTabs.value.length>0)
const promoBanner = computed(()=> ({ enabled: !!catConfig.value?.promoBanner?.enabled, title: catConfig.value?.promoBanner?.title||'', image: catConfig.value?.promoBanner?.image||'', href: catConfig.value?.promoBanner?.href||'' }))
const activePromoBanner = computed(()=>{
  if (usingPublishedTabs.value){
    const side = currentSideCfg.value as any
    if (side?.promoBanner?.enabled) return { enabled:true, title: side.promoBanner.title||'', image: side.promoBanner.image||'', href: side.promoBanner.href||'' }
    const p = page.value?.promoBanner as any
    if (p?.enabled) return { enabled:true, title: p.title||'', image: p.image||'', href: p.href||'' }
    return { enabled:false, title:'', image:'', href:'' }
  }
  const sideBanner = (currentSideCfg.value as any)?.promoBanner
  if (sideBanner && sideBanner.enabled) return { enabled:true, title: sideBanner.title||'', image: sideBanner.image||'', href: sideBanner.href||'' }
  const tabBanner = (activeTabCfg.value as any)?.promoBanner
  if (tabBanner && tabBanner.enabled) return { enabled:true, title: tabBanner.title||'', image: tabBanner.image||'', href: tabBanner.href||'' }
  return promoBanner.value
})

const router = useRouter()
function go(path: string) { router.push(path) }

function resolveLink(id: string) {
    const hasChildren = cats.value.some(c => String(c.parent) === String(id));
    return hasChildren ? `/categories/${encodeURIComponent(id)}` : `/c/${encodeURIComponent(id)}`;
}

// Enhanced Sidebar with icons (from config or fallback)
const activeTabCfg = computed(()=> (catConfig.value?.tabs||[]).find((t:any)=> String(t.key||'')===active.value) )
const sidebarItems = computed<SidebarItem[]>(()=>{
  if (usingPublishedTabs.value){
    const arr = Array.isArray(page.value?.sidebarItems)? (page.value?.sidebarItems as SidebarItem[]): []
    return arr
  }
  const tabSide = Array.isArray((activeTabCfg.value as any)?.sidebarItems) ? (activeTabCfg.value as any).sidebarItems : null
  if (tabSide) return tabSide.map((s:any)=> ({ label: String(s.label||''), icon: s.icon, href: s.href }))
  const arr = Array.isArray(catConfig.value?.sidebar)? catConfig.value.sidebar : null
  if (arr) return arr.map((s:any)=> ({ label: String(s.label||''), icon: s.icon, tab: s.tabKey||s.tab, href: s.href }))
  return []
})

// Hierarchical category structure (fallback)
const categoryHierarchy: Record<string, Cat[]> = {}

// Suggestions data
const suggestions = ref<Cat[]>([])

// Tab management
async function setTab(v: string) { 
  // إن كان v تبويب فئات منشور: حمّل محتواه داخلياً
  if (publishedTabs.value.some(t=> String(t.slug||'')===v)){
    try{
      redirecting.value = true
      activePublishedSlug.value = v
      selectedSidebarIndex.value = 0
      selectedSubcategory.value = null
      const r = await fetch(`${API_BASE}/api/tabs/${encodeURIComponent(v)}`)
      const j = await r.json()
      const content = j?.content
      const data = (content && (content as any).type==='categories-v1') ? (content as any).data as PageData : {}
      page.value = data||{}
    }catch{ page.value = {} }
    finally{ redirecting.value = false }
    trackTabChange(v)
    return
  }
  // تبويب تصميمي محلي ضمن صفحة الفئات
  active.value = v
  selectedSubcategory.value = null
  selectedSidebarIndex.value = 0
  trackTabChange(v)
}

// Sidebar management
function applySide(item: SidebarItem, idx?: number) {
  selectedSidebarIndex.value = typeof idx==='number' ? idx : 0
  if (item.tab) {
    setTab(item.tab)
  } else if ((item as any).href) {
    try { router.push(String((item as any).href)) } catch{}
  }
  trackSidebarClick(item.label)
}

function isUrl(s?:string){ return !!s && /^(https?:)?\/\//.test(s) }

// Featured categories (subcategories for current tab)
const currentSideCfg = computed(()=>{
  if (usingPublishedTabs.value){
    const list:any[] = Array.isArray(page.value?.sidebarItems)? (page.value?.sidebarItems as any[]): []
    return list[selectedSidebarIndex.value] || null
  }
  const list:any[] = Array.isArray((activeTabCfg.value as any)?.sidebarItems) ? ((activeTabCfg.value as any).sidebarItems as any[]) : []
  return list[selectedSidebarIndex.value] || null
})
const featuredCategories = computed(() => {
  if (usingPublishedTabs.value){
    const side = currentSideCfg.value as any
    if (side?.featured && Array.isArray(side.featured)) return side.featured
    if (Array.isArray(page.value?.featured)) return page.value?.featured||[]
    return []
  }
  if (active.value === 'all') return []
  if (currentSideCfg.value && Array.isArray((currentSideCfg.value as any).featured)) return (currentSideCfg.value as any).featured
  if (activeTabCfg.value && Array.isArray((activeTabCfg.value as any).featured)) return (activeTabCfg.value as any).featured
  return []
})

const showFeaturedSection = computed(() => {
  if (usingPublishedTabs.value) return featuredCategories.value.length > 0
  return active.value !== 'all' && featuredCategories.value.length > 0
})

// Select subcategory
function selectSubcategory(id: string) {
  selectedSubcategory.value = selectedSubcategory.value === id ? null : id
  trackSubcategoryClick(id)
}

// Enhanced filtering with hierarchical support
const displayedCategories = computed(() => {
  if (selectedSubcategory.value) {
    return featuredCategories.value.filter(c => c.id === selectedSubcategory.value)
  }
  if (usingPublishedTabs.value){
    const side = currentSideCfg.value as any
    const resolve = (grid?: Grid): Mini[]=>{
      if (!grid) return []
      if ((grid as GridExplicit).mode==='explicit') return (grid as GridExplicit).categories||[]
      const g = grid as GridFilter
      let pool = cats.value
      if (Array.isArray(g.categoryIds) && g.categoryIds.length){
        const byId: Record<string,Cat> = {}; for (const c of cats.value) byId[c.id]=c
        pool = g.categoryIds.map(id=> byId[id]).filter(Boolean) as any
      }
      const sorted = [...pool].sort((a:any,b:any)=>{
        if (g.sortBy==='name_desc') return String(b.name||'').localeCompare(String(a.name||''), 'ar')
        if (g.sortBy==='created_desc') return 0
        return String(a.name||'').localeCompare(String(b.name||''), 'ar')
      })
      return (g.limit? sorted.slice(0, g.limit): sorted) as any
    }
    if (side?.grid) return resolve(side.grid)
    if (page.value?.grid) return resolve(page.value.grid)
    return cats.value as any
  }
  if (active.value !== 'all') {
    const side = currentSideCfg.value as any
    if (side?.grid?.mode === 'explicit') return (side.grid?.categories||[])
    if (side?.grid?.mode === 'filter') {
      // Client-side filter using categoryIds if provided; fallback to all
      const ids = (side.grid?.categoryIds||[]) as string[]
      const limit = Number(side.grid?.limit||36)
      const sortBy = String(side.grid?.sortBy||'name_asc')
      let pool = cats.value
      if (Array.isArray(ids) && ids.length) {
        const byId: Record<string, any> = {}
        for (const c of cats.value) byId[c.id] = c
        pool = ids.map(id=> byId[id]).filter(Boolean)
      }
      const sorted = [...pool].sort((a:any,b:any)=>{
        if (sortBy==='name_desc') return String(b.name||'').localeCompare(String(a.name||''), 'ar')
        if (sortBy==='created_desc') return 0 // unknown; keep API order
        return String(a.name||'').localeCompare(String(b.name||''), 'ar')
      })
      return sorted.slice(0, limit)
    }
    const tabCfg = (activeTabCfg.value as any)
    if (tabCfg) {
      if (tabCfg.grid?.mode === 'explicit') return (tabCfg.grid?.categories||[])
      if (tabCfg.grid?.mode === 'filter') {
        // Client-side filter using categoryIds if provided; fallback to all
        const ids = (tabCfg.grid?.categoryIds||[]) as string[]
        const limit = Number(tabCfg.grid?.limit||36)
        const sortBy = String(tabCfg.grid?.sortBy||'name_asc')
        let pool = cats.value
        if (Array.isArray(ids) && ids.length) {
          const byId: Record<string, any> = {}
          for (const c of cats.value) byId[c.id] = c
          pool = ids.map(id=> byId[id]).filter(Boolean)
        }
        const sorted = [...pool].sort((a:any,b:any)=>{
          if (sortBy==='name_desc') return String(b.name||'').localeCompare(String(a.name||''), 'ar')
          if (sortBy==='created_desc') return 0 // unknown; keep API order
          return String(a.name||'').localeCompare(String(b.name||''), 'ar')
        })
        return sorted.slice(0, limit)
      }
    }
    return []
  }
  return []
})

// Section title
const currentSectionTitle = computed(() => {
  if (usingPublishedTabs.value) return page.value?.title || 'مختارات من أجلك'
  const tabs = Array.isArray(catConfig.value?.tabs)? catConfig.value.tabs : []
  const t = tabs.find((x:any)=> String(x.key||'')===active.value)
  if (t?.label) return t.label
  const titles: Record<string, string> = { all: 'مختارات من أجلك', women: 'ملابس نسائية', men: 'ملابس رجالية', kids: 'ملابس أطفال', plus: 'مقاسات كبيرة', home: 'المنزل والحيوانات الأليفة', beauty: 'منتجات التجميل' }
  return titles[active.value] || 'مختارات من أجلك'
})

// Suggestions resolution priority: sidebar item > page-level/tab > global > fallback
const activeSuggestions = computed(()=>{
  const side = currentSideCfg.value as any
  if (side?.suggestions?.enabled && Array.isArray(side?.suggestions?.items) && side.suggestions.items.length) return side.suggestions.items
  if (usingPublishedTabs.value){
    const s2 = page.value?.suggestions as any
    if (Array.isArray(s2)) return s2
    if (s2?.enabled && Array.isArray(s2.items)) return s2.items
    return []
  }
  const tab = activeTabCfg.value as any
  if (tab?.suggestions?.enabled && Array.isArray(tab?.suggestions?.items) && tab.suggestions.items.length) return tab.suggestions.items
  const s = catConfig.value?.suggestions
  if (Array.isArray(s)) return s
  if (s?.enabled && Array.isArray(s.items)) return s.items
  return suggestions.value
})
const activeSuggestionsTitle = computed(()=>{
  const side = currentSideCfg.value as any
  if (side?.suggestions?.enabled && (side?.suggestions?.title||'').trim()) return side.suggestions.title
  if (usingPublishedTabs.value){
    const s2 = page.value?.suggestions as any
    if (!Array.isArray(s2) && (s2?.title||'').trim()) return s2.title
  }
  const tab = activeTabCfg.value as any
  if (tab?.suggestions?.enabled && (tab?.suggestions?.title||'').trim()) return tab.suggestions.title
  const s = catConfig.value?.suggestions
  if (!Array.isArray(s) && (s?.title||'').trim()) return s?.title
  return 'ربما يعجبك هذا أيضاً'
})

// Promo popup management
function closePopup() {
  showPromoPopup.value = false
  trackPopupClose()
}

function subscribePromo() {
  if (promoEmail.value) {
    trackPromoSubscription(promoEmail.value)
    // In production: send to API
    console.log('Subscribed:', promoEmail.value)
    closePopup()
  }
}

// Analytics/Tracking functions
function trackTabChange(tab: string) {
  console.log('[Analytics] Tab changed to:', tab)
  // In production: send to analytics service
}

function trackSidebarClick(label: string) {
  console.log('[Analytics] Sidebar clicked:', label)
}

function trackSubcategoryClick(id: string) {
  console.log('[Analytics] Subcategory clicked:', id)
}

function trackCategoryClick(category: Cat) {
  console.log('[Analytics] Category clicked:', category.name)
}

function trackSuggestionClick(suggestion: Cat) {
  console.log('[Analytics] Suggestion clicked:', suggestion.name)
}

function trackPopupClose() {
  console.log('[Analytics] Popup closed')
}

function trackPromoSubscription(email: string) {
  console.log('[Analytics] Promo subscription:', email)
}

// Image helper via same-origin CDN (/i)
function thumb(u?: string, w: number = 160, q: number = 60): string {
  return buildThumbUrl(String(u||''), w, q)
}

// Load categories & config
onMounted(async () => {
  // Preview support
  try{
    const u = new URL(location.href)
    const tok = u.searchParams.get('token') || u.searchParams.get('previewToken') || ''
    const raw = u.searchParams.get('payload') || ''
    if (raw) { try{ const payload = JSON.parse(decodeURIComponent(raw)); catConfig.value = payload; previewActive.value = true }catch{} }
    if (!previewActive.value && tok){ try{ const r = await fetch(`${API_BASE}/api/admin/categories/page/preview/${encodeURIComponent(tok)}`, { credentials:'omit' }); const j = await r.json(); if (j) { catConfig.value = j; previewActive.value = true } }catch{} }
  }catch{}
  // Live config (use API_BASE to work in dev/prod)
  if (!previewActive.value){ try{ const r = await fetch(`${API_BASE}/api/categories/page?site=mweb`); const j = await r.json(); if (j?.config) catConfig.value = j.config; }catch{} }

  // اجلب تبويبات الفئات المنشورة فقط (من API_BASE)
  try{
    redirecting.value = !previewActive.value
    const jl = await apiGet<any>('/api/tabs/categories/list')
    const list = Array.isArray(jl?.tabs)? jl.tabs: []
    publishedTabs.value = list.map((x:any)=> ({ slug: String(x.slug||''), label: String(x.label||x.slug||'') }))
    // افتح التبويب المفضل إن كان محدداً وصالحاً، وإلا الأول (داخلياً)
    try{
      if (!previewActive.value && publishedTabs.value.length){
        const preferred = String(catConfig.value?.defaultTabSlug||'').trim()
        const candidate = publishedTabs.value.find(t=> t.slug===preferred)?.slug || publishedTabs.value[0].slug
        await setTab(candidate)
      }
      redirecting.value = false
    }catch{ redirecting.value = false }
  }catch{ publishedTabs.value = []; redirecting.value = false }

  const data = await apiGet<any>('/api/categories?limit=200')
  if (data && Array.isArray(data.categories)) {
    const badges: Record<string,string> = {}
    try{ for (const b of (catConfig.value?.badges||[])) { if (b?.categoryId && b?.text) badges[b.categoryId]=b.text } }catch{}
    cats.value = data.categories.map((c: any) => ({ 
      id: c.slug || c.id, 
      name: c.name, 
      image: c.image || `https://picsum.photos/seed/${encodeURIComponent(c.slug || c.id)}/200/200`,
      categoryType: c.categoryType,
      badge: badges[c.slug||c.id] || undefined,
      parent: c.parentId || c.parent || undefined,
    }))
  } else {
    // Fallback with mixed categories
    cats.value = []
  }
  loading.value = false
  
  // Init suggestions from config or fallback
  try{
    if (Array.isArray(catConfig.value?.suggestions)) suggestions.value = catConfig.value?.suggestions
    else if (Array.isArray(catConfig.value?.suggestions?.items)) suggestions.value = catConfig.value?.suggestions?.items
    else suggestions.value = []
  }catch{}

  // Show promo popup from config
  if (catConfig.value?.layout?.showPromoPopup) setTimeout(()=>{ showPromoPopup.value = true }, 2000)

  // Apply SEO
  try{
    const t = catConfig.value?.seo?.title || 'الفئات'
    const d = catConfig.value?.seo?.description || ''
    if (t) document.title = t
    if (d) {
      let m = document.querySelector('meta[name="description"]') as HTMLMetaElement|null
      if (!m) { m = document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m) }
      m.setAttribute('content', d)
    }
  }catch{}

  // Live preview updates from Admin
  try{
    window.addEventListener('message', (e: MessageEvent)=>{
      try{ const data:any = e.data; if (data && data.__categories_preview){ catConfig.value = data.content || {}; previewActive.value = true } }catch{}
    })
  }catch{}
})
</script>

<style scoped>
/* Base Layout */
.page{height:100dvh;overflow:hidden;background:#f9fafb;position:relative}

/* Tabs Navigation */
.tabs{display:flex;align-items:center;gap:16px;padding:10px 12px;overflow-x:auto;white-space:nowrap}
.tabs::-webkit-scrollbar{height:2px}
.tabs::-webkit-scrollbar-thumb{background:#e5e7eb}
.tabs button{background:transparent;border:0;color:#6b7280;cursor:pointer;padding:4px 8px;transition:all 0.2s;font-size:14px}
.tabs button:hover{color:#111}
.tabs .on{color:#111;font-weight:700;border-bottom:2px solid #111;padding-bottom:4px}
.tabs .sm{font-size:12px}

/* Layout Grid - مع padding للهيدر والتبويبات */
.layout{
  display:grid;
  grid-template-columns:180px 1fr;
  min-height:0;
}

/* Enhanced Sidebar - scroll منفصل */
.side{
  background:#f3f4f6;
  padding:12px;
  overflow-y:auto;
  height:100%;
  padding-bottom:calc(env(safe-area-inset-bottom) + 64px);
  overscroll-behavior:contain;
}
.side::-webkit-scrollbar{width:6px}
.side::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
.side .it{
  padding:10px 8px;
  border-bottom:1px solid #e5e7eb;
  color:#374151;
  font-size:13px;
  background:transparent;
  border:0;
  text-align:start;
  width:100%;
  cursor:pointer;
  transition:all 0.2s;
  border-radius:6px;
  margin-bottom:2px;
}
.side .it .ico{display:inline-grid;place-items:center;width:20px;height:20px;margin-inline-end:6px}
.side .it .ico img{width:18px;height:18px;object-fit:cover;border-radius:4px}
.side .it:hover{background:#e5e7eb;transform:translateX(-2px)}
.side .it.active{background:#fff;color:#111;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.1)}

/* Main Content - scroll منفصل */
.main{
  padding:12px;
  overflow-y:auto;
  height:100%;
  padding-bottom:calc(env(safe-area-inset-bottom) + 64px);
  overscroll-behavior:contain;
}

/* Promo Banner */
.promo-banner{
  background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius:12px;
  padding:16px;
  margin-bottom:16px;
  overflow:hidden;
  box-shadow:0 4px 12px rgba(102,126,234,0.2);
}
.promo-content h3{
  color:#fff;
  font-size:18px;
  font-weight:700;
  margin-bottom:12px;
  text-align:center;
}
.promo-img{
  width:100%;
  height:120px;
  object-fit:cover;
  border-radius:8px;
}

/* Section Title */
.ttl{text-align:center;font-weight:700;margin:16px 0;font-size:18px;color:#111}
.ttl2{font-size:16px;font-weight:600;margin:20px 0 12px;color:#374151}

/* Featured Subcategories */
.featured-section{margin-bottom:16px}
.subcategories-scroll{
  display:flex;
  gap:8px;
  overflow-x:auto;
  padding:8px 0;
  margin-bottom:12px;
}
.subcategories-scroll::-webkit-scrollbar{height:4px}
.subcategories-scroll::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px}
.subcat-btn{
  padding:8px 16px;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:20px;
  color:#6b7280;
  font-size:13px;
  white-space:nowrap;
  cursor:pointer;
  transition:all 0.2s;
}
.subcat-btn:hover{
  background:#f9fafb;
  border-color:#111;
  color:#111;
}

/* Categories Grid */
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.cell{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-decoration:none;
  color:inherit;
  cursor:pointer;
  transition:transform 0.2s;
  position:relative;
}
.cell:hover{transform:translateY(-4px)}
.cell img{
  width:80px;
  height:80px;
  border-radius:999px;
  object-fit:cover;
  background:#e5e7eb;
  border:2px solid transparent;
  transition:border-color 0.2s;
}
.cell:hover img{border-color:#111}
.name{
  font-size:12px;
  color:#374151;
  margin-top:6px;
  line-height:1.2;
  text-align:center;
  max-width:90px;
}
.badge{
  position:absolute;
  top:-4px;
  right:8px;
  background:#ef4444;
  color:#fff;
  font-size:9px;
  padding:2px 6px;
  border-radius:10px;
  font-weight:600;
}

/* Suggestions */
.grid.suggestions .cell img{width:90px;height:90px}

/* Promo Popup */
.popup-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.6);
  display:grid;
  place-items:center;
  z-index:9999;
  padding:20px;
  backdrop-filter:blur(4px);
  animation:fadeIn 0.3s ease;
}
@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}
.popup-content{
  background:#fff;
  border-radius:16px;
  max-width:400px;
  width:100%;
  position:relative;
  box-shadow:0 20px 60px rgba(0,0,0,0.3);
  animation:slideUp 0.3s ease;
}
@keyframes slideUp{
  from{transform:translateY(20px);opacity:0}
  to{transform:translateY(0);opacity:1}
}
.popup-close{
  position:absolute;
  top:12px;
  left:12px;
  width:32px;
  height:32px;
  border-radius:999px;
  background:#f3f4f6;
  border:0;
  font-size:24px;
  cursor:pointer;
  display:grid;
  place-items:center;
  color:#6b7280;
  transition:all 0.2s;
  z-index:10;
}
.popup-close:hover{background:#e5e7eb;color:#111}
.popup-body{padding:40px 24px 24px}
.popup-title{
  text-align:center;
  font-size:22px;
  font-weight:700;
  color:#111;
  margin-bottom:12px;
}
.popup-discount{
  text-align:center;
  margin-bottom:12px;
}
.discount-percent{
  font-size:48px;
  font-weight:900;
  color:#ef4444;
  display:block;
  line-height:1;
}
.discount-text{
  font-size:20px;
  font-weight:600;
  color:#111;
  display:block;
}
.popup-subtitle{
  text-align:center;
  font-size:14px;
  color:#6b7280;
  margin-bottom:20px;
  font-weight:600;
}
.popup-input{
  width:100%;
  padding:12px 16px;
  border:1px solid #e5e7eb;
  border-radius:8px;
  font-size:14px;
  margin-bottom:12px;
  outline:none;
  transition:border-color 0.2s;
}
.popup-input:focus{border-color:#111}
.popup-btn{
  width:100%;
  padding:14px;
  background:#ef4444;
  color:#fff;
  border:0;
  border-radius:8px;
  font-size:16px;
  font-weight:700;
  cursor:pointer;
  transition:background 0.2s;
}
.popup-btn:hover{background:#dc2626}
.popup-terms{
  font-size:11px;
  color:#9ca3af;
  text-align:center;
  margin-top:16px;
  line-height:1.4;
}

/* Responsive Design */
@media (max-width: 768px){
  .layout{grid-template-columns:140px 1fr}
  .side .it{font-size:12px;padding:8px 6px}
  .tabs{gap:12px}
  .tabs button{font-size:13px}
}

@media (max-width: 520px){
  .layout{grid-template-columns:110px 1fr}
  .grid{grid-template-columns:repeat(3,1fr);gap:10px}
  .cell img{width:72px;height:72px}
  .name{font-size:11px;max-width:80px}
  .side .it{font-size:11px;padding:6px 4px}
  .promo-banner{padding:12px}
  .promo-content h3{font-size:16px}
  .promo-img{height:100px}
  .ttl{font-size:16px}
  .popup-body{padding:32px 20px 20px}
  .popup-title{font-size:20px}
  .discount-percent{font-size:42px}
  .discount-text{font-size:18px}
}
</style>