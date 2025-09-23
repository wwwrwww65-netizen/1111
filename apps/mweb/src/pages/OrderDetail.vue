<template>
  <div dir="rtl" class="container page">
    <HeaderBar />
    <h1 class="title">تفاصيل الطلب #{{ id }}</h1>
    <div v-if="!order" class="card">جارٍ التحميل…</div>
    <div v-else class="space-y-12">
      <div class="card row" style="justify-content:space-between;align-items:center">
        <div>
          <div class="muted">الحالة</div>
          <div class="chip" :class="order.status">{{ t(order.status) }}</div>
        </div>
        <div style="text-align:end">
          <div class="muted">الإجمالي</div>
          <div style="font-weight:700">{{ Number(order.total||0).toFixed(2) }} ر.س</div>
        </div>
      </div>
      <div class="card">
        <div class="muted">العناصر</div>
        <div class="list">
          <div v-for="it in order.items" :key="it.id" class="row" style="justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee">
            <div class="row" style="gap:10px;align-items:center">
              <img :src="it.product?.images?.[0]" style="width:56px;height:56px;object-fit:cover;border-radius:6px;background:#f3f3f3" />
              <div>
                <div style="font-weight:600">{{ it.product?.name }}</div>
                <div class="muted">الكمية: {{ it.quantity }}</div>
              </div>
            </div>
            <div style="font-weight:700">{{ Number(it.price||0).toFixed(2) }} ر.س</div>
          </div>
        </div>
      </div>
      <div class="card" v-if="order.payment?.status!=='COMPLETED'">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <div class="muted">الدفع</div>
            <div>غير مدفوع</div>
          </div>
          <button class="btn" @click="payNow">ادفع الآن</button>
        </div>
      </div>
      <div class="card" v-else>
        <div>✅ مدفوع</div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { apiGet, apiPost } from '@/lib/api'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = String(route.params.id||'')
const order = ref<any|null>(null)

function t(s:string){
  const m: any = { PENDING:'قيد المعالجة', PAID:'تم الدفع', SHIPPED:'قيد الشحن', DELIVERED:'مكتمل', CANCELLED:'ملغي' }
  return m[s] || s
}

onMounted(async ()=>{
  order.value = await apiGet(`/api/orders/${encodeURIComponent(id)}`)
})

async function payNow(){
  const res = await apiPost(`/api/orders/${encodeURIComponent(id)}/pay`, { method:'CASH_ON_DELIVERY' })
  if (res){ order.value = await apiGet(`/api/orders/${encodeURIComponent(id)}`) }
}
</script>

<style scoped>
.page{padding-top:68px}
.title{margin:12px 0}
.list{display:grid;gap:8px}
.muted{color:#64748b}
.chip{padding:4px 8px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb;display:inline-block}
.btn{background:#111;color:#fff;border:0;border-radius:8px;padding:10px 12px}
</style>

