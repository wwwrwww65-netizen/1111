<template>
  <div class="bg-white min-h-screen" dir="rtl">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-white">
      <div class="flex items-center justify-between px-4 py-3 h-14">
        <div class="flex items-center gap-3">
          <button class="w-6 h-6 flex items-center justify-center" @click="router.push('/cart')">
            <ShoppingCart :size="20" />
            <span v-if="cart.count" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center text-[10px] px-1">{{ cart.count }}</span>
          </button>
          <button class="w-6 h-6 flex items-center justify-center" @click="share">
            <Share :size="20" />
          </button>
          <button class="w-6 h-6 flex items-center justify-center" @click="router.push('/search')">
            <Search :size="20" />
          </button>
        </div>
        <div class="text-xl font-bold">SHEIN</div>
        <div class="flex items-center gap-3">
          <button class="w-6 h-6 flex items-center justify-center">
            <Menu :size="20" />
          </button>
          <button class="w-6 h-6 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Product Image Gallery -->
    <div class="relative mt-14">
      <div ref="galleryRef" class="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide" @scroll.passive="onGalleryScroll">
        <div class="flex">
          <img v-for="(img,idx) in images" :key="'hero-'+idx" :src="img" :alt="title" class="w-full h-auto object-cover block flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" />
        </div>
      </div>
      
      <!-- Brand Overlay -->
      <div class="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-[12px] font-bold">
        COSMINA EST 2024
      </div>
      
      <!-- Image Counter -->
      <div class="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-[12px] font-medium">
        {{ activeIdx + 1 }}/{{ images.length }}
      </div>
    </div>

    <!-- Product Info -->
    <div class="px-4 py-4 space-y-3">
      <!-- Trends Banner -->
      <div class="bg-purple-100 px-3 py-2 rounded">
        <div class="flex items-center justify-between">
          <span class="text-purple-700 text-[12px] font-medium">ترندات</span>
          <span class="text-purple-500 text-[12px]">الموضة في متناول الجميع</span>
        </div>
      </div>
      
      <!-- Price -->
      <div class="text-[24px] font-bold text-gray-900">27.00 ر.س</div>
      
      <!-- SHEIN CLUB Offer -->
      <div class="bg-orange-100 px-3 py-2 rounded">
        <div class="text-[13px] text-orange-700">
          وفر بخصم 1.35 ر.س على هذا المنتج بعد الانضمام. 
          <span class="bg-orange-500 text-white rounded px-1 py-0.5 text-[10px] font-bold">S</span>
          <span class="font-bold">SHEIN CLUB</span>
        </div>
      </div>
      
      <!-- Product Title -->
      <h1 class="text-[16px] font-semibold leading-tight text-gray-900">ترندات COSMINA ملابس علوية كاجوال بأكمام قصيرة بلون سادة للسيدات</h1>
      <p class="text-[14px] text-gray-600">مناسب للصيف</p>
      
      <!-- Rating -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <StarIcon v-for="i in 5" :key="i" :size="14" class="text-yellow-400" />
        </div>
        <span class="text-[14px] font-semibold text-gray-900">4.90</span>
        <span class="text-gray-500 text-[12px]">(+1000)</span>
      </div>
      
      <!-- Thumbnail Images -->
      <div class="flex gap-2 overflow-x-auto">
        <img v-for="(img,i) in images.slice(0,5)" :key="'thumb'+i" :src="img" class="w-16 h-16 rounded border object-cover cursor-pointer flex-shrink-0" :class="i===activeIdx ? 'border-black ring-2 ring-black' : 'border-gray-200'" :alt="'thumbnail '+i" @click="scrollToIdx(i)" />
      </div>
      
      <!-- Best Seller -->
      <div class="bg-orange-100 px-3 py-2 rounded">
        <div class="text-[13px] text-orange-700 font-medium">#5 الأفضل مبيعًا في أنيق قسم نسائية</div>
      </div>
      
      <!-- Color Selection -->
      <div class="space-y-2">
        <div class="text-[14px] font-medium text-gray-900">لون: الأسود</div>
      </div>
      
      <!-- Size Selection -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[14px] font-medium text-gray-900">مقاس</span>
          <button class="text-blue-600 text-[12px] font-medium">مرجع المقاس</button>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="size in sizes" :key="size" 
                  class="px-3 py-2 border rounded-lg text-[13px] transition-all font-medium"
                  :class="selectedSize === size ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700'"
                  @click="selectedSize = size">
            {{ size }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center gap-3 pb-safe">
      <button class="flex-1 h-12 rounded-lg bg-black text-white font-medium text-[14px]" @click="addToCart">
        أضف إلى عربة التسوق بنجاح
      </button>
      <button class="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center" @click="toggleWish">
        <HeartIcon :size="20" :class="hasWish ? 'text-red-500' : 'text-gray-600'" />
      </button>
      <button class="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center" @click="router.push('/cart')">
        <ShoppingCart :size="20" class="text-gray-600" />
      </button>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-3 py-2 rounded-lg shadow-lg z-50">
      تمت الإضافة إلى عربة التسوق بنجاح
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useCart } from '@/store/cart'
import { API_BASE, apiPost, apiGet } from '@/lib/api'
import { ShoppingCart, Share, Search, Menu, Star as StarIcon, Heart as HeartIcon } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const id = route.query.id as string || 'p1'

