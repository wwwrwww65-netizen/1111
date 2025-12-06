<template>
  <div class="min-h-screen bg-white" dir="rtl">
    <!-- Header -->
    <header class="w-full py-4 flex items-center justify-between px-4">
      <button aria-label="رجوع" @click="goBack"><ArrowRight class="w-6 h-6 text-gray-800" /></button>
      <h1 class="text-2xl font-extrabold tracking-widest" :style="{ color: primary, marginTop: '8px' }">jeeey</h1>
      <div class="w-6"></div>
    </header>

    <main class="max-w-md mx-auto px-4 py-6 space-y-6">
      <!-- Promo split -->
      <div class="relative grid grid-cols-2 rounded-[6px] overflow-hidden animate-fadeIn" style="background-color:#fff6f3">
        <div class="flex flex-col items-center justify-center py-6">
          <div class="flex flex-col items-center">
            <Gift class="w-6 h-6 text-red-500 mb-2" />
            <div class="text-sm font-bold text-gray-900">خصم %10</div>
            <div class="text-xs text-gray-600">على طلبك الأول</div>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center py-6">
          <div class="flex flex-col items-center">
            <Star class="w-6 h-6 text-yellow-500 mb-2" />
            <div class="text-sm font-bold text-gray-900">jeeey CLUB</div>
            <div class="text-xs text-gray-600">مزايا حصرية</div>
          </div>
        </div>
        <div class="absolute left-1/2 w-px bg-black" style="top:30%;bottom:30%" />
      </div>

      <!-- Phone field -->
      <div>
        <label class="block text-[12px] text-gray-700 mb-1">رقم الهاتف</label>
        <div class="relative">
          <button type="button" @click="showCountryMenu = !showCountryMenu" class="absolute left-2 top-1/2 -translate-y-1/2 h-8 px-2 rounded-[4px] border border-gray-200 bg-gray-50 text-[12px] text-gray-800 flex items-center gap-1 z-20" dir="ltr">
            <Globe class="w-4 h-4" :style="{ color: primary }" />
            <span :style="{ color: primary }">{{ country.code }}</span>
            <span class="text-gray-500">{{ country.dial }}</span>
            <ChevronDown class="w-4 h-4 text-gray-600" />
          </button>

          <!-- Country Modal Bottom Sheet -->

          <div v-if="showCountryMenu" class="fixed inset-0 z-50 flex items-end justify-center">
             <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/50 transition-opacity" @click="showCountryMenu = false"></div>

            <!-- Modal Content -->
            <div class="relative w-full bg-white rounded-t-xl h-[75vh] flex flex-col animate-slideUp shadow-2xl">
              <!-- Header -->
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <h3 class="text-[15px] font-bold" :style="{ color: primary }">اختر الدولة</h3>
                <button @click="showCountryMenu = false" class="p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-full">
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Body -->
              <div class="flex-1 relative overflow-hidden flex" dir="rtl">
                <!-- Country List -->
                <div class="flex-1 h-full overflow-y-auto no-scrollbar px-4 pb-10 scroll-smooth" ref="countryListRef">
                  <!-- Suggested -->
                  <div class="py-2">
                    <div class="text-[11px] font-bold text-gray-400 mb-2">المقترحة</div>
                    <div class="space-y-1">
                      <button
                        v-for="c in popularCountries"
                        :key="'pop-'+c.code"
                        class="w-full flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0"
                        @click="selectCountry(c)"
                      >
                        <div class="flex items-center gap-3">
                          <span class="text-[14px] text-gray-800 font-medium">{{ c.name }}</span>
                          <span class="text-[14px] text-gray-500" dir="ltr">{{ c.dial }}</span>
                        </div>
                        <Check v-if="country.code === c.code" class="w-4 h-4" :style="{ color: primary }" :stroke-width="3" />
                      </button>
                    </div>
                  </div>

                  <!-- Alphabetical Groups -->
                  <div v-for="l in letters" :key="l" :id="'group-' + l" class="pt-2">
                    <div class="text-[11px] font-bold text-black bg-gray-50/80 backdrop-blur-sm py-1 px-2 rounded mb-1 sticky top-0 z-10">{{ l }}</div>
                    <div class="space-y-1">
                      <button
                        v-for="c in groupedCountries[l]"
                        :key="c.code"
                        class="w-full flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0"
                        @click="selectCountry(c)"
                      >
                        <div class="flex items-center gap-3">
                          <span class="text-[14px] text-gray-800 font-medium">{{ c.name }}</span>
                          <span class="text-[14px] text-gray-500" dir="ltr">{{ c.dial }}</span>
                        </div>
                        <Check v-if="country.code === c.code" class="w-4 h-4" :style="{ color: primary }" :stroke-width="3" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Alphabet Sidebar -->
                <div class="w-6 h-full flex flex-col items-center justify-center shrink-0 bg-gray-50/50 text-[12px] font-bold text-gray-500 select-none py-2 overflow-y-auto gap-1 ml-1" style="touch-action: none;">
                  <div
                    v-for="l in letters"
                    :key="l"
                    class="w-full h-[20px] flex items-center justify-center cursor-pointer hover:text-[#8a1538] transition-colors"
                    @click="scrollToLetter(l)"
                  >
                    {{ l }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <input
            type="tel"
            placeholder="أدخل رقم هاتفك"
            class="w-full h-11 pl-[130px] pr-3 rounded-[4px] border text-[13px] transition-all duration-200 text-left placeholder:text-right"
            :class="errorMessage ? 'border-red-500' : 'border-gray-200'"
            style="direction:ltr"
            :value="phone"
            @input="onPhone"
          />
        </div>
        <div v-if="errorMessage" class="mt-1 flex items-center text-red-600 text-[11px] animate-pulse">
          <AlertCircle class="w-3.5 h-3.5 ml-1" />
          {{ errorMessage }}
        </div>
        <div v-if="msg" class="mt-1 flex items-center text-red-600 text-[11px] animate-pulse">
          <AlertCircle class="w-3.5 h-3.5 ml-1" />
          {{ msg }}
        </div>
      </div>

      <!-- Login button -->
      <button 
        class="w-full h-11 rounded-[4px] text-[13px] font-semibold flex items-center justify-center transition-all duration-200 hover:scale-[1.02]" 
        :style="{ backgroundColor: primary, color: 'white' }" 
        :disabled="sending" 
        @click="requestOtp"
      >
        {{ sending ? 'جار الإرسال…' : buttonText }}
      </button>

      <!-- Social login hidden
      <div class="flex items-center gap-2">
        <div class="h-px bg-gray-300 flex-1"></div>
        <div class="text-[11px] text-gray-500">أو</div>
        <div class="h-px bg-gray-300 flex-1"></div>
      </div>

      <div class="space-y-2">
        <button class="w-full h-11 rounded-[4px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-900 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.02]" aria-label="التسجيل عبر جوجل" @click="loginWithGoogle">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.3 0 6.2 1.1 8.5 3.2l6.3-6.3C34.7 2.6 29.8 1 24 1 14.6 1 6.6 6.2 2.7 14l7.8 6.1C12.2 14.5 17.6 9.5 24 9.5z"/>
            <path fill="#FBBC05" d="M46.5 24c0-1.6-.1-2.7-.4-4H24v8h12.7c-.6 3-2.3 5.6-4.9 7.3l7.5 5.8C43.8 37.4 46.5 31.3 46.5 24z"/>
            <path fill="#4285F4" d="M24 46.5c6.2 0 11.4-2 15.2-5.4l-7.5-5.8c-2.1 1.4-4.9 2.2-7.7 2.2-6.4 0-11.8-5-13.4-11.6L2.7 34c3.9 7.8 11.9 12.5 21.3 12.5z"/>
            <path fill="#34A853" d="M10.6 25.9c-.4-1.2-.6-2.5-.6-3.9s.2-2.7.6-3.9L2.7 14C1.6 16.2 1 19 1 22s.6 5.8 1.7 8l7.9-4.1z"/>
          </svg>
          التسجيل عبر جوجل
        </button>
        <button class="w-full h-11 rounded-[4px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-900 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.02]" aria-label="التسجيل عبر فيسبوك" @click="loginWithFacebook">
          <Facebook class="w-4 h-4 text-[#1877F2]" />
          التسجيل عبر فيسبوك
        </button>
      </div>
      -->

      <p class="text-[11px] text-gray-600 text-center">بالمُتابعة، فإنك توافق على سياسة الخصوصية وشروط الاستخدام الخاصة بنا</p>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Gift, Star, Globe, ChevronDown, AlertCircle, Facebook, ArrowRight, X, Check } from 'lucide-vue-next'
