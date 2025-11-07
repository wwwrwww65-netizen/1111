<template>
  <section class="py-3" dir="rtl">
    <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
      <h2 class="text-sm font-semibold text-gray-900 text-center">من أجلك</h2>
    </div>
    <div class="px-2 py-2">
      <div v-if="isLoading" class="flex items-center justify-center py-6">
        <div class="flex flex-col items-center gap-2">
          <div class="w-8 h-8 border-4 border-gray-300 rounded-full animate-spin" style="border-top-color:#8a1538"></div>
          <span class="text-[12px] text-gray-500">جاري التحميل...</span>
        </div>
      </div>
      <div v-else class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="(p,i) in products" :key="'fy-'+(p.id||i)" class="mb-1 break-inside-avoid">
          <ProductGridCard :product="p" @add="openSuggestOptions" />
        </div>
      </div>
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
import { computed, onMounted, ref, reactive } from 'vue'
import ProductGridCard from '@/components/ProductGridCard.vue'
import { apiGet, API_BASE } from '@/lib/api'
import ProductOptionsModal from '@/components/ProductOptionsModal.vue'
import { useCart } from '@/store/cart'
import { markTrending } from '@/lib/trending'

type GridP = { id: string; title: string; image?: string; images?: string[]; overlayBannerSrc?: string; overlayBannerAlt?: string; brand?: string; discountPercent?: number; bestRank?: number; bestRankCategory?: string; basePrice?: string; soldPlus?: string; couponPrice?: string; isTrending?: boolean }
type Cfg = { columns?: number; products?: any[]; items?: any[] }
const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const fallbackCount = computed(()=> (props.device ?? 'MOBILE') === 'MOBILE' ? 8 : 9)
const products = ref<GridP[]>([])
const isLoading = ref(true)
const cart = useCart()

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
    isTrending: !!(p.isTrending===true || p.trending===true || (Array.isArray(p.badges) && p.badges.some((b:any)=> /trending|trend|ترند/i.test(String(b?.key||b?.title||'')))) || (Array.isArray(p.tags) && p.tags.some((t:any)=> /trending|trend|ترند/i.test(String(t||''))))
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
  if (provided.length){ products.value = provided.map(toGridP); try{ await hydrateCouponsAndPrices() }catch{}; isLoading.value = false; return }

  try{
    let lastId: string|undefined
    try{ lastId = window.localStorage?.getItem('last_view_product_id') || undefined }catch{}
    const [recent, newest, similar] = await Promise.all([
      apiGet<any>('/api/recommendations/recent').catch(()=>null),
      apiGet<any>('/api/products?limit=24&sort=new').catch(()=>null),
      lastId ? apiGet<any>(`/api/recommendations/similar/${encodeURIComponent(lastId)}`).catch(()=>null) : Promise.resolve(null)
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
    try{ markTrending(products.value) }catch{}
    try{ await hydrateCouponsAndPrices() }catch{}
    isLoading.value = false
  }catch{
    products.value = []
    isLoading.value = false
  }
}

onMounted(()=>{ loadRecommendations() })

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
    let colors: Array<{ label: string; img: string }> = []
    if (galleries.length){ colors = galleries.map((g:any)=> ({ label: String(g.name||'').trim(), img: normalizeImage(g.primaryImageUrl || (Array.isArray(g.images)&&g.images[0]) || '') })).filter(c=> !!c.label) }
    optionsCache[id] = { id: d.id||id, title: d.name||'', price: Number(d.price||0), images: filteredImgs.length? filteredImgs: ['/images/placeholder-product.jpg'], colors, sizes: Array.isArray(d.sizes)? d.sizes: [] }
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

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${API_BASE}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
  let data: any = await tryFetch('/api/admin/me/coupons')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  data = await tryFetch('/api/admin/coupons/public')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  data = await tryFetch('/api/admin/coupons/list')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
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
  if (!couponsCache.value.length){ couponsCache.value = await fetchCouponsList() }
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
.break-inside-avoid{ break-inside: avoid }
</style>


