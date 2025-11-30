<template>
  <div dir="rtl" class="container page">
    <HeaderBar />
    <h1 class="title">تفاصيل الطلب #{{ (order && (order as any).code) || id }}</h1>
    <div v-if="!order" class="card">جارٍ التحميل…</div>
    <div v-else class="space-y-12">
      <div class="card row" style="justify-content:space-between;align-items:center">
        <div>
          <div class="muted">الحالة</div>
          <div class="chip" :class="order.status">{{ displayStatus }}</div>
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
      <!-- عنوان الشحن المختار -->
      <div class="card" v-if="ship">
        <div class="muted">عنوان الشحن</div>
        <div style="font-weight:600">{{ shipName }}</div>
        <div class="muted">{{ shipPhone }}</div>
        <div class="muted">{{ shipLine }}</div>
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
// احتفاظ محلي من صفحة الدفع لعرض العنوان والصور المختارة عند غيابها من الخادم
const lastCheckoutAddr = ref<any>(null)
const lastCheckoutLines = ref<Array<{ productId:string; quantity:number; attributes?:{ color?:string; size?:string; image?:string } }>>([])
const isCod = computed(()=>{
  try{
    const pm = String((order.value as any)?.paymentMethod || (order.value as any)?.payment?.method || '').toLowerCase()
    return pm==='cod' || pm==='cash_on_delivery' || pm==='cash-on-delivery'
  }catch{ return false }
})

function resolveItemImage(it: any): string {
  try{
    const attrs = (it && (it as any).attributes) || {}
    // دعم مفاتيح متعددة للصورة القادمة من المتغير/السطر المخزن في الطلب
    let raw = attrs.image || attrs.img || attrs.imageUrl || attrs.variantImage || attrs.picture || attrs.photo || attrs.thumbnail || attrs.variantImageUrl || (it?.product?.images?.[0]) || ''
    // في حال غياب الصورة من الخادم، جرّب استخدام بيانات السطور المخزنة محلياً من آخر عملية دفع
    if (!raw) {
      try{
        const pid = String((it as any).productId || it?.product?.id || it?.product?.productId || it?.id || '')
        const match = (lastCheckoutLines.value||[]).find((x:any)=> String(x.productId)===pid)
        if (match?.attributes?.image) raw = match.attributes.image
      }catch{}
    }
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
  const key = String(s||'').toUpperCase()
  const m: any = { 
    PENDING:'قيد المراجعة', 
    PROCESSING:'قيد التجهيز', 
    OUT_FOR_DELIVERY:'في الطريق إليك',
    DELIVERED:'تم الشحن', 
    CANCELLED:'ملغي' 
  }
  return m[key] || s
}

const displayStatus = computed(()=>{
  const s = String(order.value?.status || '').toUpperCase()
  if (s === 'PENDING') {
    if (isCod.value) return 'قيد المراجعة'
    if (order.value?.payment?.status === 'COMPLETED') return 'مدفوع وهو الان قيد المراجعه'
    return 'بانتظار الدفع'
  }
  return t(s)
})

// عنوان الشحن الملتقط من الطلب (السنبشوت المختار أثناء الدفع إن وُجد)
const ship = computed<any>(()=>{
  const o:any = order.value||null
  return o?.shippingAddressSnapshot || o?.shippingAddress || o?.address || lastCheckoutAddr.value || null
})
const shipName = computed(()=>{
  try{ return ship.value?.fullName || ship.value?.name || '—' }catch{ return '—' }
})
const shipPhone = computed(()=>{
  try{ return ship.value?.phone || ship.value?.altPhone || '—' }catch{ return '—' }
})
const shipLine = computed(()=>{
  try{
    const a = ship.value||{}
    // Smart normalization similar to Address.vue/Checkout.vue
    // Check if 'city' contains data (New format where City=Area)
    const isNewFormat = !!a.city
    // If we have explicit 'area' field (from snapshot), prefer it. 
    // Otherwise use 'city' (if new format) or extract from 'details' (old format)
    const realArea = a.area || (isNewFormat ? a.city : (a.details || '').split(' - ')[0])
    
    // If new format, details is just landmarks. If old, details is Area - Landmarks.
    // We want just Landmarks.
    let realLandmarks = a.landmarks
    if (!realLandmarks) {
        realLandmarks = isNewFormat ? a.details : (a.details || '').split(' - ').slice(1).join(' - ')
    }

    const parts = [
        a.country, 
        a.state||a.province, 
        realArea, 
        a.street, 
        realLandmarks
    ].filter((x:any)=> !!x && String(x).trim())
    
    return parts.join('، ')
  }catch{ return '' }
})

onMounted(async ()=>{
  // تحميل بيانات الاحتفاظ المحلي كحل بديل فوري لعرض العنوان والصور المختارة
  try{ const a = sessionStorage.getItem('last_checkout_address'); if (a) lastCheckoutAddr.value = JSON.parse(a||'{}') }catch{}
  try{ const l = sessionStorage.getItem('last_checkout_lines'); if (l) lastCheckoutLines.value = JSON.parse(l||'[]') }catch{}
  order.value = await apiGet(`/api/orders/${encodeURIComponent(id)}`)
  try{ const c = await apiGet<any>('/api/currency'); if (c && c.symbol) currencySymbol.value = c.symbol }catch{}
  // Fire Purchase for COD immediately using stored payload (if present)
  try{
    const raw = sessionStorage.getItem('last_purchase')
    if (raw){
      const data = JSON.parse(raw)
      const params:any = {
        value: Number(data?.value||0),
        currency: String(data?.currency||'YER'),
        contents: Array.isArray(data?.contents)? data.contents: [],
        content_ids: Array.isArray(data?.content_ids)? data.content_ids: [],
        content_type: 'product_group'
      }
      try {
        const { trackEvent } = await import('@/lib/track')
        const ev = (order.value as any)?.eventIds?.purchase
        if (ev){ await trackEvent('Purchase', params, ev) }
        else {
          // Generate event id via CAPI then reuse for Pixel
          const eid = await trackEvent('Purchase', params)
          try{
            const fbq = (window as any).fbq
            if (typeof fbq==='function'){ fbq('track','Purchase', params, { eventID: eid }) }
          }catch{}
        }
      }catch{
        // fallback: Pixel only
        try{
          const fbq = (window as any).fbq
          if (typeof fbq==='function'){ fbq('track','Purchase', params) }
        }catch{}
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

