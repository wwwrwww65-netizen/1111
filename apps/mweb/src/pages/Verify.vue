<template>
  <div class="min-h-screen bg-white flex flex-col" dir="rtl">
    <header class="w-full py-4 flex items-center justify-between px-4 border-b border-gray-50">
      <button aria-label="رجوع" @click="goBack" class="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors">
        <ArrowRight class="w-6 h-6 text-gray-800" />
      </button>
      <h1 class="text-[16px] font-bold text-gray-900">تأكيد الرمز</h1>
      <div class="w-10"></div> <!-- Spacer for centering -->
    </header>

    <main class="flex-1 max-w-md mx-auto px-6 py-8 space-y-8 w-full">
      <section class="text-center space-y-2">
        <div class="text-[14px] text-gray-600">
          {{ infoText || `تم إرسال رمز التحقق بواسطة ${methodName} إلى` }}
          <span dir="ltr" class="font-semibold text-gray-900 mx-1">{{ displayPhone }}</span>
        </div>
        <button v-if="!isForgotFlow" class="text-[13px] text-[#8a1538] font-medium hover:underline" @click="editNumber">تعديل الرقم؟</button>
      </section>

      <section class="space-y-6">
        <div :class="['flex items-center justify-center gap-3', shake ? 'animate-shake' : '']" dir="ltr">
          <input
            v-for="(_, i) in length"
            :key="i"
            :ref="(el)=> setInputRef(el, i)"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="1"
            :value="code[i]"
            @input="(e:any)=> onChange(i, e.target.value)"
            @keydown="(e:any)=> onKeyDown(i, e)"
            @paste="onPaste"
            class="w-11 h-12 text-center border border-gray-200 rounded-[8px] text-xl font-bold text-gray-900 focus:outline-none focus:border-[#8a1538] focus:ring-1 focus:ring-[#8a1538] transition-all shadow-sm bg-gray-50/50"
          />
        </div>

        <div v-if="errorText" class="text-[13px] text-red-600 font-medium animate-fadeIn text-center">
          {{ errorText }}
        </div>

        <div class="flex flex-col items-center gap-3">
          <div class="text-[13px] text-gray-500">
            <template v-if="!canResend">
              إعادة الإرسال خلال <span class="font-mono font-bold text-gray-900">{{ timeLeft }}</span> ثانية
            </template>
            <button v-else class="text-[#8a1538] font-semibold hover:underline flex items-center gap-2" @click="resend" :disabled="resending">
              {{ resending ? 'جار الإرسال…' : 'إعادة إرسال الرمز' }}
            </button>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-[12px] border border-gray-100">
          <label class="flex items-start gap-3 cursor-pointer select-none">
            <div class="relative flex items-center">
              <input type="checkbox" v-model="circleChecked" class="peer sr-only">
              <div class="w-5 h-5 border-2 border-gray-300 rounded-[6px] peer-checked:bg-[#8a1538] peer-checked:border-[#8a1538] transition-all flex items-center justify-center">
                <Check class="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" :stroke-width="3" />
              </div>
            </div>
            <span class="text-[12px] text-gray-600 leading-5 pt-0.5">
              احصل على النشرات الإخبارية ونصائح الأناقة الحصرية من <span class="font-bold text-[#8a1538]">jeeey</span> عبر واتساب
            </span>
          </label>
        </div>

        <button 
          @click="onSubmit" 
          :disabled="!codeFilled || verifying" 
          class="w-full h-12 rounded-[8px] text-[14px] font-bold flex items-center justify-center transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm" 
          :class="codeFilled ? 'text-white shadow-md shadow-[#8a1538]/20' : 'bg-gray-100 text-gray-400'" 
          :style="{ backgroundColor: codeFilled ? primary : undefined }"
        >
          {{ verifying ? 'جار التحقق…' : 'تأكيد الدخول' }}
        </button>
      </section>

      <section class="pt-4 border-t border-gray-100">
        <div class="relative grid grid-cols-2 rounded-[12px] overflow-hidden shadow-sm" style="background-color:#fff6f3">
          <div class="flex flex-col items-center justify-center py-6 px-2 text-center">
            <Gift class="w-6 h-6 text-[#8a1538] mb-2" />
            <div class="text-[13px] font-bold text-gray-900">خصم 10%</div>
            <div class="text-[11px] text-gray-600">على طلبك الأول</div>
          </div>
          <div class="absolute left-1/2 top-4 bottom-4 w-px bg-[#8a1538]/10" />
          <div class="flex flex-col items-center justify-center py-6 px-2 text-center">
            <Star class="w-6 h-6 text-yellow-500 mb-2" />
            <div class="text-[13px] font-bold text-gray-900">نادي jeeey</div>
            <div class="text-[11px] text-gray-600">مزايا حصرية للأعضاء</div>
          </div>
        </div>
      </section>
    </main>

    <footer class="max-w-md mx-auto px-6 py-6 text-center">
      <p class="text-[11px] text-gray-400 leading-relaxed">
        بتسجيل الدخول، أنت توافق على <a href="#" class="underline hover:text-gray-600">الشروط والأحكام</a> و <a href="#" class="underline hover:text-gray-600">سياسة الخصوصية</a>
      </p>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowRight, AlertCircle, Gift, Star, Check } from 'lucide-vue-next'
