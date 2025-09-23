<template>
  <div dir="rtl">
    <HeaderBar />
    <div class="container page">
      <h1 class="title">طلباتي</h1>
      <div v-if="!items.length" class="card">لا توجد طلبات بعد</div>
      <div v-else class="list">
        <a v-for="o in items" :key="o.id" class="card row" :href="`/orders/${o.id}`" style="justify-content:space-between;align-items:center;text-decoration:none;color:inherit">
          <div>
            <div class="row" style="gap:8px;align-items:center">
              <span class="muted">رقم</span><strong>#{{ o.id }}</strong>
              <span class="chip" :class="o.status">{{ t(o.status) }}</span>
            </div>
            <div class="muted">{{ new Date(o.date).toLocaleDateString('ar-SA') }}</div>
          </div>
          <div style="font-weight:700">{{ o.total.toFixed(2) }} ر.س</div>
        </a>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { onMounted, ref } from 'vue'
import { apiGet } from '@/lib/api'

type Order = { id: string; status: 'pending'|'paid'|'shipped'|'delivered'|'cancelled'; total: number; date: string }
const items = ref<Order[]>([])
function t(s:Order['status']){
  return ({ pending:'قيد المعالجة', paid:'تم الدفع', shipped:'قيد الشحن', delivered:'مكتمل', cancelled:'ملغي' } as const)[s]
}
onMounted(async ()=>{
  try{
    const data = await apiGet<any>('/api/orders/me')
    if (Array.isArray(data)) { items.value = data; if(items.value.length) return }
  }catch{}
  items.value = [
    { id:'100123', status:'paid', total:329, date: new Date().toISOString() },
    { id:'100124', status:'shipped', total:129, date: new Date(Date.now()-86400000).toISOString() }
  ]
})
</script>

<style scoped>
.page{padding-top:68px}
.title{margin:12px 0}
.list{display:grid;gap:10px}
.muted{color:#64748b}
.chip{padding:4px 8px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb}
.chip.paid{background:#e0f2fe;border-color:#7dd3fc}
.chip.shipped{background:#fef9c3;border-color:#fde68a}
.chip.delivered{background:#dcfce7;border-color:#86efac}
.chip.cancelled{background:#fee2e2;border-color:#fecaca}
.chip.pending{background:#f1f5f9;border-color:#e2e8f0}
</style>

