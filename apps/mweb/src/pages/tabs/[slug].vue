<template>
  <div class="min-h-screen bg-[#f7f7f7] text-gray-900" dir="rtl">
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 h-12">
      <div class="max-w-md mx-auto h-full px-3 flex items-center justify-between">
        <button class="text-sm text-gray-800" @click="go('/')">الرئيسية</button>
        <div class="text-sm text-gray-600">{{ slug }}</div>
        <div />
      </div>
    </header>
    <main>
      <nav class="w-screen bg-white border-b border-gray-200" role="tablist" aria-label="التبويبات">
        <div class="max-w-md mx-auto px-3 overflow-x-auto no-scrollbar py-2 flex gap-4">
          <button v-for="(t,i) in tabs" :key="t.slug" role="tab" :aria-selected="t.slug===slug" tabindex="0" @click="go('/tabs/'+encodeURIComponent(t.slug))" :class="['text-sm whitespace-nowrap relative pb-1', (t.slug===slug) ? 'text-black font-semibold' : 'text-gray-700']">
            {{ t.label }}
            <span :class="['absolute left-0 right-0 -bottom-0.5 h-0.5 transition-all', (t.slug===slug) ? 'bg-black' : 'bg-transparent']" />
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
import { useRoute, useRouter } from 'vue-router'
import { API_BASE } from '@/lib/api'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import PromoTilesBlock from '@/components/blocks/PromoTilesBlock.vue'
import MidPromoBlock from '@/components/blocks/MidPromoBlock.vue'
import ProductCarouselBlock from '@/components/blocks/ProductCarouselBlock.vue'
import CategoriesBlock from '@/components/blocks/CategoriesBlock.vue'
import MasonryForYouBlock from '@/components/blocks/MasonryForYouBlock.vue'
const route = useRoute()
const router = useRouter()
const slug = computed(()=> String(route.params.slug||''))
const content = ref<any>({ sections: [] })
const previewActive = ref<boolean>(false)
const tabs = ref<Array<{ slug:string; label:string }>>([])
const sections = computed(()=> Array.isArray(content.value?.content?.sections) ? content.value.content.sections : (Array.isArray(content.value?.sections)? content.value.sections : []))
function go(p:string){ router.push(p) }
function renderBlock(s:any){
  const t = String(s?.type||'').toLowerCase()
  if (t==='hero') return HeroBlock
  if (t==='promotiles' || t==='promotitles') return PromoTilesBlock
  if (t==='midpromo') return MidPromoBlock
  if (t==='productcarousel') return ProductCarouselBlock
  if (t==='categories' || t==='brands') return CategoriesBlock
  if (t==='masonryforyou' || t==='masonry') return MasonryForYouBlock
  return Unknown
}

onMounted(async ()=>{
  try{
    // Admin preview support via query token/payload
    const u = new URL(location.href)
    const raw = u.searchParams.get('payload') || ''
    const tok = u.searchParams.get('previewToken') || u.searchParams.get('token') || ''
    if (raw) {
      try{
        const payload = JSON.parse(decodeURIComponent(raw))
        if (payload) { content.value = payload; previewActive.value = true }
      }catch{}
    }
    if (!previewActive.value && tok) {
      try{
        const r = await fetch(`${API_BASE}/api/admin/tabs/preview/${encodeURIComponent(tok)}`, { credentials:'omit' })
        const j = await r.json()
        if (j?.content) { content.value = j.content; previewActive.value = true }
      }catch{}
    }
  }catch{}

  if (!previewActive.value){
    try{
      const r = await fetch(`/api/tabs/${encodeURIComponent(slug.value)}`)
      const j = await r.json(); if (j?.content) content.value = j
      // track impression
      fetch('/api/tabs/track', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug: slug.value, type:'impression' }) }).catch(()=>{})
    }catch{}
  }
  try{
    const rl = await fetch('/api/tabs/list?device=MOBILE')
    const jl = await rl.json(); tabs.value = Array.isArray(jl.tabs)? jl.tabs : []
  }catch{}
  // Live updates from Admin via postMessage
  try{
    window.addEventListener('message', (e: MessageEvent)=>{
      try{
        const data:any = e.data
        if (data && typeof data==='object' && data.__tabs_preview){
          if (data.content) { content.value = data.content; previewActive.value = true }
        }
      }catch{}
    })
  }catch{}
  // Notify admin preview container that we're ready to receive live updates
  try{ if (window.parent) window.parent.postMessage({ __tabs_preview_ready: true }, '*') }catch{}
  try{ if (window.opener) window.opener.postMessage({ __tabs_preview_ready: true }, '*') }catch{}
})

function clickTrack(){ try{ fetch('/api/tabs/track', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug: slug.value, type:'click' }) }) }catch{} }

const Unknown = { template:`<div class=\"p-3 text-xs opacity-70\">قسم غير مدعوم</div>` }
</script>
