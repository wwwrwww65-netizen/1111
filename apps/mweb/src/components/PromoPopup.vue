<template>
  <div v-if="open && popup" class="popup-overlay" @click="close">
    <div class="popup" @click.stop>
      <button class="x" @click="close" aria-label="إغلاق">×</button>
      <h3 class="t">{{ popup.name }}</h3>
      <div class="body">
        <p class="muted">عرض خاص لفترة محدودة.</p>
      </div>
      <div class="actions">
        <button class="btn" @click="claim">جمع المكافأة</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const popup = ref<any|null>(null)
const open = ref(false)
function close(){ open.value = false }

onMounted(async()=>{
  try{
    const r = await fetch('/api/popups', { credentials:'include', cache:'no-store' })
    const j = await r.json()
    const it = Array.isArray(j?.items) ? j.items[0] : null
    if (it) { popup.value = it; open.value = true }
  }catch{}
})

async function claim(){
  try{
    if (!popup.value) return
    // start claim
    const r = await fetch('/api/promotions/claim/start', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ campaignId: popup.value.id }) })
    const j = await r.json(); const tok = j?.token||''
    if (!tok) return
    // try complete (if logged in)
    const c = await fetch('/api/promotions/claim/complete', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ token: tok }) })
    if (c.status === 401){
      const ret = encodeURIComponent(location.pathname + location.search)
      location.assign(`/login?return=${ret}&claimToken=${encodeURIComponent(tok)}`)
      return
    }
    open.value = false
    alert('تم جمع المكافأة!')
  }catch{}
}
</script>
<style scoped>
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:10000}
.popup{background:#fff;border-radius:12px;max-width:480px;width:94vw;padding:16px;position:relative}
.x{position:absolute;top:8px;left:8px;border:0;background:transparent;font-size:22px;cursor:pointer}
.t{margin:0 0 8px 0;font-weight:800}
.muted{color:#6b7280}
.actions{display:flex;justify-content:flex-end;margin-top:12px}
.btn{background:#0B5FFF;color:#fff;border:0;border-radius:10px;padding:10px 14px}
</style>
