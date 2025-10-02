<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <div :class="['fixed top-0 left-0 right-0 z-50 transition-all duration-200', scrolled ? 'bg-white/95 backdrop-blur-sm h-12' : 'bg-transparent h-16']" aria-label="رأس الصفحة">
      <div class="max-w-md mx-auto h-full px-3 flex items-center justify-between">
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="القائمة"><Menu :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" /></button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="الإشعارات"><Bell :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" /></button>
        </div>
        <div :class="['text-base font-semibold', scrolled ? 'text-gray-900' : 'text-white']" aria-label="شعار المتجر">jeeey</div>
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="السلة"><ShoppingCart :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" /></button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="البحث"><Search :class="scrolled ? 'text-gray-800' : 'text-white'" class="w-6 h-6" /></button>
        </div>
      </div>
    </div>

    <div :class="[scrolled ? 'bg-white/95 backdrop-blur-sm' : 'bg-transparent','fixed left-0 right-0 z-40 transition-colors']" :style="{ top: headerH + 'px' }" role="tablist" aria-label="التبويبات">
      <div ref="tabsRef" class="max-w-md mx-auto overflow-x-auto no-scrollbar px-3 py-2 flex gap-4" @keydown="onTabsKeyDown">
        <button v-for="(t,i) in tabs" :key="t" role="tab" :aria-selected="activeTab===i" tabindex="0" @click="activeTab=i" :class="['text-sm whitespace-nowrap relative pb-1', activeTab===i ? 'text-black font-semibold' : (scrolled ? 'text-gray-700' : 'text-white')]">
          {{ t }}
          <span :class="['absolute left-0 right-0 -bottom-0.5 h-0.5 transition-all', activeTab===i ? (scrolled ? 'bg-black' : 'bg-white') : 'bg-transparent']" />
        </button>
      </div>
    </div>

    <div class="max-w-md mx-auto">
      <div class="relative w-full h-[360px] sm:h-[420px]">
        <img :src="bannerSrc" :srcset="bannerSrcSet" alt="عرض تخفيضات" class="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
        <div class="absolute left-4 right-4 bottom-4 text-white">
          <div class="text-[12px] mb-1">احتفالنا الأكبر على الإطلاق</div>
          <div class="text-[32px] font-extrabold leading-tight">خصم يصل حتى 90%</div>
          <button class="mt-2 bg-white text-black px-3 py-2 rounded text-[13px] font-semibold border border-gray-200" aria-label="تسوّق الآن">تسوّق الآن</button>
        </div>
      </div>
    </div>

    <div class="max-w-md mx-auto px-3 py-3">
      <div class="bg-white border border-gray-200 rounded p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-[12px] font-semibold text-emerald-700">قسائم خصم إضافية</div>
          <div class="flex gap-2 overflow-x-auto no-scrollbar">
            <div v-for="(pt,idx) in promoTiles" :key="'pt-'+idx" class="min-w-[96px] text-center px-2 py-1 rounded border border-emerald-300" :style="{ background: pt.bg }">
              <div class="text-[11px] text-emerald-700 font-bold">{{ pt.title.includes('خصم') ? pt.title.split(' ')[0] : pt.title }}</div>
              <div class="text-[10px] text-emerald-800">{{ pt.sub }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-md mx-auto">
      <div class="bg-white p-3">
        <div class="flex overflow-x-auto gap-2 snap-x snap-mandatory no-scrollbar" aria-label="عروض">
          <div v-for="p in promoTiles" :key="p.title" class="relative w-[192px] h-[68px] flex-shrink-0 border border-gray-200 rounded overflow-hidden bg-white snap-start">
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
        <div class="overflow-x-auto no-scrollbar">
          <div class="flex gap-2 pb-0.5">
            <div v-for="(col,ci) in catCols" :key="'col-'+ci" class="flex flex-col gap-1">
              <button v-for="(c,ri) in col" :key="c.name + '-' + ci + '-' + ri" class="w-[96px] flex-shrink-0 text-center bg-transparent border-0" :aria-label="'فئة ' + c.name">
                <div class="w-[68px] h-[68px] border border-gray-200 rounded-full overflow-hidden mx-auto mb-2 bg-white">
                  <img :src="c.image" :alt="c.name" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <div class="text-[11px] text-gray-700">{{ c.name }}</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="px-3 py-3" aria-label="عروض كبرى">
        <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
          <div class="mb-1.5 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">عروض كبرى</h2>
            <button class="flex items-center text-xs text-gray-700" aria-label="عرض المزيد في عروض كبرى"><span class="mr-1">المزيد</span><ChevronLeft class="w-4 h-4" /></button>
          </div>
          <div class="overflow-x-auto no-scrollbar snap-x-start simple-row">
            <div class="simple-row-inner">
              <button v-for="(p,i) in bigDeals" :key="'deal-'+i" class="text-start snap-item simple-item" :aria-label="'منتج بسعر '+p.price">
                <div class="border border-gray-200 rounded-[4px] overflow-hidden bg-white"><img :src="p.image" :alt="p.price" class="w-full aspect-[255/192] object-cover" loading="lazy" /></div>
                <div class="mt-1"><span class="text-red-600 font-bold text-sm">{{ p.price }}</span></div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="px-3 py-3" aria-label="أهم الترندات">
        <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
          <div class="mb-1.5 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">أهم الترندات</h2>
            <button class="flex items-center text-xs text-gray-700" aria-label="عرض المزيد في أهم الترندات"><span class="mr-1">المزيد</span><ChevronLeft class="w-4 h-4" /></button>
          </div>
          <div class="overflow-x-auto no-scrollbar snap-x-start simple-row"><div class="simple-row-inner"><button v-for="(p,i) in hotTrends" :key="'trend-'+i" class="text-start snap-item simple-item" :aria-label="'منتج بسعر '+p.price"><div class="border border-gray-200 rounded-[4px] overflow-hidden bg-white"><img :src="p.image" :alt="p.price" class="w-full aspect-[255/192] object-cover" loading="lazy" /></div><div class="mt-1"><span class="text-red-600 font-bold text-sm">{{ p.price }}</span></div></button></div></div>
        </div>
      </section>

      <section class="px-3 py-3" aria-label="من أجلك">
        <h2 class="text-[14px] font-bold text-gray-900 mb-2">من أجلك</h2>
        <div class="columns-2 gap-1 [column-fill:_balance]"><!-- masonry -->
          <div v-for="(p,i) in forYouShein" :key="'fy-'+i" class="mb-1 break-inside-avoid">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden">
              <div class="relative w-full" :class="p.imageAspect">
                <img :src="p.image" :alt="p.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div v-if="(p.colors && p.colors.length) || (typeof p.colorCount==='number')" class="absolute bottom-2 right-2 flex items-center"><div class="flex flex-col items-center gap-0.5 bg-black/40 p-0.5 rounded-full"><span v-for="(c,idx) in (p.colors||[]).slice(0,3)" :key="'clr-'+idx" class="w-3 h-3 rounded-full border border-white/20" :style="{ background: c }"></span><span v-if="typeof p.colorCount==='number'" class="mt-0.5 text-[9px] font-semibold px-1 rounded-full text-white/80 bg-white/5">{{ p.colorCount }}</span></div></div>
              </div>
              <div v-if="p.overlayBannerSrc" class="w-full h-7 relative"><img :src="p.overlayBannerSrc" :alt="p.overlayBannerAlt||'شريط تسويقي'" class="absolute inset-0 w-full h-full object-cover" loading="lazy" /></div>
              <div class="relative p-2">
                <div class="inline-flex items-center border border-gray-200 rounded overflow-hidden"><span class="inline-flex items-center h-[18px] px-1.5 text-[11px] text-white bg-violet-700">ترندات</span><span class="inline-flex items-center h-[18px] px-1.5 text-[11px] bg-gray-100 text-violet-700"><Store :size="14" color="#6D28D9" :stroke-width="2" /><span class="max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap">{{ p.brand||'' }}</span><span class="text-violet-700 ms-0.5">&gt;</span></span></div>
                <div class="flex items-center gap-1 mt-1.5"><div v-if="typeof p.discountPercent==='number'" class="px-1 h-4 rounded text-[11px] font-bold border border-orange-300 text-orange-500 flex items-center leading-none">-%{{ p.discountPercent }}</div><div class="text-[12px] text-gray-900 font-medium leading-tight truncate">{{ p.title }}</div></div>
                <div v-if="(typeof p.bestRank==='number') || p.bestRankCategory" class="mt-1 inline-flex items-stretch rounded overflow-hidden"><div v-if="typeof p.bestRank==='number'" class="px-1 text-[9px] font-semibold flex items-center leading-none bg-[rgb(255,232,174)] text-[#c77210]">#{{ p.bestRank }} الأفضل مبيعاً</div><button v-if="p.bestRankCategory" class="px-1 text-[9px] font-bold flex items-center gap-1 leading-none bg-[rgba(254,243,199,.2)] text-[#d58700] border-0"><span>في {{ p.bestRankCategory }}</span><span>&gt;</span></button></div>
                <div v-if="p.basePrice || p.soldPlus" class="mt-1 flex items-center gap-1"><span v-if="p.basePrice" class="text-red-600 font-bold text-[13px]">{{ p.basePrice }} ريال</span><span v-if="p.soldPlus" class="text-[11px] text-gray-700">{{ p.soldPlus }}</span></div>
                <button v-if="p.basePrice || p.soldPlus" class="absolute left-2 bottom-6 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black bg-white" aria-label="أضف إلى السلة"><ShoppingCart :size="16" class="text-black" /><span class="text-[11px] font-bold text-black">1+</span></button>
                <div v-if="p.couponPrice" class="mt-1 h-7 inline-flex items-center gap-1 px-2 rounded bg-[rgba(249,115,22,.10)]"><span class="text-[13px] font-extrabold text-orange-500">{{ p.couponPrice }} ريال</span><span class="text-[11px] text-orange-500">/بعد الكوبون</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style="height:80px" />
      </section>
    </div>

    <nav class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 z-50" aria-label="التنقل السفلي">
      <div class="max-w-md mx-auto flex justify-around py-2" dir="rtl">
        <button class="text-center w-16" aria-label="الرئيسية"><LayoutGrid class="w-6 h-6 mx-auto mb-1 text-black" /><div class="text-[11px] text-black">الرئيسية</div></button>
        <button class="text-center w-16" aria-label="الفئات"><LayoutGrid class="w-6 h-6 mx-auto mb-1 text-gray-700" /><div class="text-[11px] text-gray-700">الفئات</div></button>
        <button class="text-center w-16" aria-label="جديد/بحث"><Search class="w-6 h-6 mx-auto mb-1 text-gray-700" /><div class="text-[11px] text-gray-700">جديد</div></button>
        <button class="text-center w-16" aria-label="حقيبة التسوق"><ShoppingBag class="w-6 h-6 mx-auto mb-1 text-gray-700" /><div class="text-[11px] text-gray-700">الحقيبة</div></button>
        <button class="text-center w-16" aria-label="حسابي"><User class="w-6 h-6 mx-auto mb-1 text-gray-700" /><div class="text-[11px] text-gray-700">حسابي</div></button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Menu, Bell, ShoppingCart, Search, ShoppingBag, LayoutGrid, User, ChevronLeft, Store } from 'lucide-vue-next'

