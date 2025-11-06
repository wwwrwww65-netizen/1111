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
onMounted(()=>{
  try{ window.dispatchEvent(new CustomEvent('order:purchase')) }catch{}
  // Fire Meta Pixel Purchase using stored payload (deduped by browser if sent twice)
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
</script>

<style scoped>
.wrap{display:grid;place-items:center;min-height:100dvh;background:#fff}
.card{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid #eee;border-radius:12px;padding:20px}
.ok{border-color:#22c55e}
.icon{font-size:40px}
.ttl{font-weight:800}
.btn{background:#111;color:#fff;border:0;border-radius:8px;padding:10px 12px;text-decoration:none}
</style>

