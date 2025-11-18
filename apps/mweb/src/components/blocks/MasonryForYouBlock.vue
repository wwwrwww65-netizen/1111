<template>
  <section class="py-3" dir="rtl">
    <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
      <h2 class="text-sm font-semibold text-gray-900 text-center">من أجلك</h2>
    </div>
    <div class="px-1 pb-1">
      <!-- Skeleton grid أثناء التحميل (يحاكي شبكة متغيرة الارتفاع) -->
      <div v-if="isLoading" class="product-grid grid grid-cols-2 gap-x-[5px] gap-y-0">
        <!-- يسار -->
        <div>
          <div v-for="i in skLeft" :key="'fy-sk-l-'+i" class="mb-[6px]">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden border-t-0 border-b-0 border-l-0">
              <div class="relative w-full">
                <div class="block w-full bg-gray-200 animate-pulse" :style="{ paddingTop: (placeholderRatios[i%placeholderRatios.length] * 100) + '%' }"></div>
              </div>
              <div class="p-2">
                <div class="inline-flex items-center gap-1 mb-1">
                  <span class="inline-block w-10 h-4 bg-gray-200 rounded"></span>
                  <span class="inline-block w-20 h-4 bg-gray-100 rounded"></span>
                </div>
                <div class="w-full h-4 bg-gray-200 rounded mb-1"></div>
                <div class="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <!-- يمين -->
        <div>
          <div v-for="i in skRight" :key="'fy-sk-r-'+i" class="mb-[6px]">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden border-t-0 border-b-0 border-l-0">
              <div class="relative w-full">
                <div class="block w-full bg-gray-200 animate-pulse" :style="{ paddingTop: (placeholderRatios[i%placeholderRatios.length] * 100) + '%' }"></div>
              </div>
              <div class="p-2">
                <div class="inline-flex items-center gap-1 mb-1">
                  <span class="inline-block w-10 h-4 bg-gray-200 rounded"></span>
                  <span class="inline-block w-20 h-4 bg-gray-100 rounded"></span>
                </div>
                <div class="w-full h-4 bg-gray-200 rounded mb-1"></div>
                <div class="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="product-grid grid grid-cols-2 gap-x-[5px] gap-y-0">
        <!-- يسار -->
        <div>
          <div v-for="(p,ci) in leftProducts" :key="'fy-l-'+(p.id||ci)" class="mb-[6px]">
            <ProductGridCard :class="'border-t-0 border-b-0 border-l-0'" :product="p" :ratio="(p as any)._ratio || defaultRatio" :priority="ci<6" @add="openSuggestOptions" />
          </div>
        </div>
        <!-- يمين -->
        <div>
          <div v-for="(p,ci) in rightProducts" :key="'fy-r-'+(p.id||ci)" class="mb-[6px]">
            <ProductGridCard :class="'border-t-0 border-b-0 border-l-0'" :product="p" :ratio="(p as any)._ratio || defaultRatio" :priority="ci<6" @add="openSuggestOptions" />
          </div>
        </div>
      </div>
      <div ref="fyLoadMoreSentinel" class="h-1"></div>
    </div>
    <!-- Toast -->
    <div 
      v-if="toast" 
      class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2"
    >
      <span>✓</span>
      <span>{{ toastText }}</span>
    </div>
    <!-- إشعار: يرجى تحديد الخيارات -->
    <Transition name="fade">
      <div v-if="requireOptionsNotice" class="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div class="bg-black/80 text-white text-[13px] px-4 py-2.5 rounded-md shadow-lg">يرجى تحديد الخيارات</div>
      </div>
    </Transition>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, reactive } from 'vue'
import ProductGridCard from '@/components/ProductGridCard.vue'
import { apiGet, API_BASE, isAuthenticated } from '@/lib/api'
import { buildThumbUrl } from '@/lib/media'
import ProductOptionsModal from '@/components/ProductOptionsModal.vue'
import { useCart } from '@/store/cart'
import { markTrending } from '@/lib/trending'

