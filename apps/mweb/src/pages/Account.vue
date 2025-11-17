<template>
  <div v-if="!hydrated" class="account-loading" dir="rtl" lang="ar">
    <div class="w-full">
      <!-- Header skeleton -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div class="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div class="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div class="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <!-- Club card skeleton -->
      <div class="mx-4 mt-4 bg-white rounded-lg p-4 shadow-sm">
        <div class="w-20 h-5 bg-orange-100 rounded mb-3"></div>
        <div class="grid grid-cols-3 gap-3 mb-3">
          <div class="h-12 bg-gray-100 rounded"></div>
          <div class="h-12 bg-gray-100 rounded"></div>
          <div class="h-12 bg-gray-100 rounded"></div>
        </div>
        <div class="h-9 bg-orange-50 rounded"></div>
      </div>
      <!-- Shortcuts skeleton -->
      <div class="mx-4 mt-4 bg-white rounded-lg p-4 shadow-sm">
        <div class="grid grid-cols-2 gap-3">
          <div class="h-9 bg-gray-100 rounded"></div>
          <div class="h-9 bg-gray-100 rounded"></div>
        </div>
      </div>
      <!-- Stats skeleton -->
      <div class="mx-4 mt-4 bg-white rounded-lg p-4 shadow-sm">
        <div class="grid grid-cols-3 gap-3">
          <div class="h-8 bg-gray-100 rounded"></div>
          <div class="h-8 bg-gray-100 rounded"></div>
          <div class="h-8 bg-gray-100 rounded"></div>
        </div>
      </div>
      <!-- Quick actions skeleton -->
      <div class="mx-4 mt-4 bg-white rounded-lg p-4 shadow-sm">
        <div class="grid grid-cols-5 gap-4">
          <div v-for="i in 5" :key="i" class="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
      <div class="h-20"></div>
    </div>
  </div>
  <main class="bg-gray-50 min-h-screen" dir="rtl" lang="ar" v-else-if="user.isLoggedIn">
    <!-- Header -->
    <div class="bg-white px-4 py-3 flex items-center justify-between">
      <button @click="goToSettings" aria-label="الإعدادات">
        <Settings class="w-6 h-6 text-gray-600" />
      </button>
      <div class="flex items-center gap-2">
        <span class="bg-gray-400 text-white px-2 py-1 rounded text-xs">SO %</span>
        <span class="text-lg font-medium">{{ username }}</span>
      </div>
      <div class="w-6 h-6"></div>
    </div>

    <!-- JEEEY Club Card -->
    <div class="bg-white mx-4 mt-4 rounded-lg p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">JEEEY CLUB</div>
      </div>
      <div class="text-sm text-gray-600 mb-4">انضم للحصول على المزايا 3+</div>

      <div class="flex justify-between items-center mb-4">
        <div class="text-center">
          <div class="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <span class="text-orange-500 font-bold text-xs">5%</span>
          </div>
          <div class="text-xs text-gray-600">نقاط يومية 5%</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">15%</div>
          <div class="text-xs text-gray-600">خصومات حتى 15%</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">10%</div>
          <div class="text-xs text-gray-600">10%-2% منتجة الشحن</div>
        </div>
      </div>

      <div class="bg-orange-50 p-3 rounded-lg">
        <div class="text-center">
          <span class="text-orange-500 line-through text-sm">₪33.99 (بدلاً من 93)</span>
          <span class="text-orange-500 font-bold text-lg mr-2">₪22.99</span>
          <button class="text-orange-500 text-sm underline" @click="joinClub">انضم الآن</button>
        </div>
      </div>
    </div>

    <!-- Coupons shortcut next to points -->
    <div class="bg-white mx-4 mt-4 rounded-lg p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-3">
        <a href="/points" class="block text-center py-2 rounded bg-gray-100 hover:bg-gray-200">نقاطي</a>
        <a href="/coupons" class="block text-center py-2 rounded bg-gray-100 hover:bg-gray-200">كوبوناتي</a>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="bg-white mx-4 mt-4 rounded-lg p-4 shadow-sm">
      <div class="flex justify-between">
        <div class="text-center">
          <div class="text-2xl font-bold">{{ awaitingShip }}</div>
          <div class="text-xs text-gray-600">بانتظار الشحن</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{{ points }}</div>
          <div class="text-xs text-gray-600">نقاط</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{{ cartCount }}</div>
          <div class="text-xs text-gray-600">عربات</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mx-4 mt-4">
      <div class="text-sm text-gray-500 mb-3">الأوامر المحفوظة</div>
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <div class="flex justify-between">
          <button class="text-center" @click="go('/wishlist')">
            <Heart class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">المنتجات المحفوظة</div>
          </button>
          <button class="text-center" @click="go('/orders')">
            <Package class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">تتبع</div>
          </button>
          <button class="text-center" @click="go('/orders')">
            <Truck class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">مركز الشحن</div>
          </button>
          <button class="text-center" @click="go('/orders')">
            <CreditCard class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">في التحضير</div>
          </button>
          <button class="text-center" @click="go('/offers')">
            <Gift class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">عرض مجاني</div>
          </button>
        </div>
      </div>
    </div>

    <!-- More Services -->
    <div class="mx-4 mt-4">
      <div class="text-sm font-medium mb-3">المزيد من الخدمات</div>
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <div class="grid grid-cols-4 gap-4">
          <button class="text-center" @click="go('/free')">
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span class="text-sm">مجاني</span>
            </div>
            <div class="text-xs text-gray-600">مجاني</div>
          </button>
          <button class="text-center" @click="go('/camera')">
            <Camera class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">كتب</div>
          </button>
          <button class="text-center" @click="go('/company')">
            <Megaphone class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">شركة</div>
          </button>
          <button class="text-center" @click="go('/reviews')">
            <FileText class="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div class="text-xs text-gray-600">مركز يستضيف الآراء</div>
          </button>
          <button class="text-center" @click="go('/support')">
            <Headphones class="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div class="text-xs text-gray-600">خدمة العملاء</div>
          </button>
        </div>
      </div>
    </div>

    <!-- Product Recommendation -->
    <div class="mx-4 mt-4">
      <div class="text-sm font-medium mb-3">تقييم الأسبوع</div>
      <div class="bg-white rounded-lg overflow-hidden shadow-sm">
        <img
          src="https://csspicker.dev/api/image/?q=black+tank+top+jeans&image_type=photo"
          alt="Product"
          class="w-full h-48 object-cover"
        />
        <div class="p-3">
          <div class="text-sm font-medium">SHEIN Privé قميص علوي ملائم جداً</div>
          <div class="flex items-center justify-between mt-2">
            <div class="text-orange-500 font-bold">₪18.40</div>
            <div class="text-xs text-gray-500">₪23.00</div>
          </div>
          <div class="text-xs text-gray-500 mt-1">تم شراؤه من قبل 1000+ مشتري</div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="flex justify-around py-2">
        <button class="text-center py-2" @click="go('/account')">
          <User class="w-6 h-6 mx-auto mb-1 text-gray-600" />
          <div class="text-xs text-gray-600">أنا</div>
        </button>
        <button class="text-center py-2 relative" @click="go('/cart')">
          <ShoppingCart class="w-6 h-6 mx-auto mb-1 text-gray-600" />
          <div class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{{ cartCount }}</div>
          <div class="text-xs text-gray-600">عربة</div>
          <div class="bg-red-500 text-white text-xs px-2 py-1 rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2">SAVE 10</div>
        </button>
        <button class="text-center py-2" @click="go('/ai')">
          <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
            <span class="text-white text-xs font-bold">AI</span>
          </div>
        </button>
        <button class="text-center py-2" @click="go('/search')">
          <Search class="w-6 h-6 mx-auto mb-1 text-gray-600" />
          <div class="text-xs text-gray-600">البحث</div>
        </button>
        <button class="text-center py-2" @click="go('/')">
          <Home class="w-6 h-6 mx-auto mb-1 text-gray-600" />
          <div class="text-xs text-gray-600">الرئيسية</div>
        </button>
      </div>
    </div>

    <div class="h-20"></div>
  </main>
  <GuestAccount v-else />
  
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import GuestAccount from '@/components/account/GuestAccount.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/store/user'
import { apiGet, apiPost } from '@/lib/api'
import { Settings, User, Heart, Package, Truck, CreditCard, Gift, Camera, Megaphone, FileText, Headphones, Search, Home, ShoppingCart } from 'lucide-vue-next'
const props = defineProps<{ userName?: string }>()
const user = useUser()
const username = computed(()=> props.userName || user.username || 'jeeey')
const router = useRouter()
function go(path:string){ router.push(path) }
function goToSettings(){ router.push('/settings') }