const scrolled = ref(false)
const activeTab = ref(0)
const tabs = ['كل','نساء','رجال','أطفال','أحجام كبيرة','جمال','المنزل','أحذية','فساتين']
const tabsRef = ref<HTMLDivElement|null>(null)
const headerH = ref(64)

function onScroll(){ scrolled.value = window.scrollY > 60; headerH.value = scrolled.value ? 48 : 64 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive: true }) })

function onTabsKeyDown(e: KeyboardEvent){
  if (e.key === 'ArrowRight') activeTab.value = Math.min(activeTab.value + 1, tabs.length - 1)
  if (e.key === 'ArrowLeft') activeTab.value = Math.max(activeTab.value - 1, 0)
  const el = tabsRef.value?.children[activeTab.value] as HTMLElement | undefined
  el?.scrollIntoView({ inline: 'center', behavior: 'smooth' })
}

const promoTiles = ref([
  { title: 'شحن مجاني', sub: 'للطلبات فوق 99 ر.س', image: 'https://csspicker.dev/api/image/?q=free+shipping+icon&image_type=photo', bg: '#ffffff' },
  { title: 'خصم 90%', sub: 'لفترة محدودة', image: 'https://csspicker.dev/api/image/?q=sale+tag&image_type=photo', bg: '#fff6f1' },
  { title: 'الدفع عند الاستلام', sub: 'متاح لمدن مختارة', image: 'https://csspicker.dev/api/image/?q=cod+payment&image_type=photo', bg: '#f7faff' },
  { title: 'نقاط ومكافآت', sub: 'اكسب مع كل شراء', image: 'https://csspicker.dev/api/image/?q=reward+points&image_type=photo', bg: '#f9f9ff' },
  { title: 'خصم الطلاب', sub: 'تحقق من الأهلية', image: 'https://csspicker.dev/api/image/?q=student+discount&image_type=photo', bg: '#fffaf3' },
  { title: 'عروض اليوم', sub: 'لا تفوّت الفرصة', image: 'https://csspicker.dev/api/image/?q=deal+of+the+day&image_type=photo', bg: '#f5fffb' }
])
const midPromo = ref({ image: 'https://images.unsplash.com/photo-1512203492609-8b0f0b52f483?w=1600&q=60', alt: 'عرض شريطي 90×720', text: 'قسائم إضافية + شحن مجاني' })
const categories = ref<Array<{ name:string; image:string }>>([
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
  { name: 'جينز', image: 'https://csspicker.dev/api/image/?q=jeans&image_type=photo' },
])
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
type ForYou = { image:string; overlayBannerSrc?:string; overlayBannerAlt?:string; title:string; brand?:string; discountPercent?:number; bestRank?:number; bestRankCategory?:string; basePrice?:string; soldPlus?:string; couponPrice?:string; colors?:string[]; colorCount?:number; imageAspect?:string }
const forYouShein = ref<ForYou[]>([
  { image:'https://csspicker.dev/api/image/?q=black+dress+model&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'COSMINA ملابس علوية كا ...', brand:'COSMINA', discountPercent:25, bestRank:4, bestRankCategory:'أنيق قمم نسائية', basePrice:'21.06', soldPlus:'تم بيع 100+', couponPrice:'16.85', colors:['#111111','#6B7280','#EEE5D4','#F9A8D4'], colorCount:9, imageAspect:'aspect-[4/5]' },
  { image:'https://csspicker.dev/api/image/?q=sleeveless+top+black+white&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'بلوزة نسائية بدون كم، خصر مرتفع', brand:'Frierie CURVE', discountPercent:76, basePrice:'120.00', soldPlus:'تم بيع 410+', couponPrice:'29.00', colors:['#000000','#FFFFFF','#A3A3A3','#FECACA'], colorCount:6, imageAspect:'aspect-[5/4]' },
  { image:'https://csspicker.dev/api/image/?q=casual+shirt+dazy&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'قميص بجيوب نسائي بسيط', brand:'Dazy', basePrice:'120.00', couponPrice:'69.00', colors:['#FFFFFF','#9CA3AF','#E5E7EB','#FDE68A'], colorCount:3, imageAspect:'aspect-[3/4]' },
  { image:'https://csspicker.dev/api/image/?q=white+outfit+woman+outdoor&image_type=photo', overlayBannerSrc:'https://csspicker.dev/api/image/?q=anniversary+party+banner+pink+yellow&image_type=photo', overlayBannerAlt:'حفلة الذكرى السنوية', title:'إطلالة أنيقة بيضاء', brand:'', basePrice:'159.00', colors:['#FFFFFF','#F3F4F6','#D1D5DB','#A7F3D0'], colorCount:5, imageAspect:'aspect-[3/4]' }
])

const bannerSrc = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60'
const bannerSrcSet = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60&fm=webp 1200w, https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=2400&q=60&fm=webp 2400w'

const rows = 3
const catRows = ((): Array<Array<{name:string;image:string}>> => {
  const perRow = Math.ceil(categories.value.length / rows)
  return Array.from({length: rows}, (_,i)=> categories.value.slice(i*perRow, (i+1)*perRow))
})()

const catCols = ((): Array<Array<{name:string;image:string}>> => {
  const list = categories.value
  const cols = Math.ceil(list.length / rows)
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
})()
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
.simple-row{--visible:4.15;--gap:6px}
.simple-row-inner{display:flex;gap:var(--gap)}
.simple-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
.cat-row{--visible:4.7;--gap:12px}
.cat-row-inner{display:flex;gap:var(--gap)}
.cat-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
.masonry{column-count:2;column-gap:6px}
.masonry-item{break-inside:avoid;margin-bottom:6px;display:inline-block;width:100%}
</style>

