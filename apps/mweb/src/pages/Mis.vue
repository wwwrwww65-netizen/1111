<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <!-- الهيدر (ثابت أعلى) -->
    <div class="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="h-12 px-2 flex items-center justify-between">
        <!-- يمين: رجوع + قائمة -->
        <div class="flex items-center gap-0.5">
          <button aria-label="رجوع" class="w-8 h-8 flex items-center justify-center p-0">
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
          <button aria-label="المفضلة" class="w-8 h-8 flex items-center justify-center p-0">
            <Heart class="w-5 h-5 text-gray-700" />
          </button>
          <button aria-label="عربة التسوق" class="w-8 h-8 flex items-center justify-center p-0 relative">
            <ShoppingCart class="w-5 h-5 text-gray-700" />
            <span v-if="cartBadge > 0" class="absolute -top-1 -left-1 min-w-[16px] h-4 text-[10px] leading-4 rounded-full bg-red-500 text-white flex items-center justify-center px-1">
              {{ cartBadge }}
            </span>
          </button>
        </div>
      </div>

      <!-- منطقة الفئات: الوضع العادي -->
      <div v-if="!compact" class="bg-white border-t border-gray-100">
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

      <!-- منطقة الفئات: الوضع المضغوط -->
      <div v-if="compact" class="bg-white border-t border-gray-100">
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
                <path :fill="priceSort === 'desc' ? '#000' : '#9ca3af'" d="M87.8,243c-2,0-4-1-5-2.5l-52.7-77.8l10.5-7l-41.2-60.3V10h12.5v226.5c0,2.5-2,5-4.5,6C88.8,242.5,88.3,243,87.8,243z"/>
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
            d="M87.8,243c-2,0-4-1-5-2.5l-52.7-77.8l10.5-7l-41.2-60.3V10h12.5v226.5c0,2.5-2,5-4.5,6C88.8,242.5,88.3,243,87.8,243z"/>
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

    <!-- منطقة محتوى المنتجات -->
    <section class="px-2 py-4">
      <div class="text-[12px] text-gray-500 text-center py-6">
        منطقة عرض بطاقات المنتجات (ضع هنا مكون ProductCard)
      </div>

      <!-- محتوى تجريبي -->
      <div v-for="n in 8" :key="n" class="mb-4">
        <div class="bg-white rounded-md p-3 border border-gray-200">
          <div class="h-28 bg-gray-50 flex items-center justify-center text-gray-400">
            بطاقة منتج تجريبية {{ n }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import {
  ArrowRight,
  Menu,
  ShoppingCart,
  Heart,
  Search,
  Camera,
  Filter,
  ChevronDown as ArrowDown,
} from 'lucide-vue-next';

const categories = [
  { id: 1, label: "ملابس بحر نسائية", img: "/cat1.png" },
  { id: 2, label: "ملابس منسوجة أنيقة", img: "/cat2.png" },
  { id: 3, label: "فساتين نسائية", img: "/cat3.png" },
  { id: 4, label: "ملابس علوية & بلايز", img: "/cat4.png" },
  { id: 5, label: "ملابس علوية مزخرفة طويلة", img: "/cat5.png" },
  { id: 6, label: "تيشيرتات كاجوال", img: "/cat6.png" },
  { id: 7, label: "بلايز وقطع علوية", img: "/cat7.png" },
];

const cartBadge = 5;
const promoWords = ["فساتين","هودي","بلايز","تيشيرت","جواكت"];
const promoIndex = ref(0);
const activeFilter = ref<'recommend'|'popular'|'price'|'rating'>('recommend');
const priceSort = ref<'asc'|'desc'|null>(null);
const compact = ref(false);

const isScrollingUp = ref(true);
const atTop = ref(true);
const showHeaderFilters = computed(() => isScrollingUp.value || atTop.value);

let interval: any;
let lastScrollY = 0;

onMounted(() => {
  interval = setInterval(()=> { promoIndex.value = (promoIndex.value + 1) % promoWords.length }, 3000);
  lastScrollY = window.scrollY || 0;
  atTop.value = lastScrollY <= 0;
  isScrollingUp.value = true;
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
}

// Scroll handled globally on window only to avoid container discrepancies

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
  overflow: hidden;
  text-overflow: ellipsis;
}

.truncate-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
