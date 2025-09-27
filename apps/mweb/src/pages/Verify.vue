<template>
  <div class="min-h-screen bg-white flex flex-col" dir="rtl">
    <header class="w-full py-4 flex items-center justify-start px-4">
      <button aria-label="رجوع" @click="goBack">
        <ArrowRight class="w-6 h-6 text-gray-800" />
      </button>
    </header>

    <main class="flex-1 max-w-md mx-auto px-4 py-6 space-y-6 w-full">
      <section class="flex items-center justify-between">
        <div class="text-[13px] text-gray-700">
          تم إرسال رمز التحقق بواسطة WhatsApp إلى {{ countryDial }} {{ phoneMasked }}.
        </div>
        <button class="text-[12px] text-blue-600 font-semibold" @click="editNumber">تعديل الرقم</button>
      </section>

      <section class="space-y-3">
        <div :class="['flex items-center justify-center gap-2', shake ? 'animate-shake' : '']" dir="ltr">
          <input
            v-for="(_, i) in length"
            :key="i"
            ref="setInputRef"
            inputmode="numeric"
            maxlength="1"
            :value="code[i]"
            @input="(e:any)=> onChange(i, e.target.value)"
            @keydown="(e:any)=> onKeyDown(i, e)"
            @paste="onPaste"
            class="w-12 h-12 text-center border border-gray-300 rounded-[6px] text-lg font-semibold text-gray-900 focus:outline-none focus:border-gray-800"
          />
        </div>

        <div v-if="errorText" class="flex items-center justify-center text-red-600 text-[12px]">
          <AlertCircle class="w-4 h-4 ml-1" />
          {{ errorText }}
        </div>

        <div class="flex items-center justify-center text-[12px] text-gray-600">
          <template v-if="!canResend">إعادة الإرسال خلال {{ timeLeft }} ثانية</template>
          <button v-else class="text-blue-600 font-semibold" @click="resend" :disabled="resending">
            {{ resending ? 'جار الإرسال…' : 'إعادة إرسال' }}
          </button>
        </div>

        <div class="flex items-start gap-2 mt-2">
          <button type="button" @click="circleChecked=!circleChecked" class="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 transition-colors duration-150" :style="{ backgroundColor: circleChecked ? primary : '#fff', border: `2px solid ${circleChecked ? primary : '#9ca3af'}` }">
            <Check v-if="circleChecked" class="w-3 h-3 text-white" />
          </button>
          <span class="text-[10px] text-gray-500 leading-5">(اختياري) احصل على النشرات الإخبارية ونصائح الأناقة الحصرية من جي jeeey عبر رسائل واتساب!</span>
        </div>

        <button @click="onSubmit" :disabled="!codeFilled || verifying" class="w-full h-11 rounded-[6px] text-[13px] font-semibold flex items-center justify-center transition-transform duration-200 hover:scale-[1.02]" :class="codeFilled ? 'text-white' : 'bg-gray-200 text-gray-500'" :style="{ backgroundColor: codeFilled ? primary : undefined }">
          {{ verifying ? 'جار التحقق…' : 'تأكيد الرمز' }}
        </button>
      </section>

      <section>
        <div class="relative grid grid-cols-2 rounded-[6px] overflow-hidden" style="background-color:#fff6f3">
          <div class="flex flex-col items-center justify-center py-6">
            <Gift class="w-6 h-6 text-red-500 mb-2" />
            <div class="text-sm font-bold text-gray-900">خصم %15</div>
            <div class="text-xs text-gray-600">على طلبك الأول</div>
          </div>
          <div class="absolute left-1/2 w-px bg-black" style="top:30%;bottom:30%" />
          <div class="flex flex-col items-center justify-center py-6">
            <Star class="w-6 h-6 text-yellow-500 mb-2" />
            <div class="text-sm font-bold text-gray-900">jeeey CLUB</div>
            <div class="text-xs text-gray-600">مزايا حصرية</div>
          </div>
        </div>
      </section>
    </main>

    <footer class="max-w-md mx-auto px-4 py-4 text-center text-[11px] text-gray-600 leading-5">
      بتسجيل الدخول إلى حسابك، فإنك توافق على سياسة الخصوصية وملفات تعريف الارتباط والشروط والأحكام الخاصة بنا.
    </footer>

    <style scoped>
    @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
    .animate-shake{ animation: shake .45s ease-in-out; }
    </style>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowRight, AlertCircle, Gift, Star, Check } from 'lucide-vue-next'
