<template>
  <div class="home-root" dir="rtl">
    <style>
      .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .snap-x-start { scroll-snap-type: x mandatory; }
      .snap-item { scroll-snap-align: start; }
    </style>

    <div class="header" :class="{ scrolled }" aria-label="رأس الصفحة">
      <div class="maxwrap header-inner">
        <div class="header-left">
          <button class="icon-btn" aria-label="القائمة" @click="go('/categories')"><Menu :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
          <button class="icon-btn" aria-label="الإشعارات" @click="go('/notifications')"><Bell :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
        </div>
        <div class="logo" :class="{ dark: scrolled }" aria-label="شعار المتجر">jeeey</div>
        <div class="header-right">
          <button class="icon-btn" aria-label="السلة" @click="go('/cart')"><ShoppingCart :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
          <button class="icon-btn" aria-label="المفضلة" @click="go('/products?wish=1')"><Heart :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
          <button class="icon-btn" aria-label="البحث" @click="go('/search')"><Search :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
        </div>
      </div>
    </div>

    <div class="tabsbar" :class="{ scrolled }" :style="{ top: headerH + 'px' }" role="tablist" aria-label="التبويبات">
      <div ref="tabsRef" class="maxwrap tabswrap no-scrollbar" @keydown="onTabsKeyDown">
        <button v-for="(t,i) in tabs" :key="t" role="tab" :aria-selected="activeTab===i" tabindex="0" @click="activeTab=i" class="tabbtn" :class="{ active: activeTab===i, dark: scrolled }">
          {{ t }}
          <span class="tab-underline" :class="{ on: activeTab===i, dark: scrolled }" />
        </button>
      </div>
    </div>

    <div class="maxwrap">
      <div class="banner">
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60"
          srcset="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60&fm=webp 1200w, https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=2400&q=60&fm=webp 2400w"
          alt="عرض تخفيضات" class="banner-img" loading="eager" />
        <div class="banner-overlay" />
        <div class="banner-text">
          <div class="banner-sub">احتفالنا الأكبر على الإطلاق</div>
          <div class="banner-title">خصم يصل حتى 90%</div>
          <button class="btn" aria-label="تسوّق الآن" @click="go('/products')">تسوّق الآن</button>
        </div>
      </div>
    </div>

    <div class="maxwrap padX padY">
      <div class="card">
        <div class="row between center gap2">
          <div class="text12 bold green7">قسائم خصم إضافية</div>
          <div class="row gap2 overflow no-scrollbar">
            <div class="coupon"><div class="coupon-title">-15%</div><div class="coupon-code">SDA15</div></div>
            <div class="coupon"><div class="coupon-title">-16%</div><div class="coupon-code">SDA16</div></div>
            <div class="coupon"><div class="coupon-title">-18%</div><div class="coupon-code">SDA18</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="maxwrap">
      <div class="strip">
        <div class="hscroll no-scrollbar snap-x-start gap2" aria-label="عروض">
          <div v-for="p in promoTiles" :key="p.title" class="tile snap-item" :style="{ backgroundColor: p.bg }">
            <img :src="p.image" :alt="p.title" class="tile-img" loading="lazy" />
            <div class="tile-text">
              <div class="text12 bold text900">{{ p.title }}</div>
              <div class="text11 text600">{{ p.sub }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="padX">
        <div class="midpromo">
          <img :src="midPromo.image" :alt="midPromo.alt" class="mid-img" loading="lazy" />
          <div class="mid-overlay" />
          <div class="mid-text">{{ midPromo.text }}</div>
        </div>
      </div>

      <section class="padX padY" aria-label="الفئات">
        <h2 class="h2">الفئات</h2>
        <div v-for="(row,idx) in catRows" :key="idx" class="hscroll no-scrollbar snap-x-start mb2">
          <div class="row gap3">
            <button v-for="c in row" :key="c.name + idx" class="catbtn snap-item" :aria-label="'فئة ' + c.name" @click="go('/products?category='+encodeURIComponent(c.name))">
              <div class="catimg-wrap"><img :src="c.image" :alt="c.name" class="catimg" loading="lazy" /></div>
              <div class="catname">{{ c.name }}</div>
            </button>
          </div>
        </div>
      </section>

      <section class="padX padY" aria-label="الأكثر مبيعاً">
        <h2 class="h2">الأكثر مبيعاً</h2>
        <div class="hscroll no-scrollbar row gap3">
          <div v-for="p in bestSellers" :key="p.title" class="prodcard">
            <div class="prodimg-wrap">
              <img :src="p.image" :alt="p.title" class="prodimg" loading="lazy" />
              <button class="favbtn" aria-label="أضف إلى المفضلة" @click="toggleWish(p)"><Heart :size="16" :color="hasWish(p)? '#ef4444':'#111'" :fill="hasWish(p)? '#ef4444':'transparent'"/></button>
              <span v-if="p.coupon" class="coupon-badge">{{ p.coupon }}</span>
            </div>
            <div class="info">
              <div class="brand">{{ p.brand }}</div>
              <div class="title clamp2">{{ p.title }}</div>
              <div class="row center gap1 rating">
                <Star :size="12" color="#eab308" :fill="'#eab308'" aria-hidden="true" />
                <span class="text11 text700">{{ p.rating.toFixed(1) }}</span>
                <span class="text11 text600">({{ p.reviews.toLocaleString() }})</span>
              </div>
              <div class="row center gap2 price">
                <span class="price-new">{{ p.price }}</span>
              </div>
              <div class="swatches">
                <span class="sw" style="background:#000"></span>
                <span class="sw" style="background:#c69c6d"></span>
                <span class="sw" style="background:#fff;border:1px solid #d1d5db"></span>
              </div>
              <div class="badges">
                <span class="badge">شحن مجاني</span>
                <span class="badge">الدفع عند الاستلام</span>
              </div>
              <button class="mini-btn" aria-label="إضافة سريعة للسلة" @click="quickAdd(p)"><ShoppingCart :size="12"/> أضف</button>
            </div>
          </div>
        </div>
      </section>

      <section class="padX padY" aria-label="الرائج الآن">
        <h2 class="h2">الرائج الآن</h2>
        <div class="hscroll no-scrollbar row gap3">
          <div v-for="p in trendingNow" :key="p.title" class="gridcard" @click="openProduct(p)" aria-label="منتج">
            <div class="gridimg-wrap"><img :src="p.image" :alt="p.title" class="gridimg" loading="lazy" /></div>
            <div class="ginfo">
              <div class="brand">{{ p.brand }}</div>
              <div class="title clamp2">{{ p.title }}</div>
              <div class="row center gap1 rating">
                <Star :size="12" color="#eab308" :fill="'#eab308'" />
                <span class="text11 text700">{{ p.rating.toFixed(1) }}</span>
                <span class="text11 text600">({{ p.reviews.toLocaleString() }})</span>
              </div>
              <div class="row center gap2 price">
                <span class="price-new">{{ p.price }}</span>
                <span v-if="p.oldPrice" class="price-old">{{ p.oldPrice }}</span>
              </div>
              <div class="swatches">
                <span class="sw" style="background:#000"></span>
                <span class="sw" style="background:#c69c6d"></span>
                <span class="sw" style="background:#fff;border:1px solid #d1d5db"></span>
              </div>
              <div class="badges">
                <span class="badge">شحن مجاني</span>
                <span class="badge">الدفع عند الاستلام</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="padX padY" aria-label="من أجلك">
        <h2 class="h2">من أجلك</h2>
        <div class="grid2 gap3">
          <div v-for="p in forYou" :key="p.title" class="gridcard" @click="openProduct(p)">
            <div class="gridimg-wrap"><img :src="p.image" :alt="p.title" class="gridimg" loading="lazy" /></div>
            <div class="ginfo">
              <div class="brand">{{ p.brand }}</div>
              <div class="title clamp2">{{ p.title }}</div>
              <div class="row center gap1 rating">
                <span class="text11 text700">{{ p.rating.toFixed(1) }}</span>
                <span class="text11 text600">({{ p.reviews.toLocaleString() }})</span>
              </div>
              <div class="row center gap2 price">
                <span class="price-new">{{ p.price }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style="height:80px" />
    </div>

    <nav class="bottomnav" aria-label="التنقل السفلي">
      <div class="maxwrap navwrap" dir="rtl">
        <button class="navbtn active" aria-label="الرئيسية" @click="go('/')"><Home :size="24" class="mx-auto mb-1" /><div class="navtext">الرئيسية</div></button>
        <button class="navbtn" aria-label="الفئات" @click="go('/categories')"><LayoutGrid :size="24" class="mx-auto mb-1" /><div class="navtext">الفئات</div></button>
        <button class="navbtn" aria-label="جديد/بحث" @click="go('/search')"><Search :size="24" class="mx-auto mb-1" /><div class="navtext">جديد</div></button>
        <button class="navbtn" aria-label="الحقيبة" @click="go('/cart')"><div class="cart-icon"><ShoppingBag :size="24" class="mx-auto mb-1" /><span v-if="cart.count>0" class="badge-count">{{ cart.count }}</span></div><div class="navtext">الحقيبة</div></button>
        <button class="navbtn" aria-label="حسابي" @click="go('/login')"><User :size="24" class="mx-auto mb-1" /><div class="navtext">حسابي</div></button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/lib/api'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { Menu, Bell, ShoppingCart, Heart, Search, ShoppingBag, Star, LayoutGrid, User, Home } from 'lucide-vue-next'

const router = useRouter()
const cart = useCart()
const wishlist = useWishlist()

const scrolled = ref(false)
const activeTab = ref(0)
const tabs = ['كل','نساء','رجال','أطفال','أحجام كبيرة','جمال','المنزل','أحذية','فساتين']
const tabsRef = ref<HTMLDivElement|null>(null)
const headerH = computed(()=> scrolled.value ? 48 : 64)

function go(path: string){ router.push(path) }
function onScroll(){ scrolled.value = window.scrollY > 60 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive: true }) })
function onTabsKeyDown(e: KeyboardEvent){
  if (e.key === 'ArrowRight') activeTab.value = Math.min(activeTab.value + 1, tabs.length - 1)
  if (e.key === 'ArrowLeft') activeTab.value = Math.max(activeTab.value - 1, 0)
  const el = tabsRef.value?.children[activeTab.value] as HTMLElement | undefined
  el?.scrollIntoView({ inline: 'center', behavior: 'smooth' })
}

