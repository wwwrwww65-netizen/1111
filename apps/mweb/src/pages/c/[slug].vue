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
            <div class="flex-1 flex items-center justify-start">
              <span class="text-[12px] text-gray-400 truncate">
                {{ promoWords[promoIndex] }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button aria-label="كاميرا" class="w-7 h-7 flex items-center justify-center opacity-60">
                <Camera class="w-4 h-4 text-gray-500" />
              </button>
              <div class="h-7 px-3 rounded-full flex items-center justify-center shadow-sm" style="background-color:#8a1538">
                <Search class="w-4 h-4 text-white" />
              </div>
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
        <div v-if="!compact" key="normal" class="bg-white border-t border-gray-100">
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
        <div v-else key="compact" class="bg-white border-t border-gray-100">
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

      <!-- نسخة الفلاتر في الهيدر -->
      <div v-if="showHeaderFilters" class="bg-white border-t border-gray-100 px-2 py-2">
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
          <button v-for="f in ['الفئات','المقاس','اللون','المواد','الأسلوب']" :key="f" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
            {{ f }} <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- مساحة للهيدر الثابت -->
    <div :style="{ height: headerHeight + 'px' }"></div>
    
    <!-- الفلاتر السفلية -->
    <div v-if="!showHeaderFilters" class="h-3"></div>
    <section v-if="!showHeaderFilters" class="bg-white border-b border-gray-200 px-2 py-2">
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
        <button 
          v-for="f in ['الفئات','المقاس','اللون','المواد','الأسلوب']" 
          :key="f" 
          class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
          {{ f }}
          <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
        </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
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

const categories = [
  { id: 1, label: "ملابس بحر نسائية", img: "/cat1.png" },
  { id: 2, label: "ملابس منسوجة أنيقة", img: "/cat2.png" },
  { id: 3, label: "فساتين نسائية", img: "/cat3.png" },
  { id: 4, label: "ملابس علوية & بلايز", img: "/cat4.png" },
  { id: 5, label: "ملابس علوية مزخرفة طويلة", img: "/cat5.png" },
  { id: 6, label: "تيشيرتات كاجوال", img: "/cat6.png" },
  { id: 7, label: "بلايز وقطع علوية", img: "/cat7.png" },
];

// بيانات المنتجات
const products = ref([
  {
    id: '1',
    title: 'تيشيرت نسائي بياقة مستديرة وقماش مريح',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop'
    ],
    basePrice: '34.00',
    brand: 'SHEIN',
    discountPercent: 20,
    colors: ['#ffffff', '#ff6b6b', '#4ecdc4'],
    colorCount: 5,
    soldPlus: 'باع 1000+',
    bestRank: 1,
    bestRankCategory: 'التيشيرتات'
  },
  {
    id: '2',
    title: 'فستان نسائي أنيق للصيف',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=200&auto=format&fit=crop',
    basePrice: '89.00',
    brand: 'SHEIN',
    discountPercent: 15,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    colorCount: 3,
    soldPlus: 'باع 500+',
    couponPrice: '75.00'
  },
  {
    id: '3',
    title: 'جاكيت نسائي شتوي دافئ',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=200&auto=format&fit=crop',
    basePrice: '120.00',
    brand: 'SHEIN',
    discountPercent: 25,
    colors: ['#2c3e50', '#34495e', '#7f8c8d'],
    colorCount: 4,
    soldPlus: 'باع 200+'
  },
  {
    id: '4',
    title: 'بنطلون جينز نسائي كاجوال',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=200&auto=format&fit=crop',
    basePrice: '65.00',
    brand: 'SHEIN',
    discountPercent: 10,
    colors: ['#2c3e50', '#34495e'],
    colorCount: 2,
    soldPlus: 'باع 800+',
    bestRank: 2,
    bestRankCategory: 'البناطيل'
  },
  {
    id: '5',
    title: 'بلوزة نسائية أنيقة للعمل',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&auto=format&fit=crop',
    basePrice: '45.00',
    brand: 'SHEIN',
    discountPercent: 30,
    colors: ['#ffffff', '#f8f9fa', '#e9ecef'],
    colorCount: 3,
    soldPlus: 'باع 300+'
  },
  {
    id: '6',
    title: 'تنورة نسائية قصيرة صيفية',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&auto=format&fit=crop',
    basePrice: '55.00',
    brand: 'SHEIN',
    discountPercent: 20,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
    colorCount: 6,
    soldPlus: 'باع 600+'
  }
]);

const cartBadge = computed(() => items.value.length);
const promoWords = ["فساتين","هودي","بلايز","تيشيرت","جواكت"];
const promoIndex = ref(0);
const activeFilter = ref<'recommend'|'popular'|'price'|'rating'>('recommend');
const priceSort = ref<'asc'|'desc'|null>(null);
const compact = ref(false);
const page = ref<HTMLElement | null>(null);

const isScrollingUp = ref(false);
const atTop = ref(true);
const showHeaderFilters = computed(() => isScrollingUp.value && !atTop.value);
const isLoadingMore = ref(false);

// حساب ارتفاع الهيدر ديناميكيًا
const headerHeight = computed(() => {
  let height = 48; // الهيدر الأساسي (h-12 = 3rem = 48px)
  
  if (!compact.value) {
    height += 100; // الفئات العادية
  } else {
    height += 60; // الفئات المضغوطة
  }
  
  if (showHeaderFilters.value) {
    height += 80; // الفلاتر في الهيدر
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
}

function togglePriceSort() {
  activeFilter.value = 'price';
  if (priceSort.value === null || priceSort.value === 'desc') {
    priceSort.value = 'asc';
  } else {
    priceSort.value = 'desc';
  }
}

function onCategoryClick(c: {id:number,label:string,img:string}) {
  console.log('category', c);
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
  
  isLoadingMore.value = true;
  
  // محاكاة تحميل المنتجات من API
  setTimeout(() => {
    const newProducts = [
      {
        id: `${products.value.length + 1}`,
        title: 'منتج جديد ' + (products.value.length + 1),
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=200&auto=format&fit=crop',
        basePrice: '75.00',
        brand: 'SHEIN',
        discountPercent: 18,
        colors: ['#ff6b6b', '#4ecdc4'],
        colorCount: 2,
        soldPlus: 'باع 400+'
      },
      {
        id: `${products.value.length + 2}`,
        title: 'منتج جديد ' + (products.value.length + 2),
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=200&auto=format&fit=crop',
        basePrice: '95.00',
        brand: 'SHEIN',
        discountPercent: 22,
        colors: ['#2c3e50', '#34495e'],
        colorCount: 3,
        soldPlus: 'باع 350+'
      }
    ];
    
    products.value.push(...newProducts);
    isLoadingMore.value = false;
  }, 1500);
}

const visibleCategories = categories.slice(0,5);
const compactCategories = categories.slice(0,4);
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
