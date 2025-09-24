<template>
  <div dir="rtl" class="container" style="padding-top:68px">
    <h1 style="margin:12px 0">إنشاء حساب</h1>
    <form class="card" @submit.prevent="onSubmit" style="display:grid;gap:10px;padding:12px">
      <input v-model="name" class="input" placeholder="الاسم" required />
      <input v-model="email" type="email" class="input" placeholder="البريد الإلكتروني" required />
      <input v-model="password" type="password" class="input" placeholder="كلمة المرور" required />
      <button class="btn" style="width:100%">تسجيل</button>
      <div v-if="msg" class="badge" :class="{ ok, err: !ok }">{{ msg }}</div>
      <a href="/login" style="text-align:center;text-decoration:none">لديك حساب؟ تسجيل الدخول</a>
    </form>
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

<style scoped>
.input{height:44px;border-radius:12px;border:1px solid var(--muted-2);padding:0 12px}
.badge{padding:6px 10px;border-radius:8px;text-align:center}
.ok{background:#e0f2fe;color:#0369a1}
.err{background:#fee2e2;color:#991b1b}
</style>

