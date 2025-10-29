<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <!-- Header -->
    <div :class="['fixed top-0 left-0 right-0 z-50 transition-all duration-200', 'bg-white/95 backdrop-blur-sm h-12']" aria-label="رأس الصفحة">
      <div class="w-screen px-3 h-full flex items-center justify-between">
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="القائمة"><span class="w-6 h-6 text-gray-800">☰</span></button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="الإشعارات"><span class="w-6 h-6 text-gray-800">🔔</span></button>
        </div>
        <div class="text-lg sm:text-xl font-semibold text-gray-900" aria-label="شعار المتجر">jeeey</div>
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="السلة"><span class="w-6 h-6 text-gray-800">🛒</span></button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="البحث"><span class="w-6 h-6 text-gray-800">🔎</span></button>
        </div>
      </div>
    </div>

    <!-- Top tabs bar -->
    <div class="fixed left-0 right-0 z-40 transition-colors bg-white/95 backdrop-blur-sm" :style="{ top: '48px' }" role="tablist" aria-label="التبويبات">
      <div ref="tabsRef" class="w-screen px-3 overflow-x-auto no-scrollbar py-2 flex gap-4">
        <button v-for="(t,i) in tabs" :key="t.slug || i" role="tab" :aria-selected="currentSlug===t.slug" tabindex="0" @click="goTab(t.slug)" :class="['text-sm whitespace-nowrap relative pb-1', currentSlug===t.slug ? 'text-black font-semibold' : 'text-gray-700']">
          {{ t.label }}
          <span :class="['absolute left-0 right-0 -bottom-0.5 h-0.5 transition-all', currentSlug===t.slug ? 'bg-black' : 'bg-transparent']" />
        </button>
      </div>
    </div>

    <!-- Main content (sections) -->
    <div class="w-screen px-0" :style="{ marginTop: '96px' }">
      <!-- Hero placeholder if needed to match spacing -->
      <section v-for="(s,i) in sections" :key="'sec-'+i" class="px-3 py-2">
        <component :is="renderBlock(s)" :cfg="s.config||{}" />
      </section>
      <div style="height:80px" />
    </div>

    <!-- Bottom nav -->
    <nav class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 z-50" aria-label="التنقل السفلي">
      <div class="w-screen px-3 flex justify-around py-2">
        <button class="w-16 text-center" aria-label="الرئيسية"><div class="mx-auto mb-1 text-gray-600">🏠</div><div class="text-[11px] text-gray-700">الرئيسية</div></button>
        <button class="w-16 text-center" aria-label="الفئات"><div class="mx-auto mb-1 text-gray-600">🔳</div><div class="text-[11px] text-gray-700">الفئات</div></button>
        <button class="w-16 text-center" aria-label="جديد"><div class="mx-auto mb-1 text-gray-600">🆕</div><div class="text-[11px] text-gray-700">جديد</div></button>
        <button class="w-16 text-center" aria-label="الحقيبة"><div class="mx-auto mb-1 text-gray-600">👜</div><div class="text-[11px] text-gray-700">الحقيبة</div></button>
        <button class="w-16 text-center" aria-label="حسابي"><div class="mx-auto mb-1 text-gray-600">👤</div><div class="text-[11px] text-gray-700">حسابي</div></button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { API_BASE } from '@/lib/api'

const tabs = ref<Array<{ label:string; slug:string }>>([])
const tabsRef = ref<HTMLDivElement|null>(null)
const currentSlug = ref<string>('')
const payload = ref<any>({ sections: [] })
const sections = computed(()=> Array.isArray(payload.value?.content?.sections)? payload.value.content.sections : (Array.isArray(payload.value?.sections)? payload.value.sections : []))

function renderBlock(s:any){
  const t = String(s?.type||'').toLowerCase()
  if (t==='hero') return Hero
  if (t==='promotiles') return PromoTiles
  if (t==='midpromo') return MidPromo
  if (t==='productcarousel') return ProductCarousel
  if (t==='categories' || t==='brands') return Categories
  return Unknown
}

function goTab(slug:string){ try{ if (slug) { currentSlug.value = slug; loadSlug(slug) } }catch{}
}

async function loadSlug(slug:string){
  try{
    const r = await fetch(`${API_BASE}/api/tabs/${encodeURIComponent(slug)}`, { credentials:'include' })
    const j = await r.json(); payload.value = j
    track('impression', slug)
  }catch{ payload.value = { sections: [] } }
}

