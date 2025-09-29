<template>
  <div class="min-h-screen flex items-center justify-center text-sm text-gray-700" dir="rtl">
    جارِ إكمال تسجيل الدخول عبر جوجل…
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { API_BASE } from '@/lib/api'

onMounted(()=>{
  try{
    const qs = typeof window !== 'undefined' ? (window.location.search || '') : ''
    const url = `${API_BASE}/api/auth/google/callback${qs}`
    window.location.replace(url)
  }catch{
    // best effort fallback
    window.location.href = `${API_BASE}/api/auth/google/callback`
  }
})
</script>

<style scoped></style>

