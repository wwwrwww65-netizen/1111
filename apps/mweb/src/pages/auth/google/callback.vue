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
    // Decode state to get desired next path (defaults to /account)
    const sp = new URLSearchParams(qs)
    const s = sp.get('state') || ''
    let next = '/account'
    try{ const obj = JSON.parse(atob(s.replace(/-/g,'+').replace(/_/g,'/'))); if (obj && typeof obj.next === 'string' && obj.next) next = obj.next.startsWith('/')? obj.next : ('/' + obj.next) }catch{}
    const ru = loc ? encodeURIComponent(`${loc.origin}${next}`) : ''
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