type Prod = { id?: string; title: string; image: string; price: string; oldPrice?: string; rating: number; reviews: number; brand?: string; coupon?: string }
type Cat = { name: string; image: string }

const promoTiles = reactive([
  { title: 'شحن مجاني', sub: 'للطلبات فوق 99 ر.س', image: 'https://csspicker.dev/api/image/?q=free+shipping+icon&image_type=photo', bg: '#ffffff' },
  { title: 'خصم 90%', sub: 'لفترة محدودة', image: 'https://csspicker.dev/api/image/?q=sale+tag&image_type=photo', bg: '#fff6f1' },
  { title: 'الدفع عند الاستلام', sub: 'متاح لمدن مختارة', image: 'https://csspicker.dev/api/image/?q=cod+payment&image_type=photo', bg: '#f7faff' },
  { title: 'نقاط ومكافآت', sub: 'اكسب مع كل شراء', image: 'https://csspicker.dev/api/image/?q=reward+points&image_type=photo', bg: '#f9f9ff' },
  { title: 'خصم الطلاب', sub: 'تحقق من الأهلية', image: 'https://csspicker.dev/api/image/?q=student+discount&image_type=photo', bg: '#fffaf3' },
  { title: 'عروض اليوم', sub: 'لا تفوّت الفرصة', image: 'https://csspicker.dev/api/image/?q=deal+of+the+day&image_type=photo', bg: '#f5fffb' },
])
const midPromo = reactive({ image: 'https://images.unsplash.com/photo-1512203492609-8b0f0b52f483?w=1600&q=60', alt: 'عرض منتصف الصفحة', text: 'قسائم إضافية + شحن مجاني' })

