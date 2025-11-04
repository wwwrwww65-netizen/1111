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
      <div class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="(p,i) in products" :key="'product-'+i" class="mb-1 break-inside-avoid">
          <div class="w-full border border-gray-200 rounded bg-white overflow-hidden cursor-pointer" role="button" :aria-label="'افتح '+(p.title||'المنتج')" tabindex="0" @click="openProduct(p)" @keydown.enter="openProduct(p)" @keydown.space.prevent="openProduct(p)">
            <div class="relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
              <div class="flex">
                <img v-for="(img,idx) in (p.images && p.images.length ? p.images : [p.image])" :key="'img-'+idx" :src="img" :alt="p.title" class="w-full h-auto object-cover block flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" />
              </div>
              <div v-if="(p.colors && p.colors.length) || (typeof p.colorCount==='number')" class="absolute bottom-2 right-2 flex items-center">
                <div class="flex flex-col items-center gap-0.5 bg-black/40 p-0.5 rounded-full">
                  <span v-for="(c,idx) in (p.colors||[]).slice(0,3)" :key="'clr-'+idx" class="w-3 h-3 rounded-full border border-white/20" :style="{ background: c }"></span>
                  <span v-if="typeof p.colorCount==='number'" class="mt-0.5 text-[9px] font-semibold px-1 rounded-full text-white/80 bg-white/5">{{ p.colorCount }}</span>
                </div>
              </div>
            </div>
            <div v-if="(p as any).overlayBannerSrc" class="w-full h-7 relative"><img :src="(p as any).overlayBannerSrc" :alt="(p as any).overlayBannerAlt||'شريط تسويقي'" class="absolute inset-0 w-full h-full object-cover" loading="lazy" /></div>
            <div class="relative p-2">
              <div class="inline-flex items-center border border-gray-200 rounded overflow-hidden"><span class="inline-flex items-center h-[18px] px-1.5 text-[11px] text-white bg-violet-700">ترندات</span><span class="inline-flex items-center h-[18px] px-1.5 text-[11px] bg-gray-100 text-violet-700"><Store :size="14" color="#6D28D9" :stroke-width="2" /><span class="max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap">{{ p.brand||'' }}</span><span class="text-violet-700 ms-0.5">&gt;</span></span></div>
              <div class="flex items-center gap-1 mt-1.5"><div v-if="typeof p.discountPercent==='number'" class="px-1 h-4 rounded text-[11px] font-bold border border-orange-300 text-orange-500 flex items-center leading-none">-%{{ p.discountPercent }}</div><div class="text-[12px] text-gray-900 font-medium leading-tight truncate">{{ p.title }}</div></div>
              <div v-if="(typeof p.bestRank==='number') || p.bestRankCategory" class="mt-1 inline-flex items-stretch rounded overflow-hidden"><div v-if="typeof p.bestRank==='number'" class="px-1 text-[9px] font-semibold flex items-center leading-none bg-[rgb(255,232,174)] text-[#c77210]">#{{ p.bestRank }} الأفضل مبيعاً</div><button v-if="p.bestRankCategory" class="px-1 text-[9px] font-bold flex items-center gap-1 leading-none bg-[rgba(254,243,199,.2)] text-[#d58700] border-0"><span>في {{ p.bestRankCategory }}</span><span>&gt;</span></button></div>
              <div v-if="p.basePrice || p.soldPlus" class="mt-1 flex items-center gap-1"><span v-if="p.basePrice" class="text-red-600 font-bold text-[13px]">{{ p.basePrice }} ريال</span><span v-if="p.soldPlus" class="text-[11px] text-gray-700">{{ p.soldPlus }}</span></div>
              <button v-if="p.basePrice || p.soldPlus" class="absolute left-2 bottom-6 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black bg-white" aria-label="أضف إلى السلة" @click.stop="addToCart(p)"><ShoppingCart :size="16" class="text-black" /><span class="text-[11px] font-bold text-black">1+</span></button>
              <div v-if="p.couponPrice" class="mt-1 h-7 inline-flex items-center gap-1 px-2 rounded bg-[rgba(249,115,22,.10)]"><span class="text-[13px] font-extrabold text-orange-500">{{ p.couponPrice }} ريال</span><span class="text-[11px] text-orange-500">/بعد الكوبون</span></div>
            </div>
          </div>
        </div>
      </div>
      <div style="height:80px" />
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
          <button v-for="s in ['XS','S','M','L','XL','2XL','3XL']" :key="s" @click="selSizes.value = selSizes.value.includes(s)? selSizes.value.filter(x=>x!==s) : [...selSizes.value, s]" :class="['px-2 py-1 rounded border text-[12px]', selSizes.value.includes(s)? 'bg-black text-white border-black':'bg-white text-gray-800 border-gray-300']">{{ s }}</button>
        </div>
        <div v-else-if="filterSheet.type==='color'" class="grid grid-cols-8 gap-2">
          <button v-for="c in ['black','white','red','blue','green','yellow','pink','beige']" :key="c" @click="selColors.value = selColors.value.includes(c)? selColors.value.filter(x=>x!==c) : [...selColors.value, c]" :class="['w-7 h-7 rounded-full border', selColors.value.includes(c)? 'ring-2 ring-black':'']" :style="{ background: c }" />
        </div>
        <div v-else-if="filterSheet.type==='material'" class="grid grid-cols-3 gap-2">
          <button v-for="m in ['cotton','polyester','wool','denim','silk']" :key="m" @click="selMaterials.value = selMaterials.value.includes(m)? selMaterials.value.filter(x=>x!==m) : [...selMaterials.value, m]" :class="['px-2 py-1 rounded border text-[12px]', selMaterials.value.includes(m)? 'bg-black text-white border-black':'bg-white text-gray-800 border-gray-300']">{{ m }}</button>
        </div>
        <div v-else-if="filterSheet.type==='style'" class="grid grid-cols-3 gap-2">
          <button v-for="st in ['casual','elegant','sport','classic','boho']" :key="st" @click="selStyles.value = selStyles.value.includes(st)? selStyles.value.filter(x=>x!==st) : [...selStyles.value, st]" :class="['px-2 py-1 rounded border text-[12px]', selStyles.value.includes(st)? 'bg-black text-white border-black':'bg-white text-gray-800 border-gray-300']">{{ st }}</button>
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
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
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