type GridP = { id: string; title: string; image?: string; images?: string[]; overlayBannerSrc?: string; overlayBannerAlt?: string; brand?: string; discountPercent?: number; bestRank?: number; bestRankCategory?: string; basePrice?: string; soldPlus?: string; couponPrice?: string; isTrending?: boolean; _ratio?: number }
type Cfg = { columns?: number; products?: any[]; items?: any[] }
const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const fallbackCount = computed(()=> 10)
const products = ref<GridP[]>([])
const leftProducts = computed(()=> products.value.filter((_p,i)=> i%2===0))
const rightProducts = computed(()=> products.value.filter((_p,i)=> i%2===1))
const skLeft = computed(()=> Array.from({ length: 10 }, (_,k)=> k+1).filter(i=> i%2===1))
const skRight = computed(()=> Array.from({ length: 10 }, (_,k)=> k+1).filter(i=> i%2===0))
const isLoading = ref(true)
const cart = useCart()
const placeholderRatios = [1.2, 1.5, 1.35, 1.1, 1.4, 1.25, 1.6, 1.3]
const defaultRatio = 1.3
function thumbSrc(p:GridP, w:number): string {
  const u = (Array.isArray(p.images)&&p.images[0]) || p.image || ''
  return buildThumbUrl(String(u||''), w, 60)
}
// (grid-cols-2 يضبط العرض بدقة؛ لا حاجة لتقسيم يدوي)
function probeRatioPromise(p: any): Promise<void>{
  return new Promise((resolve)=>{
    try{
      if (p._ratio){ resolve(); return }
      const u = thumbSrc(p, 64)
      const img = new Image()
      ;(img as any).loading = 'eager'
      ;(img as any).decoding = 'async'
      img.onload = ()=>{ try{ const w=(img as any).naturalWidth||64; const h=(img as any).naturalHeight||64; if (w>0&&h>0) p._ratio=h/w }catch{} finally{ resolve() } }
      img.onerror = ()=> resolve()
      img.src = u
    }catch{ resolve() }
  })
}

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
    couponPrice: p.couponPrice,
    isTrending: !!(
      p.isTrending===true ||
      p.trending===true ||
      (Array.isArray(p.badges) && p.badges.some((b:any)=> /trending|trend|ترند/i.test(String(b?.key||b?.title||'')))) ||
      (Array.isArray(p.tags) && p.tags.some((t:any)=> /trending|trend|ترند/i.test(String(t||''))))
    )
  }
}

function uniqById(list:any[]): any[]{
  const seen: Record<string, boolean> = {}
  const out: any[] = []
  for (const it of list){ const id=String(it.id||''); if (!seen[id]){ seen[id]=true; out.push(it) } }
  return out
}

const mode = ref<'category'|'personal'|'popular'>('popular')

