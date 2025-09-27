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
            <div class="text-sm font-bold text-gray-900">خصم %15</div>
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
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 rounded-[4px] border border-gray-200 bg-gray-50 text-[12px] text-gray-800 flex items-center gap-1">
            <Globe class="w-4 h-4 text-gray-700" />
            <span>{{ country.code }}</span>
            <span class="text-gray-500">{{ country.dial }}</span>
            <ChevronDown class="w-4 h-4 text-gray-600" />
          </button>
          <input
            placeholder="أدخل رقم هاتفك"
            class="w-full h-11 px-3 pr-[130px] rounded-[4px] border text-[13px] transition-all duration-200"
            :class="showError ? 'border-red-500' : 'border-gray-200'"
            style="direction:ltr"
            :value="phone"
            @input="onPhone"
          />
        </div>
        <div v-if="showError" class="mt-1 flex items-center text-red-600 text-[11px] animate-pulse">
          <AlertCircle class="w-3.5 h-3.5 ml-1" />
          رقم هاتف غير صحيح
        </div>
      </div>

      <!-- Login button -->
      <button class="w-full h-11 rounded-[4px] text-[13px] font-semibold flex items-center justify-center transition-transform duration-200 hover:scale-[1.02]" :style="{ backgroundColor: primary, color: 'white' }" :disabled="sending" @click="requestOtp">
        {{ isTyping ? (sending ? 'جار الإرسال…' : 'التأكيد عبر واتساب') : 'تسجيل الدخول' }}
      </button>

      <!-- OR divider -->
      <div class="flex items-center gap-2">
        <div class="h-px bg-gray-300 flex-1"></div>
        <div class="text-[11px] text-gray-500">أو</div>
        <div class="h-px bg-gray-300 flex-1"></div>
      </div>

      <!-- Social buttons -->
      <div class="space-y-2">
        <button class="w-full h-11 rounded-[4px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-900 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.02]" aria-label="التسجيل عبر جوجل">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.3 0 6.2 1.1 8.5 3.2l6.3-6.3C34.7 2.6 29.8 1 24 1 14.6 1 6.6 6.2 2.7 14l7.8 6.1C12.2 14.5 17.6 9.5 24 9.5z"/>
            <path fill="#FBBC05" d="M46.5 24c0-1.6-.1-2.7-.4-4H24v8h12.7c-.6 3-2.3 5.6-4.9 7.3l7.5 5.8C43.8 37.4 46.5 31.3 46.5 24z"/>
            <path fill="#4285F4" d="M24 46.5c6.2 0 11.4-2 15.2-5.4l-7.5-5.8c-2.1 1.4-4.9 2.2-7.7 2.2-6.4 0-11.8-5-13.4-11.6L2.7 34c3.9 7.8 11.9 12.5 21.3 12.5z"/>
            <path fill="#34A853" d="M10.6 25.9c-.4-1.2-.6-2.5-.6-3.9s.2-2.7.6-3.9L2.7 14C1.6 16.2 1 19 1 22s.6 5.8 1.7 8l7.9-4.1z"/>
          </svg>
          التسجيل عبر جوجل
        </button>
        <button class="w-full h-11 rounded-[4px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-900 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.02]" aria-label="التسجيل عبر فيسبوك">
          <Facebook class="w-4 h-4 text-[#1877F2]" />
          التسجيل عبر فيسبوك
        </button>
      </div>

      <p class="text-[11px] text-gray-600 text-center">بالمُتابعة، فإنك توافق على سياسة الخصوصية وشروط الاستخدام الخاصة بنا</p>
    </main>

    <style scoped>
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .animate-fadeIn{animation:fadeIn .6s ease-in-out}
    </style>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Gift, Star, Globe, ChevronDown, AlertCircle, Facebook, ArrowRight } from 'lucide-vue-next'
import { apiPost } from '@/lib/api'

type Country = { code: string; name: string; dial: string }
const countries: Country[] = [
  { code: 'YE', name: 'اليمن', dial: '+967' },
  { code: 'SA', name: 'السعودية', dial: '+966' },
  { code: 'AE', name: 'الإمارات', dial: '+971' },
]
const country = ref<Country>(countries[0])
const phone = ref('')
const digitsOnly = computed(()=> phone.value.replace(/[^\d]/g,''))
const isTyping = computed(()=> phone.value.trim().length>0)
const showError = computed(()=> isTyping.value && digitsOnly.value.length < 8)

const primary = '#8a1538'
const router = useRouter()
function goBack(){ try{ router.back() } catch{} }
function onPhone(e: Event){ phone.value = (e.target as HTMLInputElement).value || '' }

const sending = ref(false)
const sent = ref(false)
const verifying = ref(false)
const code = ref('')
const msg = ref('')
const ok = ref(false)

async function requestOtp(){
  msg.value = ''; ok.value = false; sent.value = false;
  if (showError.value){ msg.value = 'رقم هاتف غير صحيح'; return }
  try{
    sending.value = true
    const local = phone.value.replace(/\D/g,'')
    const dial = country.value.dial.replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const r = await apiPost('/api/auth/otp/request', { phone: e164, channel: 'whatsapp' })
    if (r && (r.ok || r.sent)) {
      sent.value = true; ok.value = true; msg.value = 'تم إرسال الرمز عبر واتساب'
      setTimeout(()=> router.push({ path:'/verify', query:{ phone: e164, dial: country.value.dial, auto: '1' } }), 300)
    } else { msg.value = 'تعذر إرسال الرمز. تحقق من الرقم/القالب.' }
  } catch { msg.value = 'خطأ في الشبكة' } finally { sending.value = false }
}

async function verifyOtp(){
  msg.value = ''; ok.value = false;
  if (!code.value.trim()){ msg.value = 'أدخل الرمز'; return }
  try{
    verifying.value = true
    const r = await apiPost('/api/auth/otp/verify', { phone: phone.value, code: code.value })
    if (r && r.ok){ ok.value = true; msg.value = 'تم تسجيل الدخول بنجاح'; setTimeout(()=> router.push('/'), 500) }
    else { msg.value = 'رمز غير صحيح أو منتهي' }
  } catch { msg.value = 'خطأ في الشبكة' } finally { verifying.value = false }
}
</script>

