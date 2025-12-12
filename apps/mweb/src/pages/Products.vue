<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl" @scroll.passive="onScroll" ref="page">
    <!-- Hidden SEO Content -->
    <div v-if="seoHead.hiddenContent" id="seo-hidden-content" style="display:none;visibility:hidden;" v-html="seoHead.hiddenContent"></div>

    <!-- الهيدر (ثابت أعلى) -->
    <div class="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div class="h-12 px-2 flex items-center justify-between">
        <!-- يمين: رجوع + قائمة -->
        <div class="flex items-center gap-0.5">
          <button aria-label="رجوع" class="w-8 h-8 flex items-center justify-center p-0" @click="goBack">
            <ChevronRight class="w-7 h-7 text-[#8a1538]" />
          </button>
          <button aria-label="الفئات" class="w-8 h-8 flex items-center justify-center p-0" @click="goToCategories">
            <Menu class="w-5 h-5 text-[#8a1538]" />
          </button>
        </div>

        <!-- الوسط: شريط البحث -->
        <div class="flex-1 px-1">
          <div 
            class="flex items-center bg-gray-100 rounded-full h-9 pl-1 pr-3 gap-2 cursor-pointer" 
            @click="goToSearch"
          >
            <!-- Input (Readonly/Fake) -->
            <div class="flex-1 text-[12px] text-gray-500 text-right truncate">
              ابحث في المنتجات
            </div>
            
            <!-- Camera Icon -->
            <button class="opacity-60 flex items-center justify-center" aria-label="بحث بالصور">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Search Button (Oval) -->
            <div class="bg-[#8a1538] rounded-[16px] w-[44px] h-[30px] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- يسار: مفضلة + سلة -->
        <div class="flex items-center gap-0.5">
          <button aria-label="المفضلة" class="w-8 h-8 flex items-center justify-center p-0" @click="goToWishlist">
            <Heart class="w-5 h-5 text-[#8a1538]" />
          </button>
          <button aria-label="عربة التسوق" class="w-8 h-8 flex items-center justify-center p-0 relative" @click="goToCart">
            <div class="relative">
              <ShoppingCart class="w-5 h-5 text-[#8a1538]" />
              <span v-if="cartBadge > 0" class="absolute -top-1.5 -right-2 bg-red-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] px-0.5 border border-white font-bold">
                {{ cartBadge }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- منطقة الفئات (الأقسام الرئيسية) -->
      <Transition name="category-switch" mode="out-in">
        <!-- الوضع العادي -->
        <div v-if="!compact && categories.length>0" key="normal" class="bg-white border-t border-gray-100">
          <div class="flex gap-2 overflow-x-auto no-scrollbar px-2 py-2 items-start">
            <RouterLink
              v-for="c in visibleCategories"
              :key="c.id"
              class="flex flex-col items-center min-w-[76px] pb-1 cursor-pointer"
              :to="`/c/${encodeURIComponent(c.id)}`"
            >
              <div class="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                <img :src="c.img" :alt="c.label" class="w-full h-full object-cover" />
              </div>
              <span class="mt-1 text-[12px] text-gray-700 text-center leading-tight category-title">
                {{ c.label }}
              </span>
            </RouterLink>
          </div>
        </div>

        <!-- الوضع المضغوط -->
        <div v-else-if="compact && categories.length>0" key="compact" class="bg-white border-t border-gray-100">
          <div class="flex gap-1.5 overflow-x-auto no-scrollbar px-2 py-1 items-center">
            <RouterLink
              v-for="c in compactCategories"
              :key="c.id"
              class="flex items-center gap-1.5 min-w-[85px] max-w-[85px] px-1 py-1 rounded-md hover:bg-gray-50 cursor-pointer"
              :to="`/c/${encodeURIComponent(c.id)}`"
            >
              <div class="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                <img :src="c.img" :alt="c.label" class="w-full h-full object-cover" />
              </div>
              <div class="text-right flex-1 min-w-0">
                <div class="text-[10px] text-gray-800 leading-tight truncate-2-lines break-words">
                  {{ c.label }}
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </Transition>

      <!-- نسخة الفلاتر في الهيدر -->
      <Transition name="fade-slide">
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
      </Transition>
    </div>

    <!-- مساحة للهيدر الثابت -->
    <div :style="{ height: headerHeight + 'px' }"></div>
    
    <!-- الفلاتر السفلية -->
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
    <section class="px-1 pb-1">
      <!-- Skeleton grid أثناء التحميل (يحاكي شبكة متغيرة الارتفاع) -->
      <div v-if="productsLoading" class="product-grid grid grid-cols-2 gap-x-[5px] gap-y-0 grid-flow-row-dense">
        <!-- عمود يسار (عناصر فردية) -->
        <div>
          <div v-for="i in skeletonLeft" :key="'skl-l-'+i" class="mb-[6px]">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden border-t-0 border-b-0 border-l-0">
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
        <!-- عمود يمين (عناصر زوجية) -->
        <div>
          <div v-for="i in skeletonRight" :key="'skl-r-'+i" class="mb-[6px]">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden border-t-0 border-b-0 border-l-0">
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
      </div>
      <!-- شبكة عمودين حقيقيين بدون فجوة أفقية (منع الفراغات العمودية عبر عمودين مستقلين) -->
      <div v-else class="product-grid grid grid-cols-2 gap-x-[5px] gap-y-0 grid-flow-row-dense">
        <!-- عمود يسار -->
        <div>
          <div v-for="(p,ci) in leftProducts" :key="'lp-'+p.id+'-'+ci" class="mb-[6px]">
            <ProductGridCard
              :class="'border-t-0 border-b-0 border-l-0'"
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
                isTrending: (p as any).isTrending === true,
                slug: p.slug
              }"
              :ratio="p._ratio || defaultRatio"
              :priority="ci<4"
              @add="openSuggestOptions"
            />
          </div>
        </div>
        <!-- عمود يمين -->
        <div>
          <div v-for="(p,ci) in rightProducts" :key="'rp-'+p.id+'-'+ci" class="mb-[6px]">
            <ProductGridCard
              :class="'border-t-0 border-b-0 border-l-0'"
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
                isTrending: (p as any).isTrending === true,
                slug: p.slug
              }"
              :ratio="p._ratio || defaultRatio"
              :priority="ci<4"
              @add="openSuggestOptions"
            />
          </div>
        </div>
      </div>
      
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
defineOptions({ name: 'ProductsPage' })
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive, onActivated, onDeactivated } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCart } from '../store/cart';
import { storeToRefs } from 'pinia';
import {
  ChevronRight,
  Menu,
  ShoppingCart,
  Heart,
  Search,
  Filter,
  ChevronDown as ArrowDown,
} from 'lucide-vue-next';
import { useHead } from '@unhead/vue'
import ProductGridCard from '@/components/ProductGridCard.vue'
import ProductOptionsModal from '@/components/ProductOptionsModal.vue'
import { markTrending } from '../lib/trending'
import { apiGet, API_BASE, isAuthenticated } from '../lib/api'
import { buildThumbUrl } from '../lib/media'

