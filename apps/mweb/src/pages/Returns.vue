<template>
  <div class="container" dir="rtl" style="padding-top:68px">
    <h1 style="margin:12px 0">طلب إرجاع/استبدال</h1>
    <form class="card" @submit.prevent="onSubmit" style="display:grid;gap:10px;padding:12px">
      <input v-model="orderId" class="input" placeholder="رقم الطلب" required />
      <select v-model="reason" class="input" required>
        <option value="">السبب</option>
        <option value="DAMAGED">تالف</option>
        <option value="WRONG_ITEM">عنصر خاطئ</option>
        <option value="SIZE">المقاس لا يناسب</option>
        <option value="OTHER">أخرى</option>
      </select>
      <textarea v-model="notes" class="input" rows="3" placeholder="ملاحظات (اختياري)"></textarea>
      <button class="btn" style="width:100%">إرسال الطلب</button>
      <div v-if="msg" class="badge" :class="{ ok, err: !ok }">{{ msg }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiPost } from '@/lib/api'
const orderId = ref('')
const reason = ref('')
const notes = ref('')
const msg = ref('')
const ok = ref(false)
async function onSubmit(){
  msg.value=''; ok.value=false
  const res = await apiPost('/api/returns', { orderId: orderId.value, reason: reason.value, notes: notes.value })
  ok.value = !!res
  msg.value = ok.value ? 'تم استقبال الطلب، سنقوم بمراجعته' : 'تعذّر إرسال الطلب'
}
</script>

<style scoped>
.input{border:1px solid var(--muted-2);border-radius:10px;padding:10px}
.badge{padding:6px 10px;border-radius:8px;text-align:center}
.ok{background:#e0f2fe;color:#0369a1}
.err{background:#fee2e2;color:#991b1b}
</style>

