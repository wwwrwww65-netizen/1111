<template>
  <div class="account-page" dir="rtl" lang="ar">
    <!-- Header -->
    <header class="account-header">
      <!-- Logged In State -->
      <div v-if="user.isLoggedIn" class="user-info">
        <div class="crown-badge">
          <span>S0</span>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 8.5H10.5" stroke="white" stroke-width="1" stroke-linecap="round"/>
            <path d="M2.5 6.5L1.5 2.5L4.5 4.5L6 1.5L7.5 4.5L10.5 2.5L9.5 6.5H2.5Z" fill="white"/>
          </svg>
        </div>
        <span class="username">{{ username }}</span>
      </div>

      <!-- Guest State -->
      <div v-else class="guest-info" @click="loginNow">
        <span class="login-text">تسجيل الدخول/ تسجيل</span>
        <ChevronLeft class="w-5 h-5 text-[#8a1538]" />
      </div>

      <button class="icon-btn" @click="goToSettings" aria-label="الإعدادات">
        <Settings class="w-6 h-6 text-[#8a1538]" />
      </button>
    </header>

    <!-- Main Content -->
    <main class="account-content">
      
      <!-- JEEEY CLUB Card -->
      <section class="club-card">
        <div class="club-header">
          <span class="club-logo">
            <span class="club-icon">S</span> JEEEY CLUB
          </span>
        </div>
        <div class="club-subtitle">انضم للحصول على المزايا +4</div>
        
        <div class="club-benefits">
          <div class="benefit-item">
            <div class="benefit-val">15x</div>
            <div class="benefit-desc">كوبونات شحن 15X</div>
          </div>
          <div class="benefit-divider"></div>
          <div class="benefit-item">
            <div class="benefit-val">10%</div>
            <div class="benefit-desc">%2~10% مكافأة الائتمان</div>
          </div>
          <div class="benefit-divider"></div>
          <div class="benefit-item">
            <div class="benefit-tag">x3</div>
            <Gift class="w-6 h-6 text-[#8B5D33] mb-1" />
            <div class="benefit-desc">3 هدايا مجانية</div>
          </div>
        </div>

        <button class="join-btn" @click="joinClub">
          انضم لمدة <span class="price">3,000 ر.ي</span> (93 يوم) <span class="old-price">5,000 ر.ي</span>
        </button>
      </section>

      <!-- Stats Row (Coupons, Wallet, Points, Gift Card) -->
      <section class="stats-container">
        <div class="stats-row">
          <div class="stat-item" @click="go('/coupons')">
            <span class="stat-val">{{ user.isLoggedIn ? couponsCount : '0' }}</span>
            <span class="stat-label">كوبونات</span>
          </div>
          <div class="stat-item" @click="go('/wallet')">
            <span class="stat-val">{{ user.isLoggedIn ? '0' : '0' }}</span>
            <span class="stat-label">محفظة</span>
          </div>
          <div class="stat-item" @click="go('/points')">
            <span class="stat-val">{{ user.isLoggedIn ? '0' : '0' }}</span>
            <span class="stat-label">نقاط</span>
          </div>
          <div class="stat-item" @click="go('/giftcards')">
            <CreditCard class="w-6 h-6 text-[#8a1538] mb-1" />
            <span class="stat-label">بطاقة هدية</span>
          </div>
        </div>

        <!-- Coupon Notification Strip -->
        <div class="coupon-strip" v-if="user.isLoggedIn && couponsCount > 0 && showCouponStrip">
          <span>لديك <span class="red-text">{{ couponsCount }} كوبونات</span> على وشك الانتهاء!</span>
          <button class="close-strip" @click="closeCouponStrip">
            <X class="w-4 h-4 text-[#8a1538]" />
          </button>
        </div>
      </section>

      <!-- Orders Section -->
      <section class="section-block">
        <div class="section-header-row" @click="go('/orders')">
          <span class="section-title">طلبي</span>
          <div class="section-more">
            <span>الاراء الكاملة</span>
            <ChevronLeft class="w-4 h-4 text-[#8a1538]" />
          </div>
        </div>
        <div class="orders-grid">
          <div class="order-item" @click="go('/orders?status=PENDING')">
            <CreditCard class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>غير مدفوع</span>
          </div>
          <div class="order-item" @click="go('/orders?status=PROCESSING')">
            <Package class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>قيد التجهيز</span>
          </div>
          <div class="order-item" @click="go('/orders?status=DELIVERED')">
            <Truck class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>تم الشحن</span>
          </div>
          <div class="order-item" @click="go('/orders?status=REVIEW')">
            <MessageSquare class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>تعليق</span>
          </div>
          <div class="order-item" @click="go('/orders?status=RETURNS')">
            <RotateCcw class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>المنتجات<br>المسترجعة</span>
          </div>
        </div>
      </section>

      <!-- More Services -->
      <section class="section-block">
        <div class="section-header-row">
          <span class="section-title">المزيد من الخدمات</span>
        </div>
        <div class="services-grid">
          <div class="service-item">
            <Headphones class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>خدمة العملاء</span>
          </div>
          <div class="service-item">
            <div class="relative">
              <FileText class="w-6 h-6 text-[#8a1538] mb-2" />
              <div class="badge-dot"></div>
            </div>
            <span>مركز إستطلاعات<br>الرأي</span>
          </div>
          <div class="service-item">
            <Megaphone class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>شركاء</span>
          </div>
          <div class="service-item">
            <Store class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>متابع</span>
          </div>
          <div class="service-item" @click="go('/settings#info-section')">
            <ShieldCheck class="w-6 h-6 text-[#8a1538] mb-2" />
            <span>سياسة</span>
          </div>
        </div>
      </section>

      <!-- Bottom Tabs (Recently Viewed / Wishlist) -->
      <section class="bottom-tabs-section">
        <div class="tabs-header">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'wishlist' }" 
            @click="activeTab = 'wishlist'"
          >
            قائمة الأماني
            <div class="active-line" v-if="activeTab === 'wishlist'"></div>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'recent' }" 
            @click="activeTab = 'recent'"
          >
            شوهد مؤخراً
            <div class="active-line" v-if="activeTab === 'recent'"></div>
          </button>
        </div>

        <div class="tab-content px-1 pb-1">
          <!-- Wishlist Tab -->
          <div v-if="activeTab === 'wishlist'">
            <div v-if="wishlist.count > 0" class="product-grid grid grid-cols-2 gap-x-[5px] gap-y-0 grid-flow-row-dense">
              <!-- Left Column -->
              <div>
                <div v-for="(p, i) in wishlistLeft" :key="p.id" class="mb-[6px]">
                  <ProductGridCard
                    class="border-t-0 border-b-0 border-l-0"
                    :product="{
                      id: p.id,
                      title: p.title,
                      images: (p as any).images || [p.img],
                      colorThumbs: (p as any).colorThumbs,
                      colors: (p as any).colors,
                      basePrice: String(p.price||0),
                      discountPercent: p.discountPercent,
                      brand: p.brand,
                      soldPlus: p.soldPlus ? String(p.soldPlus) : undefined,
                      couponPrice: p.couponPrice ? String(p.couponPrice) : undefined,
                      categoryId: (p as any).categoryId,
                      categoryIds: Array.isArray((p as any).categoryIds) ? (p as any).categoryIds : undefined,
                      overlayBannerSrc: p.overlayBannerSrc,
                      overlayBannerAlt: p.overlayBannerAlt
                    }"
                    :ratio="(p as any)._ratio || defaultRatio"
                    @add="openSuggestOptions"
                  />
                </div>
              </div>
              <!-- Right Column -->
              <div>
                <div v-for="(p, i) in wishlistRight" :key="p.id" class="mb-[6px]">
                  <ProductGridCard
                    class="border-t-0 border-b-0 border-l-0"
                    :product="{
                      id: p.id,
                      title: p.title,
                      images: (p as any).images || [p.img],
                      colorThumbs: (p as any).colorThumbs,
                      colors: (p as any).colors,
                      basePrice: String(p.price||0),
                      discountPercent: p.discountPercent,
                      brand: p.brand,
                      soldPlus: p.soldPlus ? String(p.soldPlus) : undefined,
                      couponPrice: p.couponPrice ? String(p.couponPrice) : undefined,
                      categoryId: (p as any).categoryId,
                      categoryIds: Array.isArray((p as any).categoryIds) ? (p as any).categoryIds : undefined,
                      overlayBannerSrc: p.overlayBannerSrc,
                      overlayBannerAlt: p.overlayBannerAlt
                    }"
                    :ratio="(p as any)._ratio || defaultRatio"
                    @add="openSuggestOptions"
                  />
                </div>
              </div>
            </div>
            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <div class="w-16 h-16 bg-[#8a1538]" style="-webkit-mask-image: url(https://img.icons8.com/ios/100/clothes.png); mask-image: url(https://img.icons8.com/ios/100/clothes.png); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center;"></div>
              </div>
              <p>لم تقم بحفظ أي شيء مؤخراً.</p>
              <button class="shop-btn" @click="go('/')">تسوق</button>
            </div>
          </div>

          <!-- Recently Viewed Tab -->
          <div v-else-if="activeTab === 'recent'">
            <div v-if="recent.count > 0" class="product-grid grid grid-cols-2 gap-x-[5px] gap-y-0 grid-flow-row-dense">
              <!-- Left Column -->
              <div>
                <div v-for="(p, i) in recentLeft" :key="p.id" class="mb-[6px]">
                  <ProductGridCard
                    class="border-t-0 border-b-0 border-l-0"
                    :product="{
                      id: p.id,
                      title: p.title,
                      images: (p as any).images || [p.img],
                      colorThumbs: (p as any).colorThumbs,
                      colors: (p as any).colors,
                      basePrice: String(p.price||0),
                      discountPercent: p.discountPercent,
                      brand: p.brand,
                      soldPlus: p.soldPlus ? String(p.soldPlus) : undefined,
                      couponPrice: p.couponPrice ? String(p.couponPrice) : undefined,
                      categoryId: (p as any).categoryId,
                      categoryIds: Array.isArray((p as any).categoryIds) ? (p as any).categoryIds : undefined,
                      overlayBannerSrc: p.overlayBannerSrc,
                      overlayBannerAlt: p.overlayBannerAlt
                    }"
                    :ratio="(p as any)._ratio || defaultRatio"
                    @add="openSuggestOptions"
                  />
                </div>
              </div>
              <!-- Right Column -->
              <div>
                <div v-for="(p, i) in recentRight" :key="p.id" class="mb-[6px]">
                  <ProductGridCard
                    class="border-t-0 border-b-0 border-l-0"
                    :product="{
                      id: p.id,
                      title: p.title,
                      images: (p as any).images || [p.img],
                      colorThumbs: (p as any).colorThumbs,
                      colors: (p as any).colors,
                      basePrice: String(p.price||0),
                      discountPercent: p.discountPercent,
                      brand: p.brand,
                      soldPlus: p.soldPlus ? String(p.soldPlus) : undefined,
                      couponPrice: p.couponPrice ? String(p.couponPrice) : undefined,
                      categoryId: (p as any).categoryId,
                      categoryIds: Array.isArray((p as any).categoryIds) ? (p as any).categoryIds : undefined,
                      overlayBannerSrc: p.overlayBannerSrc,
                      overlayBannerAlt: p.overlayBannerAlt
                    }"
                    :ratio="(p as any)._ratio || defaultRatio"
                    @add="openSuggestOptions"
                  />
                </div>
              </div>
            </div>
            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <div class="w-16 h-16 bg-[#8a1538]" style="-webkit-mask-image: url(https://img.icons8.com/ios/100/clothes.png); mask-image: url(https://img.icons8.com/ios/100/clothes.png); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center;"></div>
              </div>
              <p>ليس لديك سجل تصفح بعد</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- إشعار: يرجى تحديد الخيارات -->
    <Transition name="fade">
      <div v-if="requireOptionsNotice" class="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div class="bg-black/80 text-white text-[13px] px-4 py-2.5 rounded-md shadow-lg">يرجى تحديد الخيارات</div>
      </div>
    </Transition>

    <!-- نافذة خيارات المنتج للإضافة للسلة -->
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

    <!-- Toast -->
    <div 
      v-if="toast" 
      class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2"
    >
      <span>✓</span>
      <span>{{ toastText }}</span>
    </div>

    <div class="h-20"></div>

    <BottomNav active="account" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/store/user'
