<template>
  <div v-if="show" class="consent" dir="rtl">
    <div class="txt">نستخدم ملفات تعريف الارتباط لتحسين التجربة وقياس الأداء.</div>
    <div class="actions">
      <button class="btn" @click="accept">موافقة</button>
      <button class="btn outline" @click="decline">رفض</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const key = 'consent_v1'
const show = ref(!localStorage.getItem(key))
function accept(){ localStorage.setItem(key,'yes'); show.value=false; document.dispatchEvent(new CustomEvent('consent:granted')) }
function decline(){ localStorage.setItem(key,'no'); show.value=false }
</script>

<style scoped>
.consent{position:fixed;inset-inline:12px;bottom:12px;background:#111;color:#fff;padding:12px;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:80}
.txt{font-size:13px}
.actions{display:flex;gap:8px}
.btn{background:#fff;color:#111;border:0;border-radius:8px;padding:8px 12px}
.outline{background:transparent;color:#fff;border:1px solid #fff}
</style>

