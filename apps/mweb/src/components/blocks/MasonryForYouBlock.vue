<template>
  <section class="py-3" dir="rtl">
    <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
      <h2 class="text-sm font-semibold text-gray-900 text-center">من أجلك</h2>
    </div>
    <div class="px-2 py-2">
      <div class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="(p,i) in products" :key="'fy-'+(p.id||i)" class="mb-1 break-inside-avoid">
          <ProductGridCard :product="p" @add="openSuggestOptions" />
        </div>
      </div>
    </div>
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

type GridP = { id: string; title: string; image?: string; images?: string[]; overlayBannerSrc?: string; overlayBannerAlt?: string; brand?: string; discountPercent?: number; bestRank?: number; bestRankCategory?: string; basePrice?: string; soldPlus?: string; couponPrice?: string }
type Cfg = { columns?: number; products?: any[]; items?: any[] }
const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const fallbackCount = computed(()=> (props.device ?? 'MOBILE') === 'MOBILE' ? 8 : 9)
const products = ref<GridP[]>([])
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
  if (provided.length){ products.value = provided.map(toGridP); try{ await hydrateCouponsAndPrices() }catch{}; return }

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
    try{ await hydrateCouponsAndPrices() }catch{}
  }catch{
    products.value = Array.from({ length: fallbackCount.value }).map((_,i)=> ({ id: `ph-${i}`, title: 'منتج', image: '/images/placeholder-product.jpg' }))
  }
}

onMounted(()=>{ loadRecommendations() })

// Options modal logic (same UX as homepage)
const optionsModal = reactive({ open:false, productId:'', color:'', size:'', groupValues:{} as Record<string,string> })
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