import { useWishlist } from '@/store/wishlist'
import { useRecent } from '@/store/recent'
import { useCart } from '@/store/cart'
import { apiGet, API_BASE } from '@/lib/api'
import { buildThumbUrl } from '@/lib/media'
import BottomNav from '@/components/BottomNav.vue'
import ProductGridCard from '@/components/ProductGridCard.vue'
import ProductOptionsModal from '@/components/ProductOptionsModal.vue'
import { 
  Settings, MessageSquare, ChevronLeft, Gift, CreditCard, X, 
  Package, Truck, RotateCcw, Headphones, FileText, Megaphone, 
  Store, ShieldCheck, Heart, History
} from 'lucide-vue-next'

const router = useRouter()
const user = useUser()
const wishlist = useWishlist()
const recent = useRecent()
const cart = useCart()
const activeTab = ref('wishlist')
const couponsCount = ref(0)

const username = computed(() => user.username || 'jeeey')

// --- Dynamic Aspect Ratio Logic (from MasonryForYouBlock) ---
const defaultRatio = 1.3

function thumbSrc(p:any, w:number): string {
  const u = (Array.isArray(p.images)&&p.images[0]) || p.img || p.image || ''
  return buildThumbUrl(String(u||''), w, 60)
}

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

// Watchers to calculate ratios when items change
watch(() => wishlist.items, (items) => {
  items.forEach(p => probeRatioPromise(p))
  hydrateCouponsAndPrices(items)
}, { immediate: true, deep: true })