const router = useRouter();
const route = useRoute();
const cart = useCart();
const { items } = storeToRefs(cart);

// Categories State
const allCategories = ref<Array<{ id:string; slug?:string|null; name:string; parentId?:string|null; image?:string|null }>>([])
const categories = ref<Array<{ id:string; label:string; img:string }>>([])

// Products State
const products = ref<any[]>([])
const hasMore = ref(false)
const productsLoading = ref(true)
const defaultRatio = 1.3
const placeholderRatios = [1.2, 1.5, 1.35, 1.1, 1.4, 1.25, 1.6, 1.3]

// Skeleton Logic
const skeletonLeft = computed(()=> Array.from({ length: 8 }, (_, k)=> k + 1).filter(i=> i % 2 === 1))
const skeletonRight = computed(()=> Array.from({ length: 8 }, (_, k)=> k + 1).filter(i=> i % 2 === 0))

function thumbSrc(p:any, w:number): string {
  const u = (Array.isArray(p.images)&&p.images[0]) || p.image
  return buildThumbUrl(String(u||''), w, 60)
}

// Masonry Split
const leftProducts = computed(()=> products.value.filter((_p, i)=> i % 2 === 0))
const rightProducts = computed(()=> products.value.filter((_p, i)=> i % 2 === 1))

// Image Ratio Logic
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

const cartBadge = computed(() => cart.count);
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

const headerHeight = computed(() => {
  let height = 48; // Base header
  const hasCats = (categories.value||[]).length>0
  if (hasCats){
    height += (!compact.value ? 100 : 60);
  }
  if (showHeaderFilters.value || !hasCats) {
    height += 80;
  }
  return height;
});

let lastScrollY = 0;

// SEO
const seoHead = ref({
  title: 'المنتجات',
  meta: [] as any[],
  link: [] as any[],
  hiddenContent: ''
})
useHead(seoHead)