async function loadToken(token:string){
  try{
    const r = await fetch(`${API_BASE}/api/admin/tabs/preview/${encodeURIComponent(token)}`, { credentials:'include' })
    const j = await r.json(); payload.value = (j?.content || j)
    const slug = String(j?.slug || j?.content?.slug || '')
    if (slug) currentSlug.value = slug
    track('impression', slug)
  }catch{ payload.value = { sections: [] } }
}

function track(type:'impression'|'click', slug?:string){ try{ const s = slug || currentSlug.value; if (!s) return; fetch(`${API_BASE}/api/tabs/track`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ slug: s, type }) }) }catch{}
}

onMounted(async ()=>{
  // Load tabs list
  try{ const rl = await fetch(`${API_BASE}/api/tabs/list?device=MOBILE`, { credentials:'include' }); const jl = await rl.json(); tabs.value = Array.isArray(jl.tabs)? jl.tabs : [] }catch{}
  // Read query params
  let token = ''
  let slug = ''
  try{ const u = new URL(location.href); token = u.searchParams.get('token')||''; slug = u.searchParams.get('slug')||'' }catch{}
  if (token) await loadToken(token); else if (slug) await loadSlug(slug); else if (tabs.value[0]?.slug) await loadSlug(tabs.value[0].slug)
  // Accept postMessage for live updates from Admin
  window.addEventListener('message', (e: MessageEvent)=>{
    try{
      const data = e.data as any
      if (data && typeof data==='object' && data.__tabs_preview){
        if (data.device && (data.device==='MOBILE' || data.device==='DESKTOP')){}
        if (data.content){ payload.value = data.content; }
      }
    }catch{}
  })
})

const Hero = { props:['cfg'], template:`<div class=\"p-3\"><div v-if=\"Array.isArray(cfg.slides)\" class=\"grid grid-flow-col auto-cols-[100%] overflow-auto snap-x snap-mandatory\"><a v-for=\"(sl,i) in cfg.slides\" :key=\"i\" :href=\"sl.href||'#'\" class=\"block snap-start\"><img :src=\"sl.image||''\" class=\"w-full h-[200px] object-cover rounded border border-gray-200\" /></a></div><div v-else class=\"h-[200px] bg-gray-100 border border-gray-200 rounded\"></div></div>` }
const PromoTiles = { props:['cfg'], template:`<div class=\"p-3 grid grid-cols-2 gap-2\"><div v-for=\"(t,i) in (cfg.tiles||[])\" :key=\"i\" class=\"bg-white border border-gray-200 rounded overflow-hidden\"><img v-if=\"t.image\" :src=\"t.image\" class=\"w-full h-[100px] object-cover\" /><div v-if=\"t.title\" class=\"p-2 text-xs text-gray-900\">{{ t.title }}</div></div></div>` }
const MidPromo = { props:['cfg'], template:`<div class=\"p-3\"><a :href=\"cfg.href||'#'\"><img v-if=\"cfg.image\" :src=\"cfg.image\" class=\"w-full h-[90px] object-cover rounded border border-gray-200\" /><div v-if=\"cfg.text\" class=\"-mt-6 ps-3 text-[12px] text-white\">{{ cfg.text }}</div></a></div>` }
const ProductCarousel = { props:['cfg'], template:`<div class=\"p-3\"><div v-if=\"cfg.title\" class=\"mb-2 font-semibold text-gray-900\">{{ cfg.title }}</div><div class=\"grid grid-cols-2 gap-2\"><div v-for=\"i in 6\" :key=\"i\" class=\"bg-white border border-gray-200 rounded overflow-hidden\"><div class=\"h-[120px] bg-gray-100\"></div><div class=\"p-2\"><div class=\"text-xs text-gray-900\">اسم منتج</div><div v-if=\"cfg.showPrice\" class=\"text-red-600 text-xs\">99.00</div></div></div></div></div>` }
const Categories = { props:['cfg'], template:`<div class=\"p-3 grid grid-cols-3 gap-2\"><div v-for=\"(c,i) in (cfg.categories||cfg.brands||[])\" :key=\"i\" class=\"text-center\"><img v-if=\"c.image\" :src=\"c.image\" class=\"w-full h-[72px] object-cover rounded border border-gray-200\" /><div class=\"mt-1 text-[11px] text-gray-800\">{{ c.name||'-' }}</div></div></div>` }
const Unknown = { template:`<div class=\"p-3 text-xs text-gray-500\">قسم غير مدعوم</div>` }
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
</style>
