<template>
  <div class="container" dir="rtl" style="padding-top:68px">
    <h1 style="margin:12px 0">تواصل معنا</h1>
    <form class="card" @submit.prevent="onSubmit" style="display:grid;gap:10px;padding:12px">
      <input v-model="name" class="input" placeholder="الاسم" required />
      <input v-model="email" type="email" class="input" placeholder="البريد الإلكتروني" required />
      <textarea v-model="message" class="input" rows="4" placeholder="رسالتك" required></textarea>
      <button class="btn" style="width:100%">إرسال</button>
      <div v-if="msg" class="badge" :class="{ ok, err: !ok }">{{ msg }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiPost } from '@/lib/api'
const name = ref('')
const email = ref('')
const message = ref('')
const msg = ref('')
const ok = ref(false)
async function onSubmit(){
  msg.value=''; ok.value=false
  const res = await apiPost('/api/support/tickets', { name: name.value, email: email.value, message: message.value })
  ok.value = !!res
  msg.value = ok.value ? 'تم استقبال رسالتك' : 'تعذّر الإرسال'
}
</script>

