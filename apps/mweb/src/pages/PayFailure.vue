<template>
  <div class="wrap" dir="rtl">
    <div class="card err">
      <div class="icon">❌</div>
      <div class="ttl">فشل الدفع</div>
      <a href="/checkout" class="btn">إعادة المحاولة</a>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.wrap{display:grid;place-items:center;min-height:100dvh;background:#fff}
.card{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid #eee;border-radius:12px;padding:20px}
.err{border-color:#ef4444}
.icon{font-size:40px}
.ttl{font-weight:800}
.btn{background:#111;color:#fff;border:0;border-radius:8px;padding:10px 12px;text-decoration:none}
</style>

