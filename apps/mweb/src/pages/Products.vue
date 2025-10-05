<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl" @scroll.passive="onScroll" ref="page">
    <div class="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="h-12 px-2 flex items-center justify-between">
        <div class="flex items-center gap-0.5">
          <button aria-label="رجوع" class="w-8 h-8 flex items-center justify-center p-0" @click="goBack">
            <ArrowRight class="w-5 h-5 text-gray-800" />
          </button>
          <div aria-hidden class="w-8 h-8 flex items-center justify-center p-0">
            <Menu class="w-5 h-5 text-gray-700" />
          </div>
        </div>
        <div class="flex-1 px-1">
          <div class="flex items-center bg-gray-100 rounded-full h-9 px-2">
            <div class="flex-1 flex items-center justify-start">
              <span class="text-[12px] text-gray-400 truncate">{{ promoWords[promoIndex] }}</span>
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
        <div class="flex items-center gap-0.5">
          <button aria-label="المفضلة" class="w-8 h-8 flex items-center justify-center p-0">
            <Heart class="w-5 h-5 text-gray-700" />
          </button>
          <button aria-label="عربة التسوق" class="w-8 h-8 flex items-center justify-center p-0 relative">
            <ShoppingCart class="w-5 h-5 text-gray-700" />
            <span v-if="cartBadge > 0" id="cart-target" class="absolute -top-1 -left-1 min-w-[16px] h-4 text-[10px] leading-4 rounded-full bg-red-500 text-white flex items-center justify-center px-1">{{ cartBadge }}</span>
          </button>
        </div>
      </div>

      <div v-if="!compact" class="bg-white border-t border-gray-100">
        <div class="flex gap-2 overflow-x-auto no-scrollbar px-2 py-2 items-start">
          <button v-for="c in visibleCategories" :key="c.id" class="flex flex-col items-center min-w-[76px] pb-1" @click="onCategoryClick(c)">
            <div class="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <img :src="c.img" :alt="c.label" class="w-full h-full object-cover" />
            </div>
            <span class="mt-1 text-[12px] text-gray-700 text-center leading-tight category-title">{{ c.label }}</span>
          </button>
        </div>
      </div>

      <div v-if="compact" class="bg-white border-t border-gray-100">
        <div class="flex gap-2 overflow-x-auto no-scrollbar px-2 py-1 items-center">
          <button v-for="c in compactCategories" :key="c.id" class="flex items-center gap-3 min-w-[140px] px-2 py-1 rounded-md hover:bg-gray-50" @click="onCategoryClick(c)">
            <div class="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              <img :src="c.img" :alt="c.label" class="w-full h-full object-cover" />
            </div>
            <div class="text-right">
              <div class="text-[13px] text-gray-800 leading-tight truncate-2-lines max-w-[8rem]">{{ c.label }}</div>
            </div>
          </button>
        </div>
      </div>

      <div v-if="showHeaderFilters" class="bg-white border-t border-gray-100 px-2 py-2">
        <div class="flex items-center justify-between mb-2">
          <button @click="setFilter('recommend')" :class="['text-[12px]', activeFilter === 'recommend' ? 'text-black font-semibold' : 'text-gray-600']">التوصية</button>
          <button @click="setFilter('popular')" :class="['text-[12px]', activeFilter === 'popular' ? 'text-black font-semibold' : 'text-gray-600']">الأوسع انتشاراً</button>
          <button @click="togglePriceSort" class="flex items-center gap-1 text-[12px]" :class="['', activeFilter === 'price' ? 'text-black font-semibold' : 'text-gray-600']">
            السعر
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g>
              <path :fill="priceSort === 'asc' ? '#000' : '#9ca3af'" d="M174.2,246h-12.5V19.5c0-2.5,2-5,4.5-6c2.5-1,5.5,0,7,2.5l52.7,77.3l-11.1,7l-41.2-60.3V246H174.2z"/>
              <path :fill="priceSort === 'desc' ? '#000' : '#9ca3af'" d="M87.8,243c-2,0-4-1-5-2.5l-52.7-77.8l10.5-7l41.2,60.3V10h12.5v226.5c0,2.5-2,5-4.5,6C88.8,242.5,88.3,243,87.8,243z"/>
            </g></svg>
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

    <div v-if="!showHeaderFilters" class="h-3"></div>
    <section v-if="!showHeaderFilters" class="bg-white border-b border-gray-200 px-2 py-2">
      <div class="flex items-center justify-between mb-2">
        <button @click="setFilter('recommend')" :class="['text-[12px]', activeFilter === 'recommend' ? 'text-black font-semibold' : 'text-gray-600']">التوصية</button>
        <button @click="setFilter('popular')" :class="['text-[12px]', activeFilter === 'popular' ? 'text-black font-semibold' : 'text-gray-600']">الأوسع انتشاراً</button>
        <button @click="togglePriceSort" class="flex items-center gap-1 text-[12px]" :class="['', activeFilter === 'price' ? 'text-black font-semibold' : 'text-gray-600']">
          السعر
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g>
            <path :fill="priceSort === 'asc' ? '#000' : '#9ca3af'" d="M174.2,246h-12.5V19.5c0-2.5,2-5,4.5-6c2.5-1,5.5,0,7,2.5l52.7,77.3l-11.1,7l-41.2-60.3V246H174.2z"/>
            <path :fill="priceSort === 'desc' ? '#000' : '#9ca3af'" d="M87.8,243c-2,0-4-1-5-2.5l-52.7-77.8l10.5-7l41.2,60.3V10h12.5v226.5c0,2.5-2,5-4.5,6C88.8,242.5,88.3,243,87.8,243z"/>
          </g></svg>
        </button>
        <button @click="setFilter('rating')" :class="['flex items-center gap-1 text-[12px]', activeFilter === 'rating' ? 'text-black font-semibold' : 'text-gray-600']">
          <Filter class="w-3.5 h-3.5" /> التصنيف
        </button>
      </div>
      <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button v-for="f in ['الفئات','المقاس','اللون','المواد','الأسلوب']" :key="f" class="flex items-center gap-1 bg-[#f7f7f7] px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-800 min-w-max">
          {{ f }}
          <ArrowDown class="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
    </section>

    <section class="px-2 py-2">
      <div v-if="!products.length" class="text-[12px] text-gray-500 text-center py-6">لا توجد منتجات</div>
      <div v-else class="grid grid-cols-2 gap-2">
        <ProductCard v-for="p in products" :key="p.id" :id="p.id" :img="p.image" :title="p.title" :price="p.price" />
      </div>
    </section>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet } from '@/lib/api'
