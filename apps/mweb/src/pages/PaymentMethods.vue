<template>
  <div class="container" dir="rtl" style="padding-top:68px">
    <h1 style="margin:12px 0">طرق الدفع المحفوظة</h1>
    <div class="card" style="padding:12px">
      <div v-if="!methods.length" class="muted">لا توجد بطاقات محفوظة</div>
      <div v-for="m in methods" :key="m.id" class="row" style="justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:8px 0">
        <div>{{ m.brand }} **** **** **** {{ m.last4 }} — {{ m.exp }}</div>
        <button class="btn btn-outline" @click="remove(m.id)">حذف</button>
      </div>
      <button class="btn" style="margin-top:12px" @click="add">إضافة بطاقة</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPost } from '@/lib/api'
type PM = { id:string; brand:string; last4:string; exp:string }
const methods = ref<PM[]>([])
onMounted(async ()=>{
  const r = await apiGet<any>('/api/payments/methods')
  methods.value = (r?.items||[]).map((x:any)=>({ id:x.id, brand:x.brand||'CARD', last4:x.last4||'0000', exp: `${x.expMonth||'MM'}/${x.expYear||'YY'}` }))
})
async function remove(id:string){ await apiPost('/api/payments/methods/delete', { id }); methods.value = methods.value.filter(m=>m.id!==id) }
async function add(){ const r = await apiPost('/api/payments/methods/create', { returnUrl: location.href }); if (r && (r as any).redirectUrl) location.href = (r as any).redirectUrl }
</script>

