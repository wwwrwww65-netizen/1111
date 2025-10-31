<template>
  <div class="page" dir="rtl" lang="ar">
    <!-- Header (optional) -->
    <div v-if="showHeader" class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm h-14" aria-label="رأس الصفحة">
      <div class="w-screen px-3 h-full flex items-center justify-between">
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="الإشعارات" @click="go('/notifications')">
            <Bell class="text-gray-800 w-6 h-6" />
          </button>
        </div>
        <div class="text-lg sm:text-xl font-semibold text-gray-900">jeeey</div>
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

    <!-- Tabs (stick to header) -->
    <nav v-if="showTabs" class="tabs fixed left-0 right-0 z-40 bg-white border-t border-b border-gray-200" :style="{ top: navTop }">
      <button v-for="t in tabsList" :key="t.slug" :class="{on: slug===t.slug}" @click="go('/categories/'+encodeURIComponent(t.slug))">{{ t.label }}</button>
    </nav>

    <!-- Layout: Sidebar + Main -->
    <div class="layout" :style="{ marginTop: layoutTop, height: layoutHeight }">
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

      <main class="main">
        <!-- Promo banner resolution: sidebar > page-level -->
        <div class="promo-banner" v-if="activePromoBanner.enabled">
          <div class="promo-content">
            <h3>{{ activePromoBanner.title || 'بانر ترويجي' }}</h3>
            <img :src="activePromoBanner.image || 'https://csspicker.dev/api/image/?q=fashion+banner'" alt="بانر" class="promo-img" />
          </div>
        </div>

        <h2 class="ttl">{{ pageTitle }}</h2>

        <div v-if="showFeaturedSection && featuredCategories.length" class="featured-section">
          <div class="subcategories-scroll">
            <button v-for="sub in featuredCategories" :key="sub.id" class="subcat-btn" @click="selectSubcategory(sub.id)">{{ sub.name }}</button>
          </div>
        </div>

        <SkeletonGrid v-if="loading" :count="12" :cols="3" />
        <div v-else class="grid">
          <a v-for="c in displayedCategories" :key="c.id" class="cell" :href="`/c/${encodeURIComponent(c.id)}`">
            <img :src="c.image" :alt="c.name" loading="lazy" />
            <div class="name">{{ c.name }}</div>
            <div v-if="c.badge" class="badge">{{ c.badge }}</div>
          </a>
        </div>

        <template v-if="activeSuggestions.length">
          <h3 class="ttl2">{{ activeSuggestionsTitle }}</h3>
          <div class="grid suggestions">
            <a v-for="(sug, idx) in activeSuggestions" :key="idx" class="cell" :href="`/c/${encodeURIComponent(sug.id)}`">
              <img :src="sug.image" :alt="sug.name" loading="lazy" />
              <div class="name">{{ sug.name }}</div>
            </a>
          </div>
        </template>
      </main>
    </div>

    <BottomNav active="categories" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SkeletonGrid from '@/components/SkeletonGrid.vue'
import { apiGet, API_BASE } from '@/lib/api'
import BottomNav from '@/components/BottomNav.vue'
import { Bell, ShoppingCart, Search } from 'lucide-vue-next'

type Cat = { id: string; name: string; image: string; badge?: string }
type Mini = { id: string; name: string; image?: string }
type GridExplicit = { mode: 'explicit'; categories: Mini[] }
type GridFilter = { mode: 'filter'; categoryIds?: string[]; limit?: number; sortBy?: 'name_asc'|'name_desc'|'created_desc' }
type Grid = GridExplicit | GridFilter
type Suggestions = { enabled?: boolean; title?: string; items?: Mini[] } | Mini[]
type SidebarItem = { label: string; href?: string; icon?: string; promoBanner?: any; featured?: Mini[]; grid?: Grid; suggestions?: Suggestions }
type PageData = { layout?: { showHeader?: boolean; showSidebar?: boolean }; promoBanner?: any; title?: string; featured?: Mini[]; grid?: Grid; sidebarItems?: SidebarItem[]; suggestions?: Suggestions; seo?: { title?: string; description?: string } }
type PageContent = { type: 'categories-v1'; data: PageData }

const route = useRoute()
const router = useRouter()
function go(path: string){ router.push(path) }
const slug = computed(()=> String(route.params.slug||''))