import ProductCard from '@/components/ProductCard.vue'
import { useCart } from '@/store/cart'
import { ArrowRight, Menu, ShoppingCart, Heart, Search, Camera, Filter, ChevronDown as ArrowDown } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const cart = useCart()
const cartBadge = computed(()=> cart.count)

const promoWords = ["فساتين","هودي","بلايز","تيشيرت","جواكت"]
const promoIndex = ref(0)
const activeFilter = ref<'recommend'|'popular'|'price'|'rating'>('recommend')
const priceSort = ref<'asc'|'desc'|null>(null)
const compact = ref(false)
const page = ref<HTMLElement | null>(null)
const isScrollingUp = ref(true)
const atTop = ref(true)
const showHeaderFilters = computed(() => isScrollingUp.value || atTop.value)

let interval: any
let lastScrollY = 0

const categories = ref<Array<{ id:string; label:string; img:string }>>([])
const visibleCategories = computed(()=> categories.value.slice(0, 8))
const compactCategories = computed(()=> categories.value.slice(0, 6))

const products = ref<Array<{ id:string; image:string; title:string; price:string }>>([])

function goBack(){ router.back() }

onMounted(() => {
  interval = setInterval(()=> { promoIndex.value = (promoIndex.value + 1) % promoWords.length }, 3000)
  lastScrollY = window.scrollY || 0
  atTop.value = lastScrollY <= 0
  isScrollingUp.value = true
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  loadCategories()
  loadProducts()
})

onBeforeUnmount(() => {
  clearInterval(interval)
  window.removeEventListener('scroll', handleWindowScroll)
})

function handleWindowScroll(){
  const y = window.scrollY
  isScrollingUp.value = y < lastScrollY
  compact.value = y > 90
  atTop.value = y <= 0
  lastScrollY = y
}

function onScroll(e: Event){
  const el = page.value
  if (!el) return
  const y = el.scrollTop
  isScrollingUp.value = y < lastScrollY
  compact.value = y > 90
  atTop.value = y <= 0
  lastScrollY = y
}

function setFilter(filter: 'recommend'|'popular'|'rating'){
  activeFilter.value = filter
  priceSort.value = null
  loadProducts()
}
function togglePriceSort(){
  activeFilter.value = 'price'
  if (priceSort.value === null || priceSort.value === 'desc') priceSort.value = 'asc'; else priceSort.value = 'desc'
  loadProducts()
}
function onCategoryClick(c: {id:string,label:string,img:string}){
  router.replace({ path: '/products', query: { category: c.id } })
  loadProducts()
}

async function loadCategories(){
  const data = await apiGet<any>('/api/categories?limit=36')
  const arr = Array.isArray(data?.categories) ? data.categories : []
  categories.value = arr.map((c:any)=> ({ id: (c.slug||c.id||'').toString(), label: c.name||c.title||'', img: c.image || `https://picsum.photos/seed/${encodeURIComponent(c.slug||c.id||'img')}/200/200` }))
}

async function loadProducts(){
  const sp = new URLSearchParams()
  sp.set('limit','24')
  const cat = String(route.query.category||'')
  let endpoint = '/api/products'
  if (cat) endpoint = `/api/catalog/${encodeURIComponent(cat)}`
  const sort = activeFilter.value === 'popular' ? 'top' : activeFilter.value === 'recommend' ? 'reco' : (activeFilter.value === 'price' ? (priceSort.value==='asc'?'price_asc':'price_desc') : 'reco')
  sp.set('sort', sort)
  const data = await apiGet<any>(`${endpoint}?${sp.toString()}`)
  const items: Array<{ id:string; name:string; price:number; images?:string[] }> = Array.isArray(data?.items) ? data.items : []
  products.value = items.map(p=> ({ id: String(p.id), image: (p.images?.[0]) || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', title: p.name || '', price: `${Number(p.price||0)} ر.س` }))
}
</script>

<style>
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.category-title { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; text-overflow: ellipsis; }
.truncate-2-lines { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; text-overflow: ellipsis; }
</style>

