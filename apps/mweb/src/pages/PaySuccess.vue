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
onMounted(async ()=>{
  try{ window.dispatchEvent(new CustomEvent('order:purchase')) }catch{}
  // نكتفي بإرسال Purchase عبر CAPI من الخادم لتفادي الازدواج؛ لا نرسل نسخة Pixel هنا
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