import { apiPost, apiGet } from '@/lib/api'
import { allCountries, popularCountries, type Country } from '@/lib/countries'
import { parsePhoneNumber, validatePhoneNumberLength } from 'libphonenumber-js/max'

const route = useRoute()
const router = useRouter()

// Initialize from query if present (e.g. returning from Verify page)
const queryDial = route.query.dial ? String(route.query.dial) : ''
const queryPhone = route.query.phone ? String(route.query.phone) : ''

const initialCountry = queryDial 
  ? (allCountries.find(c => c.dial.replace(/\D/g,'') === queryDial.replace(/\D/g,'')) || popularCountries[0])
  : popularCountries[0]

const country = ref<Country>(initialCountry)
const showCountryMenu = ref(false)
const countryListRef = ref<HTMLElement>()

// Group countries by first Arabic letter (ignoring "AL-")
const groupedCountries = computed(() => {
  const groups: Record<string, Country[]> = {}
  allCountries.forEach(c => {
    let name = c.name
    // Remove "ال" if present at start for indexing purposes
    if (name.startsWith('ال') && name.length > 2) {
      name = name.substring(2)
    }
    const char = name.charAt(0)
    if (!groups[char]) groups[char] = []
    groups[char].push(c)
  })
  return groups
})

const letters = computed(() => Object.keys(groupedCountries.value).sort((a, b) => a.localeCompare(b, 'ar')))