// Product Data
const title = ref('ترندات COSMINA ملابس علوية كاجوال بأكمام قصيرة بلون سادة للسيدات')
const price = ref<number>(27.00)
const originalPrice = ref('')
const images = ref<string[]>([
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop'
])

// Gallery
const activeIdx = ref(0)
const galleryRef = ref<HTMLDivElement|null>(null)

// Product Options
const colors = ref([
  { name: 'أسود', hex: '#000000' }
])
const selectedColorIdx = ref(0)
const selectedColor = computed(() => colors.value[selectedColorIdx.value].name)

const sizes = ref(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
const selectedSize = ref('M')

// Reviews & Ratings
const avgRating = ref(4.90)
const reviewsCount = ref(1000)
const sizeFitPercentage = ref(95)
const wouldBuyAgain = ref(95)
const goodFabric = ref(500)

const reviews = ref([
  { 
    id: 1, 
    user: 'سارة أ***', 
    stars: 5, 
    comment: 'قميص رائع جداً، مريح ومناسب للصيف. الجودة ممتازة والمقاس مناسب تماماً.', 
    date: 'منذ يومين',
    colorSize: 'لون: أسود، مقاس: M',
    helpful: 8
  },
  { 
    id: 2, 
    user: 'فاطمة م***', 
    stars: 4, 
    comment: 'التصميم بسيط وأنيق، القماش خفيف ومناسب للطقس الحار. أنصح به.', 
    date: 'منذ أسبوع',
    colorSize: 'لون: أسود، مقاس: L',
    helpful: 5
  }
])

// Shipping & Location
const shippingLocation = ref('Riyadh, Saudi Arabia')
const freeShippingThreshold = ref('99.00')
const deliveryDate = ref('نوفمبر 15 - نوفمبر 18')
const clubCoupons = ref(12)
const clubCouponsValue = ref('360.00')

// SHEIN CLUB
const clubSave = ref(1.35)

// Model Info
const modelSize = ref('M')
const modelMeasurements = ref('طول: 175cm صدر: 84cm خصر: 62cm الوركين: 91cm')

// Related Products
const relatedCategories = ref(['ملابس نسائية', 'قمصان', 'ملابس صيفية', 'ملابس كاجوال'])

const relatedProducts = ref([
  {
    id: 1,
    name: 'Dazy',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&h=200&fit=crop',
    price: '15.80',
    reviews: 189
  },
  {
    id: 2,
    name: 'SHEIN Privé',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop',
    price: '18.40',
    reviews: 1000
  }
])

// Computed
const displayPrice = computed(() => price.value.toFixed(2))

// Cart & Wishlist
const cart = useCart()
const hasWish = ref(false)
const toast = ref(false)

// Functions
function selectColor(i: number) {
  selectedColorIdx.value = i
}

function scrollToIdx(i: number) {
  activeIdx.value = i
  const el = galleryRef.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}

function onGalleryScroll() {
  const el = galleryRef.value
  if (!el) return
  const i = Math.round(el.scrollLeft / el.clientWidth)
  if (i !== activeIdx.value) activeIdx.value = i
}

function addToCart() {
  cart.add({ 
    id, 
    title: title.value, 
    price: Number(price.value) || 0, 
    img: images.value[activeIdx.value] 
  }, 1)
  toast.value = true
  setTimeout(() => toast.value = false, 2000)
}

function toggleWish() {
  hasWish.value = !hasWish.value
}

async function share() {
  try {
    const data = { 
      title: title.value, 
      text: title.value, 
      url: location.href 
    }
    if ((navigator as any).share) {
      await (navigator as any).share(data)
    } else {
      await navigator.clipboard.writeText(location.href)
    }
  } catch {}
}

// Lifecycle
onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/product/${encodeURIComponent(id)}`, { 
      credentials: 'omit', 
      headers: { 'Accept': 'application/json' } 
    })
    if (res.ok) {
      const d = await res.json()
      title.value = d.name || title.value
      price.value = Number(d.price || 18.40)
      const imgs = Array.isArray(d.images) ? d.images : []
      if (imgs.length) images.value = imgs
      originalPrice.value = d.original ? d.original : originalPrice.value
    }
  } catch {}
})
</script>

<style scoped>
/* Removed custom layout styles in favor of Tailwind classes already in template */
</style>