watch(() => recent.list, (items) => {
  items.forEach(p => probeRatioPromise(p))
  hydrateCouponsAndPrices(items)
}, { immediate: true, deep: true })

// Split logic for 2-column grid
const wishlistLeft = computed(() => wishlist.items.filter((_, i) => i % 2 === 0))
const wishlistRight = computed(() => wishlist.items.filter((_, i) => i % 2 === 1))

const recentLeft = computed(() => recent.list.filter((_, i) => i % 2 === 0))
const recentRight = computed(() => recent.list.filter((_, i) => i % 2 === 1))

function go(path: string) {
  // Protected routes that require login
  const protectedRoutes = ['/coupons', '/wallet', '/points', '/giftcards', '/orders']
  const isProtected = protectedRoutes.some(p => path.startsWith(p))

  if (isProtected && !user.isLoggedIn) {
    const ret = (typeof window !== 'undefined') ? (location.pathname + location.search) : '/account'
    router.push({ path: '/login', query: { return: ret } })
    return
  }
  
  router.push(path)
}

function goToSettings() {
  router.push('/settings')
}

function loginNow() {
  router.push('/login')
}

function joinClub() {
  // Handle club join
  console.log('Join club')
}

const showCouponStrip = ref(true)

function closeCouponStrip() {
  showCouponStrip.value = false
}