async function loadRecommendations(){
  const cfg = props.cfg || {}
  const provided = Array.isArray(cfg.products) && cfg.products.length ? cfg.products : (Array.isArray(cfg.items) ? cfg.items : [])
  if (provided.length){
    const base = uniqById(provided)
    const mapped = base.map(toGridP)
    await Promise.all(mapped.map(p=> probeRatioPromise(p)))
    products.value = mapped
    try{ await hydrateCouponsAndPrices() }catch{}
    isLoading.value = false
    hasMore.value = false
    return
  }
  try{
    // Prefer categories coming from config or last carousel to align with admin selection
    const w: any = window as any
    const cfgRec: any = (cfg as any).recommend || {}
    const catIds: string[] = Array.isArray(cfgRec.categoryIds) ? cfgRec.categoryIds : (Array.isArray(w.__LAST_CAROUSEL_CATEGORY_IDS) ? w.__LAST_CAROUSEL_CATEGORY_IDS : [])
    const exclude: string[] = Array.isArray(cfgRec.excludeIds) ? cfgRec.excludeIds : (Array.isArray(w.__USED_PRODUCT_IDS) ? Array.from(w.__USED_PRODUCT_IDS) : [])
    if (catIds.length){
      mode.value = 'category'
      const u = new URL(`${API_BASE}/api/products`)
      u.searchParams.set('limit', String(fallbackCount.value))
      u.searchParams.set('sort', 'new')
      u.searchParams.set('categoryIds', catIds.join(','))
      if (exclude.length) u.searchParams.set('excludeIds', exclude.join(','))
      const j = await (await fetch(u.toString(), { headers:{ 'Accept':'application/json' } })).json()
      const arr = Array.isArray(j?.items)? j.items: []
      const lst = uniqById(arr).slice(0, fallbackCount.value)
      const mapped = lst.map(toGridP)
      await Promise.all(mapped.map(p=> probeRatioPromise(p)))
      products.value = mapped
      try{ markTrending(products.value) }catch{}
      try{ await hydrateCouponsAndPrices() }catch{}
      isLoading.value = false
      hasMore.value = arr.length >= fallbackCount.value
      return
    }
    // Decide personalization vs popular
    let lastId: string|undefined
    try{ lastId = window.localStorage?.getItem('last_view_product_id') || undefined }catch{}
    // try recent to detect any history
    const recent = await apiGet<any>('/api/recommendations/recent').catch(()=>null)
    const hasHistory = Array.isArray(recent?.items) && recent.items.length>0
    if (hasHistory || lastId){
      mode.value = 'personal'
      const [newest, similar] = await Promise.all([
        apiGet<any>('/api/products?limit=24&sort=new').catch(()=>null),
        lastId ? apiGet<any>(`/api/recommendations/similar/${encodeURIComponent(lastId)}`).catch(()=>null) : Promise.resolve(null)
      ])
      const a = Array.isArray(recent?.items)? recent.items : []
      const b = Array.isArray(newest?.items)? newest.items : []
      const c = Array.isArray(similar?.items)? similar.items : []
      const mixed:any[] = []
      const max = Math.max(a.length, b.length, c.length)
      for (let i=0;i<max;i++){ if (c[i]) mixed.push(c[i]); if (a[i]) mixed.push(a[i]); if (b[i]) mixed.push(b[i]) }
      const used: Set<string> = (w && w.__USED_PRODUCT_IDS) ? (w.__USED_PRODUCT_IDS as Set<string>) : new Set<string>()
      const filtered = mixed.filter((p:any)=> !used.has(String(p?.id||'')))
      const dedup = uniqById(filtered)
      const mapped = dedup.slice(0, fallbackCount.value).map(toGridP)
      await Promise.all(mapped.map(p=> probeRatioPromise(p)))
      products.value = mapped
      try{ markTrending(products.value) }catch{}
      try{ await hydrateCouponsAndPrices() }catch{}
      isLoading.value = false
      hasMore.value = dedup.length >= fallbackCount.value
      return
    }
    // Popular fallback for first-time visitors
    mode.value = 'popular'
    const u = new URL(`${API_BASE}/api/products`)
    u.searchParams.set('limit', String(fallbackCount.value))
    u.searchParams.set('sort', 'popular')
    const j = await (await fetch(u.toString(), { headers:{ 'Accept':'application/json' } })).json()
    const arr = Array.isArray(j?.items)? j.items: []
    const mapped = arr.slice(0, fallbackCount.value).map(toGridP)
    await Promise.all(mapped.map(p=> probeRatioPromise(p)))
    products.value = mapped
    try{ markTrending(products.value) }catch{}
    try{ await hydrateCouponsAndPrices() }catch{}
    isLoading.value = false
    hasMore.value = arr.length >= fallbackCount.value
  }catch{
    products.value = []
    isLoading.value = false
    hasMore.value = false
  }
}

const hasMore = ref(true)
const isLoadingMore = ref(false)
const fyLoadMoreSentinel = ref<HTMLDivElement|null>(null)