const router = useRouter();
const cart = useCart();
const { items } = storeToRefs(cart);

import { useRoute } from 'vue-router'
import { apiGet, API_BASE } from '../../lib/api'
const route = useRoute()
const allCategories = ref<Array<{ id:string; slug?:string|null; name:string; parentId?:string|null; image?:string|null }>>([])
const currentCategory = ref<{ id:string; slug?:string|null; name:string }|null>(null)
const categories = ref<Array<{ id:string; label:string; img:string }>>([])

// بيانات المنتجات (حقيقية من API)
const products = ref<any[]>([])
const hasMore = ref(false)

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
  try{ const fbq = (window as any).fbq; if (typeof fbq==='function'){ const q = String(searchQ.value||''); if(q) fbq('track','Search',{ search_string: q }) } }catch{}
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
  // TODO: دعم ترقيم حقيقي عند توفره في الـ API
  // حاليا نستدعي بنفس التصنيف مع limit أعلى ونوقف التحميل عند عدم تغير العدد
  const prev = products.value.length
  void loadProducts(prev + 24).finally(()=>{ isLoadingMore.value = false; hasMore.value = products.value.length > prev })
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
    categories.value = children.map(c=> ({ id:c.slug||c.id, label:c.name, img: c.image || '/images/placeholder-product.jpg' }))
  }catch{ allCategories.value = []; currentCategory.value = null; categories.value = [] }
}

function mapSort(): string {
  if (activeFilter.value==='price') return priceSort.value==='asc' ? 'price_asc' : 'price_desc'
  // popular/recommend fall back to backend default
  return 'reco'
}

async function loadProducts(limit: number = 24){
  try{
    const slug = currentSlug()
    const sort = mapSort()
    const url = new URL(`${API_BASE}/api/catalog/${encodeURIComponent(slug)}`)
    url.searchParams.set('limit', String(limit))
    if (sort) url.searchParams.set('sort', sort)
    const q = String(searchQ.value||'').trim(); if(q) url.searchParams.set('q', q)
    if (selSizes.value.length) url.searchParams.set('sizes', selSizes.value.join(','))
    if (selColors.value.length) url.searchParams.set('colors', selColors.value.join(','))
    if (selMaterials.value.length) url.searchParams.set('materials', selMaterials.value.join(','))
    if (selStyles.value.length) url.searchParams.set('styles', selStyles.value.join(','))
    const data = await fetch(url.toString(), { headers:{ 'Accept':'application/json' } }).then(r=> r.json()).catch(()=> null)
    const items = Array.isArray(data?.items)? data.items : []
    products.value = items.map((it:any)=> ({
      id: String(it.id),
      title: String(it.name||''),
      image: Array.isArray(it.images)&&it.images[0]? it.images[0] : '/images/placeholder-product.jpg',
      images: Array.isArray(it.images)? it.images : [],
      basePrice: Number(it.price||0).toFixed(2),
      brand: it.brand||'',
    }))
    hasMore.value = items.length >= limit
    try{ await hydrateCouponsAndPrices() }catch{}
  }catch{ products.value = []; hasMore.value = false }
}

async function bootstrap(){ await loadCategories(); await loadProducts() }

watch(()=> route.params.slug, ()=>{ void bootstrap() })

// ===== كوبونات وتطبيق السعر بعد الخصم على البطاقات =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const base = (await import('../../lib/api')).API_BASE
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${base}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
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

<style>
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }

.category-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

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
