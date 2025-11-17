<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl" @scroll.passive="onScroll" ref="page">
    <!-- الهيدر (ثابت أعلى) -->
    <div class="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div class="h-12 px-2 flex items-center justify-between">
        <!-- يمين: رجوع + قائمة -->
        <div class="flex items-center gap-0.5">
          <button aria-label="رجوع" class="w-8 h-8 flex items-center justify-center p-0" @click="goBack">
            <ArrowRight class="w-5 h-5 text-gray-800" />
          </button>
          <div aria-hidden class="w-8 h-8 flex items-center justify-center p-0">
            <Menu class="w-5 h-5 text-gray-700" />
          </div>
        </div>

        <!-- الوسط: شريط البحث -->
        <div class="flex-1 px-1">
          <div class="flex items-center bg-gray-100 rounded-full h-9 px-2">
            <input v-model="searchQ" @keydown.enter.prevent="applySearch" placeholder="ابحث في هذه الفئة" class="flex-1 bg-transparent text-[12px] text-gray-800 outline-none" />
            <div class="flex items-center gap-1">
              <button aria-label="بحث" class="w-7 h-7 flex items-center justify-center" @click="applySearch">
                <Search class="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <!-- يسار: مفضلة + سلة -->
        <div class="flex items-center gap-0.5">
          <button aria-label="المفضلة" class="w-8 h-8 flex items-center justify-center p-0" @click="goToWishlist">
            <Heart class="w-5 h-5 text-gray-700" />
          </button>
          <button aria-label="عربة التسوق" class="w-8 h-8 flex items-center justify-center p-0 relative" @click="goToCart">
            <ShoppingCart class="w-5 h-5 text-gray-700" />
            <span v-if="cartBadge > 0" class="absolute -top-1 -left-1 min-w-[16px] h-4 text-[10px] leading-4 rounded-full bg-red-500 text-white flex items-center justify-center px-1">
              {{ cartBadge }}
            </span>
          </button>
        </div>
      </div>

      <!-- منطقة الفئات -->
      <Transition name="category-switch" mode="out-in">
        <!-- الوضع العادي -->
        <div v-if="!compact && categories.length>0" key="normal" class="bg-white border-t border-gray-100">
          <div class="flex gap-2 overflow-x-auto no-scrollbar px-2 py-2 items-start">
            <button
              v-for="c in visibleCategories"
              :key="c.id"
              class="flex flex-col items-center min-w-[76px] pb-1"
              @click="onCategoryClick(c)"
            >
              <div class="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                <img :src="c.img" :alt="c.label" class="w-full h-full object-cover" />
              </div>
              <span class="mt-1 text-[12px] text-gray-700 text-center leading-tight category-title">
                {{ c.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- الوضع المضغوط -->
        <div v-else-if="compact && categories.length>0" key="compact" class="bg-white border-t border-gray-100">
          <div class="flex gap-2 overflow-x-auto no-scrollbar px-2 py-1 items-center">
            <button
              v-for="c in compactCategories"
              :key="c.id"
              class="flex items-center gap-3 min-w-[140px] px-2 py-1 rounded-md hover:bg-gray-50"
              @click="onCategoryClick(c)"
            >
              <div class="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                <img :src="c.img" :alt="c.label" class="w-full h-full object-cover" />
              </div>
              <div class="text-right">
                <div class="text-[13px] text-gray-800 leading-tight truncate-2-lines max-w-[8rem]">
                  {{ c.label }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </Transition>

      <!-- نسخة الفلاتر في الهيدر: تظهر دائمًا إذا لا توجد فئات فرعية -->
      <div v-if="showHeaderFilters || categories.length===0" class="bg-white border-t border-gray-100 px-2 py-2">
        <div class="flex items-center justify-between mb-2">
          <button @click="setFilter('recommend')" :class="['text-[12px]', activeFilter === 'recommend' ? 'text-black font-semibold' : 'text-gray-600']">التوصية</button>
          <button @click="setFilter('popular')" :class="['text-[12px]', activeFilter === 'popular' ? 'text-black font-semibold' : 'text-gray-600']">الأوسع انتشاراً</button>
          <button @click="togglePriceSort" class="flex items-center gap-1 text-[12px]" :class="activeFilter === 'price' ? 'text-black font-semibold' : 'text-gray-600'">
            السعر
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
              <g>
                <path :fill="priceSort === 'asc' ? '#000' : '#9ca3af'" d="M174.2,246h-12.5V19.5c0-2.5,2-5,4.5-6c2.5-1,5.5,0,7,2.5l52.7,77.3l-11.1,7l-41.2-60.3V246H174.2z"/>
                <path :fill="priceSort === 'desc' ? '#000' : '#9ca3af'" d="M87.8,243c-2,0-4-1-5-2.5l-52.7-77.8l10.5-7l41.2,60.3V10h12.5v226.5c0,2.5-2,5-4.5,6C88.8,242.5,88.3,243,87.8,243z"/>
              </g>
            </svg>
          </button>
          <button @click="setFilter('rating')" :class="['flex items-center gap-1 text-[12px]', activeFilter === 'rating' ? 'text-black font-semibold' : 'text-gray-600']">
            <Filter class="w-3.5 h-3.5" /> التصنيف
          </button>
        </div>
        <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
          <button @click="openFilter('category')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
            الفئات <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button @click="openFilter('size')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
            المقاس <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button @click="openFilter('color')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
            اللون <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button @click="openFilter('material')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
            المواد <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button @click="openFilter('style')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
            الأسلوب <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- مساحة للهيدر الثابت -->
    <div :style="{ height: headerHeight + 'px' }"></div>
    
    <!-- الفلاتر السفلية (تظهر فقط عند وجود فئات فرعية وإخفاء نسخة الهيدر) -->
    <div v-if="!showHeaderFilters && categories.length>0" class="h-3"></div>
    <section v-if="!showHeaderFilters && categories.length>0" class="bg-white border-b border-gray-200 px-2 py-2">
      <div class="flex items-center justify-between mb-2">
        <button 
          @click="setFilter('recommend')" 
          :class="['text-[12px]', activeFilter === 'recommend' ? 'text-black font-semibold' : 'text-gray-600']">
          التوصية
        </button>

        <button 
          @click="setFilter('popular')" 
          :class="['text-[12px]', activeFilter === 'popular' ? 'text-black font-semibold' : 'text-gray-600']">
          الأوسع انتشاراً
        </button>

        <button 
          @click="togglePriceSort" 
          class="flex items-center gap-1 text-[12px]" 
          :class="activeFilter === 'price' ? 'text-black font-semibold' : 'text-gray-600'">
          السعر
          <!-- أيقونة السعر -->
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
            <g>
              <path 
                :fill="priceSort === 'asc' ? '#000' : '#9ca3af'" 
                d="M174.2,246h-12.5V19.5c0-2.5,2-5,4.5-6c2.5-1,5.5,0,7,2.5l52.7,77.3l-11.1,7l-41.2-60.3V246H174.2z"/>
              <path 
                :fill="priceSort === 'desc' ? '#000' : '#9ca3af'" 
                d="M87.8,243c-2,0-4-1-5-2.5l-52.7-77.8l10.5-7l41.2,60.3V10h12.5v226.5c0,2.5-2,5-4.5,6C88.8,242.5,88.3,243,87.8,243z"/>
            </g>
          </svg>
        </button>

        <button 
          @click="setFilter('rating')" 
          :class="['flex items-center gap-1 text-[12px]', activeFilter === 'rating' ? 'text-black font-semibold' : 'text-gray-600']">
          <Filter class="w-3.5 h-3.5" /> التصنيف
        </button>
    </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button @click="openFilter('category')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">الفئات<ArrowDown class="w-3.5 h-3.5 text-gray-500" /></button>
        <button @click="openFilter('size')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">المقاس<ArrowDown class="w-3.5 h-3.5 text-gray-500" /></button>
        <button @click="openFilter('color')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">اللون<ArrowDown class="w-3.5 h-3.5 text-gray-500" /></button>
        <button @click="openFilter('material')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">المواد<ArrowDown class="w-3.5 h-3.5 text-gray-500" /></button>
        <button @click="openFilter('style')" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">الأسلوب<ArrowDown class="w-3.5 h-3.5 text-gray-500" /></button>
      </div>
    </section>
    
    <!-- ✅ مكان بطاقات المنتجات -->
    <section class="px-2 py-2">
      <!-- Skeleton grid أثناء التحميل (يحاكي شبكة متغيرة الارتفاع) -->
      <div v-if="productsLoading" class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="i in 8" :key="'sk-prod-'+i" class="mb-1 break-inside-avoid">
          <div class="w-full border border-gray-200 rounded bg-white overflow-hidden">
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
      <!-- الشبكة الفعلية: توزيع تناوبي بين عمودين مستقلين لتفادي ملء عمود واحد أولاً -->
      <div v-else class="flex gap-1">
        <!-- العمود الأيسر: العناصر ذات الفهرس الزوجي -->
        <div class="flex-1 space-y-1">
          <div v-for="(p,idx) in leftProducts" :key="'product-l-'+p.id+'-'+idx" class="break-inside-avoid">
            <ProductGridCard
              :product="{
                id: p.id,
                title: p.title,
                images: Array.isArray(p.images)? p.images : (p.image? [p.image] : []),
                overlayBannerSrc: (p as any).overlayBannerSrc,
                overlayBannerAlt: (p as any).overlayBannerAlt,
                brand: p.brand,
                discountPercent: p.discountPercent,
                bestRank: p.bestRank,
                bestRankCategory: p.bestRankCategory,
                basePrice: p.basePrice,
                soldPlus: p.soldPlus,
                couponPrice: p.couponPrice,
                isTrending: (p as any).isTrending === true
              }"
              :ratio="p._ratio || defaultRatio"
              :priority="idx<4"
              @add="openSuggestOptions"
            />
          </div>
        </div>
        <!-- العمود الأيمن: العناصر ذات الفهرس الفردي -->
        <div class="flex-1 space-y-1">
          <div v-for="(p,idx) in rightProducts" :key="'product-r-'+p.id+'-'+idx" class="break-inside-avoid">
            <ProductGridCard
              :product="{
                id: p.id,
                title: p.title,
                images: Array.isArray(p.images)? p.images : (p.image? [p.image] : []),
                overlayBannerSrc: (p as any).overlayBannerSrc,
                overlayBannerAlt: (p as any).overlayBannerAlt,
                brand: p.brand,
                discountPercent: p.discountPercent,
                bestRank: p.bestRank,
                bestRankCategory: p.bestRankCategory,
                basePrice: p.basePrice,
                soldPlus: p.soldPlus,
                couponPrice: p.couponPrice,
                isTrending: (p as any).isTrending === true
              }"
              :ratio="p._ratio || defaultRatio"
              :priority="idx<4"
              @add="openSuggestOptions"
            />
          </div>
        </div>
      </div>
      <div style="height:80px" />

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
    </section>

    <!-- Loading -->
    <div v-if="isLoadingMore" class="flex items-center justify-center py-8">
      <div class="flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-4 border-gray-300 border-t-[#8a1538] rounded-full animate-spin"></div>
        <span class="text-[12px] text-gray-500">جاري التحميل...</span>
      </div>
    </div>

    <!-- Bottom filter sheet -->
    <div v-if="filterSheet.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeFilter" />
      <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-[12px] p-3 max-h-[70vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-[16px]">تصفية حسب {{ filterSheet.type==='size'?'المقاس': filterSheet.type==='color'?'اللون': filterSheet.type==='material'?'المواد': filterSheet.type==='style'?'الأسلوب':'الفئة' }}</h3>
          <button class="text-[20px]" @click="closeFilter">×</button>
        </div>
        <div v-if="filterSheet.type==='size'" class="grid grid-cols-4 gap-2">
          <button v-for="s in ['XS','S','M','L','XL','2XL','3XL']" :key="s" @click="selSizes = selSizes.includes(s)? selSizes.filter(x=>x!==s) : [...selSizes, s]" :class="['px-2 py-1 rounded border text-[12px]', selSizes.includes(s)? 'bg-black text-white border-black':'bg-white text-gray-800 border-gray-300']">{{ s }}</button>
        </div>
        <div v-else-if="filterSheet.type==='color'" class="grid grid-cols-8 gap-2">
          <button v-for="c in ['black','white','red','blue','green','yellow','pink','beige']" :key="c" @click="selColors = selColors.includes(c)? selColors.filter(x=>x!==c) : [...selColors, c]" :class="['w-7 h-7 rounded-full border', selColors.includes(c)? 'ring-2 ring-black':'']" :style="{ background: c }" />
        </div>
        <div v-else-if="filterSheet.type==='material'" class="grid grid-cols-3 gap-2">
          <button v-for="m in ['cotton','polyester','wool','denim','silk']" :key="m" @click="selMaterials = selMaterials.includes(m)? selMaterials.filter(x=>x!==m) : [...selMaterials, m]" :class="['px-2 py-1 rounded border text-[12px]', selMaterials.includes(m)? 'bg-black text-white border-black':'bg-white text-gray-800 border-gray-300']">{{ m }}</button>
        </div>
        <div v-else-if="filterSheet.type==='style'" class="grid grid-cols-3 gap-2">
          <button v-for="st in ['casual','elegant','sport','classic','boho']" :key="st" @click="selStyles = selStyles.includes(st)? selStyles.filter(x=>x!==st) : [...selStyles, st]" :class="['px-2 py-1 rounded border text-[12px]', selStyles.includes(st)? 'bg-black text-white border-black':'bg-white text-gray-800 border-gray-300']">{{ st }}</button>
        </div>
        <div v-else class="text-[13px] text-gray-600">اختر من الشريط العلوي فئة فرعية.</div>
        <div class="mt-3 flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeFilter">إلغاء</button>
          <button class="btn" style="background:#8a1538;color:#fff" @click="applyFilters">تطبيق</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useCart } from '../../store/cart';
import { storeToRefs } from 'pinia';
import {
  ArrowRight,
  Menu,
  ShoppingCart,
  Heart,
  Search,
  Camera,
  Filter,
  ChevronDown as ArrowDown,
  Store,
} from 'lucide-vue-next';
import ProductGridCard from '@/components/ProductGridCard.vue'
import ProductOptionsModal from '@/components/ProductOptionsModal.vue'
import { markTrending } from '../../lib/trending'

const router = useRouter();
const cart = useCart();
const { items } = storeToRefs(cart);

import { useRoute } from 'vue-router'
import { apiGet, API_BASE, isAuthenticated } from '../../lib/api'
import { buildThumbUrl } from '../../lib/media'
const route = useRoute()
const allCategories = ref<Array<{ id:string; slug?:string|null; name:string; parentId?:string|null; image?:string|null }>>([])
const currentCategory = ref<{ id:string; slug?:string|null; name:string }|null>(null)
const categories = ref<Array<{ id:string; label:string; img:string }>>([])

// بيانات المنتجات (حقيقية من API)
const products = ref<any[]>([])
const hasMore = ref(false)
const productsLoading = ref(true)
const defaultRatio = 1.3
const placeholderRatios = [1.2, 1.5, 1.35, 1.1, 1.4, 1.25, 1.6, 1.3]
function thumbSrc(p:any, w:number): string {
  const u = (Array.isArray(p.images)&&p.images[0]) || p.image
  return buildThumbUrl(String(u||''), w, 60)
}
// تقسيم تناوبي للمنتجات بين عمودين
const leftProducts = computed(()=> products.value.filter((_p, i)=> i % 2 === 0))
const rightProducts = computed(()=> products.value.filter((_p, i)=> i % 2 === 1))
function probeRatioOnce(p:any): void {
  try{
    if (p._ratioProbing || p._ratio){ return }
    p._ratioProbing = true
    const u = thumbSrc(p, 64)
    const img = new Image()
    ;(img as any).loading = 'eager'
    ;(img as any).decoding = 'async'
    img.onload = ()=>{
      try{
        const w = (img as any).naturalWidth || 64
        const h = (img as any).naturalHeight || 64
        if (w>0 && h>0){ p._ratio = h / w }
      }catch{ p._ratio = defaultRatio } finally { p._ratioProbing = false }
    }
    img.onerror = ()=>{ try{ p._ratioProbing = false }catch{} }
    img.src = u
  }catch{}
}
// نسخة Promise للاستعمال قبل العرض
function probeRatioPromise(p:any): Promise<void>{
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

const cartBadge = computed(() => items.value.length);
const promoWords = ["فساتين","هودي","بلايز","تيشيرت","جواكت"];
const promoIndex = ref(0);
const activeFilter = ref<'recommend'|'popular'|'price'|'rating'>('recommend');
const priceSort = ref<'asc'|'desc'|null>(null);
const compact = ref(false);
const page = ref<HTMLElement | null>(null);
const searchQ = ref('')

const isScrollingUp = ref(false);
const atTop = ref(true);
const showHeaderFilters = computed(() => isScrollingUp.value && !atTop.value);
const isLoadingMore = ref(false);
const pageNumber = ref(1);

// حساب ارتفاع الهيدر ديناميكيًا
const headerHeight = computed(() => {
  let height = 48; // الهيدر الأساسي (h-12 = 3rem = 48px)
  const hasCats = (categories.value||[]).length>0
  if (hasCats){
    height += (!compact.value ? 100 : 60); // مساحة الفئات فقط عند توفرها
  }
  // أضف مساحة الفلاتر في الهيدر عندما تكون مفعلة أو عند عدم توفر الفئات الفرعية
  if (showHeaderFilters.value || !hasCats) {
    height += 80;
  }
  return height;
});

let interval: any;
let lastScrollY = 0;

onMounted(() => {
  interval = setInterval(()=> { promoIndex.value = (promoIndex.value + 1) % promoWords.length }, 3000);
  lastScrollY = window.scrollY || 0;
  atTop.value = lastScrollY <= 0;
  isScrollingUp.value = false;
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  void bootstrap()
  // دعم المعاينة الحية من لوحة التحكم (Categories Tabs)
  try{
    window.addEventListener('message', (e: MessageEvent)=>{
      try{
        const data:any = (e as any).data
        if (data && typeof data==='object' && data.__categories_preview){
          const c = data.content
          if (c && (c.type==='categories-v1' || c.data)){
            // استخرج فئات للمعاينة من content.data (featured / grid.explicit / suggestions.items)
            const d = c.data || {}
            const catFromMini = (arr:any[]) => (Array.isArray(arr)? arr : []).map((x:any)=> ({ id: String(x?.id||x?.slug||x?.name||''), label: String(x?.name||x?.label||''), img: String(x?.image||x?.img||'') })).filter((x:any)=> x.id && x.label)
            let list:any[] = []
            try{ list = list.concat(catFromMini(d.featured||[])) }catch{}
            try{ if (Array.isArray(d.sidebarItems)) for (const it of d.sidebarItems){ if (Array.isArray(it?.featured)) list = list.concat(catFromMini(it.featured)); if (it?.grid?.mode==='explicit' && Array.isArray(it?.grid?.categories)) list = list.concat(catFromMini(it.grid.categories)); if (it?.suggestions && Array.isArray(it.suggestions.items)) list = list.concat(catFromMini(it.suggestions.items)); } }catch{}
            // fallback إلى promoBanner أو عنوان
            if (!list.length && d.title){ list = [{ id: 'title', label: String(d.title), img:'' }] }
            if (Array.isArray(list) && list.length){ categories.value = list.slice(0, 20) }
          }
        }
      }catch{}
    })
  }catch{}
});

onBeforeUnmount(() => {
  clearInterval(interval);
  window.removeEventListener('scroll', handleWindowScroll);
});

function handleWindowScroll() {
  const y = window.scrollY;
  isScrollingUp.value = y < lastScrollY;
  compact.value = y > 90;
  atTop.value = y <= 0;
  lastScrollY = y;

  // التحميل اللانهائي
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  const clientHeight = window.innerHeight;
  
  if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingMore.value) {
    loadMoreProducts();
  }
}

function onScroll(e: Event) {
  const el = page.value;
  if (!el) return;
  const y = el.scrollTop;
  isScrollingUp.value = y < lastScrollY;
  compact.value = y > 90;
  atTop.value = y <= 0;
  lastScrollY = y;
}

function setFilter(filter: 'recommend'|'popular'|'rating') {
  activeFilter.value = filter;
  priceSort.value = null;
  void loadProducts()
}

function togglePriceSort() {
  activeFilter.value = 'price';
  if (priceSort.value === null || priceSort.value === 'desc') {
    priceSort.value = 'asc';
  } else {
    priceSort.value = 'desc';
  }
  void loadProducts()
}

function onCategoryClick(c: {id:string;label:string;img:string}) {
  if (!c?.id) return
  const slugOrId = c.id
  router.push({ path: `/c/${encodeURIComponent(slugOrId)}` })
}

// فلاتر متقدمة
const filterSheet = ref<{ open:boolean; type:'category'|'size'|'color'|'material'|'style'|null }>({ open:false, type:null })
const selSizes = ref<string[]>([])
const selColors = ref<string[]>([])
const selMaterials = ref<string[]>([])
const selStyles = ref<string[]>([])
function openFilter(t:'category'|'size'|'color'|'material'|'style'){ filterSheet.value = { open:true, type:t } }
function closeFilter(){ filterSheet.value.open=false; filterSheet.value.type=null }
function applyFilters(){ closeFilter(); void loadProducts() }
function applySearch(){
  try{
    const q = String(searchQ.value||'').trim()
    if (q){
      import('@/lib/track').then(m=> m.trackEvent('Search', { search_string: q }))
    }
  }catch{}
  void loadProducts()
}

// وظائف التنقل
function goBack() {
  router.back();
}

function goToWishlist() {
  router.push('/wishlist');
}

function goToCart() {
  router.push('/cart');
}

function openProduct(product: any) {
  router.push(`/p?id=${product.id}`);
}

function addToCart(product: any) {
  cart.add({
    id: product.id,
    title: product.title,
    price: parseFloat(product.basePrice),
    img: product.image,
    variantColor: product.colors?.[0] || 'أبيض',
    variantSize: 'M'
  });
}

// تحميل المزيد من المنتجات
function loadMoreProducts() {
  if (isLoadingMore.value) return;
  if (!hasMore.value) return;
  isLoadingMore.value = true;
  const prev = products.value.length
  ;(async ()=>{
    try{
      const slug = currentSlug()
      const sort = mapSort()
      const pageSize = 24
      const offset = prev
      const url = new URL(`${API_BASE}/api/catalog/${encodeURIComponent(slug)}`)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('offset', String(offset))
      if (sort) url.searchParams.set('sort', sort)
      const q = String(searchQ.value||'').trim(); if(q) url.searchParams.set('q', q)
      if (selSizes.value.length) url.searchParams.set('sizes', selSizes.value.join(','))
      if (selColors.value.length) url.searchParams.set('colors', selColors.value.join(','))
      if (selMaterials.value.length) url.searchParams.set('materials', selMaterials.value.join(','))
      if (selStyles.value.length) url.searchParams.set('styles', selStyles.value.join(','))
      const data = await apiGet<any>(`/api/catalog/${encodeURIComponent(slug)}?${url.searchParams.toString()}`).catch(()=> null)
      const items = Array.isArray(data?.items)? data.items : []
      const slice = items.map((it:any)=> ({
        id: String(it.id),
        title: String(it.name||''),
        image: Array.isArray(it.images)&&it.images[0]? it.images[0] : '/images/placeholder-product.jpg',
        images: Array.isArray(it.images)? it.images : [],
        basePrice: Number(it.price||0).toFixed(2),
        brand: it.brand||'',
        discountPercent: typeof it.discountPercent==='number'? it.discountPercent : undefined,
        bestRank: typeof it.bestRank==='number'? it.bestRank : undefined,
        bestRankCategory: it.bestRankCategory || undefined,
        soldPlus: it.soldPlus || undefined,
        overlayBannerSrc: it.overlayBannerSrc || undefined,
        overlayBannerAlt: it.overlayBannerAlt || undefined,
        _ratio: undefined,
        _imgLoaded: false
      }))
      if (slice.length){
        // جس النسب قبل الإضافة لمنع أي قفزات لاحقة
        await Promise.all(slice.map((p:any)=> probeRatioPromise(p)))
        products.value = products.value.concat(slice)
        hasMore.value = items.length >= pageSize
        const nextPage = Math.floor(prev / pageSize) + 1
        pageNumber.value = nextPage
        try{ await fireListView(slice, nextPage) }catch{}
        try{ markTrending(products.value as any[]) }catch{}
        try{ await hydrateCouponsAndPrices() }catch{}
      } else {
        hasMore.value = false
      }
    } finally {
      isLoadingMore.value = false
    }
  })()
}

const visibleCategories = computed(()=> categories.value.slice(0,5))
const compactCategories = computed(()=> categories.value.slice(0,4))

// ===== تحميل بيانات الفئة والمنتجات =====
function currentSlug(): string { try{ return String(route.params.slug||'') }catch{ return '' } }

async function loadCategories(){
  try{
    const data = await apiGet<any>('/api/categories?limit=200')
    const list = Array.isArray(data?.categories)? data.categories : []
    allCategories.value = list.map((c:any)=> ({ id:String(c.id), slug:c.slug||null, name:String(c.name||''), parentId: c.parentId? String(c.parentId) : null, image: c.image||null }))
    const slug = currentSlug()
    const cur = allCategories.value.find(c=> c.id===slug || (c.slug && c.slug===slug)) || null
    currentCategory.value = cur ? { id: cur.id, slug: cur.slug||undefined, name: cur.name } : null
    // Build child categories list
    const children = cur ? allCategories.value.filter(c=> String(c.parentId||'')===cur.id) : []
    categories.value = children.map(c=> ({
      id: c.slug||c.id,
      label: c.name,
      img: buildThumbUrl(c.image || '/images/placeholder-product.jpg', 112, 60)
    }))
  }catch{ allCategories.value = []; currentCategory.value = null; categories.value = [] }
}

function mapSort(): string {
  if (activeFilter.value==='price') return priceSort.value==='asc' ? 'price_asc' : 'price_desc'
  // popular/recommend fall back to backend default
  return 'reco'
}

async function loadProducts(limit: number = 24){
  try{
    productsLoading.value = true
    const slug = currentSlug()
    const sort = mapSort()
    const url = new URL(`${API_BASE}/api/catalog/${encodeURIComponent(slug)}`)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', '0')
    if (sort) url.searchParams.set('sort', sort)
    const q = String(searchQ.value||'').trim(); if(q) url.searchParams.set('q', q)
    if (selSizes.value.length) url.searchParams.set('sizes', selSizes.value.join(','))
    if (selColors.value.length) url.searchParams.set('colors', selColors.value.join(','))
    if (selMaterials.value.length) url.searchParams.set('materials', selMaterials.value.join(','))
    if (selStyles.value.length) url.searchParams.set('styles', selStyles.value.join(','))
    const path = `/api/catalog/${encodeURIComponent(slug)}?${url.searchParams.toString()}`
    const data = await apiGet<any>(path).catch(()=> null)
    const items = Array.isArray(data?.items)? data.items : []
    const mapped = items.map((it:any)=> ({
      id: String(it.id),
      title: String(it.name||''),
      image: Array.isArray(it.images)&&it.images[0]? it.images[0] : '/images/placeholder-product.jpg',
      images: Array.isArray(it.images)? it.images : [],
      basePrice: Number(it.price||0).toFixed(2),
      brand: it.brand||'',
      discountPercent: typeof it.discountPercent==='number'? it.discountPercent : undefined,
      bestRank: typeof it.bestRank==='number'? it.bestRank : undefined,
      bestRankCategory: it.bestRankCategory || undefined,
      soldPlus: it.soldPlus || undefined,
      overlayBannerSrc: it.overlayBannerSrc || undefined,
      overlayBannerAlt: it.overlayBannerAlt || undefined,
      _ratio: undefined,
      _imgLoaded: false
    }))
    // جس النسب قبل العرض لضمان أن الهيكل يطابق الصورة
    await Promise.all(mapped.slice(0, limit).map((p:any)=> probeRatioPromise(p)))
    products.value = mapped
    try{ markTrending(products.value as any[]) }catch{}
    // جس لاحق لأي عناصر إضافية خارج أول دفعة إن لزم
    setTimeout(()=>{ try{ for (const p of products.value.slice(limit, limit*2)){ probeRatioOnce(p) } }catch{} }, 0)
    hasMore.value = items.length >= limit
    try{ await hydrateCouponsAndPrices() }catch{}
    try{
      pageNumber.value = 1;
      await fireListView(products.value.slice(0, Math.min(24, products.value.length)), 1)
    }catch{}
  }catch{ products.value = []; hasMore.value = false }
  finally { productsLoading.value = false }
}

async function bootstrap(){ await loadCategories(); await loadProducts() }

watch(()=> route.params.slug, ()=>{ void bootstrap() })

// ===== كوبونات وتطبيق السعر بعد الخصم على البطاقات =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const base = (await import('../../lib/api')).API_BASE
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${base}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
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

// ===== Tracking helper: ViewCategory / ProductListView =====
async function fireListView(list:any[], page:number){
  try{
    if (!Array.isArray(list) || !list.length) return
    const { trackEvent } = await import('../../lib/track')
    const categoryName = String(currentCategory.value?.name || currentSlug() || '').trim()
    const contents = list.map((p:any, i:number)=> ({
      id: String(p.id),
      item_price: Number(String(p.basePrice||'0').replace(/[^0-9.]/g,''))||0,
      quantity: 1,
      position: i + 1,
      page_number: page
    }))
    const ids = contents.map(c=> c.id)
    await trackEvent('ViewCategory', {
      content_ids: ids,
      content_type: 'product_group',
      contents,
      currency: (window as any).__CURRENCY_CODE__||'YER'
    })
  }catch{}
}

// ===== صور مصغرة مستجيبة =====
function thumb(u: string): string {
  return buildThumbUrl(u, 384, 60)
}

// ===== خيارات المنتج (إضافة للسلة من البطاقة) =====
const optionsModal = reactive<{ open: boolean; productId: string; color: string; size: string; groupValues: Record<string, string> }>({
  open: false, productId: '', color: '', size: '', groupValues: {}
})
const optionsProduct = ref<any|null>(null)
const requireOptionsNotice = ref(false)
const toast = ref(false)
const toastText = ref('تمت الإضافة إلى السلة')
function showToast(msg?: string){ try{ if(msg) toastText.value = msg }catch{}; toast.value = true; setTimeout(()=>{ toast.value=false; try{ toastText.value='تمت الإضافة إلى السلة' }catch{} }, 1200) }

async function fetchProductDetails(id: string){
  try{
    const d = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`)
    const imgs = Array.isArray(d.images)? d.images : []
    const filteredImgs = imgs.filter((u:string)=> /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
    const galleries = Array.isArray(d.colorGalleries) ? d.colorGalleries : []
    const colors = galleries.map((g:any)=> ({ label: String(g.name||'').trim(), img: (g.primaryImageUrl || (Array.isArray(g.images)&&g.images[0]) || filteredImgs[0] || '/images/placeholder-product.jpg') })).filter((c:any)=> !!c.label)
    const sizes: string[] = Array.isArray(d.sizes)? d.sizes: []
    const letters = sizes.filter((s:string)=> /^(xxs|xs|s|m|l|xl|2xl|3xl|4xl|5xl)$/i.test(String(s)))
    const numbers = sizes.filter((s:string)=> /^\\d{1,3}$/.test(String(s)))
    const sizeGroups: Array<{label:string; values:string[]}> = []
    if (letters.length) sizeGroups.push({ label:'مقاسات بالأحرف', values: letters })
    if (numbers.length) sizeGroups.push({ label:'مقاسات بالأرقام', values: numbers })
    optionsProduct.value = { id: d.id||id, title: d.name||'', price: Number(d.price||0), images: filteredImgs.length? filteredImgs: ['/images/placeholder-product.jpg'], colors, sizes, sizeGroups, colorGalleries: galleries }
  }catch{ optionsProduct.value = { id, title:'', price:0, images: ['/images/placeholder-product.jpg'], colors: [], sizes: [], sizeGroups: [] } }
}

async function openSuggestOptions(id: string){
  try{
    const d = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`)
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
  }catch{}
  optionsModal.productId = id
  optionsModal.color = ''
  optionsModal.size = ''
  optionsModal.groupValues = {}
  optionsModal.open = true
  await fetchProductDetails(id)
}
function closeOptions(){ optionsModal.open = false }
function onOptionsSave(payload: { color: string; size: string }){
  try{
    const prod = optionsProduct.value
    const groups = Array.isArray(prod?.sizeGroups) ? prod!.sizeGroups : []
    if (groups.length){
      const composite = String(payload.size||'')
      const missing = groups.some((g:any)=> !new RegExp(`(?:^|\\|)${g.label}:[^|]+`).test(composite))
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
</script>
<style>
 
 .truncate-2-lines {
   display: -webkit-box;
   -webkit-box-orient: vertical;
   -webkit-line-clamp: 2;
   line-clamp: 2;
   overflow: hidden;
   text-overflow: ellipsis;
 }
 
 /* انتقال سلس للفئات */
 .category-switch-enter-active,
 .category-switch-leave-active {
   transition: all 0.25s ease-in-out;
 }
 
 .category-switch-enter-from {
   opacity: 0;
   transform: translateY(-8px) scale(0.98);
 }
 
 .category-switch-leave-to {
   opacity: 0;
   transform: translateY(8px) scale(0.98);
 }
 </style>