const categories = ref<Cat[]>([])
const bestSellers = ref<Prod[]>([])
const trendingNow = ref<Prod[]>([])
const forYou = ref<Prod[]>([])

function parsePrice(s: string): number { const n = Number(String(s).replace(/[^0-9.]/g,'')); return isFinite(n)? n : 0 }
function toProd(p:any): Prod { return { id: p.id, title: p.name||p.title, image: p.images?.[0]||p.image, price: (p.price!=null? p.price : p.priceMin||0) + ' ر.س', oldPrice: p.original? (p.original+' ر.س'): undefined, rating: Number(p.rating||4.6), reviews: Number(p.reviews||0), brand: p.brand||'SHEIN' } }

onMounted(async ()=>{
  const cats = await apiGet<any>('/api/categories?limit=15')
  categories.value = Array.isArray(cats?.items) ? cats.items.map((c:any)=> ({ name: c.name||c.title, image: c.image||`https://csspicker.dev/api/image/?q=${encodeURIComponent(c.name||'fashion')}&image_type=photo` })) : []
  if (!categories.value.length){
    categories.value = [
      { name: 'فساتين', image: 'https://csspicker.dev/api/image/?q=dress&image_type=photo' },
      { name: 'أحذية', image: 'https://csspicker.dev/api/image/?q=shoes+footwear&image_type=photo' },
      { name: 'حقائب', image: 'https://csspicker.dev/api/image/?q=handbag&image_type=photo' },
      { name: 'ملابس رياضية', image: 'https://csspicker.dev/api/image/?q=sportswear&image_type=photo' },
      { name: 'إكسسوارات', image: 'https://csspicker.dev/api/image/?q=fashion+accessories&image_type=photo' },
      { name: 'مجوهرات', image: 'https://csspicker.dev/api/image/?q=jewelry&image_type=photo' },
      { name: 'أزياء نسائية', image: 'https://csspicker.dev/api/image/?q=women+fashion&image_type=photo' },
      { name: 'أزياء رجالية', image: 'https://csspicker.dev/api/image/?q=men+fashion&image_type=photo' },
      { name: 'أزياء الأطفال', image: 'https://csspicker.dev/api/image/?q=kids+fashion&image_type=photo' },
      { name: 'جمال وصحة', image: 'https://csspicker.dev/api/image/?q=beauty+cosmetics&image_type=photo' },
      { name: 'منزل وحديقة', image: 'https://csspicker.dev/api/image/?q=home+garden&image_type=photo' },
      { name: 'بلوزات', image: 'https://csspicker.dev/api/image/?q=blouse&image_type=photo' },
      { name: 'تنورات', image: 'https://csspicker.dev/api/image/?q=skirt&image_type=photo' },
      { name: 'معاطف', image: 'https://csspicker.dev/api/image/?q=coat&image_type=photo' },
      { name: 'جينز', image: 'https://csspicker.dev/api/image/?q=jeans&image_type=photo' }
    ]
  }

  const bs = await apiGet<any>('/api/products?sort=best&limit=12')
  bestSellers.value = Array.isArray(bs?.items) ? bs.items.map(toProd) : [
    { title:'MOTF Premium Collection — فستان أسود', image:'https://csspicker.dev/api/image/?q=black+midi+dress&image_type=photo', price:'179.00 ر.س', rating:4.8, reviews:1260, brand:'SHEIN' },
    { title:'فستان بني راقٍ', image:'https://csspicker.dev/api/image/?q=brown+dress+model&image_type=photo', price:'179.00 ر.س', rating:4.7, reviews:980, brand:'MOTF' },
    { title:'فستان أبيض كلاسيكي', image:'https://csspicker.dev/api/image/?q=white+dress&image_type=photo', price:'179.00 ر.س', rating:4.7, reviews:1120, brand:'SHEIN' },
    { title:'فستان بلا أكمام أسود', image:'https://csspicker.dev/api/image/?q=black+sleeveless+dress&image_type=photo', price:'179.00 ر.س', rating:4.6, reviews:870, brand:'SHEIN' },
  ]

  const tr = await apiGet<any>('/api/products?sort=trending&limit=12')
  trendingNow.value = Array.isArray(tr?.items) ? tr.items.map((p:any)=> ({ ...toProd(p), oldPrice: p.original? (p.original+' ر.س'): undefined, coupon: p.discountPercent? `-${p.discountPercent}%`: undefined })) : [
    { title:'تنورة كاجوال', image:'https://csspicker.dev/api/image/?q=beige+skirt&image_type=photo', price:'95.00 ر.س', oldPrice:'129.00 ر.س', rating:4.5, reviews:640, coupon:'-25%', brand:'SHEIN' },
    { title:'بلوزة وردية', image:'https://csspicker.dev/api/image/?q=pink+top&image_type=photo', price:'48.00 ر.س', rating:4.6, reviews:720, brand:'SHEIN' },
    { title:'تنورة سوداء', image:'https://csspicker.dev/api/image/?q=black+skirt&image_type=photo', price:'66.00 ر.س', rating:4.4, reviews:410, brand:'SHEIN' },
    { title:'بلوزة بيضاء', image:'https://csspicker.dev/api/image/?q=white+blouse&image_type=photo', price:'95.00 ر.س', rating:4.5, reviews:520, brand:'SHEIN' },
  ]

  const fy = await apiGet<any>('/api/products?sort=reco&limit=8')
  forYou.value = Array.isArray(fy?.items) ? fy.items.map(toProd) : [
    { title:'فستان أبيض أنيق', image:'https://csspicker.dev/api/image/?q=white+summer+dress&image_type=photo', price:'159.00 ر.س', rating:4.6, reviews:440, brand:'SHEIN' },
    { title:'بلوزة سوداء كلاسيكية', image:'https://csspicker.dev/api/image/?q=black+blouse&image_type=photo', price:'79.00 ر.س', rating:4.5, reviews:350, brand:'SHEIN' },
    { title:'تنورة بنية متوسطة', image:'https://csspicker.dev/api/image/?q=brown+skirt&image_type=photo', price:'99.00 ر.س', rating:4.4, reviews:220, brand:'SHEIN' },
    { title:'قميص رجالي بسيط', image:'https://csspicker.dev/api/image/?q=men+white+shirt&image_type=photo', price:'69.00 ر.س', rating:4.3, reviews:310, brand:'SHEIN' },
    { title:'حقيبة يد جلدية', image:'https://csspicker.dev/api/image/?q=leather+handbag&image_type=photo', price:'129.00 ر.س', rating:4.7, reviews:590, brand:'SHEIN' },
    { title:'حذاء رياضي أبيض', image:'https://csspicker.dev/api/image/?q=white+sneakers&image_type=photo', price:'139.00 ر.س', rating:4.6, reviews:760, brand:'SHEIN' },
    { title:'عقد ذهبي رفيع', image:'https://csspicker.dev/api/image/?q=gold+necklace&image_type=photo', price:'49.00 ر.س', rating:4.4, reviews:180, brand:'SHEIN' },
    { title:'تنورة سوداء قصيرة', image:'https://csspicker.dev/api/image/?q=short+black+skirt&image_type=photo', price:'89.00 ر.س', rating:4.5, reviews:410, brand:'SHEIN' },
  ]
})

