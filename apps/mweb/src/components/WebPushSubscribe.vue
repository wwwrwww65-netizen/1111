<template>
  <button class="btn" @click="subscribe">تفعيل إشعارات الويب</button>
</template>

<script setup lang="ts">
import { API_BASE } from '@/lib/api'
async function subscribe(){
  try{
    const reg = await navigator.serviceWorker.ready
    const resp = await fetch(`${API_BASE}/api/webpush/vapid`, { credentials:'omit' })
    const vapid = resp.ok ? await resp.json() : null
    if(!vapid?.publicKey){ alert('تعذر التفعيل'); return }
    const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: urlBase64ToUint8Array(vapid.publicKey) })
    await fetch(`${API_BASE}/api/webpush/subscribe`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(sub) })
    alert('تم تفعيل الإشعارات')
  }catch{ alert('تعذر التفعيل') }
}
function urlBase64ToUint8Array(base64String:string){ const padding='='.repeat((4-base64String.length%4)%4); const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/'); const raw=atob(base64); const arr=new Uint8Array(raw.length); for(let i=0;i<raw.length;++i){arr[i]=raw.charCodeAt(i);} return arr }
</script>

