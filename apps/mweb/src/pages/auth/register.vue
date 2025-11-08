<template>
  <div class="wrap" dir="rtl" style="min-height:100vh;display:grid;place-items:center;background:#fff">
    <p>جاري التحويل إلى صفحة التسجيل...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(()=> {
  try{
    const sp = new URLSearchParams(location.search||'')
    const next = sp.get('next') || '/coupons?claim=1'
    const dest = `/login?return=${encodeURIComponent(next)}`
    window.location.replace(dest)
  }catch{
    window.location.href = '/login'
  }
})
</script>


