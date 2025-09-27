<template>
  <div class="login-root" dir="rtl">
    <header class="login-header">
      <button class="icon-btn" aria-label="رجوع" @click="goBack">
        <ArrowRight :size="24" color="#1f2937" />
      </button>
      <h1 class="logo">jeeey</h1>
      <div style="width:24px" />
    </header>

    <main class="login-main">
      <section class="promo-split animate-fadeIn" aria-label="مزايا التسجيل">
        <div class="promo-half">
          <Gift :size="24" color="#ef4444" style="margin-bottom:8px" />
          <div class="t12 bold text900">خصم %15</div>
          <div class="t11 text600">على طلبك الأول</div>
        </div>
        <div class="promo-half">
          <Star :size="24" color="#f59e0b" style="margin-bottom:8px" />
          <div class="t12 bold text900">jeeey CLUB</div>
          <div class="t11 text600">مزايا حصرية</div>
        </div>
        <div class="promo-divider" />
      </section>

      <section aria-label="رقم الهاتف">
        <label class="t11 text700" style="display:block;margin-bottom:4px">رقم الهاتف</label>
        <div class="phone-wrap">
          <button type="button" class="country-btn" aria-label="الدولة">
            <Globe :size="16" color="#374151" />
            <span class="t11 text900">{{ country.code }}</span>
            <span class="t11 text600">{{ country.dial }}</span>
            <ChevronDown :size="16" color="#4b5563" />
          </button>
          <input :value="phone" @input="onPhone" class="phone-input" :class="{ err: showError }" placeholder="أدخل رقم هاتفك" />
        </div>
        <div v-if="showError" class="err-row">
          <AlertCircle :size="14" color="#dc2626" style="margin-inline-start:4px" />
          <span class="t11" style="color:#dc2626">رقم هاتف غير صحيح</span>
        </div>
      </section>

      <div style="display:grid;gap:8px">
        <button class="login-btn" :disabled="sending" @click="requestOtp" aria-label="أرسل الرمز عبر واتساب">
          {{ sending ? 'جار الإرسال…' : 'أرسل الرمز عبر واتساب' }}
        </button>
        <div v-if="sent" class="t11 text600" style="text-align:center">تم إرسال الرمز. أدخله بالأسفل.</div>
        <div v-if="sent" style="display:grid;gap:8px;grid-template-columns:1fr auto">
          <input v-model="code" placeholder="أدخل الرمز" class="phone-input" style="direction:ltr" />
          <button class="login-btn" :disabled="verifying" @click="verifyOtp" aria-label="تحقق">
            {{ verifying ? 'جار التحقق…' : 'تحقق' }}
          </button>
        </div>
        <div v-if="msg" class="t11" :style="{color: ok? '#16a34a':'#dc2626', textAlign:'center'}">{{ msg }}</div>
      </div>

      <div class="or-row">
        <div class="hr" /><div class="t11 text600">أو</div><div class="hr" />
      </div>

      <div class="social-col">
        <button class="social-btn" aria-label="التسجيل عبر جوجل">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16" style="margin-inline-end:8px">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3" />
          </svg>
          <span class="t13 text900 bold">التسجيل عبر جوجل</span>
        </button>
        <button class="social-btn" aria-label="التسجيل عبر فيسبوك">
          <Facebook :size="16" color="#1877F2" style="margin-inline-end:8px" />
          <span class="t13 text900 bold">التسجيل عبر فيسبوك</span>
        </button>
      </div>

      <p class="t11 text600" style="text-align:center">بالمُتابعة، فإنك توافق على سياسة الخصوصية وشروط الاستخدام الخاصة بنا</p>
    </main>

    <style scoped>
    .login-root{min-height:100vh;background:#ffffff}
    .login-header{width:100%;padding:16px;display:flex;align-items:center;justify-content:space-between}
    .icon-btn{width:24px;height:24px;background:transparent;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer}
    .logo{font-size:24px;font-weight:800;letter-spacing:.25em;color:#8a1538;margin-top:8px}
    .login-main{max-width:384px;margin:0 auto;padding:24px 16px;display:grid;gap:24px}

    .promo-split{position:relative;display:grid;grid-template-columns:1fr 1fr;border-radius:6px;overflow:hidden;background:#fff6f3}
    .promo-half{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}
    .promo-divider{position:absolute;left:50%;width:1px;background:#000;top:30%;bottom:30%}

    .phone-wrap{position:relative}
    .country-btn{position:absolute;right:8px;top:50%;transform:translateY(-50%);height:32px;padding:0 8px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;display:inline-flex;align-items:center;gap:6px;cursor:default}
    .phone-input{direction:ltr;width:100%;height:44px;padding:0 12px;padding-right:130px;border:1px solid #e5e7eb;border-radius:4px;font-size:13px;color:#111827;outline:none}
    .phone-input.err{border-color:#dc2626}
    .err-row{margin-top:4px;display:flex;align-items:center;gap:4px}

    .login-btn{width:100%;height:44px;border-radius:4px;font-weight:700;font-size:13px;color:#fff;background:#8a1538;border:none;cursor:pointer;transition:transform .2s}
    .login-btn:active{transform:scale(.98)}

    .or-row{display:flex;align-items:center;gap:8px}
    .hr{height:1px;background:#d1d5db;flex:1}

    .social-col{display:grid;gap:8px}
    .social-btn{width:100%;height:44px;border:1px solid #e5e7eb;border-radius:4px;background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s}
    .social-btn:active{transform:scale(.98)}

    .t11{font-size:11px}
    .t12{font-size:12px}
    .t13{font-size:13px}
    .bold{font-weight:700}
    .text600{color:#6b7280}
    .text700{color:#374151}
    .text900{color:#111827}

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
    const r = await apiPost('/api/auth/otp/request', { phone: phone.value, channel: 'whatsapp' })
    if (r && (r.ok || r.sent)) { sent.value = true; ok.value = true; msg.value = 'تم إرسال الرمز عبر واتساب' } else { msg.value = 'تعذر إرسال الرمز' }
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