onMounted(()=>{ loadRecommendations(); try{ window.addEventListener('scroll', onWinScroll, { passive:true }) }catch{} })
onBeforeUnmount(()=>{ try{ window.removeEventListener('scroll', onWinScroll) }catch{} })

onMounted(()=>{
  try{
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        const e = entries[0]
        if (e && e.isIntersecting && hasMore.value && !isLoadingMore.value){
          void loadMore()
        }
      }, { root:null, rootMargin:'0px 0px 300px 0px', threshold:0 })
      if (fyLoadMoreSentinel.value) io.observe(fyLoadMoreSentinel.value)
    }
  }catch{}
})

function onWinScroll(){
  try{
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY
    const clientHeight = window.innerHeight
    if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingMore.value && hasMore.value){
      void loadMore()
    }
  }catch{}
}

async function loadMore(){
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  try{
    const cfg = props.cfg || {}
    const provided = Array.isArray(cfg.products) && cfg.products.length ? cfg.products : (Array.isArray(cfg.items) ? cfg.items : [])
    if (provided.length){ hasMore.value = false; return }

    const w: any = window as any
    const cfgRec: any = (cfg as any).recommend || {}
    const catIds: string[] = Array.isArray(cfgRec.categoryIds) ? cfgRec.categoryIds : (Array.isArray(w.__LAST_CAROUSEL_CATEGORY_IDS) ? w.__LAST_CAROUSEL_CATEGORY_IDS : [])
    if (mode.value==='category' && catIds.length){
      const ex = Array.from(new Set(products.value.map(p=> String(p.id)))).slice(0,200)
      const u = new URL(`${API_BASE}/api/products`)
      u.searchParams.set('limit', String(fallbackCount.value))
      u.searchParams.set('sort', 'new')
      u.searchParams.set('offset', String(products.value.length))
      u.searchParams.set('categoryIds', catIds.join(','))
      if (ex.length) u.searchParams.set('excludeIds', ex.join(','))
      const j = await (await fetch(u.toString(), { headers:{ 'Accept':'application/json' } })).json()
      const arr = Array.isArray(j?.items)? j.items: []
      const lst = uniqById(arr)
      const mapped = lst.map(toGridP)
      await Promise.all(mapped.map(p=> probeRatioPromise(p)))
      const pre = products.value.length
      products.value = products.value.concat(mapped)
      hasMore.value = mapped.length >= 1
      try{ markTrending(products.value as any[]) }catch{}
      try{ await hydrateCouponsAndPrices() }catch{}
      return
    }
    // Other modes
    const ex = Array.from(new Set(products.value.map(p=> String(p.id)))).slice(0,200)
    if (mode.value==='popular'){
      const u = new URL(`${API_BASE}/api/products`)
      u.searchParams.set('limit', String(fallbackCount.value))
      u.searchParams.set('sort', 'popular')
      u.searchParams.set('offset', String(products.value.length))
      if (ex.length) u.searchParams.set('excludeIds', ex.join(','))
      const j = await (await fetch(u.toString(), { headers:{ 'Accept':'application/json' } })).json()
      const arr = Array.isArray(j?.items)? j.items: []
      const mapped = arr.map(toGridP)
      await Promise.all(mapped.map(p=> probeRatioPromise(p)))
      products.value = products.value.concat(mapped)
      hasMore.value = mapped.length >= 1
      try{ markTrending(products.value as any[]) }catch{}
      try{ await hydrateCouponsAndPrices() }catch{}
      return
    }
    // personal: fallback to new with excludeIds
    {
      const u = new URL(`${API_BASE}/api/products`)
      u.searchParams.set('limit', String(fallbackCount.value))
      u.searchParams.set('sort', 'new')
      u.searchParams.set('offset', String(products.value.length))
      if (ex.length) u.searchParams.set('excludeIds', ex.join(','))
      const j = await (await fetch(u.toString(), { headers:{ 'Accept':'application/json' } })).json()
      const arr = Array.isArray(j?.items)? j.items: []
      const mapped = arr.map(toGridP)
      await Promise.all(mapped.map(p=> probeRatioPromise(p)))
      products.value = products.value.concat(mapped)
      hasMore.value = mapped.length >= 1
      try{ markTrending(products.value as any[]) }catch{}
      try{ await hydrateCouponsAndPrices() }catch{}
    }
  }catch{ hasMore.value = false } finally { isLoadingMore.value = false }
}

