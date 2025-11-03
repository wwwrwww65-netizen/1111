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
        <div class="coupon" v-if="variant?.type==='coupon' && couponCode">
          <code>{{ couponCode }}</code>
          <button class="btn btn-copy" @click="copyCoupon">نسخ</button>
        </div>
        <form class="form" v-if="variant?.type==='subscribe' || variant?.type==='form'" @submit.prevent="submitForm">
          <input class="input" v-model="email" type="email" required placeholder="بريدك الإلكتروني" aria-label="البريد" />
          <button class="btn">اشترك</button>
          <small class="consent" v-if="showConsent">بتسجيلك أنت توافق على سياسة الخصوصية.</small>
        </form>
        <div class="points" v-if="variant?.type==='points' && points>0">اكسب {{ points }} نقطة</div>
        <div class="actions" v-if="ctas && ctas.length">
          <a v-for="(b,i) in ctas" :key="i" class="btn btn-cta" :href="b.href||'#'" @click.prevent="ctaClick(b)">{{ b.label }}</a>
        </div>
        <div class="secondary-actions">
          <button class="lnk" @click="emitClose('not_now')">لا الآن</button>
          <button class="lnk" v-if="dontShowAgain" @click="dontShow">لا تظهر مرة أخرى</button>
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
const points = computed(()=> Number(content.value?.points||0))
const ctas = computed(()=> Array.isArray(content.value?.ctas)? content.value.ctas : [])
const textAlign = computed(()=> design.value?.textAlign||'start')
const showConsent = computed(()=> (variant.value?.type==='subscribe' || variant.value?.type==='form'))

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
async function copyCoupon(){
  try{ await navigator.clipboard.writeText(String(couponCode.value||'')); props.onEvent('coupon_copied') }catch{}
}
async function submitForm(){ props.onEvent('signup_submitted', { email: email.value }); emitClose('form_submit') }
function ctaClick(b:any){ props.onEvent('click', { href:b.href, label:b.label }); if (b.href) location.assign(b.href) }

onMounted(async()=>{ await nextTick(); try{ dialogRef.value?.focus(); props.onEvent('view') }catch{} })
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
.btn-copy{background:#111827}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.btn-cta{display:inline-block;text-decoration:none}
.secondary-actions{display:flex;gap:12px;justify-content:center;margin-top:10px}
.lnk{background:transparent;border:0;color:#6b7280;cursor:pointer;text-decoration:underline}

@media (max-width: 640px){
  .popup{width:100vw;max-width:none;height:auto;margin:0;border-radius:0;border-top-left-radius:16px;border-top-right-radius:16px}
}
</style>