const cats = ref<Cat[]>([])
const loading = ref(true)
const page = ref<PageData>({})
const selectedSidebarIndex = ref(0)
const selectedSubcategory = ref<string|null>(null)

const showHeader = computed(()=> page.value?.layout?.showHeader !== false)
const showSidebar = computed(()=> page.value?.layout?.showSidebar !== false)

// Tabs list for header bar
const publishedTabs = ref<Array<{ slug: string; label: string }>>([])
const showTabs = computed(()=> publishedTabs.value.length>0)
const tabsList = computed(()=> publishedTabs.value)
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

const sidebarItems = computed<SidebarItem[]>(()=> Array.isArray(page.value?.sidebarItems) ? (page.value?.sidebarItems as SidebarItem[]) : [])
const currentSideCfg = computed(()=> sidebarItems.value[selectedSidebarIndex.value] || null)

const promoBanner = computed(()=> ({ enabled: !!page.value?.promoBanner?.enabled, title: page.value?.promoBanner?.title||'', image: page.value?.promoBanner?.image||'', href: page.value?.promoBanner?.href||'' }))
const activePromoBanner = computed(()=>{
  const side = currentSideCfg.value as any
  if (side?.promoBanner?.enabled) return { enabled:true, title: side.promoBanner.title||'', image: side.promoBanner.image||'', href: side.promoBanner.href||'' }
  return promoBanner.value
})

const featuredCategories = computed<Mini[]>(()=>{
  const side = currentSideCfg.value as any
  if (side?.featured && Array.isArray(side.featured)) return side.featured
  if (Array.isArray(page.value?.featured)) return page.value?.featured||[]
  return []
})
const showFeaturedSection = computed(()=> featuredCategories.value.length>0)

function selectSubcategory(id:string){ selectedSubcategory.value = selectedSubcategory.value===id? null: id }

const displayedCategories = computed<Mini[]>(()=>{
  if (selectedSubcategory.value) return featuredCategories.value.filter(c=> c.id===selectedSubcategory.value)
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
})

const pageTitle = computed(()=> page.value?.title || 'مختارات من أجلك')

function normSuggestions(s: Suggestions|undefined): { enabled: boolean; title?: string; items: Mini[] }{
  if (Array.isArray(s)) return { enabled: true, items: s }
  return { enabled: s?.enabled !== false, title: s?.title, items: s?.items||[] }
}
const activeSuggestions = computed(()=>{
  const side = currentSideCfg.value as any
  const s1 = side?.suggestions? normSuggestions(side.suggestions): null
  if (s1 && s1.enabled && s1.items.length) return s1.items
  const s2 = page.value?.suggestions? normSuggestions(page.value?.suggestions): null
  if (s2 && s2.enabled) return s2.items
  return []
})
const activeSuggestionsTitle = computed(()=>{
  const side = currentSideCfg.value as any
  const s1 = side?.suggestions? normSuggestions(side.suggestions): null
  if (s1 && s1.enabled && (s1.title||'').trim()) return s1.title as string
  const s2 = page.value?.suggestions? normSuggestions(page.value?.suggestions): null
  if (s2 && (s2.title||'').trim()) return s2.title as string
  return 'ربما يعجبك هذا أيضاً'
})

function applySide(item: SidebarItem, idx?: number){ selectedSidebarIndex.value = typeof idx==='number'? idx: 0; try{ if (item.href) router.push(item.href) }catch{} }

