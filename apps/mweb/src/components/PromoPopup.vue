<template>
  <div class="popup-overlay" @click="emitClose('overlay')">
    <div
      class="popup"
      :style="popupStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="campaign?.name || 'Promo'"
      @click.stop
      ref="dialogRef"
      @keydown.esc.prevent.stop="emitClose('esc')"
      tabindex="-1"
    >
      <button class="x" @click="emitClose('x')" aria-label="إغلاق" ref="closeBtn">×</button>
      <div class="media" v-if="mediaSrc">
        <img v-if="mediaType==='image'" :src="mediaSrc" :alt="contentTitle||'promo'" loading="lazy" />
        <video v-else controls playsinline preload="metadata"><source :src="mediaSrc" /></video>
      </div>
      <div class="inner" :style="{ textAlign: textAlign }">
        <h3 class="t" v-if="contentTitle">{{ contentTitle }}</h3>
        <p class="sub" v-if="contentSubtitle">{{ contentSubtitle }}</p>
        <p class="desc" v-if="contentDesc">{{ contentDesc }}</p>
        <div class="coupons-stack" v-if="couponsList.length >= 1" :style="{ textAlign: 'start' }">
          <article
            v-for="(code,i) in couponsList"
            :key="code+'-'+i"
            class="coupon-card"
            :data-category="(getC(code)?.categories && getC(code).categories.join(' ')) || 'all discount unused'"
          >
            <div class="coupon-left">
              <div class="coupon-title">{{ getC(code)?.title || ('كوبون ' + code) }}</div>
              <div class="coupon-sub">عروض</div>
              <div class="expiry-row" @click="toggleExpiry(code)">
                <span class="expiry">
                  تنتهي الصلاحية في {{ expiryDateText(getC(code)) || '—' }}
                </span>
                <button
                  class="exp-toggle"
                  :class="{ open: isExpanded(code) }"
                  :aria-expanded="isExpanded(code)"
                >▾</button>
              </div>
              <transition name="accordion">
                <div v-show="isExpanded(code)" class="expiry-details">
                  <p>شروط الاستخدام:</p>
                  <ul>
                    <li v-for="cond in getConditions(getC(code))" :key="String(cond)">{{ cond }}</li>
                  </ul>
                </div>
              </transition>
            </div>
            <div class="coupon-divider"></div>
            <div class="coupon-right">
              <div class="coupon-percent">
                {{ percentOf(getC(code)) ? percentOf(getC(code)) : '' }}<span v-if="percentOf(getC(code))">%</span>
              </div>
              <div class="discount-note">{{ minOrderTextOf(getC(code)) }}</div>
            </div>
          </article>
        </div>
        <form class="form" v-if="variant?.type==='subscribe' || variant?.type==='form'" @submit.prevent="submitForm">
          <input class="input" v-model="email" type="email" required placeholder="بريدك الإلكتروني" aria-label="البريد" />
          <button class="btn">اشترك</button>
          <small class="consent" v-if="showConsent">بتسجيلك أنت توافق على سياسة الخصوصية.</small>
        </form>
        <div class="points" v-if="variant?.type==='points' && points>0">اكسب {{ points }} نقطة</div>
        <div class="actions" v-if="ctas && ctas.length">
          <a
            v-for="(b,i) in ctas"
            :key="i"
            class="btn-cta"
            :href="b.href||'#'"
            :style="{ background: primaryColor, color: '#fff' }"
            @click.prevent="ctaClick(b)"
          >{{ b.label }}</a>
        </div>
        <div class="secondary-actions" v-if="dontShowAgain">
          <button class="lnk" @click="dontShow">لا تظهر مرة أخرى</button>
        </div>
      </div>
    </div>
  </div>
  
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps<{ campaign: any; onClose: (reason:string)=> void; onEvent: (type:string, meta?:any)=> void }>()
const dialogRef = ref<HTMLElement|null>(null)
const closeBtn = ref<HTMLButtonElement|null>(null)
const email = ref<string>('')
const couponMap = ref<Record<string, any>>({})

const variant = computed(()=> props.campaign?.variant || null)
const design = computed(()=> variant.value?.design || {})
const content = computed(()=> variant.value?.content || {})
const triggers = computed(()=> variant.value?.triggers || {})
const dontShowAgain = computed(()=> !!props.campaign?.freq?.dontShowAgain)