import { apiPost } from '@/lib/api'

const primary = '#8a1538'
const router = useRouter()
const route = useRoute()

const countryDial = ref<string>(route.query.dial ? String(route.query.dial) : '+966')
const phone = ref<string>(route.query.phone ? String(route.query.phone) : '')
const phoneMasked = computed(()=> phone.value ? phone.value.replace(/\D/g,'') : '502457254')

function goBack(){ try{ router.back() } catch{} }
function editNumber(){ router.push('/login') }

const length = 6
const code = ref<string[]>(Array.from({ length }, ()=>''))
const inputsRef = ref<Array<HTMLInputElement|null>>([])
function setInputRef(el: any){ if (el) inputsRef.value.push(el as HTMLInputElement) }

const timeLeft = ref<number>(60)
const canResend = ref<boolean>(false)
const resending = ref<boolean>(false)
const circleChecked = ref<boolean>(false)
const shake = ref<boolean>(false)
const errorText = ref<string>('')
const verifying = ref<boolean>(false)

onMounted(()=>{ tick() })
// Auto request on arrive if query auto=1
onMounted(async ()=>{
  const auto = String(route.query.auto||'') === '1'
  if (!auto) return
  try{
    const local = phone.value.replace(/\D/g,'')
    const dial = String(countryDial.value||'').replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const r = await apiPost('/api/auth/otp/request', { phone: e164, channel: 'whatsapp' })
    if (r && (r.ok || r.sent)) { timeLeft.value = 60; canResend.value = false; if (!timeLeft.value) tick(); }
    else { errorText.value = 'تعذر إرسال الرمز. تأكد أن القالب Approved ولغته صحيحة (ar أو ar_SA).'; }
  } catch { errorText.value = 'خطأ في الشبكة' }
})
function tick(){ if (timeLeft.value>0){ setTimeout(()=>{ timeLeft.value--; tick() }, 1000) } else { canResend.value = true } }

function onChange(idx:number, v:string){
  const digit = v.replace(/\D/g,'').slice(0,1)
  const next = [...code.value]
  next[idx] = digit
  code.value = next
  if (digit && idx < length-1) inputsRef.value[idx+1]?.focus()
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
}

const codeFilled = computed(()=> code.value.every(c=> c.length===1))

async function resend(){
  if (!canResend.value || !phone.value) return
  errorText.value = ''
  try{
    resending.value = true
    const local = phone.value.replace(/\D/g,'')
    const dial = String(countryDial.value||'').replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const r = await apiPost('/api/auth/otp/request', { phone: e164, channel: 'whatsapp' })
    if (r && (r.ok || r.sent)){
      timeLeft.value = 60; canResend.value = false; tick()
    } else { errorText.value = 'تعذر إرسال الرمز' }
  } catch { errorText.value = 'خطأ في الشبكة' } finally { resending.value = false }
}

async function onSubmit(){
  if (!codeFilled.value){ shake.value = true; setTimeout(()=> shake.value=false, 450); return }
  errorText.value = ''
  try{
    verifying.value = true
    const local = phone.value.replace(/\D/g,'')
    const dial = String(countryDial.value||'').replace(/\D/g,'')
    const e164 = local.startsWith(dial) ? local : (dial + local)
    const r = await apiPost('/api/auth/otp/verify', { phone: e164, code: code.value.join('') })
    if (r && r.ok){ router.push('/') } else { errorText.value = 'رمز غير صحيح أو منتهي' }
  } catch { errorText.value = 'خطأ في الشبكة' } finally { verifying.value = false }
}
</script>