onMounted(() => {
  lastScrollY = window.scrollY || 0;
  atTop.value = lastScrollY <= 0;
  isScrollingUp.value = false;
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  void bootstrap()
  
  // SEO Check
  apiGet<any>('/api/seo/meta?type=page&slug=/products').then(seo => {
    if (seo) {
      seoHead.value = {
        title: seo.titleSeo || 'المنتجات',
        meta: [
          { name: 'description', content: seo.metaDescription },
          { name: 'robots', content: seo.metaRobots },
          { name: 'author', content: seo.author },
          { property: 'og:title', content: seo.titleSeo },
          { property: 'og:description', content: seo.metaDescription },
          { property: 'og:image', content: seo.ogTags?.image || seo.siteLogo },
          { property: 'og:url', content: seo.canonicalUrl },
        ].filter(Boolean),
        link: [
           { rel: 'canonical', href: seo.canonicalUrl },
           ...(seo.alternateLinks ? Object.entries(seo.alternateLinks).map(([lang, url]) => ({ rel: 'alternate', hreflang: lang, href: url })) : [])
        ].filter(x=>x.href),
        hiddenContent: seo.hiddenContent
      }
    }
  }).catch(()=>{})
});

onActivated(() => {
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
})

onDeactivated(() => {
  window.removeEventListener('scroll', handleWindowScroll);
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleWindowScroll);
});

function handleWindowScroll() {
  const y = window.scrollY;
  // Only consider scrolling up if we moved at least 5px to avoid jitter
  if (Math.abs(y - lastScrollY) > 5) {
    isScrollingUp.value = y < lastScrollY;
  }
  compact.value = y > 90;
  // Increase threshold for "at top" to avoid conflict with initial scroll
  atTop.value = y <= 200;
  lastScrollY = y;

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
  console.log('Category clicked:', c);
  if (!c?.id) { console.warn('Missing ID for category:', c); return }
  // Navigate to specific category page (Product List)
  router.push({ path: `/c/${encodeURIComponent(c.id)}` })
}

// Filters
const filterSheet = ref<{ open:boolean; type:'category'|'size'|'color'|'material'|'style'|null }>({ open:false, type:null })
const selSizes = ref<string[]>([])
const selColors = ref<string[]>([])
const selMaterials = ref<string[]>([])
const selStyles = ref<string[]>([])
function openFilter(t:'category'|'size'|'color'|'material'|'style'){ filterSheet.value = { open:true, type:t } }
function closeFilter(){ filterSheet.value.open=false; filterSheet.value.type=null }
function applyFilters(){ closeFilter(); void loadProducts() }

// Navigation
function goToSearch() { router.push('/search'); }
function goBack() { router.back(); }
function goToWishlist() { router.push('/wishlist'); }
function goToCart() { router.push('/cart'); }
function goToCategories() { router.push('/categories'); }

// Options Modal Logic
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
    const numbers = sizes.filter((s:string)=> /^\d{1,3}$/.test(String(s)))
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
function onOptionsSave(payload: { color: string; size: string; img?: string }){
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
    const img = payload.img || (prod?.images && prod.images[0]) || '/images/placeholder-product.jpg'
    cart.add({ id: prod?.id || optionsModal.productId, title: prod?.title || '', price: Number(prod?.price||0), img, variantColor: payload.color||undefined, variantSize: payload.size||undefined }, 1)
    showToast()
  }catch{}
  optionsModal.open = false
}

// Data Loading
async function loadCategories(){
  try{
    const data = await apiGet<any>('/api/categories?limit=200')
    const list = Array.isArray(data?.categories)? data.categories : []
    allCategories.value = list.map((c:any)=> ({ id:String(c.id), slug:c.slug||null, name:String(c.name||''), parentId: c.parentId? String(c.parentId) : null, image: c.image||null }))
    
    // Filter for Top Level Categories
    const topLevel = allCategories.value.filter(c => !c.parentId)
    
    const safeImg = (u?: string|null) => {
      const s = String(u||'').trim()
      if (!s || s.startsWith('blob:')) return '/images/placeholder-product.jpg'
      return buildThumbUrl(s, 112, 60)
    }
    categories.value = topLevel.map(c=> ({
      id: c.slug||c.id,
      label: c.name,
      img: safeImg(c.image)
    }))
  }catch{ allCategories.value = []; categories.value = [] }
}

function mapSort(): string {
  if (activeFilter.value==='price') return priceSort.value==='asc' ? 'price_asc' : 'price_desc'
  return 'reco'
}