function scrollToLetter(l: string) {
  const el = document.getElementById('group-' + l)
  if (el && countryListRef.value) {
    // Simple scroll into view
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const phone = ref(queryPhone)
const digitsOnly = computed(()=> phone.value.replace(/[^\d]/g,''))
const isTyping = computed(()=> phone.value.trim().length>0)
const errorMessage = ref('')
const errorCount = ref(0)
const isNewUser = ref<boolean | null>(null)
const checkingUser = ref(false)
let checkTimeout: any = null

const primary = '#8a1538'
function goBack(){ try{ router.back() } catch{} }

const buttonText = computed(() => {
  if (!errorMessage.value && phone.value && !checkingUser.value) {
    if (isNewUser.value === true) return 'التأكيد عبر واتساب'
    if (isNewUser.value === false) return 'تسجيل الدخول'
  }
  return 'تسجيل الدخول'
})

async function checkUserExistence() {
  if (checkTimeout) clearTimeout(checkTimeout)
  checkTimeout = setTimeout(async () => {
    if (!phone.value) {
      isNewUser.value = null
      return
    }
    
    // Basic validation before check
    const dial = country.value.dial
    const local = phone.value.replace(/\D/g,'')
    const fullNumber = dial + local
    const phoneNumber = parsePhoneNumber(fullNumber, country.value.code as any)
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      isNewUser.value = null
      return
    }

    checkingUser.value = true
    try {
      const res = await apiGet(`/api/auth/check-user?phone=${encodeURIComponent(fullNumber)}`)
      if (res) {
        isNewUser.value = !res.exists
      }
    } catch {
      isNewUser.value = null
    } finally {
      checkingUser.value = false
    }
  }, 500)
}

function onPhone(e: Event){ 
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '')
  phone.value = val
  if (input.value !== val) input.value = val
  
  // Reset error count on typing valid input (simple reset)
  if (errorMessage.value) errorCount.value = 0

  // Dynamic validation for length based on country rules
  const res = validatePhoneNumberLength(val, country.value.code as any)
  if (res === 'TOO_LONG') {
    errorMessage.value = 'رقم الهاتف طويل جداً'
    isNewUser.value = null
  } else if (errorMessage.value === 'رقم الهاتف طويل جداً') {
    errorMessage.value = ''
  } else {
    errorMessage.value = ''
  }
  
  // Check user existence if valid length (approx)
  if (!errorMessage.value && val.length > 6) {
    checkUserExistence()
  } else {
    isNewUser.value = null
  }
}

