<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">

    <div class="header" :class="{ scrolled }" aria-label="رأس الصفحة">
        <div class="maxwrap header-inner">
          <div class="header-left row gap1">
          <button class="icon-btn" aria-label="القائمة" @click="go('/categories')"><Menu :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
          <button class="icon-btn" aria-label="الإشعارات" @click="go('/notifications')"><Bell :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
        </div>
        <div class="logo" :class="{ dark: scrolled }" aria-label="شعار المتجر">jeeey</div>
          <div class="header-right row gap1">
          <button class="icon-btn" aria-label="السلة" @click="go('/cart')"><ShoppingCart :color="scrolled? '#1f2937':'#ffffff'" :size="24" /></button>
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

    <div class="max-w-[768px] mx-auto">
      <div class="relative w-full h-[360px] sm:h-[420px]">
        <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60" alt="عرض تخفيضات" class="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
        <div class="absolute left-4 right-4 bottom-4 text-white">
          <div class="text-[12px] mb-1">احتفالنا الأكبر على الإطلاق</div>
          <div class="text-[32px] font-extrabold leading-tight">خصم يصل حتى 90%</div>
          <button class="mt-2 bg-white text-black px-3 py-2 rounded text-[13px] font-semibold border border-gray-200" aria-label="تسوّق الآن" @click="go('/products')">تسوّق الآن</button>
        </div>
      </div>
    </div>

    <div class="max-w-[768px] mx-auto px-3 py-3">
      <div class="bg-white border border-gray-200 rounded p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-[12px] font-semibold text-emerald-700">قسائم خصم إضافية</div>
          <div class="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div class="min-w-[96px] text-center px-2 py-1 rounded border border-emerald-300 bg-emerald-50">
              <div class="text-[11px] text-emerald-700 font-bold">-15%</div>
              <div class="text-[10px] text-emerald-800">SDA15</div>
            </div>
            <div class="min-w-[96px] text-center px-2 py-1 rounded border border-emerald-300 bg-emerald-50">
              <div class="text-[11px] text-emerald-700 font-bold">-16%</div>
              <div class="text-[10px] text-emerald-800">SDA16</div>
            </div>
            <div class="min-w-[96px] text-center px-2 py-1 rounded border border-emerald-300 bg-emerald-50">
              <div class="text-[11px] text-emerald-700 font-bold">-18%</div>
              <div class="text-[10px] text-emerald-800">SDA18</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-[768px] mx-auto">
      <div class="bg-white p-3">
        <div class="flex overflow-x-auto gap-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" aria-label="عروض">
          <div v-for="p in promoTiles" :key="p.title" class="relative w-[192px] h-[68px] flex-shrink-0 border border-gray-200 rounded overflow-hidden bg-white snap-start" :style="{ backgroundColor: p.bg }">
            <img :src="p.image" :alt="p.title" class="absolute right-0 top-0 w-16 h-full object-cover opacity-90" loading="lazy" />
            <div class="absolute inset-0 right-[72px] left-2 flex flex-col justify-center">
              <div class="text-[12px] font-semibold text-gray-900">{{ p.title }}</div>
              <div class="text-[11px] text-gray-600">{{ p.sub }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-3">
        <div class="w-full h-[90px] border border-gray-200 rounded overflow-hidden relative bg-white">
          <img :src="midPromo.image" :alt="midPromo.alt" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div class="absolute inset-0 bg-black/10" />
          <div class="absolute left-3 right-3 top-1/2 -translate-y-1/2 text-white text-[12px] font-semibold">{{ midPromo.text }}</div>
        </div>
      </div>

      <section class="px-3 py-3" aria-label="الفئات">
        <h2 class="text-[14px] font-bold text-gray-900 mb-2">الفئات</h2>
        <div class="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div class="flex gap-2 pb-0.5">
            <div v-for="(col,ci) in catCols" :key="'col-'+ci" class="flex flex-col gap-1">
              <button v-for="(c,ri) in col" :key="c.name + '-' + ci + '-' + ri" class="w-[96px] flex-shrink-0 text-center bg-transparent border-0" :aria-label="'فئة ' + c.name" @click="go('/products?category='+encodeURIComponent(c.name))">
                <div class="w-[68px] h-[68px] border border-gray-200 rounded-full overflow-hidden mx-auto mb-2 bg-white">
                  <img :src="c.image" :alt="c.name" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <div class="text-[11px] text-gray-700">{{ c.name }}</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="padX padY" aria-label="عروض كبرى">
        <h2 class="h2">عروض كبرى</h2>
        <div class="overflow no-scrollbar snap-x-start simple-row hscroll">
          <div class="simple-row-inner">
            <button v-for="(p,i) in bigDeals" :key="'deal-'+i" class="text-start snap-item simple-item" :aria-label="'منتج بسعر '+p.price">
              <div class="borderbox">
                <img :src="p.image" :alt="p.price" class="simple-img" loading="lazy" />
              </div>
              <div class="mt-1"><span class="price-red">{{ p.price }}</span></div>
            </button>
          </div>
        </div>
      </section>

      <section class="padX padY" aria-label="أهم الترندات">
        <h2 class="h2">أهم الترندات</h2>
        <div class="overflow no-scrollbar snap-x-start simple-row hscroll">
          <div class="simple-row-inner">
            <button v-for="(p,i) in hotTrends" :key="'trend-'+i" class="text-start snap-item simple-item" :aria-label="'منتج بسعر '+p.price">
              <div class="borderbox">
                <img :src="p.image" :alt="p.price" class="simple-img" loading="lazy" />
              </div>
              <div class="mt-1"><span class="price-red">{{ p.price }}</span></div>
            </button>
          </div>
        </div>
      </section>

      <section class="padX padY" aria-label="من أجلك">
        <h2 class="h2">من أجلك</h2>
        <div class="masonry mt0">
          <div v-for="(p,i) in forYouShein" :key="'fy-'+i" class="masonry-item">
            <div class="cardbox">
              <div class="imgwrap" :class="p.imageAspect">
                <img :src="p.image" :alt="p.title" class="absimg" loading="lazy" />
                <div v-if="(p.colors && p.colors.length) || (typeof p.colorCount==='number')" class="colorstack">
                  <div class="colorcol">
                    <span v-for="(c,idx) in (p.colors||[]).slice(0,3)" :key="'clr-'+idx" class="clr" :style="{ background: c }"></span>
                    <span v-if="typeof p.colorCount==='number'" class="clrcount">{{ p.colorCount }}</span>
                  </div>
                </div>
              </div>
              <div v-if="p.overlayBannerSrc" class="bannerbar">
                <img :src="p.overlayBannerSrc" :alt="p.overlayBannerAlt||'شريط تسويقي'" class="bannerimg" loading="lazy" />
              </div>
              <div class="contentbox">
                <div class="inlinechip">
                  <span class="chip trend">ترندات</span>
                  <span class="chip store" :aria-label="'رموز متجر '+(p.brand||'')">
                    <Store :size="14" color="#6D28D9" :stroke-width="2" />
                    <span class="brandtxt">{{ p.brand||'' }}</span>
                    <span class="caret">&gt;</span>
                  </span>
                </div>
                <div class="row gap1 mt2">
                  <div v-if="typeof p.discountPercent==='number'" class="disc">-%{{ p.discountPercent }}</div>
                  <div class="prodtitle">{{ p.title }}</div>
                </div>
                <div v-if="(typeof p.bestRank==='number') || p.bestRankCategory" class="bestrow">
                  <div v-if="typeof p.bestRank==='number'" class="bestrank">#{{ p.bestRank }} الأفضل مبيعاً</div>
                  <button v-if="p.bestRankCategory" class="bestcat" :aria-label="'اذهب إلى الفئة '+p.bestRankCategory">
                    <span>في {{ p.bestRankCategory }}</span><span>&gt;</span>
                  </button>
                </div>
                <div v-if="p.basePrice || p.soldPlus" class="pricerow">
                  <span v-if="p.basePrice" class="price-red">{{ p.basePrice }} ريال</span>
                  <span v-if="p.soldPlus" class="soldtxt">{{ p.soldPlus }}</span>
                </div>
                <button v-if="p.basePrice || p.soldPlus" class="addbtn" aria-label="أضف إلى السلة"><ShoppingCart :size="16" class="addicon" /><span class="addqty">1+</span></button>
                <div v-if="p.couponPrice" class="couponrow"><span class="couponnew">{{ p.couponPrice }} ريال</span><span class="coupontext">/بعد الكوبون</span></div>
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
        <button class="navbtn" aria-label="حسابي" @click="go('/account')"><User :size="24" class="mx-auto mb-1" /><div class="navtext">حسابي</div></button>
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
const bigDeals = ref<Array<{ image:string; price:string }>>([
  { image: 'https://csspicker.dev/api/image/?q=black+midi+dress&image_type=photo', price: '179.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=brown+dress+model&image_type=photo', price: '179.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=white+dress&image_type=photo', price: '179.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=black+sleeveless+dress&image_type=photo', price: '179.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=beige+skirt&image_type=photo', price: '95.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=pink+top&image_type=photo', price: '48.00 ر.س' }
])
const hotTrends = ref<Array<{ image:string; price:string }>>([
  { image: 'https://csspicker.dev/api/image/?q=black+skirt&image_type=photo', price: '66.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=white+blouse&image_type=photo', price: '95.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=white+summer+dress&image_type=photo', price: '159.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=black+blouse&image_type=photo', price: '79.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=leather+handbag&image_type=photo', price: '129.00 ر.س' },
  { image: 'https://csspicker.dev/api/image/?q=white+sneakers&image_type=photo', price: '139.00 ر.س' }
])
type ForYouShein = { image:string; overlayBannerSrc?:string; overlayBannerAlt?:string; title:string; brand?:string; discountPercent?:number; bestRank?:number; bestRankCategory?:string; basePrice?:string; soldPlus?:string; couponPrice?:string; colors?:string[]; colorCount?:number; imageAspect?:string }
const forYouShein = ref<ForYouShein[]>([])

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

  // Build ForYou section in SHEIN style (static placeholders for now, wired to API later)
  forYouShein.value = [
    { image:'https://csspicker.dev/api/image/?q=black+dress+model&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'COSMINA ملابس علوية كا ...', brand:'COSMINA', discountPercent:25, bestRank:4, bestRankCategory:'أنيق قمم نسائية', basePrice:'21.06', soldPlus:'تم بيع 100+', couponPrice:'16.85', colors:['#111111','#6B7280','#EEE5D4','#F9A8D4'], colorCount:9, imageAspect:'aspect-[4/5]' },
    { image:'https://csspicker.dev/api/image/?q=sleeveless+top+black+white&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'بلوزة نسائية بدون كم، خصر مرتفع', brand:'Frierie CURVE', discountPercent:76, basePrice:'120.00', soldPlus:'تم بيع 410+', couponPrice:'29.00', colors:['#000000','#FFFFFF','#A3A3A3','#FECACA'], colorCount:6, imageAspect:'aspect-[5/4]' },
    { image:'https://csspicker.dev/api/image/?q=casual+shirt+dazy&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'قميص بجيوب نسائي بسيط', brand:'Dazy', basePrice:'120.00', couponPrice:'69.00', colors:['#FFFFFF','#9CA3AF','#E5E7EB','#FDE68A'], colorCount:3, imageAspect:'aspect-[3/4]' },
    { image:'https://csspicker.dev/api/image/?q=white+outfit+woman+outdoor&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'إطلالة أنيقة بيضاء', basePrice:'159.00', colors:['#FFFFFF','#F3F4F6','#D1D5DB','#A7F3D0'], colorCount:5, imageAspect:'aspect-[3/4]' }
  ]
})

const rows = 3
const catCols = computed(()=>{
  const list = categories.value || []
  const cols = Math.ceil(list.length / rows) || 1
  const out: any[] = []
  for (let c=0;c<cols;c++){
    const col: any[] = []
    for (let r=0;r<rows;r++){
      const idx = c*rows + r
      if (idx < list.length) col.push(list[idx])
    }
    out.push(col)
  }
  return out
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
.mt0{margin-top:0}
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

.tabsbar{position:fixed;left:0;right:0;z-index:40;transition:background .2s;border-bottom:0;box-shadow:none}
.tabsbar.scrolled{background:rgba(255,255,255,.95);border-bottom:0;box-shadow:none}
.tabswrap{display:flex;overflow-x:auto;padding:8px 12px;gap:16px;border-bottom:0;box-shadow:none}
.tabbtn{background:transparent;border:none;padding:0 0 4px 0;cursor:pointer;white-space:nowrap;font-size:14px;color:#fff;position:relative}
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
.hscroll{display:flex;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
.hscroll::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
.tile{position:relative;width:192px;height:68px;flex-shrink:0;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;background:#fff}
.tile-img{position:absolute;right:0;top:0;width:64px;height:100%;object-fit:cover;opacity:.9}
.tile-text{position:absolute;inset:0;right:72px;left:8px;display:flex;flex-direction:column;justify-content:center}

/* Simple tiles (image + price) */
.simple-row{--visible:4.15;--gap:6px}
.simple-row-inner{display:flex;gap:var(--gap)}
.simple-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
.borderbox{border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;background:#fff}
.simple-img{width:100%;aspect-ratio:255/192;object-fit:cover}
.price-red{color:#dc2626;font-weight:700;font-size:13px}

/* Hide any visible scrollbars for containers marked no-scrollbar */
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}

/* Unified categories scroll: 3 rows move together */
.cat-scroll{overflow-x:auto;scrollbar-width:none}
.cat-scroll::-webkit-scrollbar{display:none}
.cat-cols{display:flex;gap:8px;padding-bottom:2px}
.cat-col{display:flex;flex-direction:column;gap:4px}
.catbtn{width:90px}
.cat-grid{display:grid;grid-auto-flow:column;grid-auto-columns:calc(100% - 24px);gap:12px;padding-bottom:2px}
.cat-grid{--rows:3}
.cat-grid{grid-template-rows:repeat(var(--rows),auto)}
.catbtn{display:block}

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

/* Masonry For You */
.masonry{column-count:2;column-gap:6px}
.masonry-item{break-inside:avoid;margin-bottom:6px;display:inline-block;width:100%}
.cardbox{width:100%;border:1px solid #e5e7eb;border-radius:4px;background:#fff;overflow:hidden}
.imgwrap{position:relative;width:100%}
.absimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.colorstack{position:absolute;bottom:8px;right:8px;display:flex;align-items:center}
.colorcol{display:flex;flex-direction:column;align-items:center;gap:2px;background:rgba(0,0,0,.4);padding:2px;border-radius:999px}
.clr{width:12px;height:12px;border-radius:999px;border:1px solid rgba(255,255,255,.2)}
.clrcount{margin-top:2px;font-size:9px;font-weight:600;padding:0 4px;border-radius:999px;color:rgba(255,255,255,.8);background:rgba(255,255,255,.05)}
.bannerbar{width:100%;height:28px;position:relative}
.bannerimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.contentbox{position:relative;padding:8px}
.inlinechip{display:inline-flex;align-items:center;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden}
.chip{display:inline-flex;align-items:center;padding:0 6px;height:18px;font-size:11px}
.chip.trend{color:#fff;background:#6D28D9}
.chip.store{background:#F3F4F6;color:#6D28D9}
.brandtxt{max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.caret{color:#6D28D9;margin-inline-start:2px}
.mt2{margin-top:6px}
.disc{padding:0 4px;height:16px;border-radius:3px;font-size:11px;font-weight:700;border:1px solid #FB923C;color:#F97316;display:flex;align-items:center;line-height:1.1}
.prodtitle{font-size:12px;color:#111827;font-weight:500;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bestrow{margin-top:4px;display:inline-flex;align-items:stretch;border-radius:4px;overflow:hidden}
.bestrank{padding:0 4px;font-size:9px;font-weight:600;display:flex;align-items:center;line-height:1.1;background:rgb(255,232,174);color:#c77210}
.bestcat{padding:0 4px;font-size:9px;font-weight:700;display:flex;align-items:center;gap:4px;line-height:1.1;background:rgba(254,243,199,.2);color:#d58700;border:0}
.pricerow{margin-top:4px;display:flex;align-items:center;gap:6px}
.soldtxt{font-size:11px;color:#374151}
.addbtn{position:absolute;left:8px;bottom:24px;display:flex;align-items:center;gap:4px;padding:2px 6px;border-radius:999px;border:1px solid #000;background:#fff}
.addicon{color:#000}
.addqty{font-size:11px;font-weight:700;color:#000}
.couponrow{margin-top:4px;height:28px;display:inline-flex;align-items:center;gap:6px;padding:0 8px;border-radius:3px;background:rgba(249,115,22,.10)}
.couponnew{font-size:13px;font-weight:800;color:#F97316}
.coupontext{font-size:11px;color:#F97316}

.bottomnav{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e5e7eb;z-index:50}
.navwrap{display:flex;justify-content:space-around;padding:8px 0}
.navbtn{width:64px;text-align:center;background:transparent;border:none;cursor:pointer}
.navbtn.active .navtext{color:#111}
.navtext{font-size:11px;color:#374151}
.navicon{width:24px;height:24px;margin:0 auto 4px auto;background:#111;border-radius:4px;opacity:.9}
.cart-icon{position:relative;display:inline-block}
.badge-count{position:absolute;top:-4px;left:50%;transform:translateX(-20%);background:#ef4444;color:#fff;border-radius:999px;min-width:16px;height:16px;line-height:16px;font-size:10px;padding:0 4px;border:1px solid #fff}
</style>