import { apiPost, apiGet } from '@/lib/api'
import { useUser } from '@/store/user'

const primary = '#8a1538'
const router = useRouter()
const route = useRoute()
const user = useUser()
const isForgotFlow = computed(() => route.query.reason === 'forgot')

const countryDial = ref<string>(route.query.dial ? String(route.query.dial) : '+966')
const phone = ref<string>(route.query.phone ? String(route.query.phone) : '')
const phoneMasked = computed(()=> phone.value ? phone.value.replace(/\D/g,'') : '502457254')
const displayPhone = computed(()=>{
  const dialDigits = String(countryDial.value||'').replace(/\D/g,'')
  const digits = phoneMasked.value
  if (!digits) return ''
  return digits.startsWith(dialDigits) ? ('+' + digits) : (String(countryDial.value||'') + ' ' + digits)
})

function goBack(){ try{ router.back() } catch{} }
function editNumber(){ 
  // Pass current phone and dial back to login to pre-fill
  const rawPhone = phone.value.replace(/\D/g,'')
  const rawDial = countryDial.value.replace(/\D/g,'')
  // If phone starts with dial, strip it for the input field
  let phoneInput = rawPhone
  if (phoneInput.startsWith(rawDial)) {
    phoneInput = phoneInput.substring(rawDial.length)
  }
  // Remove leading zeros if any, as the login input usually expects that
  phoneInput = phoneInput.replace(/^0+/, '')
  
  router.push({ path: '/login', query: { phone: phoneInput, dial: countryDial.value } }) 
}

const length = 6
const code = ref<string[]>(Array.from({ length }, ()=>''))
const inputsRef = ref<Array<HTMLInputElement|null>>(Array.from({ length }, ()=> null))
function setInputRef(el: any, idx:number){ if (el) inputsRef.value[idx] = el as HTMLInputElement }

const timeLeft = ref<number>(60)
const canResend = ref<boolean>(false)
const resending = ref<boolean>(false)
const circleChecked = ref<boolean>(false)
const shake = ref<boolean>(false)
const errorText = ref<string>('')
const verifying = ref<boolean>(false)

const verificationMethod = ref<string>('whatsapp')
const infoText = ref<string>('')
const methodName = computed(() => verificationMethod.value === 'whatsapp' ? 'WhatsApp' : 'SMS')

let timerInterval: any = null

function startTimer(seconds: number) {
  timeLeft.value = seconds
  canResend.value = false
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      canResend.value = true
      if (timerInterval) clearInterval(timerInterval)
    }
  }, 1000)
}

onMounted(()=>{ 
  try{ inputsRef.value[0]?.focus() }catch{} 
})
// Auto request on arrive if query auto=1
// Session storage helpers for OTP cooldown
function getLastSent(p: string) {
  try { return parseInt(sessionStorage.getItem('last_otp_' + p) || '0') } catch { return 0 }
}
function setLastSent(p: string) {
  try { sessionStorage.setItem('last_otp_' + p, Date.now().toString()) } catch {}
}