// Options modal logic (same UX as homepage/category)
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
        // Add directly
        const wItem = wishlist.items.find(i => i.id === id)
        const rItem = recent.items.find(i => i.id === id)
        const p = wItem || rItem
        if (p){ 
          cart.add({ 
            id: String(p.id), 
            title: String(p.title), 
            price: Number(String(p.price||'0').replace(/[^0-9.]/g,''))||0, 
            img: (Array.isArray((p as any).images)&&(p as any).images[0]) || p.img || '/images/placeholder-product.jpg',
            variantColor: undefined,
            variantSize: undefined
          }, 1); 
          showToast() 
        }
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

// ===== Coupon Hydration Logic =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])
const couponsCacheTs = ref(0)

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const { isAuthenticated } = await import('@/lib/api')
  if (!isAuthenticated()) return []
  try{
    const res = await apiGet<any>('/api/me/coupons')
    const items = Array.isArray(res?.items) ? res.items : []
    const coupons = Array.isArray(res?.coupons) ? res.coupons : []
    const list = [...items, ...coupons]
    return normalizeCoupons(list)
  }catch{ return [] }
}

function normalizeCoupons(list:any[]): SimpleCoupon[] {
  return (list||[]).map((c:any)=> ({
    code: c.code,
    discountType: (String(c.discountType||'PERCENTAGE').toUpperCase()==='FIXED' ? 'FIXED' : 'PERCENTAGE'),
    discountValue: Number(c.discountValue||c.discount||0),
    audience: c.audience?.target || c.audience || undefined,
    kind: c.kind || undefined,
    rules: { includes: c.includes || c.rules?.includes || [], excludes: c.excludes || c.rules?.excludes || [], min: c.minOrderAmount || c.rules?.min }
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
  if (Array.isArray(prod?.categoryIds)) {
    prod.categoryIds.forEach((cid:string) => tokens.push(`category:${cid}`))
  }
  if (prod?.id) tokens.push(`product:${prod.id}`)
  if (prod?.brand) tokens.push(`brand:${prod.brand}`)
  if (prod?.sku) tokens.push(`sku:${prod.sku}`)
  const hasInc = !inc.length || inc.some(t=> tokens.includes(t))
  const hasExc = exc.length && exc.some(t=> tokens.includes(t))
  return hasInc && !hasExc
}

async function ensureProductMeta(p:any): Promise<any> {
  if (p.categoryId!=null && Array.isArray(p.categoryIds)) return p
  try{
    const d = await apiGet<any>(`/api/product/${encodeURIComponent(p.id)}`)
    if (d){ 
      p.categoryId = d.categoryId || d.category?.id || d.category || null; 
      p.brand = p.brand || d.brand; 
      p.sku = p.sku || d.sku;
      if (Array.isArray(d.categoryIds)) p.categoryIds = d.categoryIds.map(String)
      else if (p.categoryId) p.categoryIds = [String(p.categoryId)]
    }
  }catch{}
  return p
}

async function hydrateCouponsAndPrices(list: any[]){
  try{
    const now = Date.now()
    if (!couponsCache.value.length || (now - couponsCacheTs.value) > 60000){
      couponsCache.value = await fetchCouponsList(); couponsCacheTs.value = now
    }
  }catch{}
  
  const cups = couponsCache.value||[]
  if (!cups.length) return

  for (const p of list){
    const base = Number(String(p.price||'0').replace(/[^0-9.]/g,''))||0
    if (!base) { p.couponPrice = undefined; continue }
    
    await ensureProductMeta(p)

    const site = cups.find(isCouponSitewide)
    if (site){
      if (eligibleByTokens(p, site)){
        p.couponPrice = priceAfterCoupon(base, site).toFixed(2)
      }
      continue
    }

    const match = cups.find(c=> eligibleByTokens(p, c))
    if (match){ p.couponPrice = priceAfterCoupon(base, match).toFixed(2) }
  }
}

onMounted(async () => {
  // Check auth state on mount to ensure UI reflects login status
  user.checkAuth()
  // Sync wishlist if logged in
  if (user.isLoggedIn) {
    wishlist.sync()
    // Fetch coupons (owned/eligible)
    try {
      const res = await apiGet<any>('/api/me/coupons')
      const items = Array.isArray(res?.items) ? res.items : []
      const coupons = Array.isArray(res?.coupons) ? res.coupons : []
      const list = [...items, ...coupons]
      if (Array.isArray(list)) {
        // Filter for valid (unused/not expired) coupons to match Coupons page logic
        const now = Date.now()
        const validCoupons = list.filter((c: any) => {
          const validUntil = c?.validUntil ? new Date(c.validUntil).getTime() : null
          // If no expiry, assume valid. If expiry, must be in future.
          // Also check if status is explicitly 'used' if API provides it
          const isExpired = validUntil ? validUntil < now : false
          const isUsed = c?.status === 'used'
          return !isExpired && !isUsed
        })
        couponsCount.value = validCoupons.length
      }
    } catch (e) {
      console.error('Failed to fetch coupons', e)
    }
  }
  // Sync recent items (for both guest and logged-in)
  recent.sync()
})
</script>

<style scoped>
.product-grid{column-gap:5px!important;row-gap:0!important}

.account-page {
  background-color: #F7F8FA;
  min-height: 100vh;
  font-family: 'DIN Next LT Arabic', sans-serif;
}

/* Header */
.account-header {
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.icon-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crown-badge {
  background: #CCCCCC; /* Silver/Grey for S0 */
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: bold;
}

.username {
  font-weight: bold;
  font-size: 16px;
  color: #000;
}

.guest-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.login-text {
  font-weight: bold;
  font-size: 16px;
  color: #520f23;
}

/* Content */
.account-content {
  padding-inline: 12px;
  padding-block: 12px;
}

/* Club Card */
.club-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
}

.club-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.club-logo {
  font-weight: bold;
  color: #8B5D33; /* Bronze/Gold tone */
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.club-icon {
  border: 1px solid #8B5D33;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.club-status {
  font-size: 12px;
  color: #333;
}

.club-subtitle {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.club-benefits {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.benefit-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #FFFBF8;
  padding: 8px 4px;
  border-radius: 4px;
}

.benefit-divider {
  width: 1px;
  background: #eee;
  margin: 0 4px;
}

.benefit-val {
  font-size: 18px;
  font-weight: bold;
  color: #000;
}

.benefit-tag {
  font-size: 10px;
  color: #FF5722;
  background: #FFEBE6;
  padding: 1px 4px;
  border-radius: 2px;
  margin-bottom: 2px;
  align-self: flex-end; /* Position like the image */
  margin-right: 8px;
}

.benefit-desc {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.join-btn {
  width: 100%;
  background: #FFF0E5;
  color: #D86E34;
  border: none;
  padding: 10px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
  cursor: pointer;
}

.price {
  font-weight: 800;
}

.old-price {
  font-weight: normal;
  text-decoration: line-through;
  font-size: 11px;
  margin-right: 4px;
}

/* Stats Container */
.stats-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px 12px;
  margin-bottom: 12px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex: 1;
}

.stat-val {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #520f23;
}

/* Coupon Strip */
.coupon-strip {
  background: #FFF8E1;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #333;
  position: relative;
}

.coupon-strip::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 12%; /* Align with Coupons item roughly */
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #FFF8E1;
}

.red-text {
  color: #FF5722;
  font-weight: bold;
}

.close-strip {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* Section Block */
.section-block {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
}

.section-title {
  font-weight: bold;
  font-size: 14px;
  color: #520f23;
}

.section-more {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8a1538;
  opacity: 0.6;
}

/* Orders & Services Grid */
.orders-grid, .services-grid {
  display: flex;
  justify-content: space-between;
  text-align: center;
}

.order-item, .service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex: 1;
}

.order-item span, .service-item span {
  font-size: 11px;
  color: #520f23;
  line-height: 1.3;
}

.badge-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  background: #FF5722;
  border-radius: 50%;
  border: 1px solid #fff;
}

/* Bottom Tabs */
.bottom-tabs-section {
  margin-top: 20px;
  background: transparent !important;
  margin-inline: -12px; /* Compensate for parent padding */
}

.tabs-header {
  display: flex;
  background: #fff !important;
  border-bottom: 1px solid #e5e7eb; /* Visible gray separator */
  padding-bottom: 12px; /* Increased internal bottom spacing */
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  font-size: 14px;
  color: #8a1538;
  opacity: 0.6;
  font-weight: bold;
  padding: 12px 0;
  position: relative;
  cursor: pointer;
  text-align: center;
}

.tab-btn.active {
  color: #8a1538;
  opacity: 1;
}

.active-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #8a1538;
  border-radius: 2px;
}



.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #8a1538;
  font-size: 14px;
}

.empty-state .empty-icon,
.empty-state p {
  opacity: 0.6;
}

.empty-icon {
  margin-bottom: 16px;
}

.shop-btn {
  margin-top: 16px;
  padding: 10px 32px;
  background: transparent;
  border: 1px solid #8a1538;
  border-radius: 20px;
  color: #8a1538;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shop-btn:hover {
  background: #8a1538;
  color: #fff;
}
</style>