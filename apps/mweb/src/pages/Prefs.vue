<template>
  <div class="container" dir="rtl" style="padding-top:68px">
    <h1 style="margin:12px 0">تفضيلات الإشعارات</h1>
    <div class="card" style="padding:12px">
      <label class="row" style="gap:8px;align-items:center"><input type="checkbox" v-model="email" /> بريد إلكتروني</label>
      <label class="row" style="gap:8px;align-items:center"><input type="checkbox" v-model="sms" /> رسائل SMS</label>
      <label class="row" style="gap:8px;align-items:center"><input type="checkbox" v-model="whatsapp" /> WhatsApp</label>
      <label class="row" style="gap:8px;align-items:center"><input type="checkbox" v-model="webpush" /> Web Push</label>
      <button class="btn" style="margin-top:10px" @click="save">حفظ</button>
      <div class="muted" v-if="msg">{{ msg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPost } from '@/lib/api'
const email = ref(true), sms = ref(false), whatsapp = ref(false), webpush = ref(true)
const msg = ref('')
onMounted(async ()=>{
  try{ const j = await apiGet<any>('/api/me/preferences'); if(j?.preferences){ Object.assign({ email, sms, whatsapp, webpush }, j.preferences) } }catch{}
})
async function save(){
  msg.value=''
  const ok = await apiPost('/api/me/preferences', { email: email.value, sms: sms.value, whatsapp: whatsapp.value, webpush: webpush.value })
  msg.value = ok? 'تم الحفظ' : 'فشل الحفظ'
}
</script>

<style scoped>
.muted{color:#64748b;margin-top:6px}
</style>

