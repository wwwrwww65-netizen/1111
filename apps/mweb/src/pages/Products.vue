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
      <!-- Skeleton grid (initial/refresh) -->
      <div v-if="initialLoading" class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="i in 8" :key="'sk-prod-'+i" class="mb-1 break-inside-avoid">
          <div class="w-full border border-gray-200 rounded bg-white overflow-hidden">
            <div class="w-full bg-gray-200 animate-pulse aspect-[255/192]"></div>
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
      <!-- Real grid -->
      <div v-else class="columns-2 gap-1 [column-fill:_balance]">
        <div v-for="(p,i) in products" :key="'product-'+i" class="mb-1 break-inside-avoid">
          <ProductGridCard 
            :product="{ id: p.id, title: p.title, images: (p.images && p.images.length ? p.images : [p.image]), overlayBannerSrc: (p as any).overlayBannerSrc, overlayBannerAlt: (p as any).overlayBannerAlt, brand: p.brand, discountPercent: p.discountPercent, bestRank: p.bestRank, bestRankCategory: p.bestRankCategory, basePrice: p.basePrice, soldPlus: p.soldPlus, couponPrice: p.couponPrice, isTrending: (p as any).isTrending===true || (Array.isArray((p as any).badges) && (p as any).badges.some((b:any)=> /trending|trend|ترند/i.test(String(b?.key||b?.title||'')))) }"
            @add="onCardAdd(p)"
          />
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

    <!-- Toast notification (مطابق لصفحة المنتج) -->
    <div 
      v-if="toast" 
      class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2"
    >
      <Check class="w-4 h-4 text-green-400" />
      <span>{{ toastText }}</span>
    </div>

    <!-- Modal for options from cards -->
    <ProductOptionsModal
      v-if="modalOpen"
      :onClose="()=>{ modalOpen=false }"
      :onSave="onModalSave"
      :product="modalProduct"
      :selectedColor="modalColor"
      :selectedSize="modalSize"
      :groupValues="undefined"
      :hideTitle="true"
      primaryLabel="إضافة إلى السلة"
      :showWishlist="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCart } from '../store/cart';
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
import { apiGet, API_BASE } from '@/lib/api'
import { buildThumbUrl } from '@/lib/media'
import { trackEvent } from '@/lib/track'
import { markTrending } from '@/lib/trending'
import { Check } from 'lucide-vue-next'

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
    brand: 'JEEEY',
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
    brand: 'JEEEY',
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
    brand: 'JEEEY',
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
    brand: 'JEEEY',
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
    brand: 'JEEEY',
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
    brand: 'JEEEY',
    discountPercent: 20,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
    colorCount: 6,
    soldPlus: 'باع 600+'
  }
]);
// annotate trending ids from Admin as they load
markTrending(products.value)
// Skeleton control for initial paint
const initialLoading = ref(true)
function preloadFirstImages(): Promise<void>{
  const urls: string[] = []
  try{
    for (const p of products.value){ const u = (Array.isArray(p.images)&&p.images[0]) || p.image; if (u) urls.push(u); if (urls.length>=8) break }
  }catch{}
  const tasks = urls.map(u=> new Promise<void>(res=>{ const img = new Image(); img.onload = ()=> res(); img.onerror = ()=> res(); img.src = u }))
  return new Promise<void>((resolve)=>{
    let settled = false
    const timer = setTimeout(()=>{ if (!settled){ settled = true; resolve() } }, 500)
    Promise.allSettled(tasks).then(()=>{ if (!settled){ settled = true; clearTimeout(timer); resolve() } })
  })
}

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
const pageNumber = ref(1);
const currentListName = ref<string>('Products');
const currentCategoryName = ref<string>('');

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
  // show skeleton briefly until key images are ready
  preloadFirstImages().catch(()=>{}).finally(()=>{ initialLoading.value = false })
  interval = setInterval(()=> { promoIndex.value = (promoIndex.value + 1) % promoWords.length }, 3000);
  lastScrollY = window.scrollY || 0;
  atTop.value = lastScrollY <= 0;
  isScrollingUp.value = false;
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  // حساب أسعار بعد الكوبون إن وُجدت كوبونات مناسبة
  try{ hydrateCouponsAndPrices() }catch{}
  try{ fireListView(products.value, 1) }catch{}
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
  try{
    currentCategoryName.value = c.label || '';
    currentListName.value = 'Category';
    pageNumber.value = 1;
    // إرسال ViewCategory
    const ids = (products.value||[]).slice(0, 20).map((p:any)=> String(p.id));
    const contents = (products.value||[]).slice(0, 20).map((p:any, i:number)=> ({ id:String(p.id), item_price: Number(String(p.basePrice||'0').replace(/[^0-9.]/g,''))||0, quantity:1, position: i+1 }));
    trackEvent('ViewCategory', { content_ids: ids, content_type:'product', contents, currency: (window as any).__CURRENCY_CODE__||'YER' });
  }catch{}
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

