<template>
  <div class="min-h-screen bg-gray-50" dir="rtl">
    <style>
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    </style>

    <!-- Top Navigation -->
    <div class="bg-white px-4 py-3 flex items-center gap-3">
      <ChevronRight class="w-6 h-6" />
      <div class="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
        <input
          type="text"
          placeholder="فستان"
          class="flex-1 bg-transparent outline-none text-right text-sm"
        />
        <Camera class="w-5 h-5 text-gray-500 ml-2" />
        <div class="bg-black rounded-full p-2 ml-2">
          <Search class="w-4 h-4 text-white" />
        </div>
      </div>
      <LayoutGrid class="w-6 h-6" />
      <Heart class="w-6 h-6" />
    </div>

    <!-- Categories -->
    <div class="bg-white px-4 py-3 overflow-x-auto hide-scrollbar">
      <div class="flex gap-4">
        <div v-for="(cat, idx) in categories" :key="'cat-'+idx" class="flex flex-col items-center min-w-[80px]">
          <div class="w-16 h-16 rounded-full overflow-hidden mb-2">
            <img :src="cat.image" :alt="cat.label" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <p class="text-xs text-center text-gray-700 leading-tight">{{ cat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Main Filters -->
    <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-b border-gray-200">
      <button class="flex items-center gap-1 text-sm">
        <ChevronDown class="w-4 h-4" />
        <span>التوصية</span>
      </button>
      <span class="text-sm text-gray-600">أوسع منتشرة</span>
      <button class="flex items-center gap-1 text-sm text-gray-600">
        <span>السعر</span>
        <div class="flex flex-col">
          <ChevronDown class="w-3 h-3 -mb-1" />
        </div>
      </button>
      <button class="flex items-center gap-1 text-sm text-gray-600">
        <Filter class="w-4 h-4" />
        <span>تصنيف</span>
      </button>
    </div>

    <!-- Secondary Filters -->
    <div class="bg-white px-4 py-3 overflow-x-auto hide-scrollbar">
      <div class="flex gap-2">
        <button class="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm whitespace-nowrap flex items-center gap-1">
          <span>🚚 شحن سريع</span>
        </button>
        <button class="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm whitespace-nowrap">تنزيلات</button>
        <button class="px-3 py-1 border border-gray-300 rounded-full text-sm whitespace-nowrap flex items-center gap-1">
          <ChevronDown class="w-3 h-3" />
          <span>الفئات</span>
        </button>
        <button class="px-3 py-1 border border-gray-300 rounded-full text-sm whitespace-nowrap flex items-center gap-1">
          <ChevronDown class="w-3 h-3" />
          <span>مقاس</span>
        </button>
        <button class="px-3 py-1 border border-gray-300 rounded-full text-sm whitespace-nowrap">أضف التصفية</button>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="p-2 grid grid-cols-2 gap-2">
      <div v-for="(product, idx) in products" :key="'p-'+idx" class="bg-white rounded-lg overflow-hidden shadow-sm relative">
        <div class="relative">
          <img :src="product.image" :alt="product.title || ('item-'+idx)" class="w-full aspect-[3/4] object-cover" loading="lazy" />
          <div v-if="product.badge" class="absolute top-2 left-2 bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">{{ product.badge }}</div>
          <div v-if="product.cartCount !== undefined" class="absolute bottom-2 left-2 bg-white rounded-full p-2 shadow-md">
            <div class="relative">
              <ShoppingCart class="w-5 h-5" />
              <span v-if="product.cartCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{{ product.cartCount }}</span>
            </div>
          </div>
          <div class="absolute bottom-2 right-2 flex gap-1">
            <div class="w-3 h-3 rounded-full bg-purple-300"></div>
            <div class="w-3 h-3 rounded-full bg-green-300"></div>
            <div class="w-3 h-3 rounded-full bg-blue-300"></div>
          </div>
        </div>
        <div v-if="product.title" class="p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-500">{{ product.brand }}</span>
            <span v-if="product.badge" class="text-xs text-purple-600 flex items-center gap-1">
              <span>تنزيلات</span>
              <span class="text-purple-400">◀</span>
            </span>
          </div>
          <p class="text-sm mb-2 text-gray-800">{{ product.title }}</p>
          <div v-if="product.rating" class="flex items-center gap-1 mb-2">
            <span v-for="i in 5" :key="'s-'+i" class="text-yellow-400 text-xs">⭐</span>
            <span class="text-xs text-gray-500">({{ product.reviews }})</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">{{ product.price }}</div>
              <div class="text-xs text-gray-400 line-through">تم بيع {{ product.originalPrice.replace('SR','') }}.+</div>
            </div>
            <div class="text-orange-500 text-sm font-semibold">
              {{ product.originalPrice }} <span class="text-xs">{{ product.discount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation (placeholder) -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center">
      <div class="flex flex-col items-center gap-1">
        <div class="w-8 h-1 bg-gray-300 rounded-full"></div>
      </div>
      <div class="w-12 h-12 rounded-full border-2 border-gray-300"></div>
      <ChevronRight class="w-6 h-6 text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Heart, LayoutGrid, Search, Camera, ChevronRight, Filter, ChevronDown, ShoppingCart } from 'lucide-vue-next'

type ProductCard = {
  image: string
  brand: string
  title: string
  price: string
  originalPrice: string
  discount: string
  rating?: number
  reviews?: string
  badge?: string
  cartCount?: number
}

type CategoryItem = { image: string; label: string }

const categories = ref<CategoryItem[]>([
  { image: 'https://csspicker.dev/api/image/?q=women+fashion+dress&image_type=photo', label: 'ملابس علوية &بلايز& ت...' },
  { image: 'https://csspicker.dev/api/image/?q=blue+dress&image_type=photo', label: 'فساتين نسائية' },
  { image: 'https://csspicker.dev/api/image/?q=casual+outfit&image_type=photo', label: 'ملابسة منسوحة نس...' },
  { image: 'https://csspicker.dev/api/image/?q=elegant+dress&image_type=photo', label: 'ملابس سفلية نسائية' },
  { image: 'https://csspicker.dev/api/image/?q=coordinated+outfit&image_type=photo', label: 'أطقم منسقة نسائية' },
  { image: 'https://csspicker.dev/api/image/?q=women+clothing&image_type=photo', label: 'ملابس نسائية' },
])

const products = ref<ProductCard[]>([
  {
    image: 'https://csspicker.dev/api/image/?q=green+elegant+dress&image_type=photo',
    brand: 'Feyla',
    title: 'فستان ماكسي بحمالات مطرز...',
    price: 'SR109.00',
    originalPrice: 'SR59.95',
    discount: 'بعد الكوبون',
    rating: 5,
    reviews: '+1000',
    cartCount: 6,
  },
  {
    image: 'https://csspicker.dev/api/image/?q=floral+dress+women&image_type=photo',
    brand: 'SHEIN SXY',
    title: 'ملابس علوية نسائي ع...',
    price: 'SR33.00',
    originalPrice: 'SR26.40',
    discount: 'بعد الكوبون',
    badge: 'تنزيلات',
    cartCount: 1,
  },
  {
    image: 'https://csspicker.dev/api/image/?q=black+elegant+dress&image_type=photo',
    brand: 'abyoxi',
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    cartCount: 5,
  },
  {
    image: 'https://csspicker.dev/api/image/?q=black+top+checkered+skirt&image_type=photo',
    brand: 'SHEIN ESSNTL',
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
  },
])
</script>

<style scoped>
</style>