const rows = 3
const catRows = computed(()=>{
  const perRow = Math.ceil((categories.value?.length||0) / rows) || 1
  return Array.from({ length: rows }, (_, i) => categories.value.slice(i * perRow, (i + 1) * perRow))
})

function hasWish(p: Prod){ return wishlist.has(p.id || p.title) }
function toggleWish(p: Prod){ const id = p.id || p.title; wishlist.toggle({ id, title: p.title, price: parsePrice(p.price), img: p.image }) }
function quickAdd(p: Prod){ const id = p.id || p.title; cart.add({ id, title: p.title, price: parsePrice(p.price), img: p.image }, 1) }
function openProduct(p: Prod){ const id = p.id || ''; if (id) router.push(`/products?id=${encodeURIComponent(id)}`) }
</script>

<style scoped>
.home-root{min-height:100vh;background:#f7f7f7}
.maxwrap{max-width:768px;margin:0 auto}
.padX{padding-inline:12px}
.padY{padding-block:12px}
.mb2{margin-bottom:8px}
.gap1{gap:4px}
.gap2{gap:8px}
.gap3{gap:12px}
.row{display:flex}
.between{justify-content:space-between}
.center{align-items:center}
.overflow{overflow-x:auto}
.text11{font-size:11px}
.text12{font-size:12px}
.text600{color:#6b7280}
.text700{color:#374151}
.text900{color:#111827}
.bold{font-weight:600}
.green7{color:#047857}

.header{position:fixed;inset-inline:0;top:0;z-index:50;transition:all .2s;background:transparent;height:64px}
.header.scrolled{background:rgba(255,255,255,.95);backdrop-filter:saturate(1.2) blur(6px);height:48px}
.header-inner{height:100%;padding:0 12px;display:flex;align-items:center;justify-content:space-between}
.icon-btn{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer}
.logo{font-size:16px;font-weight:700;color:#fff}
.logo.dark{color:#111827}

.tabsbar{position:fixed;left:0;right:0;z-index:40;transition:background .2s}
.tabsbar.scrolled{background:rgba(255,255,255,.95)}
.tabswrap{display:flex;overflow-x:auto;padding:8px 12px;gap:16px}
.tabbtn{background:transparent;border:none;padding:0 0 4px 0;cursor:pointer;white-space:nowrap;font-size:14px;color:#fff}
.tabbtn.dark{color:#374151}
.tabbtn.active{font-weight:700;color:#111}
.tab-underline{position:absolute;left:0;right:0;bottom:-2px;height:2px;background:transparent;display:block}
.tab-underline.on{background:#000}
.tab-underline.on.dark{background:#000}

.banner{position:relative;width:100%;height:360px}
@media (min-width:640px){.banner{height:420px}}
.banner-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.banner-overlay{position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,.2), transparent)}
.banner-text{position:absolute;left:16px;right:16px;bottom:16px;color:#fff}
.banner-sub{font-size:12px;margin-bottom:4px}
.banner-title{font-size:32px;font-weight:800;line-height:1.1}
.btn{margin-top:8px;background:#fff;color:#000;padding:8px 12px;border-radius:4px;font-size:13px;font-weight:600;border:1px solid #e5e7eb}

.card{background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:12px}
.coupon{min-width:96px;text-align:center;padding:4px 8px;border-radius:4px;border:1px solid #86efac;background:#ecfdf5}
.coupon-title{font-size:11px;color:#047857;font-weight:700}
.coupon-code{font-size:10px;color:#065f46}

.strip{background:#fff;padding:12px}
.hscroll{display:flex;overflow-x:auto}
.tile{position:relative;width:192px;height:68px;flex-shrink:0;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;background:#fff}
.tile-img{position:absolute;right:0;top:0;width:64px;height:100%;object-fit:cover;opacity:.9}
.tile-text{position:absolute;inset:0;right:72px;left:8px;display:flex;flex-direction:column;justify-content:center}

.midpromo{width:100%;height:90px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;position:relative;background:#fff}
.mid-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mid-overlay{position:absolute;inset:0;background:rgba(0,0,0,.1)}
.mid-text{position:absolute;left:12px;right:12px;top:50%;transform:translateY(-50%);color:#fff;font-size:12px;font-weight:600}

.h2{font-size:14px;font-weight:700;color:#111827;margin:0 0 8px 0}
.catbtn{width:96px;flex-shrink:0;text-align:center;background:transparent;border:none;cursor:pointer}
.catimg-wrap{width:68px;height:68px;border:1px solid #e5e7eb;border-radius:999px;overflow:hidden;margin:0 auto 8px auto;background:#fff}
.catimg{width:100%;height:100%;object-fit:cover}
.catname{font-size:11px;color:#374151}

.prodcard{width:160px;flex-shrink:0}
.prodimg-wrap{position:relative;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;background:#fff}
.prodimg{width:100%;height:160px;object-fit:cover}
.favbtn{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb;cursor:pointer}
.coupon-badge{position:absolute;top:8px;left:8px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px}
.info{padding:6px 6px}
.brand{font-size:11px;color:#6b7280}
.title{font-size:12px;color:#111827}
.clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rating{margin-top:4px}
.price{margin-top:4px}
.price-new{color:#dc2626;font-weight:700;font-size:13px}
.price-old{color:#9ca3af;font-size:11px;text-decoration:line-through}
.mini-btn{margin-top:6px;display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#374151;padding:4px 8px;border:1px solid #d1d5db;border-radius:4px;background:#fff;cursor:pointer}
.swatches{margin-top:4px;display:flex;gap:6px;align-items:center}
.sw{width:12px;height:12px;border-radius:999px;display:inline-block}
.badges{margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.badge{display:inline-block;font-size:10px;color:#374151;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:2px 6px}

.grid2{display:grid;grid-template-columns:1fr 1fr}
.gridcard{cursor:pointer}
.gridimg-wrap{border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;background:#fff}
.gridimg{width:100%;aspect-ratio:3/4;object-fit:cover}
.ginfo{margin-top:6px}

.bottomnav{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e5e7eb;z-index:50}
.navwrap{display:flex;justify-content:space-around;padding:8px 0}
.navbtn{width:64px;text-align:center;background:transparent;border:none;cursor:pointer}
.navbtn.active .navtext{color:#111}
.navtext{font-size:11px;color:#374151}
.navicon{width:24px;height:24px;margin:0 auto 4px auto;background:#111;border-radius:4px;opacity:.9}
.cart-icon{position:relative;display:inline-block}
.badge-count{position:absolute;top:-4px;left:50%;transform:translateX(-20%);background:#ef4444;color:#fff;border-radius:999px;min-width:16px;height:16px;line-height:16px;font-size:10px;padding:0 4px;border:1px solid #fff}
</style>

