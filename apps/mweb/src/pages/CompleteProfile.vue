<template>
  <div class="min-h-screen bg-white" dir="rtl">
    <header class="w-full py-4 flex items-center justify-between px-4">
      <button aria-label="رجوع" @click="goBack"><ArrowRight class="w-6 h-6 text-gray-800" /></button>
      <h1 class="text-xl font-extrabold" :style="{ color: primary }">jeeey</h1>
      <div class="w-6"></div>
    </header>
    <main class="max-w-md mx-auto px-4 py-6 space-y-4">
      <h2 class="text-lg font-bold">اكمال إنشاء الحساب</h2>
      <div>
        <label class="block text-[12px] text-gray-700 mb-1">الاسم</label>
        <input v-model="fullName" class="w-full h-11 px-3 rounded-[4px] border border-gray-200 text-[13px]" placeholder="الاسم" />
      </div>
      <div>
        <label class="block text-[12px] text-gray-700 mb-1">كلمة السر</label>
        <input type="password" v-model="password" class="w-full h-11 px-3 rounded-[4px] border border-gray-200 text-[13px]" placeholder="••••••••" />
      </div>
      <div>
        <label class="block text-[12px] text-gray-700 mb-1">تأكيد كلمة السر</label>
        <input type="password" v-model="confirm" class="w-full h-11 px-3 rounded-[4px] border border-gray-200 text-[13px]" placeholder="••••••••" />
      </div>
      <div v-if="error" class="text-[12px] text-red-600">{{ error }}</div>
      <button :disabled="submitting || !valid" @click="onSubmit" class="w-full h-11 rounded-[4px] text-[13px] font-semibold flex items-center justify-center" :style="{ backgroundColor: primary, color: 'white', opacity: valid?1:.6 }">
        {{ submitting ? 'جار الحفظ…' : 'تسجيل' }}
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { apiPost, apiGet } from '@/lib/api'
import { useUser } from '@/store/user'

const primary = '#8a1538'
const router = useRouter()
const route = useRoute()
function goBack(){ try{ router.back() } catch{} }

onMounted(async () => {
  // Check if user is already complete to prevent access by logged-in users who don't need this
  try {
    const me = await apiGet<any>('/api/me')
    if (me && me.user) {
       const rawName = String(me.user.name||'').trim()
       const incomplete = !rawName || rawName.length < 2 || /^\d+$/.test(rawName)
       if (!incomplete) {
         // User is already complete, redirect to return URL or Account
         router.replace((route.query.return as string) || '/account')
       }
    }
  } catch {}
})

const fullName = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const submitting = ref(false)
// Password optional: if provided must be >=6 and match confirm
const valid = computed(()=> {
  const n = fullName.value.trim().length>=2
  const hasPass = password.value.length>0 || confirm.value.length>0
  const p = !hasPass || (password.value.length>=6 && password.value===confirm.value)
  return n && p
})
async function onSubmit(){
  if (!valid.value){ error.value = 'تحقق من البيانات'; return }
  error.value = ''
  try{
    submitting.value = true
    const payload: any = { fullName: fullName.value.trim() }
    if (password.value) { payload.password = password.value; payload.confirm = confirm.value }
    // Ensure Authorization header is present by reading latest token
    const r: any = await apiPost('/api/me/complete', payload)
    if (r && r.ok){
      // Refresh session user and hydrate store
      try{
        const me = await apiGet<any>('/api/me')
        if (me && me.user){
          const u = useUser()
          u.isLoggedIn = true
          if (me.user.name || me.user.email || me.user.phone){
            u.username = String(me.user.name || me.user.email || me.user.phone)
          }
        }
      }catch{}
      const ret = String(route.query.return||'/account')
      
      try {
        const { useCart } = await import('@/store/cart')
        const cart = useCart()
        await cart.mergeLocalToUser()
        await cart.syncFromServer(true)
        cart.saveLocal()
      } catch { }

      router.push(ret)
    } else {
      const msg = String((r && (r.error||r.message)) || '')
      if (msg.includes('invalid_name')) error.value = 'الاسم مطلوب (حرفان أو أكثر)'
      else if (msg.includes('invalid_password')) error.value = 'كلمة السر إن أُدخلت يجب أن تكون ≥6 ومطابقة للتأكيد'
      else error.value = 'تعذر إكمال إنشاء الحساب'
    }
  } catch { error.value = 'خطأ في الشبكة' } finally { submitting.value = false }
}
</script>