// Modal state for card add-to-cart
const modalOpen = ref(false)
const modalProduct = ref<any|null>(null)
const modalColor = ref('')
const modalSize = ref('')
const modalGroups = ref<Array<{ label:string; values:string[] }>>([])
const toast = ref(false)
const toastText = ref('تمت الإضافة إلى السلة')
function showToast(msg?: string){
  try{ if (msg) toastText.value = msg }catch{}
  toast.value = true
  setTimeout(()=>{ toast.value = false; try{ toastText.value = 'تمت الإضافة إلى السلة' }catch{} }, 1200)
}
async function openOptions(pid: string){
  try{
    modalOpen.value = true
    modalProduct.value = null
    // fetch product details (reuse PDP endpoint)
    const d = await apiGet<any>(`/api/product/${encodeURIComponent(pid)}`)
    const imgs = Array.isArray(d.images)? d.images : []
    const colors = Array.isArray(d.colorGalleries) ? d.colorGalleries.map((g:any)=> ({ label: g.name, img: g.primaryImageUrl || g.images?.[0] || imgs[0] || '/images/placeholder-product.jpg' })) : []
    // size groups: derive as in PDP (simple two groups heuristic)
    const sizes: string[] = Array.isArray(d.sizes)? d.sizes : []
    const letters = sizes.filter((s:string)=> /^(xxs|xs|s|m|l|xl|2xl|3xl|4xl|5xl)$/i.test(String(s)))
    const numbers = sizes.filter((s:string)=> /^\d{1,3}$/.test(String(s)))
    const groups: Array<{label:string; values:string[]}> = []
    if (letters.length) groups.push({ label:'مقاسات بالأحرف', values: letters })
    if (numbers.length) groups.push({ label:'مقاسات بالأرقام', values: numbers })
    modalGroups.value = groups
    modalProduct.value = { id: d.id||pid, title: d.name||'', price: Number(d.price||0), images: imgs, colors, sizes, sizeGroups: groups }
    modalColor.value = colors?.[0]?.label || ''
    modalSize.value = ''
  }catch{ modalProduct.value = { id: pid, title:'', price:0, images: [], colors: [], sizes: [], sizeGroups: [] } }
}
function onModalSave(payload: { color: string; size: string }){
  try{
    const color = payload?.color || ''
    const size = payload?.size || ''
    if (!modalProduct.value) return
    cart.add({ id: modalProduct.value.id, title: modalProduct.value.title, price: Number(modalProduct.value.price||0), img: (modalProduct.value.images?.[0]||''), variantColor: color||undefined, variantSize: size||undefined }, 1)
    showToast()
  }finally{ modalOpen.value = false }
}

// Card add handler: if product has no options, add directly with toast; else open modal
async function onCardAdd(p: any){
  try{
    const id = p.id
    // quick probe: fetch minimal product details
    const d = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`)
    const galleries = Array.isArray(d?.colorGalleries) ? d.colorGalleries : []
    const colorsCount = galleries.filter((g:any)=> String(g?.name||'').trim()).length
    const hasColors = colorsCount > 1 // لونان فأكثر فقط تتطلب اختيار
    const sizesArr = Array.isArray(d?.sizes) ? (d.sizes as any[]).filter((s:any)=> typeof s==='string' && String(s).trim()) : []
    const variantsHasSize = Array.isArray(d?.variants) && d.variants.some((v:any)=> !!v?.size || /size|مقاس/i.test(String(v?.name||'')))
    const hasSizes = (new Set(sizesArr.map((s:string)=> s.trim().toLowerCase()))).size > 1 || (!!variantsHasSize && (sizesArr.length>1))
    if (!hasColors && !hasSizes){
      cart.add({ id, title: p.title, price: parseFloat(p.basePrice), img: (p.images&&p.images[0])||p.image }, 1)
      showToast()
      return
    }
    await openOptions(id)
  }catch{
    // fallback: add directly
    cart.add({ id: p.id, title: p.title, price: parseFloat(p.basePrice), img: (p.images&&p.images[0])||p.image }, 1)
    showToast()
  }
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
        brand: 'JEEEY',
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
        brand: 'JEEEY',
        discountPercent: 22,
        colors: ['#2c3e50', '#34495e'],
        colorCount: 3,
        soldPlus: 'باع 350+'
      }
    ];
    
    products.value.push(...newProducts);
    try{ markTrending(newProducts) }catch{}
    try{ computeCouponPrices(products.value) }catch{}
    isLoadingMore.value = false;
    try{ pageNumber.value = pageNumber.value + 1; fireListView(newProducts, pageNumber.value) }catch{}
  }, 1500);
}

const visibleCategories = categories.slice(0,5);
const compactCategories = categories.slice(0,4);

// ===== كوبونات وتطبيق السعر بعد الخصم على البطاقات =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const base = (await import('@/lib/api')).API_BASE
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${base}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
  // تخطّي me/coupons للزوار لتجنب 401 غير الضرورية
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

// ===== Tracking helper: ProductListView / ViewCategory =====
function fireListView(list:any[], page:number){
  try{
    const contents = (list||[]).map((p:any, i:number)=> ({ id:String(p.id), item_price: Number(String(p.basePrice||'0').replace(/[^0-9.]/g,''))||0, quantity:1, position: i+1, page_number: page }))
    const ids = contents.map(c=> c.id)
    trackEvent(currentCategoryName.value ? 'ViewCategory' : 'ProductListView', {
      content_ids: ids,
      content_type: 'product',
      contents,
      currency: (window as any).__CURRENCY_CODE__||'YER'
    })
  }catch{}
}

// ===== صور مصغرة مستجيبة =====
function thumb(u: string): string {
  return buildThumbUrl(String(u||''), 384, 60)
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
