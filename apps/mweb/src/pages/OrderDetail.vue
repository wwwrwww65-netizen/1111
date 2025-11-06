<template>
  <div dir="rtl" class="container page">
    <HeaderBar />
    <h1 class="title">تفاصيل الطلب #{{ (order && (order as any).code) || id }}</h1>
    <div v-if="!order" class="card">جارٍ التحميل…</div>
    <div v-else class="space-y-12">
      <div class="card row" style="justify-content:space-between;align-items:center">
        <div>
          <div class="muted">الحالة</div>
          <div class="chip" :class="order.status">{{ t(order.status) }}</div>
        </div>
        <div style="text-align:end">
          <div class="muted">الإجمالي</div>
          <div style="font-weight:700">{{ Number(order.total||0).toFixed(2) }} {{ currencySymbol }}</div>
        </div>
      </div>
      <div class="card">
        <div class="muted">العناصر</div>
        <div class="list">
          <div v-for="it in order.items" :key="it.id" class="row" style="justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee">
            <div class="row" style="gap:10px;align-items:center">
              <img :src="resolveItemImage(it)" style="width:56px;height:56px;object-fit:cover;border-radius:6px;background:#f3f3f3" />
              <div>
                <div style="font-weight:600">{{ it.product?.name }}</div>
                <div class="muted">الكمية: {{ it.quantity }}</div>
                <div class="muted">
                  <template v-if="(it as any).attributes">
                    <span v-if="(it as any).attributes?.color">اللون: {{ (it as any).attributes.color }}</span>
                    <span v-if="displaySize(it)" style="margin-right:6px">المقاس: {{ displaySize(it) }}</span>
                  </template>
                </div>
              </div>
            </div>
            <div style="font-weight:700">{{ Number(it.price||0).toFixed(2) }} {{ currencySymbol }}</div>
          </div>
        </div>
      </div>
      <div class="card" v-if="order.payment?.status==='COMPLETED'">
        <div>✅ مدفوع</div>
      </div>
      <div class="card" v-else-if="isCod">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <div class="muted">الدفع</div>
            <div>الدفع عند الاستلام</div>
          </div>
        </div>
      </div>
      <div class="card" v-else>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <div class="muted">الدفع</div>
            <div>غير مدفوع</div>
          </div>
          <button class="btn" @click="payNow">ادفع الآن</button>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { apiGet, apiPost } from '@/lib/api'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = String(route.params.id||'')
const order = ref<any|null>(null)
const currencySymbol = ref('ر.س')
const isCod = computed(()=>{
  try{
    const pm = String((order.value as any)?.paymentMethod || (order.value as any)?.payment?.method || '').toLowerCase()
    return pm==='cod' || pm==='cash_on_delivery' || pm==='cash-on-delivery'
  }catch{ return false }
})

function resolveItemImage(it: any): string {
  try{
    const attrs = (it && (it as any).attributes) || {}
    const raw = attrs.image || (it?.product?.images?.[0]) || ''
    const s = String(raw||'').trim()
    if (!s) return ''
    if (/^https?:\/\//i.test(s)) return s
    // Normalize uploads path when relative
    const base = (window as any).API_BASE || ''
    if (s.startsWith('/uploads')) return `${base}${s}`
    if (s.startsWith('uploads/')) return `${base}/${s}`
    return s
  }catch{ return it?.product?.images?.[0] || '' }
}

function displaySize(it: any): string {
  try{
    const attrs = (it && (it as any).attributes) || {}
    if (attrs.size) return String(attrs.size)
    const letters = String(attrs.size_letters||'').trim()
    const numbers = String(attrs.size_numbers||'').trim()
    return [letters, numbers].filter(Boolean).join(' / ')
  }catch{ return '' }
}

function t(s:string){
  const m: any = { PENDING:'قيد المراجعة', PAID:'تم الدفع', SHIPPED:'قيد الشحن', DELIVERED:'مكتمل', CANCELLED:'ملغي' }
  return m[s] || s
}

onMounted(async ()=>{
  order.value = await apiGet(`/api/orders/${encodeURIComponent(id)}`)
  try{ const c = await apiGet<any>('/api/currency'); if (c && c.symbol) currencySymbol.value = c.symbol }catch{}
  // Fire Purchase for COD immediately using stored payload (if present)
  try{
    const raw = sessionStorage.getItem('last_purchase')
    if (raw){
      const data = JSON.parse(raw)
      const fbq = (window as any).fbq
      if (typeof fbq==='function'){
        fbq('track','Purchase', {
          value: Number(data?.value||0),
          currency: String(data?.currency||'YER'),
          contents: Array.isArray(data?.contents)? data.contents: [],
          content_ids: Array.isArray(data?.content_ids)? data.content_ids: [],
          content_type: 'product'
        })
      }
      sessionStorage.removeItem('last_purchase')
    }
  }catch{}
})

async function payNow(){
  if (!order.value) return
  const method = String((order.value as any).paymentMethod||'').trim()
  if (!method || isCod.value) return
  try{
    const amount = Number((order.value as any).total||0)
    const session = await apiPost('/api/payments/session', {
      amount,
      currency: (window as any).__CURRENCY_CODE__||'SAR',
      method,
      returnUrl: location.origin + '/pay/success',
      cancelUrl: location.origin + '/pay/failure',
      ref: (order.value as any).id,
    })
    if (session && (session as any).redirectUrl){ location.href = (session as any).redirectUrl; return }
  } finally {
    // refresh state regardless
    try{ order.value = await apiGet(`/api/orders/${encodeURIComponent(id)}`) }catch{}
  }
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

