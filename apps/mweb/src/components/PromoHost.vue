<template>
  <transition name="fade-scale">
    <PromoPopup
      v-if="current"
      :campaign="current"
      :onClose="handleClose"
      :onEvent="handleEvent"
    />
  </transition>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PromoPopup from './PromoPopup.vue'

type CampaignItem = {
  id: string
  name: string
  priority: number
  status: string
  variantKey: 'A'|'B'
  variant: any
  rewardId?: string|null
  schedule?: any
  targeting?: any
  freq?: any
}

const queue = ref<CampaignItem[]>([])
const current = ref<CampaignItem|null>(null)
const route = useRoute()
const router = useRouter()
let scrollListener: any = null
let exitListener: any = null
let timeouts: number[] = []
let cartListener: any = null
let purchaseListener: any = null

function lcGet(key:string){ try{ return localStorage.getItem(key) }catch{ return null } }
function lcSet(key:string,v:string){ try{ localStorage.setItem(key,v) }catch{} }
function ssGet(key:string){ try{ return sessionStorage.getItem(key) }catch{ return null } }
function ssSet(key:string,v:string){ try{ sessionStorage.setItem(key,v) }catch{} }

function freqKey(c:CampaignItem){ return `promo_seen:${c.id}` }
function markSeen(c:CampaignItem){
  const cap = c?.freq?.cap||'session'
  const now = Date.now()
  const days = Number(c?.freq?.days||0)
  const until = cap==='daily' ? now + 86400000 : cap==='weekly'? now + 7*86400000 : cap==='custom' ? now + Math.max(1, days)*86400000 : now + 3600000
  const val = JSON.stringify({ until })
  if (cap==='session') ssSet(freqKey(c), val); else lcSet(freqKey(c), val)
}
function isCapped(c:CampaignItem){
  const cap = c?.freq?.cap||'session'
  const raw = cap==='session' ? ssGet(freqKey(c)) : lcGet(freqKey(c))
  if (!raw) return false
  try{ const j = JSON.parse(raw); return (j?.until && Date.now() < Number(j.until)) }catch{ return false }
}

async function fetchCampaigns(){
  try{
    const params = new URLSearchParams()
    params.set('path', location.pathname + location.search)
    const lang = document.documentElement.lang || ''
    if (lang) params.set('lang', lang)
    const r = await fetch(`/api/popups?${params.toString()}`, { credentials:'include', cache:'no-store' })
    const j = await r.json()
    const items: CampaignItem[] = Array.isArray(j?.items)? j.items : []
    // Filter by frequency cap and user opt-out
    const eligible = items.filter(it=> {
      try{ if (localStorage.getItem(`promo_dontshow:${it.id}`)==='1') return false }catch{}
      return !isCapped(it) && it?.variant
    })
    // Queue by priority
    queue.value = eligible.sort((a,b)=> (b.priority||0) - (a.priority||0))
    scheduleNext()
  }catch{}
}

function scheduleNext(){
  if (current.value) return
  const next = queue.value.shift()
  if (!next) return
  const tr = next?.variant?.triggers||{}
  // First visit
  if (tr.on==='first_visit') { open(next); return }
  if (tr.on==='time') { const t = window.setTimeout(()=> open(next), Math.max(0, Number(tr.delaySeconds||0))*1000); timeouts.push(t); return }
  if (tr.on==='scroll') { attachScroll(next, Math.max(1, Number(tr.scrollPercent||50))); return }
  if (tr.on==='exit') { attachExit(next); return }
  if (tr.on==='add_to_cart' || tr.afterAddToCart) { attachCart(next); return }
  if (tr.on==='post_purchase' || tr.afterPurchase) { attachPurchase(next); return }
  // default immediate
  open(next)
}

function attachScroll(c:CampaignItem, pct:number){
  detachScroll()
  scrollListener = ()=>{
    try{
      const scrolled = (window.scrollY||0) + window.innerHeight
      const total = Math.max(1, document.documentElement.scrollHeight)
      const perc = Math.round((scrolled/total)*100)
      if (perc >= pct){ detachScroll(); open(c) }
    }catch{}
  }
  window.addEventListener('scroll', scrollListener, { passive:true })
}
function detachScroll(){ if (scrollListener){ window.removeEventListener('scroll', scrollListener); scrollListener = null } }

function attachExit(c:CampaignItem){
  detachExit()
  exitListener = (e: MouseEvent)=>{
    if (e.clientY <= 0) { detachExit(); open(c) }
  }
  window.addEventListener('mouseout', exitListener)
}
function detachExit(){ if (exitListener){ window.removeEventListener('mouseout', exitListener); exitListener = null } }

function attachCart(c:CampaignItem){
  detachCart()
  cartListener = ()=>{ detachCart(); open(c) }
  window.addEventListener('cart:add', cartListener as any)
}
function detachCart(){ if (cartListener){ window.removeEventListener('cart:add', cartListener as any); cartListener = null } }

function attachPurchase(c:CampaignItem){
  detachPurchase()
  purchaseListener = ()=>{ detachPurchase(); open(c) }
  window.addEventListener('order:purchase', purchaseListener as any)
}
function detachPurchase(){ if (purchaseListener){ window.removeEventListener('order:purchase', purchaseListener as any); purchaseListener = null } }

function open(c:CampaignItem){ current.value = c; markSeen(c); track('impression', c) }
function handleClose(reason: string){ if (!current.value) return; track('close', current.value, { reason }); current.value = null; scheduleNext() }
function handleEvent(type: string, meta?: any){ if (!current.value) return; track(type, current.value, meta) }

async function track(type:string, c:CampaignItem, meta?:any){
  try{ fetch('/api/promotions/events', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ type, campaignId: c.id, variantKey: c.variantKey, meta: meta||{} }) }).catch(()=>{}) }catch{}
  try{ if ((window as any).gtag) (window as any).gtag('event', 'promo_'+type, { campaign_id: c.id, variant: c.variantKey }) }catch{}
  try{ const fbq = (window as any).fbq; if (typeof fbq==='function') fbq('trackCustom','Promo'+type.charAt(0).toUpperCase()+type.slice(1), { campaign_id: c.id, variant: c.variantKey }) }catch{}
}

onMounted(()=>{ fetchCampaigns() })
onUnmounted(()=>{ detachScroll(); detachExit(); detachCart(); detachPurchase(); for (const t of timeouts){ try{ clearTimeout(t) }catch{} } })
watch(()=> route.fullPath, ()=>{ // reset queue on route changes
  queue.value = []
  if (!current.value) fetchCampaigns()
})
</script>
<style scoped>
.fade-scale-enter-active,.fade-scale-leave-active{ transition: opacity .2s ease, transform .2s ease }
.fade-scale-enter-from,.fade-scale-leave-to{ opacity:0; transform: scale(.98) }
</style>


