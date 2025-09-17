<template>
  <div>
    <HeaderBar />
    <div class="container">
      <h1 style="margin:12px 0">تسجيل الدخول</h1>
      <form class="card space-y-12" @submit.prevent="onSubmit">
        <input v-model="email" type="email" placeholder="البريد الإلكتروني" class="input" style="height:44px;border-radius:12px;border:1px solid var(--muted-2);padding:0 12px" required />
        <input v-model="password" type="password" placeholder="كلمة المرور" class="input" style="height:44px;border-radius:12px;border:1px solid var(--muted-2);padding:0 12px" required />
        <button class="btn" style="width:100%">دخول</button>
        <div v-if="msg" class="badge" :class="{ ok: ok, err: !ok }">{{ msg }}</div>
      </form>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { ref } from 'vue'

const email = ref('admin@example.com')
const password = ref('admin123')
const msg = ref('')
const ok = ref(false)

async function onSubmit(){
  msg.value=''; ok.value=false
  try{
    const res = await fetch('https://api.jeeey.com/api/admin/auth/login', { method:'POST', headers:{ 'content-type':'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: email.value, password: password.value }) as any, credentials:'include' })
    ok.value = res.ok
    msg.value = res.ok ? 'تم تسجيل الدخول' : 'فشل تسجيل الدخول'
  }catch{ msg.value='خطأ في الاتصال' }
}
</script>

