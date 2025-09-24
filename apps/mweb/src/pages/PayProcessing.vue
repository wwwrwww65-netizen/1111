<template>
  <div class="wrap" dir="rtl">
    <div class="card">
      <div class="spinner" aria-hidden="true"></div>
      <div class="txt">جارٍ معالجة الدفع…</div>
      <div class="muted">لا تُحدّث الصفحة</div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.wrap{display:grid;place-items:center;min-height:100dvh;background:#fff}
.card{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid #eee;border-radius:12px;padding:20px}
.txt{font-weight:700}
.muted{color:#64748b}
.spinner{width:36px;height:36px;border-radius:999px;border:3px solid #eee;border-top-color:#111;animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
</style>