const contentTitle = computed(()=> content.value?.title||'')
const contentSubtitle = computed(()=> content.value?.subtitle||'')
const contentDesc = computed(()=> content.value?.description||'')
const mediaType = computed(()=> content.value?.media?.type || 'image')
const mediaSrc = computed(()=> content.value?.media?.src || '')
const couponCode = computed(()=> content.value?.couponCode || '')
const couponsList = computed<string[]>(()=> {
  const arr = Array.isArray(content.value?.coupons)? content.value.coupons : []
  if (arr.length) return arr
  return couponCode.value? [couponCode.value] : []
})
const points = computed(()=> Number(content.value?.points||0))
const ctas = computed(()=> Array.isArray(content.value?.ctas)? content.value.ctas : [])
const textAlign = computed(()=> design.value?.textAlign||'start')
const showConsent = computed(()=> (variant.value?.type==='subscribe' || variant.value?.type==='form'))
const primaryColor = computed(()=> design.value?.colors?.primary || '#0B5FFF')
const expanded = ref<Set<string>>(new Set())

const popupStyle = computed(()=>{
  const maxW = Number(design.value?.maxWidth||480)
  const radius = Number(design.value?.radius||12)
  const bg = design.value?.colors?.background || '#fff'
  const color = design.value?.colors?.text || '#111827'
  const shadow = design.value?.shadow||'lg'
  return { maxWidth: maxW+'px', borderRadius: radius+'px', background:bg, color, boxShadow: shadow==='none'? 'none' : shadow==='sm'? '0 4px 10px rgba(0,0,0,.1)' : shadow==='md'? '0 8px 20px rgba(0,0,0,.15)' : '0 12px 28px rgba(0,0,0,.2)' }
})

function emitClose(reason:string){ props.onClose(reason) }
function dontShow(){ try{ localStorage.setItem(`promo_dontshow:${props.campaign?.id}`,'1') }catch{}; emitClose('dont_show_again') }
async function submitForm(){ props.onEvent('signup_submitted', { email: email.value }); emitClose('form_submit') }
function isGuest(): boolean {
  try{
    const m = document.cookie.match(/(?:^|; )shop_auth_token=([^;]+)/)
    return !m
  }catch{ return true }
}
async function ctaClick(b:any){
  props.onEvent('click', { href:b.href, label:b.label })
  const behavior = b?.behavior||{}
  if (isGuest() && behavior?.guest === 'signup_redirect'){
    try{
      // start claim for this campaign (optional best-effort)
      const tokenRes = await fetch(buildApiUrl('/api/promotions/claim/start'), { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ campaignId: props.campaign?.id }) })
      const tJ = await tokenRes.json().catch(()=>null)
      if (tJ?.token) sessionStorage.setItem('claim_token', String(tJ.token))
    }catch{}
    try{
      sessionStorage.setItem('pending_campaignId', String(props.campaign?.id||''))
      sessionStorage.setItem('pending_coupons', JSON.stringify(couponsList.value||[]))
    }catch{}
    const next = '/coupons?claim=1'
    location.assign(`/auth/register?next=${encodeURIComponent(next)}`)
    return
  }
  if (b.href) location.assign(b.href)
}

function buildApiUrl(path:string){
  try{
    const host = location.hostname||''
    const parts = host.split('.')
    if (parts.length>=2){
      const base = parts.slice(-2).join('.')
      const proto = location.protocol||'https:'
      return `${proto}//api.${base}${path}`
    }
  }catch{}
  return path
}

