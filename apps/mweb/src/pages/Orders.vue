<template>
  <div dir="rtl" class="bg-gray-50 min-h-screen pb-20 pt-[50px]">
    <!-- Custom Header -->
    <header class="fixed top-0 left-0 right-0 h-[50px] bg-white z-50 flex items-center justify-between px-4 border-b border-gray-100">
      <!-- Right: Back Button -->
      <button @click="$router.push('/')" class="w-8 h-8 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <!-- Center: Title -->
      <h1 class="text-lg font-bold text-black">طلباتي</h1>
      
      <!-- Left: Cart Icon -->
      <button @click="$router.push('/cart')" class="w-8 h-8 flex items-center justify-center relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </button>
    </header>
    
    <!-- Tabs -->
    <div class="sticky top-[50px] z-40 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
      <div class="flex whitespace-nowrap px-2">
        <button 
          v-for="(tab, index) in tabs" 
          :key="tab.id"
          ref="tabRefs"
          @click="selectTab(tab.id)"
          class="px-4 py-3 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id ? 'text-black font-bold border-b-2 border-black' : 'text-gray-500'"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="pt-4 pb-4">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>

      <div v-else-if="!filteredOrders.length" class="flex flex-col items-center justify-center py-20 text-center px-4">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">📦</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
        <p class="text-gray-500 text-sm mb-6">لم تقم بإجراء أي طلبات في هذه الفئة بعد</p>
        <button @click="$router.push('/')" class="px-6 py-2 bg-black text-white text-sm font-medium rounded-full">تسوق الآن</button>
      </div>

      <div v-else class="space-y-2">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id" 
          class="bg-white p-4 cursor-pointer"
          @click="$router.push(`/order/${order.id}`)"
        >
          <!-- Header: Status (Right) & ID (Left) -->
          <div class="flex items-center justify-between mb-4 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="getStatusDotColor(order.status)"></span>
              <span class="text-sm font-bold text-gray-900">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
            <span class="text-xs text-gray-500" dir="ltr">
              {{ order.code || order.id }} # طلب
            </span>
          </div>

          <!-- Items -->
          <div class="mb-4">
            <!-- Single Item -->
            <div v-if="order.items.length === 1" class="flex gap-3">
              <div class="w-20 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img :src="resolveItemImage(order.items[0])" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm text-gray-800 line-clamp-2 mb-1">{{ order.items[0].product.name }}</h4>
                <div class="text-xs text-gray-500 mb-2">x{{ order.items[0].quantity }}</div>
              </div>
            </div>
            
            <!-- Multiple Items (Scrollable) -->
            <div v-else class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <div v-for="item in order.items" :key="item.id" class="w-20 flex-shrink-0">
                <div class="w-20 h-24 bg-gray-100 rounded overflow-hidden mb-2 relative">
                  <img :src="resolveItemImage(item)" class="w-full h-full object-cover" />
                  <span v-if="item.quantity > 1" class="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Row: Price (Left) & Count (Right) -->
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm text-gray-500">
              {{ order.items.length }} البضائع: <span class="text-gray-900">السعر الفعلي</span>
            </div>
            <div class="font-bold text-gray-900 text-base" dir="ltr">
              SR{{ order.total.toFixed(2) }}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 justify-end border-t pt-3">
             <!-- Pay Now: Only if pending AND NOT COD -->
            <button 
              v-if="order.status === 'PENDING' && order.paymentMethod !== 'cod'" 
              class="px-6 py-2 bg-black text-white text-sm font-medium rounded"
            >
              دفع على الفور
            </button>
            
            <button 
              v-if="['DELIVERED', 'CANCELLED'].includes(String(order.status||'').toUpperCase())"
              class="px-6 py-2 bg-white text-gray-900 text-sm font-medium rounded border border-gray-300"
            >
              إعادة الشراء
            </button>
          </div>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import { onMounted, ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet } from '@/lib/api'

const route = useRoute()

const tabs = [
  { id: 'ALL', label: 'جميع الطلبات' },
  { id: 'PENDING', label: 'قيد المراجعة' },
  { id: 'PROCESSING', label: 'قيد التجهيز' },
  { id: 'OUT_FOR_DELIVERY', label: 'في الطريق' },
  { id: 'DELIVERED', label: 'تم الشحن' },
  { id: 'REVIEW', label: 'تعليق' },
  { id: 'RETURNS', label: 'المنتجات المسترجعة' }
]

const activeTab = ref('ALL')
const loading = ref(true)
const orders = ref<any[]>([])
const tabRefs = ref<HTMLElement[]>([])

const filteredOrders = computed(() => {
  if (activeTab.value === 'ALL') return orders.value
  if (activeTab.value === 'REVIEW') return orders.value.filter(o => o.hasUnreviewedItems)
  if (activeTab.value === 'RETURNS') return orders.value.filter(o => !!o.returnRequest)
  return orders.value.filter(o => String(o.status || '').toUpperCase() === activeTab.value)
})

function getStatusLabel(status: string) {
  const s = String(status || '').toUpperCase()
  const map: Record<string, string> = {
    PENDING: 'قيد المراجعة',
    PROCESSING: 'قيد التجهيز',
    OUT_FOR_DELIVERY: 'في الطريق إليك',
    DELIVERED: 'تم الشحن',
    CANCELLED: 'ملغي'
  }
  return map[s] || status
}

function getStatusColor(status: string) {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING') return 'text-orange-500'
  if (s === 'PROCESSING') return 'text-blue-600'
  if (s === 'OUT_FOR_DELIVERY') return 'text-purple-600'
  if (s === 'CANCELLED') return 'text-gray-500'
  return 'text-green-600'
}

function getStatusDotColor(status: string) {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING') return 'bg-orange-500'
  if (s === 'PROCESSING') return 'bg-blue-600'
  if (s === 'OUT_FOR_DELIVERY') return 'bg-purple-600'
  if (s === 'CANCELLED') return 'bg-gray-500'
  return 'bg-green-600'
}

function resolveItemImage(it: any): string {
  try{
    const attrs = (it && (it as any).attributes) || {}
    let raw = attrs.image || attrs.img || attrs.imageUrl || attrs.variantImage || attrs.picture || attrs.photo || attrs.thumbnail || attrs.variantImageUrl || (it?.product?.images?.[0]) || ''
    const s = String(raw||'').trim()
    if (!s) return it?.product?.image || '/placeholder.png'
    if (/^https?:\/\//i.test(s)) return s
    const base = (window as any).API_BASE || ''
    if (s.startsWith('/uploads')) return `${base}${s}`
    if (s.startsWith('uploads/')) return `${base}/${s}`
    return s
  }catch{ return it?.product?.image || '/placeholder.png' }
}

function scrollToActiveTab() {
  nextTick(() => {
    const index = tabs.findIndex(t => t.id === activeTab.value)
    if (index !== -1 && tabRefs.value[index]) {
      tabRefs.value[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  })
}

function selectTab(id: string) {
  activeTab.value = id
  scrollToActiveTab()
}

onMounted(async () => {
  if (route.query.status) {
    const s = String(route.query.status).toUpperCase()
    if (tabs.some(t => t.id === s)) {
      activeTab.value = s
      scrollToActiveTab()
    }
  }

  try {
    const data = await apiGet<any>('/api/orders/me')
    if (Array.isArray(data)) {
      orders.value = data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>

