<template>
  <div class="preview-shell">
    <div class="bar">
      <div>Tabs Preview</div>
      <div class="muted">{{ deviceLabel }}</div>
    </div>
    <div class="frame" :style="frameStyle">
      <component v-for="(s,idx) in sections" :key="idx" :is="renderBlock(s)" :cfg="s.config||{}" :device="device" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

const device = ref<'MOBILE'|'DESKTOP'>('MOBILE')
const payload = ref<any>({ sections: [] })
const sections = computed(()=> Array.isArray(payload.value?.sections)? payload.value.sections : [])
const deviceLabel = computed(()=> device.value==='MOBILE'? 'Mobile' : 'Desktop')
const frameStyle = computed(()=> ({ maxWidth: device.value==='MOBILE'? '420px' : '980px' }))

function renderBlock(s:any){
  const t = String(s?.type||'')
  if (t==='hero') return HeroBlock
  if (t==='promoTiles') return PromoTiles
  if (t==='productCarousel') return ProductCarousel
  if (t==='categories' || t==='brands') return CategoriesBlock
  return UnknownBlock
}

onMounted(async ()=>{
  try{
    const d = new URLSearchParams(location.search).get('device') as any
    if (d==='MOBILE' || d==='DESKTOP') device.value = d
  }catch{}
  try{
    const url = new URL(location.href)
    const raw = url.searchParams.get('payload')
    if (raw) payload.value = JSON.parse(decodeURIComponent(raw))
    const token = url.searchParams.get('token')
    if (token){
      try{
        const r = await fetch(`/api/admin/tabs/preview/${encodeURIComponent(token)}`, { credentials:'include' })
        if (r.ok){ const j = await r.json(); if (j?.content) payload.value = j.content; if (j?.device) device.value = j.device }
      }catch{}
    }
  }catch{}
  // Track impression
  try{
    const url = new URL(location.href)
    const slug = url.searchParams.get('slug') || (payload.value?.slug || payload.value?.content?.slug || '')
    if (slug) {
      fetch('/api/tabs/track', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ slug, type:'impression' }) })
        .catch(()=>{})
    }
  }catch{}
  // Accept postMessage for live updates (from admin)
  window.addEventListener('message', (e: MessageEvent)=>{
    try{
      const data = e.data
      if (data && typeof data==='object' && data.__tabs_preview){
        if (data.device) device.value = data.device
        if (data.content) payload.value = data.content
      }
    }catch{}
  })
})

function trackClick(){
  try{
    const url = new URL(location.href)
    const slug = url.searchParams.get('slug') || (payload.value?.slug || payload.value?.content?.slug || '')
    if (slug) fetch('/api/tabs/track', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ slug, type:'click' }) }).catch(()=>{})
  }catch{}
}
const HeroBlock = {
  props: ['cfg','device'],
  template: `<div class=\"hero\"><div v-if=\"Array.isArray(cfg.slides) && cfg.slides.length\" class=\"slides\"><a v-for=\"(sl,i) in cfg.slides\" :key=\"i\" :href=\"sl.href||'#'\" @click=\"trackClick()\"><img :src=\"sl.image||''\" alt=\"\" /></a></div><div v-else class=\"placeholder\">Hero</div></div>`
}
const PromoTiles = {
  props: ['cfg','device'],
  template: `<div class="tiles"><div v-for="(t,i) in (cfg.tiles||[])" :key="i" class="tile"><img v-if="t.image" :src="t.image" alt="" /><div v-if="t.title" class="caption">{{ t.title }}</div></div></div>`
}
const ProductCarousel = {
  props: ['cfg','device'],
  template: `<div class="carousel"><div v-if="cfg.title" class="title">{{ cfg.title }}</div><div class="row"><div v-for="i in (device==='MOBILE'?6:10)" :key="i" class="card"><div class="img" /><div class="name">اسم منتج</div><div v-if="cfg.showPrice" class="price">99.00</div></div></div></div>`
}
const CategoriesBlock = {
  props: ['cfg','device'],
  template: `<div class="categories"><div class="grid"><div v-for="(c,i) in (cfg.categories||cfg.brands||[])" :key="i" class="cat"><img v-if="c.image" :src="c.image" alt="" /><div class="name">{{ c.name||'-' }}</div></div></div></div>`
}
const UnknownBlock = { template: `<div class="unknown">قسم غير مدعوم</div>` }
</script>

<style scoped>
.preview-shell{ padding:12px; color:#e2e8f0 }
.bar{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:#94a3b8 }
.frame{ margin:0 auto; border:1px solid #1c2333; border-radius:12px; overflow:hidden; background:#0b0e14 }
.hero .slides{ display:grid; grid-auto-flow:column; grid-auto-columns:100%; overflow-x:auto; scroll-snap-type:x mandatory }
.hero .slides a{ display:block; scroll-snap-align:start }
.hero img{ width:100%; height:260px; object-fit:cover }
.hero .placeholder{ height:260px; display:grid; place-items:center; background:#0f1420; color:#94a3b8 }
.tiles{ padding:12px; display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:12px }
.tile{ background:#0f1420; border:1px solid #1c2333; border-radius:10px; overflow:hidden }
.tile img{ width:100%; height:120px; object-fit:cover }
.tile .caption{ padding:6px 8px }
.carousel{ padding:12px }
.carousel .title{ margin-bottom:8px; font-weight:700 }
.carousel .row{ display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:12px }
.carousel .card{ background:#0f1420; border:1px solid #1c2333; border-radius:10px; overflow:hidden }
.carousel .img{ height:140px; background:#101828 }
.carousel .name{ padding:8px; height:32px; color:#e2e8f0 }
.carousel .price{ color:#22c55e; padding: 0 8px 8px }
.categories{ padding:12px }
.categories .grid{ display:grid; grid-template-columns:repeat(6, minmax(0,1fr)); gap:12px }
.categories .cat img{ width:100%; height:90px; object-fit:cover; border-radius:10px; border:1px solid #1c2333 }
.categories .cat .name{ margin-top:6px; font-size:12px }
.unknown{ padding:12px; color:#94a3b8 }
</style>