onMounted(async ()=>{
  // Safety: ensure we never block the UI beyond a short window
  try{ setTimeout(()=>{ try{ if (!hydrated.value){ user.isLoggedIn = false; hydrated.value = true } }catch{} }, 2500) }catch{}
  // Helpers
  const getApexDomain = (): string | null => {
    try{
      const host = location.hostname // e.g., m.jeeey.com
      if (host === 'localhost' || /^(\d+\.){3}\d+$/.test(host)) return null
      const parts = host.split('.')
      if (parts.length < 2) return null
      const apex = parts.slice(-2).join('.')
      return apex
    }catch{ return null }
  }
  const writeCookie = (name: string, value: string): void => {
    try{
      const apex = getApexDomain()
      const isHttps = typeof location !== 'undefined' && location.protocol === 'https:'
      const sameSite = isHttps ? 'None' : 'Lax'
      const secure = isHttps ? ';Secure' : ''
      const domainPart = apex ? `;domain=.${apex}` : ''
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60*60*24*30}${domainPart};SameSite=${sameSite}${secure}`
    }catch{}
  }
  const meWithRetry = async (retries = 2): Promise<any|null> => {
    for (let i=0;i<=retries;i++){
      try{
        const me = await apiGet<any>('/api/me?ts=' + Date.now())
        if (me && me.user) return me
      }catch{}
      await new Promise(res=> setTimeout(res, 250))
    }
    return null
  }

  try{
    // Capture token from URL (OAuth callback) and persist cookies before requesting /api/me
    const sp = new URLSearchParams(typeof window!=='undefined' ? location.search : '')
    const t = sp.get('t') || ''
    if (t) {
      writeCookie('auth_token', t)
      writeCookie('shop_auth_token', t)
      try{ localStorage.setItem('shop_token', t) }catch{}
      // Link analytics session to user immediately after setting token
      try{
        let sid = localStorage.getItem('sid_v1') || ''
        if (!sid){
          try{
            sid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
            localStorage.setItem('sid_v1', sid)
          }catch{}
        }
        if (sid){ await apiPost('/api/analytics/link', { sessionId: sid }) }
      }catch{}
      try{ const u = new URL(location.href); u.searchParams.delete('t'); history.replaceState(null,'',u.toString()) }catch{}
    }

    const me = await meWithRetry(2)
    if (me && me.user) {
      user.isLoggedIn = true
      if (me.user.name || me.user.email || me.user.phone) {
        user.username = String(me.user.name || me.user.email || me.user.phone)
      }
    // Profile incomplete? Keep user on Account; let Verify flow handle first-time redirection
      hydrated.value = true
      return
    }
  }catch{}

  // If no user after retries: clear cookies and show guest account (no redirect)
  try{
    const clear = (name:string)=>{ document.cookie = `${name}=; Max-Age=0; path=/; domain=.jeeey.com; SameSite=None; Secure`; document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`; }
    clear('shop_auth_token'); clear('auth_token')
  }catch{}
  user.isLoggedIn = false
  hydrated.value = true
  // Stay on guest account page; user can choose to login from the page CTA
})

const hydrated = ref(false)
</script>

<style scoped>
.account{background:#f5f6f8;min-height:100dvh}
.box{margin:0 12px}
.account-loading{background:#f5f6f8;min-height:100dvh;display:flex;align-items:flex-start;justify-content:stretch}
</style>