function getExpiryTs(c:any){
  const raw = c?.validUntil || c?.valid_to || c?.expiresAt || (c?.schedule && c.schedule.to)
  if (!raw) return null
  const ts = new Date(raw).getTime()
  return Number.isFinite(ts) ? ts : null
}
function expiryDateText(c:any){
  const ts = getExpiryTs(c)
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('ar', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return new Date(ts).toISOString()
  }
}
function minOrderTextOf(c:any){
  const min = c?.minOrderAmount ?? c?.min ?? (c?.rules && c.rules.min)
  if (!min || isNaN(min)) return 'بدون حد أدنى للشراء'
  try {
    const formatted = new Intl.NumberFormat('ar', { maximumFractionDigits: 2 }).format(min)
    return `طلبات أكثر من ${formatted}`
  } catch {
    return `طلبات أكثر من ${min}`
  }
}
function getC(code:string){ return couponMap.value[code] || {} }
function percentOf(c:any): number {
  const v = c?.discount ?? c?.percent ?? 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function getConditions(c:any): string[] {
  const arr = (c?.conditions && Array.isArray(c.conditions)) ? c.conditions : (c?.rules?.conditions && Array.isArray(c.rules.conditions) ? c.rules.conditions : [])
  return arr
}
function isExpanded(code:string){ return expanded.value.has(code) }
function toggleExpiry(code:string){
  if (expanded.value.has(code)) expanded.value.delete(code); else expanded.value.add(code)
}

async function fetchCouponDetails(){
  try{
    const codes = couponsList.value
    if (!codes.length) return
    // try precise shop endpoint by codes
    let list:any[] = []
    try{
      const url = buildApiUrl(`/api/coupons/by-codes?codes=${encodeURIComponent(codes.join(','))}`)
      const r1 = await fetch(url, { credentials:'omit', cache:'no-store' })
      const j1 = await r1.json().catch(()=>null)
      if (j1 && Array.isArray(j1.coupons)) list = j1.coupons
    }catch{}
    // fallback to public coupons
    if (!list.length){
      const r2 = await fetch(buildApiUrl('/api/admin/coupons/public'), { credentials:'omit', cache:'no-store' })
      const j2 = await r2.json().catch(()=>null)
      list = (j2 && Array.isArray(j2.coupons))? j2.coupons : []
    }
    const map: Record<string, any> = {}
    for (const c of list){ if (c?.code) map[String(c.code)] = c }
    couponMap.value = map
  }catch{}
}

onMounted(async()=>{
  await nextTick()
  try{ dialogRef.value?.focus(); props.onEvent('view') }catch{}
  fetchCouponDetails()
})
</script>
<style scoped>
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:10000}
.popup{width:94vw;max-width:480px;padding:16px;position:relative}
.x{position:absolute;top:8px;left:8px;border:0;background:transparent;font-size:22px;cursor:pointer}
.media{width:100%;overflow:hidden;border-radius:12px}
.media img,.media video{width:100%;display:block}
.t{margin:8px 0;font-weight:800;font-size:18px}
.sub{margin:4px 0;color:#4b5563}
.desc{margin:8px 0;color:#374151;line-height:1.6}
.coupon{display:flex;gap:8px;align-items:center;margin:8px 0}
.coupon code{background:#f3f4f6;border-radius:8px;padding:8px 10px}
.form{display:flex;gap:8px;align-items:center;margin:8px 0}
.input{flex:1 1 auto;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px}
.btn{background:#0B5FFF;color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer}
.actions{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.btn-cta{display:block;width:100%;text-align:center;text-decoration:none;border-radius:10px;padding:12px 16px}
.secondary-actions{display:flex;gap:12px;justify-content:center;margin-top:10px}
.lnk{background:transparent;border:0;color:#6b7280;cursor:pointer;text-decoration:underline}

/* Coupons stack (similar to Couponati style) */
.coupons-stack{display:grid;gap:8px;margin-top:8px}
.coupon-card{display:flex;align-items:stretch;gap:12px;background:#fff6f4;border:1px solid #f3d2c8;border-radius:14px;padding:12px}
.coupon-left{flex:1;display:flex;flex-direction:column;gap:6px}
.coupon-title{font-weight:800;font-size:16px}
.coupon-sub{font-size:12px;color:#8a8a8a}
.coupon-divider{width:1px;position:relative}
.coupon-divider::after{content:"";position:absolute;inset:0;border-left:1px dashed rgba(200,120,100,.4)}
.coupon-right{width:110px;min-width:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.coupon-percent{font-size:28px;font-weight:800;color:#ff5a3c;line-height:1}
.coupon-note{font-size:12px;color:#666;text-align:center}
.expiry-row{display:flex;align-items:center;gap:8px;margin-top:6px}
.expiry{font-size:12px;color:#8a8a8a}
.exp-toggle{background:transparent;border:0;cursor:pointer;font-size:14px;color:#8a8a8a;transition:transform .3s}
.exp-toggle.open{transform:rotate(180deg)}
.expiry-details{margin-top:8px;padding-top:8px;border-top:1px dashed var(--card-border,#f3d2c8);font-size:12px;color:#666}
.expiry-details ul{margin-right:20px;margin-top:4px}

/* Accordion transitions */
.accordion-enter-active,.accordion-leave-active{transition:all .3s ease;overflow:hidden}
.accordion-enter-from,.accordion-leave-to{max-height:0;opacity:0}
.accordion-enter-to,.accordion-leave-from{max-height:200px;opacity:1}

@media (max-width: 640px){
  .popup{width:100vw;max-width:none;height:auto;margin:0;border-radius:0;border-top-left-radius:16px;border-top-right-radius:16px}
}
</style>
