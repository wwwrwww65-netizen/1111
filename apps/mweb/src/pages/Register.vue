<template>
  <div dir="rtl" class="min-h-screen bg-white">
    <main class="max-w-md mx-auto px-4 py-6 space-y-4">
      <h1 class="text-2xl font-bold text-gray-900">إنشاء حساب</h1>
      <form @submit.prevent="onSubmit" class="grid gap-3">
        <input v-model="name" class="h-11 rounded-[12px] border border-gray-200 px-3 bg-white text-[13px] text-gray-900 focus:outline-none focus:border-gray-800" placeholder="الاسم" required />
        <input v-model="email" type="email" class="h-11 rounded-[12px] border border-gray-200 px-3 bg-white text-[13px] text-gray-900 focus:outline-none focus:border-gray-800" placeholder="البريد الإلكتروني" required />
        <input v-model="password" type="password" class="h-11 rounded-[12px] border border-gray-200 px-3 bg-white text-[13px] text-gray-900 focus:outline-none focus:border-gray-800" placeholder="كلمة المرور" required />
        <button class="w-full h-11 rounded-[6px] text-[13px] font-semibold text-white transition-transform duration-200 hover:scale-[1.02]" :style="{ backgroundColor: '#8a1538' }">تسجيل</button>
        <div v-if="msg" class="px-3 py-2 rounded-[8px] text-center text-[13px]" :class="ok ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-800'">{{ msg }}</div>
        <a href="/login" class="text-center text-[13px] text-blue-600">لديك حساب؟ تسجيل الدخول</a>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { API_BASE } from '@/lib/api'
import { useUser } from '@/store/user'
import { useRouter } from 'vue-router'
const name = ref('')
const email = ref('')
const password = ref('')
const msg = ref('')
const ok = ref(false)
const user = useUser()
const router = useRouter()
async function onSubmit(){
  msg.value=''; ok.value=false
  try{
    const res = await fetch(`${API_BASE}/api/auth/register`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ name: name.value, email: email.value, password: password.value }) })
    ok.value = res.ok
    msg.value = res.ok ? 'تم إنشاء الحساب، تحقق من بريدك لتفعيل الحساب' : 'فشل التسجيل'
    if (res.ok) {
      // تسجيل دخول تلقائي إن أمكن عبر endpoint عام أو إعادة استخدام نفس البريد/كلمة المرور
      try {
        const loginRes = await fetch(`${API_BASE}/api/admin/auth/login`, { method:'POST', headers:{ 'content-type':'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: email.value, password: password.value }) as any, credentials:'include' })
        if (loginRes.ok) {
          user.isLoggedIn = true
          user.username = name.value || email.value.split('@')[0] || 'jeeey'
          router.replace('/account')
          return
        }
      } catch {}
      // في حال عدم التمكن من تسجيل الدخول تلقائياً
      router.replace('/login')
    }
  }catch{ msg.value='خطأ في الاتصال' }
}
</script>

<style scoped></style>

