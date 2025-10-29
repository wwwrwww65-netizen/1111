<template>
  <div class="min-h-screen bg-[#f7f7f7] text-gray-900" dir="rtl">
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 h-12">
      <div class="max-w-md mx-auto h-full px-3 flex items-center justify-between">
        <button class="text-sm text-gray-800" @click="go('/')">الرئيسية</button>
        <div class="text-sm text-gray-600">معاينة</div>
        <div />
      </div>
    </header>
    <main>
      <nav class="w-screen bg-white border-b border-gray-200" role="tablist" aria-label="التبويبات">
        <div class="max-w-md mx-auto px-3 overflow-x-auto no-scrollbar py-2 flex gap-4">
          <button v-for="(t,i) in tabs" :key="t.slug" role="tab" aria-selected="false" tabindex="0" @click="go('/tabs/'+encodeURIComponent(t.slug))" :class="['text-sm whitespace-nowrap relative pb-1','text-gray-700']">
            {{ t.label }}
            <span class="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-transparent" />
          </button>
        </div>
      </nav>
      <div class="max-w-md mx-auto">
        <section v-for="(s,i) in sections" :key="i" class="px-3 py-2">
          <component :is="renderBlock(s)" :cfg="s.config||{}" />
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const content = ref<any>({ sections: [] })
const sections = computed(()=> Array.isArray(content.value?.content?.sections) ? content.value.content.sections : (Array.isArray(content.value?.sections)? content.value.sections : []))
const tabs = ref<Array<{ slug:string; label:string }>>([])
function go(p:string){ router.push(p) }
function renderBlock(s:any){
  const t = String(s?.type||'').toLowerCase()
  if (t==='hero') return Hero
  if (t==='promotiles' || t==='promotitles') return PromoTiles
  if (t==='midpromo') return MidPromo
  if (t==='productcarousel') return ProductCarousel
  if (t==='categories' || t==='brands') return Categories
  if (t==='masonryforyou' || t==='masonry') return MasonryForYou
  return Unknown
}

onMounted(async ()=>{
  try{
    const u = new URL(location.href)
    const token = u.searchParams.get('token') || ''
    const r = await fetch(`/api/admin/tabs/preview/${encodeURIComponent(token)}`, { credentials:'include' })
    const j = await r.json(); if (j?.content) content.value = j
    // track impression optionally by slug if provided
    const slug = u.searchParams.get('slug')
    if (slug) fetch('/api/tabs/track', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug, type:'impression' }) }).catch(()=>{})
  }catch{}
  try{
    const rl = await fetch('/api/tabs/list?device=MOBILE')
    const jl = await rl.json(); tabs.value = Array.isArray(jl.tabs)? jl.tabs : []
  }catch{}
})

function clickTrack(){ try{ const u=new URL(location.href); const slug=u.searchParams.get('slug'); if (slug) fetch('/api/tabs/track', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug, type:'click' }) }) }catch{} }

const Hero = { props:['cfg'], template:`<div class=\"p-3\"><div v-if=\"Array.isArray(cfg.slides)\" class=\"grid grid-flow-col auto-cols-[100%] overflow-auto snap-x snap-mandatory\"><a v-for=\"(sl,i) in cfg.slides\" :key=\"i\" :href=\"sl.href||'#'\" class=\"block snap-start\" @click=\"$emit('click'); clickTrack()\"><img :src=\"sl.image||''\" class=\"w-full h-[200px] object-cover rounded\" /></a></div></div>` }
const PromoTiles = { props:['cfg'], template:`<div class=\"p-3 grid grid-cols-2 gap-2\"><div v-for=\"(t,i) in (cfg.tiles||[])\" :key=\"i\" class=\"bg-[#0f1420] border border-white/5 rounded overflow-hidden\"><img v-if=\"t.image\" :src=\"t.image\" class=\"w-full h-[100px] object-cover\" /><div v-if=\"t.title\" class=\"p-2 text-xs\">{{ t.title }}</div></div></div>` }
const MidPromo = { props:['cfg'], template:`<div class=\"p-3\"><a :href=\"cfg.href||'#'\" @click=\"clickTrack()\"><img v-if=\"cfg.image\" :src=\"cfg.image\" class=\"w-full h-[90px] object-cover rounded border border-white/5\" /><div v-if=\"cfg.text\" class=\"-mt-6 ps-3 text-[12px]\">{{ cfg.text }}</div></a></div>` }
const ProductCarousel = { props:['cfg'], template:`<div class=\"p-3\"><div v-if=\"cfg.title\" class=\"mb-2 font-semibold\">{{ cfg.title }}</div><div class=\"grid grid-cols-2 gap-2\"><div v-for=\"i in 6\" :key=\"i\" class=\"bg-[#0f1420] border border-white/5 rounded overflow-hidden\"><div class=\"h-[120px] bg-[#101828]\"></div><div class=\"p-2\"><div class=\"text-xs\">اسم منتج</div><div v-if=\"cfg.showPrice\" class=\"text-green-500 text-xs\">99.00</div></div></div></div></div>` }
const Categories = { props:['cfg'], template:`<div class=\"p-3 grid grid-cols-3 gap-2\"><div v-for=\"(c,i) in (cfg.categories||cfg.brands||[])\" :key=\"i\" class=\"text-center\"><img v-if=\"c.image\" :src=\"c.image\" class=\"w-full h-[72px] object-cover rounded border border-white/5\" /><div class=\"mt-1 text-[11px]\">{{ c.name||'-' }}</div></div></div>` }
const MasonryForYou = { props:['cfg'], template:`<div class=\"p-3\"><div class=\"grid\" :style=\"{ gridTemplateColumns: 'repeat(' + (Number((cfg&&cfg.columns)||2)) + ', minmax(0,1fr))', gap: '6px' }\"><div v-for=\"i in 6\" :key=\"i\" class=\"bg-[#0f1420] border border-white/5 rounded overflow-hidden\"><div class=\"w-full h-[120px] bg-[#101828]\"></div><div class=\"p-2 text-xs\">منتج</div></div></div></div>` }
const Unknown = { template:`<div class=\"p-3 text-xs opacity-70\">قسم غير مدعوم</div>` }
</script>