onMounted(async()=>{
  // Resolve preview via token
  let content: PageContent|undefined
  try{
    const u = new URL(location.href)
    const tok = u.searchParams.get('previewToken')||''
    if (tok){
      const r = await fetch(`${API_BASE}/api/admin/tabs/preview/${encodeURIComponent(tok)}`, { credentials:'omit' })
      const j = await r.json(); content = j?.content
    }
  }catch{}
  if (!content){
    try{
      const r = await fetch(`${API_BASE}/api/tabs/${encodeURIComponent(slug.value)}`)
      const j = await r.json(); content = j?.content
    }catch{}
  }
  // Load published tabs for header bar
  try{
    const jl = await apiGet<any>('/api/tabs/categories/list')
    const list = Array.isArray(jl?.tabs)? jl.tabs: []
    publishedTabs.value = list.map((x:any)=> ({ slug: String(x.slug||''), label: String(x.label||x.slug||'') }))
  }catch{ publishedTabs.value = [] }
  const data = (content && (content as any).type==='categories-v1') ? (content as any).data as PageData : {}
  page.value = data||{}

  // Load categories
  try{
    const dataCats = await apiGet<any>('/api/categories?limit=200')
    if (dataCats && Array.isArray(dataCats.categories)){
      cats.value = dataCats.categories.map((c:any)=> ({ id: c.slug||c.id, name: c.name, image: c.image || `https://picsum.photos/seed/${encodeURIComponent(c.slug||c.id)}/200/200` }))
    } else { cats.value = [] }
  }catch{ cats.value = [] }
  loading.value = false

  // Basic SEO
  try{
    if (page.value?.seo?.title) document.title = page.value?.seo?.title
    const d = page.value?.seo?.description||''
    if (d){
      let m = document.querySelector('meta[name="description"]') as HTMLMetaElement|null
      if (!m){ m = document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m) }
      m.setAttribute('content', d)
    }
  }catch{}

  // Live preview via postMessage
  try{
    const handler = (e: MessageEvent)=>{
      try{
        const data:any = e.data
        if (data && data.__categories_preview){
          const content = data.content?.content || data.content
          if (content?.type === 'categories-v1') page.value = content.data||{}
        }
      }catch{}
    }
    window.addEventListener('message', handler)
    onBeforeUnmount(()=> window.removeEventListener('message', handler))
  }catch{}
})
</script>

<style scoped>
.page{min-height:100dvh;background:#f9fafb;position:relative}
.layout{display:grid;grid-template-columns:180px 1fr;min-height:0}
.side{background:#f3f4f6;padding:12px;overflow-y:auto;height:100%}
.side .it{padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;background:transparent;border:0;text-align:start;width:100%;cursor:pointer;transition:all 0.2s;border-radius:6px;margin-bottom:2px}
.side .it:hover{background:#e5e7eb;transform:translateX(-2px)}
.side .it.active{background:#fff;color:#111;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.main{padding:12px;overflow-y:auto;height:100%}
.promo-banner{background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;padding:16px;margin-bottom:16px;overflow:hidden;box-shadow:0 4px 12px rgba(102,126,234,0.2)}
.promo-content h3{color:#fff;font-size:18px;font-weight:700;margin-bottom:12px;text-align:center}
.promo-img{width:100%;height:120px;object-fit:cover;border-radius:8px}
.ttl{text-align:center;font-weight:700;margin:16px 0;font-size:18px;color:#111}
.ttl2{font-size:16px;font-weight:600;margin:20px 0 12px;color:#374151}
.featured-section{margin-bottom:16px}
.subcategories-scroll{display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:12px}
.subcat-btn{padding:8px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;color:#6b7280;font-size:13px;white-space:nowrap;cursor:pointer;transition:all 0.2s}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.cell{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit;cursor:pointer;transition:transform 0.2s;position:relative}
.cell:hover{transform:translateY(-4px)}
.cell img{width:80px;height:80px;border-radius:999px;object-fit:cover;background:#e5e7eb;border:2px solid transparent;transition:border-color 0.2s}
.cell:hover img{border-color:#111}
.name{font-size:12px;color:#374151;margin-top:6px;line-height:1.2;text-align:center;max-width:90px}
.badge{position:absolute;top:-4px;right:8px;background:#ef4444;color:#fff;font-size:9px;padding:2px 6px;border-radius:10px;font-weight:600}
.grid.suggestions .cell img{width:90px;height:90px}
/* Tabs Navigation (match Categories.vue) */
.tabs{display:flex;align-items:center;gap:16px;padding:10px 12px;overflow-x:auto;white-space:nowrap}
.tabs::-webkit-scrollbar{height:2px}
.tabs::-webkit-scrollbar-thumb{background:#e5e7eb}
.tabs button{background:transparent;border:0;color:#6b7280;cursor:pointer;padding:4px 8px;transition:all 0.2s;font-size:14px}
.tabs button:hover{color:#111}
.tabs .on{color:#111;font-weight:700;border-bottom:2px solid #111;padding-bottom:4px}
.tabs .sm{font-size:12px}
@media (max-width: 768px){ .layout{grid-template-columns:140px 1fr} }
@media (max-width: 520px){ .layout{grid-template-columns:110px 1fr} .grid{grid-template-columns:repeat(3,1fr);gap:10px} .cell img{width:72px;height:72px} .name{font-size:11px;max-width:80px} }
</style>