// Options modal logic (same UX as homepage)
const optionsModal = reactive({ open:false, productId:'', color:'', size:'', groupValues:{} as Record<string,string> })
const optionsCache = reactive<Record<string, any>>({})
const optionsProduct = computed(()=> optionsCache[optionsModal.productId] || null)
const requireOptionsNotice = ref(false)
const toast = ref(false)
const toastText = ref('تمت الإضافة إلى السلة')
function showToast(msg?: string){ try{ if(msg) toastText.value = msg }catch{}; toast.value = true; setTimeout(()=>{ toast.value=false; try{ toastText.value='تمت الإضافة إلى السلة' }catch{} }, 1200) }
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
    const normToken = (s:string)=> String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9\u0600-\u06FF]/g,'')
    const isColorWord = (t:string): boolean => {
      const v = normToken(t)
      return /^(black|white|red|blue|green|yellow|pink|beige|gray|grey|brown|navy|purple|orange|ذهبي|فضي|أسود|ابيض|أبيض|أحمر|ازرق|أزرق|أخضر|أصفر|وردي|بيج|رمادي|بني|紺|بنفسجي)$/i.test(v)
    }
    const looksSizeToken = (s:string): boolean => {
      const v = String(s||'').trim()
      if (!v) return false
      if (/^\d{1,3}$/.test(v)) return true
      const t = v.toUpperCase()
      return ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL'].includes(t)
    }

    // Colors: prefer attributes.color values mapped to colorGalleries thumbnails; fallback to galleries names
    let colors: Array<{ label: string; img: string }> = []
    try{
      const attrs: Array<{ key:string; label:string; values:string[] }> = Array.isArray((d as any).attributes)? (d as any).attributes : []
      const col = attrs.find(a=> a.key==='color')
      const colVals: string[] = Array.isArray(col?.values)? col!.values : []
      if (colVals.length){
        colors = colVals.map((label:string)=>{
          const g = galleries.find((x:any)=> String(x?.name||'').trim().toLowerCase() === String(label||'').trim().toLowerCase())
          const chosen = g?.primaryImageUrl || (Array.isArray(g?.images)&&g!.images![0]) || filteredImgs[0] || '/images/placeholder-product.jpg'
          return { label, img: normalizeImage(chosen) }
        })
      }
    }catch{}
    if (!colors.length && galleries.length){
      colors = galleries.map((g:any)=> {
        const label = String(g.name||'').trim()
        const chosen = g.primaryImageUrl || (Array.isArray(g.images)&&g.images[0]) || filteredImgs[0] || '/images/placeholder-product.jpg'
        return { label, img: normalizeImage(chosen) }
      }).filter(c=> !!c.label)
    }
    if (colors.length <= 1) colors = []

    // Sizes: accept only real size tokens; derive groups (letters/numbers) with ordering
    const variants = Array.isArray(d.variants)? d.variants : []
    let sizes = Array.isArray(d.sizes)? (d.sizes as any[]).filter((s:any)=> typeof s==='string' && looksSizeToken(String(s).trim()) && !isColorWord(String(s).trim())) : []
    if (!sizes.length && variants.length){
      const set = new Set<string>()
      for (const v of variants){
        const sv = String((v as any).size||'').trim()
        if (sv && looksSizeToken(sv) && !isColorWord(sv)) set.add(sv)
      }
      sizes = Array.from(set)
    }
    const isNumber = (x:string)=> /^\d{1,3}$/.test(String(x).trim())
    const letters = new Set<string>()
    const numbers = new Set<string>()
    for (const s of sizes){ if (isNumber(s)) numbers.add(s); else if (looksSizeToken(s)) letters.add(s) }
    const lettersOrder = ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL']
    const orderLetters = (vals:string[])=> Array.from(vals).sort((a,b)=> lettersOrder.indexOf(String(a).toUpperCase()) - lettersOrder.indexOf(String(b).toUpperCase()))
    const orderNumbers = (vals:string[])=> Array.from(vals).sort((a,b)=> (parseInt(a,10)||0) - (parseInt(b,10)||0))
    const sizeGroups: Array<{ label:string; values:string[] }> = []
    if (letters.size) sizeGroups.push({ label: 'مقاسات بالأحرف', values: orderLetters(Array.from(letters)) })
    if (numbers.size) sizeGroups.push({ label: 'مقاسات بالأرقام', values: orderNumbers(Array.from(numbers)) })

    optionsCache[id] = {
      id: d.id||id,
      title: d.name||'',
      price: Number(d.price||0),
      images: filteredImgs.length? filteredImgs: ['/images/placeholder-product.jpg'],
      colors,
      sizes,
      sizeGroups,
      colorGalleries: galleries
    }
    return optionsCache[id]
  }catch{}
}
async function openSuggestOptions(id: string){
  // Probe first: if no options, add directly and toast
  try{
    const base = API_BASE
    const res = await fetch(`${base}/api/product/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } })
    if (res.ok){
      const d = await res.json()
      const galleries = Array.isArray(d?.colorGalleries) ? d.colorGalleries : []
      const colorsCount = galleries.filter((g:any)=> String(g?.name||'').trim()).length
      const hasColors = colorsCount > 1
      const sizesArr = Array.isArray(d?.sizes) ? (d.sizes as any[]).filter((s:any)=> typeof s==='string' && String(s).trim()) : []
      const variantsHasSize = Array.isArray(d?.variants) && d.variants.some((v:any)=> !!v?.size || /size|مقاس/i.test(String(v?.name||'')))
      const hasSizes = (new Set(sizesArr.map((s:string)=> s.trim().toLowerCase()))).size > 1 || (!!variantsHasSize && (sizesArr.length>1))
      if (!hasColors && !hasSizes){
        const p = products.value.find(x=> String(x.id)===String(id))
        if (p){ cart.add({ id: String(p.id), title: String(p.title), price: Number(String(p.basePrice||'0').replace(/[^0-9.]/g,''))||0, img: (Array.isArray(p.images)&&p.images[0]) || p.image || '/images/placeholder-product.jpg' }, 1); showToast() }
        return
      }
    }
  }catch{}
  // Has options → open modal
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
    // Require sizes/groups when present
    const groups = Array.isArray(prod?.sizeGroups) ? prod!.sizeGroups : []
    if (groups.length){
      const composite = String(payload.size||'')
      const missing = groups.some((g:any)=> !new RegExp(`(?:^|\|)${g.label}:[^|]+`).test(composite))
      if (missing){ requireOptionsNotice.value = true; setTimeout(()=> requireOptionsNotice.value=false, 2000); return }
    } else {
      const hasSizes = Array.isArray(prod?.sizes) && prod!.sizes.length>0
      if (hasSizes && !String(payload.size||'').trim()){ requireOptionsNotice.value = true; setTimeout(()=> requireOptionsNotice.value=false, 2000); return }
    }
    const img = (prod?.images && prod.images[0]) || '/images/placeholder-product.jpg'
    cart.add({ id: prod?.id || optionsModal.productId, title: prod?.title || '', price: Number(prod?.price||0), img, variantColor: payload.color||undefined, variantSize: payload.size||undefined }, 1)
    showToast()
  }catch{}
  optionsModal.open = false
}

// ===== كوبونات وتطبيق السعر بعد الخصم على البطاقات =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])
const couponsCacheTs = ref(0)

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const tryFetch = async (path: string) => {
    try{
      const creds = path.startsWith('/api/coupons/public') ? 'omit' : 'include'
      const r = await fetch(`${API_BASE}${path}`, { credentials: creds as RequestCredentials, headers:{ 'Accept':'application/json' } })
      if(!r.ok) return null; return await r.json()
    }catch{ return null }
  }
  if (isAuthenticated()){
    const data1: any = await tryFetch('/api/me/coupons')
    if (data1 && Array.isArray(data1.coupons)) return normalizeCoupons(data1.coupons)
  }
  const data2: any = await tryFetch('/api/coupons/public')
  if (data2 && Array.isArray(data2.coupons)) return normalizeCoupons(data2.coupons)
  return []
}

function normalizeCoupons(list:any[]): SimpleCoupon[] {
  return (list||[]).map((c:any)=> ({
    code: c.code,
    discountType: (String(c.discountType||'PERCENTAGE').toUpperCase()==='FIXED' ? 'FIXED' : 'PERCENTAGE'),
    discountValue: Number(c.discountValue||c.discount||0),
    audience: c.audience?.target || c.audience || undefined,
    kind: c.kind || undefined,
    rules: c.rules || undefined
  }))
}

function priceAfterCoupon(base:number, cup: SimpleCoupon): number {
  if (!Number.isFinite(base) || base<=0) return base
  const v = Number(cup.discountValue||0)
  if (cup.discountType==='FIXED') return Math.max(0, base - v)
  return Math.max(0, base * (1 - v/100))
}

function isCouponSitewide(c: SimpleCoupon): boolean { return String(c.kind||'').toLowerCase()==='sitewide' || !Array.isArray(c?.rules?.includes) }

function eligibleByTokens(prod: any, c: SimpleCoupon): boolean {
  const inc = Array.isArray(c?.rules?.includes) ? c.rules!.includes! : []
  const exc = Array.isArray(c?.rules?.excludes) ? c.rules!.excludes! : []
  const tokens: string[] = []
  if (prod?.categoryId) tokens.push(`category:${prod.categoryId}`)
  if (prod?.id) tokens.push(`product:${prod.id}`)
  if (prod?.brand) tokens.push(`brand:${prod.brand}`)
  if (prod?.sku) tokens.push(`sku:${prod.sku}`)
  const hasInc = !inc.length || inc.some(t=> tokens.includes(t))
  const hasExc = exc.length && exc.some(t=> tokens.includes(t))
  return hasInc && !hasExc
}

async function ensureProductMeta(p:any): Promise<any> {
  if (p.categoryId!=null) return p
  try{
    const d = await apiGet<any>(`/api/product/${encodeURIComponent(p.id)}`)
    if (d){ p.categoryId = d.categoryId || d.category?.id || d.category || null; p.brand = p.brand || d.brand; p.sku = p.sku || d.sku }
  }catch{}
  return p
}

async function hydrateCouponsAndPrices(){
  try{
    const now = Date.now()
    if (!couponsCache.value.length || (now - couponsCacheTs.value) > 60000){
      couponsCache.value = await fetchCouponsList(); couponsCacheTs.value = now
    }
  }catch{}
  await computeCouponPrices(products.value)
}

async function computeCouponPrices(list:any[]){
  const cups = couponsCache.value||[]
  if (!cups.length) return
  for (const p of list){
    const base = Number(String(p.basePrice||'0').replace(/[^0-9.]/g,''))||0
    if (!base) { p.couponPrice = undefined; continue }
    const site = cups.find(isCouponSitewide)
    if (site){ p.couponPrice = priceAfterCoupon(base, site).toFixed(2); continue }
    await ensureProductMeta(p)
    const match = cups.find(c=> eligibleByTokens(p, c))
    if (match){ p.couponPrice = priceAfterCoupon(base, match).toFixed(2) }
  }
}
</script>

<style scoped>
.product-grid{column-gap:5px!important;row-gap:0!important}
</style>


