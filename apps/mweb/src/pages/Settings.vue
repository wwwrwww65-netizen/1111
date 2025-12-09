<template>
  <div class="min-h-screen bg-[#f7f7f7] flex flex-col scroll-smooth" dir="rtl">
    <!-- Header ثابت -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-12 flex items-center justify-between px-4">
      <button aria-label="رجوع" @click="goBack">
        <ArrowRight class="w-6 h-6 text-gray-800" />
      </button>
      <h1 class="text-[15px] font-semibold text-gray-900">الإعدادات</h1>
      <div class="w-6" />
    </header>

    <!-- المحتوى مع تمرير ناعم -->
    <main class="flex-1 pt-12 pb-6 space-y-4 w-screen overflow-y-auto scroll-smooth">
      <!-- خيار الاسم فقط -->
      <section class="bg-white w-full">
        <button class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right border-b border-gray-100 transition-colors">
          <span class="text-[13px] text-gray-800 flex items-center gap-2">
            <User class="w-5 h-5 text-gray-700" />
            {{ accountName }}
          </span>
          <ChevronLeft class="w-4 h-4 text-gray-400" />
        </button>
      </section>

      <!-- الإعدادات -->
      <section class="bg-white w-full">
        <div class="px-4 py-2 border-b border-gray-200">
          <h2 class="text-[13px] font-semibold text-gray-900">الإعدادات</h2>
        </div>
        <div>
          <button 
            v-for="item in settingsItems" 
            :key="item"
            class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right border-b border-gray-100 transition-colors"
            @click="handleSettingsClick(item)"
          >
            <span class="text-[13px] text-gray-800 flex items-center gap-2">
              {{ item }}
            </span>
            <ChevronLeft class="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </section>

      <!-- المعلومات -->
      <section id="info-section" class="bg-white w-full">
        <div class="px-4 py-2 border-b border-gray-200">
          <h2 class="text-[13px] font-semibold text-gray-900">المعلومات</h2>
        </div>
        <div>
          <button 
            v-for="item in infoItems" 
            :key="item"
            class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right border-b border-gray-100 transition-colors"
            @click="handleInfoClick(item)"
          >
            <span class="text-[13px] text-gray-800 flex items-center gap-2">
              {{ item }}
            </span>
            <ChevronLeft class="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </section>

      <!-- تبديل الحساب -->
      <section class="bg-white w-full">
        <button 
          class="w-full px-4 py-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-800"
          @click="switchAccount"
        >
          <RefreshCcw class="w-4 h-4 text-gray-600" />
          تبديل الحساب
        </button>
      </section>

      <!-- تسجيل الخروج -->
      <section class="bg-white w-full">
        <button
          class="w-full px-4 py-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-white"
          style="background-color: #8a1538"
          @click="logout"
        >
          <LogOut class="w-4 h-4 text-white" />
          تسجيل الخروج
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, ChevronLeft, User, LogOut, RefreshCcw } from 'lucide-vue-next'
import { apiPost } from '../lib/api'

const router = useRouter()
const accountName = "jeeey"

// قائمة الإعدادات
const settingsItems = [
  "دفتر العناوين",
  "تغيير العملة", 
  "خيارات الدفع",
  "إدارة حسابي",
  "جهات الاتصال المفضلة"
]

// قائمة المعلومات
const infoItems = [
  "معلومات الشحن",
  "سياسة الإرجاع",
  "اختيار الإعلان",
  "استرداد",
  "طريقة الدفع",
  "عن محفظة جي jeeey",
  "سياسة نقاط المكافأة",
  "سياسة القسائم",
  "شروط وأحكام VIP من جي jeeey",
  "إرشادات المراجعة",
  "بطاقة هدية",
  "كيف أتابع طلبي",
  "صفحة كيفية الطلب",
  "مركز الخصوصية",
  "الشروط والأحكام",
  "من نحن",
  "معلومات الشركة"
]

// وظائف التنقل
function goBack() {
  router.back()
}

function handleSettingsClick(item: string) {
  console.log('تم النقر على:', item)
  // يمكن إضافة منطق التنقل هنا
  switch(item) {
    case 'دفتر العناوين':
      router.push('/address')
      break
    case 'تغيير العملة':
      // يمكن إضافة صفحة تغيير العملة
      break
    case 'خيارات الدفع':
      // يمكن إضافة صفحة خيارات الدفع
      break
    case 'إدارة حسابي':
      router.push('/account')
      break
    default:
      console.log('لم يتم تحديد صفحة لهذا العنصر:', item)
  }
}

function handleInfoClick(item: string) {
  console.log('تم النقر على:', item)
  // يمكن إضافة منطق التنقل هنا
  switch(item) {
    case 'معلومات الشحن':
      // يمكن إضافة صفحة معلومات الشحن
      break
    case 'سياسة الإرجاع':
      router.push('/legal/returns')
      break
    case 'الشروط والأحكام':
      router.push('/legal/terms')
      break
    case 'مركز الخصوصية':
      router.push('/legal/privacy')
      break
    default:
      console.log('لم يتم تحديد صفحة لهذا العنصر:', item)
  }
}

async function switchAccount() {
  try { await logout() } catch {}
  router.push('/login')
}

async function logout() {
  try {
    // Best-effort: notify backend to clear HttpOnly cookies (if any)
    await apiPost('/api/auth/logout', {})
  } catch {}
  try {
    // Clear auth cookies for both apex domain and current host
    const clearCookie = (name: string) => {
      try {
        const host = location.hostname
        const parts = host.split('.')
        const apex = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
        // Expire on apex (if any) and current host
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${apex}; SameSite=None; Secure`
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
      } catch {}
    }
    clearCookie('shop_auth_token')
    clearCookie('auth_token')
  } catch {}
  try { localStorage.removeItem('shop_token') } catch {}
  try { localStorage.removeItem('cart_v1') } catch {} // Clear local cart
  try { sessionStorage.removeItem('__linked_v1') } catch {}
  // Force a fresh analytics session for the next user
  try { localStorage.removeItem('sid_v1') } catch {}

  // Use window.location.replace to force a full reload and clear in-memory Pinia state
  window.location.replace('/login')
}
</script>

<style scoped>
/* استخدام Tailwind CSS - لا حاجة لأنماط إضافية */
</style>
