<template>
  <div dir="rtl" class="container" style="padding-top:68px">
    <h1 style="margin:12px 0">استرجاع كلمة المرور</h1>
    <form class="card" @submit.prevent="onSubmit" style="display:grid;gap:10px;padding:12px">
      <input v-model="email" type="email" class="input" placeholder="البريد الإلكتروني" required />
      <button class="btn" style="width:100%">إرسال رابط الاسترجاع</button>
      <div v-if="msg" class="badge" :class="{ ok, err: !ok }">{{ msg }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { API_BASE } from '@/lib/api'
const email = ref('')
const msg = ref('')
const ok = ref(false)
async function onSubmit(){
  msg.value=''; ok.value=false
  try{
    const res = await fetch(`${API_BASE}/api/auth/forgot`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ email: email.value }) })
    ok.value = res.ok
    msg.value = res.ok ? 'تم إرسال رابط الاسترجاع' : 'فشل الطلب'
  }catch{ msg.value='خطأ في الاتصال' }
}
</script>

<style scoped>
.input{height:44px;border-radius:12px;border:1px solid var(--muted-2);padding:0 12px}
.badge{padding:6px 10px;border-radius:8px;text-align:center}
.ok{background:#e0f2fe;color:#0369a1}
.err{background:#fee2e2;color:#991b1b}
</style>