onMounted(async ()=>{
  // 1. Resolve Phone/Dial immediately from URL or State to ensure persistence works
  const params = new URLSearchParams(window.location.search)
  const urlPhone = params.get('phone') || ''
  const urlDial = params.get('dial') || ''
  
  if ((!phone.value || phone.value === 'undefined') && urlPhone) phone.value = urlPhone
  if (countryDial.value === '+966' && urlDial) countryDial.value = urlDial

  // 2. Check cooldown immediately with the resolved phone
  const last = getLastSent(phone.value)
  const diff = (Date.now() - last) / 1000
  
  const auto = params.get('auto') === '1'
  const ch = params.get('ch') || 'whatsapp'

  if (diff < 60) {
    startTimer(Math.floor(60 - diff))
  } else {
    if (auto) {
      canResend.value = false
      startTimer(60)
      setLastSent(phone.value) // Optimistic save so refresh works
    } else {
      canResend.value = true
      timeLeft.value = 0
    }
  }
  
  if (auto) {
    // Remove auto from URL silently without triggering router/remount
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('auto')
      window.history.replaceState({}, '', url.toString())
    } catch {}

    // If we are already in cooldown (from step 1), do NOT send again
    if (diff < 60) return

    try{
      // Use the most up-to-date values
      const pVal = phone.value || urlPhone
      const dVal = countryDial.value || urlDial

      let local = pVal.replace(/\D/g,'')
      if (local.startsWith('0')) local = local.replace(/^0+/, '')
      const dial = String(dVal||'').replace(/\D/g,'')
      const e164 = local.startsWith(dial) ? local : (dial + local)
      
      console.log('[Verify] Requesting OTP for:', e164, 'channel:', ch)
      const r: any = await apiPost('/api/auth/otp/request', { phone: e164, channel: ch })
      console.log('[Verify] OTP Response:', r)

      if (r && (r.ok || r.sent)) {
        // Timer already started optimistically
        if (r.channelUsed === 'sms') {
          verificationMethod.value = 'sms'
          infoText.value = 'تم الإرسال عبر SMS تلقائياً.'
        } else {
          verificationMethod.value = 'whatsapp'
        }
      } else {
        // Failed, BUT do not stop timer as per user request
        // Just show the error message
        console.error('[Verify] OTP Request Failed:', r)
        errorText.value = r?.error ? `خطأ: ${r.error}` : 'تعذر إرسال الرمز عبر واتساب. سنحاول SMS تلقائياً أو أعد المحاولة بعد لحظات.';
      }
    } catch (e) { 
      // Network error, do not stop timer
      console.error('[Verify] OTP Network Error:', e)
      errorText.value = 'خطأ في الشبكة' 
    }
  }
})

function onChange(idx:number, v:string){
  const digit = v.replace(/\D/g,'').slice(0,1)
  const next = [...code.value]
  next[idx] = digit
  code.value = next
  if (digit && idx < length-1) inputsRef.value[idx+1]?.focus()
  if (next.every(c => c.length === 1)) onSubmit()
}
function onKeyDown(idx:number, e:KeyboardEvent){
  if (e.key === 'Backspace'){
    if (code.value[idx] === '' && idx > 0) inputsRef.value[idx-1]?.focus()
    else { const next = [...code.value]; next[idx]=''; code.value = next }
  }
  if (e.key === 'ArrowLeft' && idx>0) inputsRef.value[idx-1]?.focus()
  if (e.key === 'ArrowRight' && idx<length-1) inputsRef.value[idx+1]?.focus()
}
function onPaste(e: ClipboardEvent){
  const pasted = (e.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,length)
  if (!pasted) return
  e.preventDefault()
  const next = [...code.value]
  for (let i=0;i<length;i++) next[i] = pasted[i]||''
  code.value = next
  
  if (next.every(c => c.length === 1)) {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    onSubmit()
    return
  }

  // move focus to first empty or last
  const firstEmpty = next.findIndex(c=> !c)
  const pos = firstEmpty === -1 ? length-1 : firstEmpty
  try{ inputsRef.value[pos]?.focus() }catch{}
}

const codeFilled = computed(()=> code.value.every(c=> c.length===1))

async function resend(){
  if (!canResend.value || !phone.value) return
  errorText.value = ''
  try{
    resending.value = true
    let local = phone.value.replace(/\D/g,'')
    if (local.startsWith('0')) local = local.replace(/^0+/, '')
    const dial = String(countryDial.value||'').replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const r = await apiPost('/api/auth/otp/request', { phone: e164, channel: 'whatsapp' })
    if (r && (r.ok || r.sent)){
      setLastSent(phone.value)
      startTimer(60)
      if ((r as any).channelUsed === 'sms') {
          verificationMethod.value = 'sms'
          infoText.value = 'تم الإرسال عبر SMS تلقائياً.'
      } else {
          verificationMethod.value = 'whatsapp'
          infoText.value = ''
      }
    } else { errorText.value = 'تعذر إرسال الرمز' }
  } catch { errorText.value = 'خطأ في الشبكة' } finally { resending.value = false }
}

