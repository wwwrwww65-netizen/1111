<template>
  <div class="wrap" dir="rtl">
    <div class="card ok">
      <div class="icon">✅</div>
      <div class="ttl">تم الدفع بنجاح</div>
      <a href="/orders" class="btn">عرض الطلبات</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { apiGet } from '@/lib/api'
onMounted(async ()=>{
  try{ window.dispatchEvent(new CustomEvent('order:purchase')) }catch{}
  // إرسال Purchase عبر Pixel باستخدام البيانات المخزنة من مرحلة Checkout
  try{
    const raw = sessionStorage.getItem('last_purchase')
    if (raw){
      const data = JSON.parse(raw||'{}')
      // جلب event_id من الخادم للتوحيد (dedupe)
      let eventId: string | undefined
      try{
        const ordId = String(data?.order_id||'').trim()
        if (ordId){
          const ord = await apiGet<any>(`/api/orders/${encodeURIComponent(ordId)}`)
          eventId = ord?.eventIds?.purchase || undefined
        }
      }catch{}
      const fbq = (window as any).fbq
      if (typeof fbq === 'function'){
        const params = {
          value: Number(data?.value||0),
          currency: String(data?.currency||'YER'),
          contents: Array.isArray(data?.contents)? data.contents : [],
          content_ids: Array.isArray(data?.content_ids)? data.content_ids : [],
          content_type: 'product'
        }
        if (eventId){ fbq('track','Purchase', params as any, { eventID: eventId }) }
        else { fbq('track','Purchase', params as any) }
      }
    }
  }catch{}
  try{ sessionStorage.removeItem('last_purchase') }catch{}
})
</script>

<style scoped>
.wrap{display:grid;place-items:center;min-height:100dvh;background:#fff}
.card{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid #eee;border-radius:12px;padding:20px}
.ok{border-color:#22c55e}
.icon{font-size:40px}
.ttl{font-weight:800}
.btn{background:#111;color:#fff;border:0;border-radius:8px;padding:10px 12px;text-decoration:none}
</style>

