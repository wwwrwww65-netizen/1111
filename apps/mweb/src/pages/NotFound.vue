<template>
  <div class="wrap" dir="rtl">
    <div class="card">
      <div class="ttl">الصفحة غير موجودة</div>
      <a href="/" class="btn">العودة للرئيسية</a>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.wrap{display:grid;place-items:center;min-height:100dvh}
.card{border:1px solid #eee;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center}
.ttl{font-weight:800}
.btn{background:#111;color:#fff;padding:10px 12px;border-radius:8px;text-decoration:none}
</style>