async function onSubmit(){
  if (!codeFilled.value){ shake.value = true; setTimeout(()=> shake.value=false, 450); return }
  errorText.value = ''
  // Helpers
  const getApexDomain = (): string | null => {
    try{
      const host = location.hostname
      if (host === 'localhost' || /^(\d+\.){3}\d+$/.test(host)) return null
      const parts = host.split('.')
      if (parts.length < 2) return null
      return parts.slice(-2).join('.')
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
    verifying.value = true
    let local = phone.value.replace(/\D/g,'')
    if (local.startsWith('0')) local = local.replace(/^0+/, '')
    const dial = String(countryDial.value||'').replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const r: any = await apiPost('/api/auth/otp/verify', { phone: e164, code: code.value.join('') })
      if (r && r.ok){
      // If token returned, persist locally to avoid any Set-Cookie timing issues
      if (r.token) {
        writeCookie('auth_token', r.token)
        writeCookie('shop_auth_token', r.token)
        try{ localStorage.setItem('shop_token', r.token) }catch{}
      }
        // Link anonymous session to user for analytics continuity
        try{
          const sid = localStorage.getItem('sid_v1') || ''
          const me = await meWithRetry(2)
          const uid = me?.user?.id || ''
          if (uid && sid){
            await apiPost('/api/analytics/link', { sessionId: sid })
          }
        }catch{}
      // Complete pending claim if any (prefer query, fallback to sessionStorage) against API_BASE with auth header
      try{
        let claimTok = String(route.query.claimToken||'')
        if (!claimTok){
          try{ claimTok = sessionStorage.getItem('claim_token') || '' }catch{}
        }
        if (claimTok){
          const { API_BASE, getAuthHeader } = await import('@/lib/api')
          await fetch(`${API_BASE}/api/promotions/claim/complete`, { method:'POST', headers:{ 'content-type':'application/json', ...getAuthHeader() }, credentials:'include', body: JSON.stringify({ token: claimTok }) })
          try{ sessionStorage.removeItem('claim_token') }catch{}
        }
      }catch{}
      // Fetch session and hydrate user store before redirect
      const me = await meWithRetry(2)
      const ret = String(route.query.return || '/account')
      if (me && me.user){
        user.isLoggedIn = true
        if (me.user.name || me.user.email || me.user.phone){
          user.username = String(me.user.name || me.user.email || me.user.phone)
        }
        const rawName = String(me.user.name||'').trim()
        const incomplete = !rawName || rawName.length < 2 || /^\d+$/.test(rawName)
        try{ const { trackEvent } = await import('@/lib/track'); if (r.newUser || incomplete) await trackEvent('CompleteRegistration', {}) }catch{}
        try{ const { trackEvent } = await import('@/lib/track'); if (circleChecked.value) await trackEvent('Subscribe', { email: me?.user?.email, phone: me?.user?.phone }) }catch{}
        // Merge local cart into server, then hydrate cart from server so items persist across devices
        try{
          const { useCart } = await import('@/store/cart')
          const cart = useCart()
          const items = Array.isArray(cart.items) ? cart.items.map(i=>({ productId: i.id, quantity: i.qty })) : []
          if (items.length) await apiPost('/api/cart/merge', { items })
          // Force hydration from server so cart persists across devices and after login
          await cart.syncFromServer(true)
          cart.saveLocal()
        }catch{}
        if (String(route.query.reason) === 'forgot') {
          router.push('/reset-password')
        } else if (r.newUser || incomplete) {
          router.push({ path: '/complete-profile', query: { return: ret } })
        } else {
          router.push(ret)
        }
      } else {
        // Fallback: honor API hint if provided
        if (String(route.query.reason) === 'forgot') {
          router.push('/reset-password')
        } else if (r.newUser) {
          router.push({ path: '/complete-profile', query: { return: ret } })
        } else {
          router.push(ret)
        }
      }
    } else { errorText.value = 'رمز غير صحيح أو منتهي' }
  } catch { errorText.value = 'خطأ في الشبكة' } finally { verifying.value = false }
}
</script>

<style scoped>
@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
.animate-shake{ animation: shake .45s ease-in-out; }
</style>