function selectCountry(c: Country) {
  country.value = c
  showCountryMenu.value = false
  errorMessage.value = ''
  errorCount.value = 0
  isNewUser.value = null
  if (phone.value) checkUserExistence()
}

const sending = ref(false)
const sent = ref(false)
const verifying = ref(false)
const code = ref('')
const msg = ref('')
const ok = ref(false)

// Rate Limiting Logic
function checkRateLimit(): boolean {
  try {
    const blockUntil = parseInt(localStorage.getItem('login_block_until') || '0')
    if (blockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000)
      errorMessage.value = `تم إيقاف التسجيل مؤقتاً. الرجاء المحاولة بعد ${remainingMinutes} دقيقة.`
      return false
    }
  } catch {}
  return true
}

function recordAttempt() {
  try {
    let attempts = parseInt(localStorage.getItem('login_attempts') || '0')
    let level = parseInt(localStorage.getItem('login_block_level') || '1')
    attempts++
    
    if (attempts > 3) {
      // Block user: 30 mins * level
      const blockDuration = 30 * 60 * 1000 * level
      const blockUntil = Date.now() + blockDuration
      
      localStorage.setItem('login_block_until', blockUntil.toString())
      localStorage.setItem('login_block_level', (level + 1).toString())
      localStorage.setItem('login_attempts', '0')
      
      const remainingMinutes = Math.ceil(blockDuration / 60000)
      errorMessage.value = `تم تجاوز عدد المحاولات المسموح بها. تم إيقاف التسجيل لمدة ${remainingMinutes} دقيقة.`
      return false
    } else {
      localStorage.setItem('login_attempts', attempts.toString())
      return true
    }
  } catch { return true }
}