async function loadProducts(limit: number = 10){
  try{
    productsLoading.value = true
    const sort = mapSort()
    const url = new URL(`${API_BASE}/api/products`)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', '0')
    if (sort) url.searchParams.set('sort', sort)
    
    const q = String(searchQ.value||'').trim(); if(q) url.searchParams.set('q', q)
    if (selSizes.value.length) url.searchParams.set('sizes', selSizes.value.join(','))
    if (selColors.value.length) url.searchParams.set('colors', selColors.value.join(','))
    if (selMaterials.value.length) url.searchParams.set('materials', selMaterials.value.join(','))
    if (selStyles.value.length) url.searchParams.set('styles', selStyles.value.join(','))
    
    const data = await apiGet<any>(`/api/products?${url.searchParams.toString()}`).catch(()=> null)
    const items = Array.isArray(data?.items)? data.items : []

    const mappedRaw = items.map((it:any)=> ({
      id: String(it.id),
      title: String(it.name||''),
      slug: it.slug,
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
      categoryId: it.categoryId || it.category?.id,
      categoryIds: Array.isArray(it.categoryIds) ? it.categoryIds : undefined,
      _ratio: undefined,
      _imgLoaded: false
    }))

    // De-duplicate
    const seen: Record<string, boolean> = {}
    const mapped = mappedRaw.filter((p:any)=>{ const k=String(p.id); if (seen[k]) return false; seen[k]=true; return true })
    
    // Probe ratios
    await Promise.all(mapped.slice(0, limit).map((p:any)=> probeRatioPromise(p)))
    products.value = mapped
    
    // Probe remaining
    setTimeout(()=>{ try{ for (const p of products.value.slice(limit, limit*2)){ probeRatioOnce(p) } }catch{} }, 0)
    
    hasMore.value = items.length >= limit
    try{ markTrending(products.value as any[]) }catch{}
    try{ await hydrateCouponsAndPrices() }catch{}

  }catch{ products.value = []; hasMore.value = false }
  finally { productsLoading.value = false }
}

async function loadMoreProducts() {
  if (isLoadingMore.value) return;
  if (!hasMore.value) return;
  isLoadingMore.value = true;
  const prev = products.value.length
  const pageSize = 10
  const offset = prev
  
  try {
    const sort = mapSort()
    const url = new URL(`${API_BASE}/api/products`)
    url.searchParams.set('limit', String(pageSize))
    url.searchParams.set('offset', String(offset))
    if (sort) url.searchParams.set('sort', sort)
    
    const q = String(searchQ.value||'').trim(); if(q) url.searchParams.set('q', q)
    // ... filters ...
    try{
      const ids = Array.from(new Set(products.value.map((p:any)=> String(p.id)))).slice(0, 200)
      if (ids.length) url.searchParams.set('excludeIds', ids.join(','))
    }catch{}

    const data = await apiGet<any>(`/api/products?${url.searchParams.toString()}`).catch(()=> null)
    const items = Array.isArray(data?.items)? data.items : []
    
    const sliceRaw = items.map((it:any)=> ({
        id: String(it.id),
        title: String(it.name||''),
        slug: it.slug,
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
        categoryId: it.categoryId || it.category?.id,
        categoryIds: Array.isArray(it.categoryIds) ? it.categoryIds : undefined,
        _ratio: undefined,
        _imgLoaded: false
    }))
    
    const existing = new Set(products.value.map((p:any)=> String(p.id)))
    const slice = sliceRaw.filter((p:any)=> !existing.has(String(p.id)))
    
    if (slice.length){
        await Promise.all(slice.map((p:any)=> probeRatioPromise(p)))
        products.value = products.value.concat(slice)
        hasMore.value = items.length >= pageSize
        try{ markTrending(products.value as any[]) }catch{}
        try{ await hydrateCouponsAndPrices() }catch{}
    } else {
        hasMore.value = false
    }

  } finally {
    isLoadingMore.value = false
  }
}

async function bootstrap(){ await loadCategories(); await loadProducts() }

// Coupons Logic
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])
const couponsCacheTs = ref(0)

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const { API_BASE, isAuthenticated } = await import('../lib/api')
  const tryFetch = async (path: string) => {
    try{
      const creds = path.startsWith('/api/coupons/public')? 'omit':'include'
      const { getAuthHeader } = await import('../lib/api')
      const r = await fetch(`${API_BASE}${path}`, { credentials: creds as RequestCredentials, headers:{ 'Accept':'application/json', ...getAuthHeader() } })
      if(!r.ok) return null; return await r.json()
    }catch{ return null }
  }
  if (isAuthenticated()){
    const data1: any = await tryFetch('/api/me/coupons')
    if (data1){
      const itemsArr = Array.isArray(data1.items) ? data1.items : []
      const couponsArr = Array.isArray(data1.coupons) ? data1.coupons : []
      const merged = [...itemsArr, ...couponsArr]
      if (merged.length>0) return normalizeCoupons(merged)
    }
  }
  return []
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
  if (p.categoryId!=null) return p
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

async function hydrateCouponsAndPrices(){
  // Refresh coupons if cache is empty or older than 60s
  try{
    const now = Date.now()
    if (!couponsCache.value.length || (now - couponsCacheTs.value) > 60000){
      couponsCache.value = await fetchCouponsList(); couponsCacheTs.value = now
    }
  }catch{}
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

const visibleCategories = computed(()=> categories.value)
const compactCategories = computed(()=> categories.value)

</script>

<style scoped>
.product-grid{column-gap:5px!important;row-gap:0!important}
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>