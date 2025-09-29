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
    const loc = typeof window !== 'undefined' ? window.location : null
    const ru = loc ? encodeURIComponent(`${loc.origin}${loc.pathname}`) : ''
    const join = qs && qs.includes('?') ? '' : ''
    const sep = qs ? '&' : '?'
    const url = `${API_BASE}/api/auth/google/callback${qs}${sep}ru=${ru}`
    window.location.replace(url)
  }catch{
    // best effort fallback
    window.location.href = `${API_BASE}/api/auth/google/callback`
  }
})
</script>

<style scoped></style>