async function requestOtp(){
  msg.value = ''; ok.value = false; sent.value = false; errorMessage.value = '';
  
  // Check if user is blocked
  if (!checkRateLimit()) return

  if (!phone.value) {
    errorMessage.value = 'الرجاء إدخال رقم الهاتف'
    return
  }

  // Validate phone number
  try {
    const dial = country.value.dial
    const local = phone.value.replace(/\D/g,'')
    // Construct full number to validate
    const fullNumber = dial + local
    const phoneNumber = parsePhoneNumber(fullNumber, country.value.code as any)
    
    if (!phoneNumber || !phoneNumber.isValid()) {
       errorCount.value++
       errorMessage.value = errorCount.value > 1 
         ? 'رقم الهاتف غير صحيح، تأكد من اختيار رمز الدولة الصحيح' 
         : 'رقم الهاتف غير صحيح'
       return
    }
    
    // Strict mobile check
    const type = phoneNumber.getType()
    if (type !== 'MOBILE' && type !== 'FIXED_LINE_OR_MOBILE') {
       errorCount.value++
       errorMessage.value = errorCount.value > 1 
         ? 'يجب إدخال رقم جوال صحيح، تأكد من اختيار رمز الدولة الصحيح' 
         : 'يجب إدخال رقم جوال صحيح'
       return
    }

  } catch (e) {
    errorCount.value++
    errorMessage.value = errorCount.value > 1 
      ? 'رقم الهاتف غير صحيح، تأكد من اختيار رمز الدولة الصحيح' 
      : 'رقم الهاتف غير صحيح'
    return
  }

  // Record attempt before proceeding
  if (!recordAttempt()) return

  // Check user status if not already checked
  if (isNewUser.value === null) {
      if (checkingUser.value) {
        checkingUser.value = true
        try {
          const dial = country.value.dial
          const local = phone.value.replace(/\D/g,'')
          const fullNumber = dial + local
          const res = await apiGet(`/api/auth/check-user?phone=${encodeURIComponent(fullNumber)}`)
          if (res) isNewUser.value = !res.exists
        } catch { isNewUser.value = true } 
        checkingUser.value = false
      } else {
          checkingUser.value = true
          try {
            const dial = country.value.dial
            const local = phone.value.replace(/\D/g,'')
            const fullNumber = dial + local
            const res = await apiGet(`/api/auth/check-user?phone=${encodeURIComponent(fullNumber)}`)
            if (res) isNewUser.value = !res.exists
          } catch { isNewUser.value = true }
          checkingUser.value = false
      }
  }

  if (isNewUser.value === false) {
    // Existing user -> Password page
    const local = phone.value.replace(/\D/g,'')
    const dial = country.value.dial.replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const ret = typeof window !== 'undefined' ? (new URLSearchParams(location.search).get('return') || '/account') : '/account'
    router.push({ path:'/password', query:{ phone: e164, dial: country.value.dial, return: ret } })
    return
  }

  // New user -> Verify page (OTP)
  const local = phone.value.replace(/\D/g,'')
  const dial = country.value.dial.replace(/\D/g,'')
  const e164 = local.startsWith(dial) ? local : (dial + local)
  const ret = typeof window !== 'undefined' ? (new URLSearchParams(location.search).get('return') || '/account') : '/account'
  router.push({ path:'/verify', query:{ phone: e164, dial: country.value.dial, auto: '1', ch: 'both', return: ret } })
}

/*
function loginWithGoogle(){
  const ret = typeof window !== 'undefined' ? (new URLSearchParams(location.search).get('return') || '/account') : '/account'
  const url = googleLoginUrl(ret)
  window.location.href = url
}

function loginWithFacebook(){
  const ret = typeof window !== 'undefined' ? (new URLSearchParams(location.search).get('return') || '/account') : '/account'
  const url = facebookLoginUrl(ret)
  window.location.href = url
}
*/

async function verifyOtp(){
  msg.value = ''; ok.value = false;
  if (!code.value.trim()){ msg.value = 'أدخل الرمز'; return }
  try{
    verifying.value = true
    const r = await apiPost('/api/auth/otp/verify', { phone: phone.value, code: code.value })
    if (r && r.ok){
      // Persist token to cookies and localStorage
      try{
        const writeCookie = (name: string, value: string) => {
          try{
            const host = location.hostname
            const parts = host.split('.')
            const apex = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
            const isHttps = location.protocol === 'https:'
            const sameSite = isHttps ? 'None' : 'Lax'
            const secure = isHttps ? ';Secure' : ''
            const domainPart = apex ? `;domain=${apex}` : ''
            document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60*60*24*30}${domainPart};SameSite=${sameSite}${secure}`
          }catch{}
        }
        if (r.token){
          writeCookie('auth_token', r.token)
          writeCookie('shop_auth_token', r.token)
          try{ localStorage.setItem('shop_token', r.token) }catch{}
        }
      }catch{}
      // Link current anonymous session to user for analytics
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
      ok.value = true; msg.value = 'تم تسجيل الدخول بنجاح'
      setTimeout(()=> router.push('/account'), 400)
    }
    else { msg.value = 'رمز غير صحيح أو منتهي' }
  } catch { msg.value = 'خطأ في الشبكة' } finally { verifying.value = false }
}
</script>
<style scoped>
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.animate-fadeIn{animation:fadeIn .3s ease-out}
.animate-slideUp{animation:slideUp .3s ease-out}
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
