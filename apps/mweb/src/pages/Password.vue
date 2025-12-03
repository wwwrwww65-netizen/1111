<template>
  <div class="min-h-screen bg-white flex flex-col" dir="rtl">
    <!-- Header -->
    <header class="w-full py-4 flex items-center justify-between px-6">
      <button aria-label="رجوع" @click="goBack" class="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors">
        <ArrowRight class="w-6 h-6 text-gray-800" />
      </button>
      <div class="w-10"></div>
    </header>

    <main class="flex-1 max-w-md mx-auto px-6 w-full flex flex-col pt-4">
      <!-- Welcome Section -->
      <div class="mb-8 animate-fadeIn">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">مرحباً بعودتك<span v-if="userName">، {{ userName }}</span>! 👋</h1>
        <p class="text-[15px] text-gray-500 leading-relaxed">
          أدخل كلمة المرور للمتابعة إلى حسابك المرتبط بالرقم 
          <span dir="ltr" class="font-semibold text-gray-900">{{ displayPhone }}</span>
        </p>
      </div>

      <!-- Password Field -->
      <div class="space-y-6 animate-slideUp">
        <div class="space-y-2">
          <label class="block text-[13px] font-medium text-gray-700">كلمة المرور</label>
          <div class="relative group">
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'"
              class="w-full h-14 px-4 rounded-[12px] border border-gray-200 bg-gray-50 text-right text-[16px] transition-all duration-200 focus:bg-white focus:border-[#8a1538] focus:ring-4 focus:ring-[#8a1538]/5 outline-none placeholder:text-gray-400"
              placeholder="أدخل كلمة المرور"
              @keyup.enter="login"
              autofocus
            />
            <button 
              type="button"
              @click="showPassword = !showPassword"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
          
          <div v-if="errorMessage" class="flex items-start gap-2 text-red-500 text-[13px] bg-red-50 p-3 rounded-[8px] animate-shake">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <div class="flex justify-end">
          <button 
            @click="forgotPassword" 
            class="text-[13px] font-medium text-[#8a1538] hover:text-[#6d112c] transition-colors"
          >
            نسيت كلمة المرور؟
          </button>
        </div>

        <!-- Submit Button -->
        <button 
          @click="login" 
          :disabled="loading || !password"
          class="w-full h-14 rounded-[12px] text-white font-bold text-[16px] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#8a1538]/20 hover:shadow-[#8a1538]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none bg-[#8a1538]"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>تسجيل الدخول</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'
import { apiGet, apiPost } from '@/lib/api'
import { useUser } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUser()
const primary = '#8a1538'

const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const phone = computed(() => String(route.query.phone || ''))

const displayPhone = computed(() => {
  return phone.value
})

function goBack() {
  router.back()
}

const userName = ref('')

// Fetch user name if available
const fetchUserName = async () => {
  try {
    const res = await fetch(`/api/auth/check-user?phone=${encodeURIComponent(phone.value)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.name) userName.value = data.name
    }
  } catch {}
}

// Fetch on mount
fetchUserName()

const login = async () => {
  if (!password.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    // Use phone-based login directly
    const res = await fetch('/trpc/auth.login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone: phone.value, password: password.value })
    })
    
    const text = await res.text()
    let data: any = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch (e) {
      throw new Error('خطأ في الاتصال: استجابة غير صالحة')
    }

    if (!res.ok) {
      throw new Error(data.error?.message || 'خطأ في تسجيل الدخول')
    }

    // Login successful
    if (data.result?.data?.user) {
      // Save token if available
      if (data.result.data.token) {
        const token = data.result.data.token
        try {
          localStorage.setItem('shop_token', token)
        } catch {}

        // Manually set cookies to ensure persistence
        try {
          const writeCookie = (name: string, value: string) => {
            try {
              const host = location.hostname
              const parts = host.split('.')
              const apex = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
              const isHttps = location.protocol === 'https:'
              const sameSite = isHttps ? 'None' : 'Lax'
              const secure = isHttps ? ';Secure' : ''
              const domainPart = apex ? `;domain=${apex}` : ''
              document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 30}${domainPart};SameSite=${sameSite}${secure}`
            } catch {}
          }
          writeCookie('auth_token', token)
          writeCookie('shop_auth_token', token)
        } catch {}
      }
      
      // Verify session and update store
      const meWithRetry = async (retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            const me = await apiGet('/api/me?ts=' + Date.now())
            if (me && me.user) return me
          } catch {}
          await new Promise(res => setTimeout(res, 250))
        }
        return null
      }

      const me = await meWithRetry()

      if (me && me.user) {
        userStore.isLoggedIn = true
        if (me.user.name || me.user.email || me.user.phone) {
          userStore.username = String(me.user.name || me.user.email || me.user.phone)
        }

        // Link analytics
        try {
          const sid = localStorage.getItem('sid_v1') || ''
          if (sid) await apiPost('/api/analytics/link', { sessionId: sid })
        } catch {}

        // Merge cart
        try {
          const { useCart } = await import('@/store/cart')
          const cart = useCart()
          const items = Array.isArray(cart.items) ? cart.items.map(i => ({ productId: i.id, quantity: i.qty })) : []
          if (items.length) await apiPost('/api/cart/merge', { items })
          await cart.syncFromServer(true)
          cart.saveLocal()
        } catch {}

        // Redirect
        const ret = route.query.return ? String(route.query.return) : '/account'
        router.replace(ret)
      } else {
        // Fallback: if me fails but login said success, force reload
        const ret = route.query.return ? String(route.query.return) : '/account'
        window.location.replace(ret)
      }
    } else {
      // User data missing
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'خطأ في الاتصال'
  } finally {
    loading.value = false
  }
}

const forgotPassword = () => {
  router.push({
    path: '/verify',
    query: {
      phone: phone.value,
      dial: route.query.dial,
      auto: '1',
      reason: 'forgot', // Flag to indicate password reset flow
      return: route.query.return
    }
  })
}
</script>
