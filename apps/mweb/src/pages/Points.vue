<template>
  <div class="app" dir="rtl">
    <!-- Fixed header like Coupons -->
    <header class="unified-header" :class="{ scrolled: isScrolled }" ref="headerEl">
      <div class="header-left">
        <button class="back-btn" @click="handleBack" aria-label="رجوع">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="header-center">
        <div class="page-title">نقاطي</div>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="container" :style="{ paddingTop: `calc(var(--header-height) + 12px)` }">

    <!-- Guard: guest view -->
    <section v-if="!hydrated || !isLoggedIn" class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div v-if="!hydrated" class="animate-pulse grid gap-3">
        <div class="h-6 bg-gray-200 rounded"></div>
        <div class="h-20 bg-gray-200 rounded"></div>
        <div class="h-32 bg-gray-200 rounded"></div>
      </div>
      <div v-else class="text-center">
        <div class="text-gray-700 mb-2">سجّل الدخول لعرض رصيد نقاطك ومحفظتك</div>
        <div class="flex items-center justify-center gap-2">
          <a class="px-4 py-2 rounded text-white" :style="{ backgroundColor: primary }" href="/verify?return=/points">تسجيل الدخول</a>
        </div>
      </div>
    </section>
    <template v-else>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <div class="text-xs text-gray-500">رصيد النقاط</div>
        <div class="text-2xl font-bold mt-1">{{ balance }}</div>
        <div class="text-xs text-gray-500 mt-2">1 نقطة = {{ pointValue }}</div>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <div class="text-xs text-gray-500">رصيد المحفظة</div>
        <div class="text-2xl font-bold mt-1">{{ walletBalance.toFixed(2) }}</div>
        <div class="text-xs text-gray-500 mt-2">قابل للاستخدام فورًا</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div class="grid grid-cols-1 gap-3">
        <div class="flex items-center justify-between bg-emerald-50 rounded p-3">
          <div class="text-sm">
            <div class="text-emerald-700 font-medium">تسجيل يومي</div>
            <div class="text-gray-600">احصل على نقاط يومية عند تسجيل الدخول</div>
          </div>
          <button class="px-3 py-2 rounded text-white disabled:opacity-50" :style="{ backgroundColor: '#16a34a' }" :disabled="checkedInToday" @click="checkin">{{ checkedInToday? 'تم اليوم' : 'تسجيل الآن' }}</button>
        </div>
        <div class="grid grid-cols-3 gap-2 items-end">
          <label class="col-span-2 text-sm">
            <div class="text-gray-600 mb-1">صرف النقاط إلى رصيد المحفظة</div>
            <input v-model.number="redeemPts" type="number" min="0" :max="balance" class="w-full border px-3 py-2 rounded" placeholder="ادخل عدد النقاط" />
          </label>
          <button class="w-full py-2 rounded text-white" :style="{ backgroundColor: '#8a1538', opacity: redeemPts>0? 1: .5 }" :disabled="!(redeemPts>0)" @click="redeemToWallet">تحويل</button>
        </div>
        <div v-if="redeemPts>0" class="text-xs text-gray-500 -mt-2 mb-2">سيُضاف {{ (redeemPts * pointValue).toFixed(2) }} إلى المحفظة</div>

        <div class="grid grid-cols-3 gap-2 items-end">
          <label class="col-span-2 text-sm">
            <div class="text-gray-600 mb-1">إضافة رصيد إلى المحفظة</div>
            <input v-model.number="topupAmt" type="number" min="0" class="w-full border px-3 py-2 rounded" placeholder="المبلغ" />
          </label>
          <button class="w-full py-2 rounded text-white bg-green-600 disabled:opacity-50" :disabled="!(topupAmt>0)" @click="topup">إضافة</button>
        </div>

        <div class="grid grid-cols-3 gap-2 items-end">
          <label class="col-span-2 text-sm">
            <div class="text-gray-600 mb-1">تحويل النقاط إلى قسيمة</div>
            <input v-model.number="couponPts" type="number" min="0" :max="balance" class="w-full border px-3 py-2 rounded" placeholder="نقاط" />
          </label>
          <button class="w-full py-2 rounded text-white bg-blue-600 disabled:opacity-50" :disabled="!(couponPts>0)" @click="redeemToCoupon">تحويل</button>
        </div>
        <div v-if="couponPts>0" class="text-xs text-gray-500 -mt-2 mb-2">قسيمة مكافئة لقيمة ≈ {{ (couponPts * pointValue).toFixed(2) }}</div>
        <div v-if="msg" class="text-sm text-gray-500">{{ msg }}</div>
      </div>
    </div>

    <!-- Earn & Use -->
    <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h2 class="font-semibold mb-2">كيف تكسب وتستخدم النقاط</h2>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-500 mb-1">طرق الكسب</div>
          <ul class="list-disc pr-5 text-gray-700">
            <li v-if="meta?.triggers?.purchase">الشراء: {{ meta.triggers.purchase.pointsPerCurrency }} نقطة لكل وحدة عملة</li>
            <li v-if="meta?.triggers?.registration">تسجيل أول مرة: {{ meta.triggers.registration.points }} نقطة</li>
            <li v-if="meta?.triggers?.dailyCheckIn">تسجيل يومي: {{ meta.triggers.dailyCheckIn.points }} نقطة</li>
            <li v-if="meta?.triggers?.review">كتابة تقييم: {{ meta.triggers.review.base }} نقطة</li>
            <li v-if="meta?.triggers?.share">مشاركة: {{ meta.triggers.share.view }} نقطة</li>
            <li v-if="meta?.triggers?.referral">إحالة صديق: {{ meta.triggers.referral.signUp?.referrer }} (للمُحيل) / {{ meta.triggers.referral.signUp?.referred }} (للمحال)</li>
          </ul>
          <div class="mt-2">
            <button class="px-3 py-2 rounded bg-gray-900 text-white text-xs" @click="simulateReview">سجّل تقييمًا (تجريبي)</button>
            <button class="ml-2 px-3 py-2 rounded bg-gray-700 text-white text-xs" @click="simulateShare">سجّل مشاركة (تجريبي)</button>
          </div>
        </div>
        <div>
          <div class="text-gray-500 mb-1">طرق الاستخدام</div>
          <ul class="list-disc pr-5 text-gray-700">
            <li>خصم مباشر في السلة باستخدام النقاط</li>
            <li>تحويل إلى رصيد محفظة</li>
            <li>تحويل إلى قسيمة شراء</li>
          </ul>
          <div v-if="meta?.redemption?.tiers?.length" class="text-xs text-gray-500 mt-2">مستويات الاستبدال:
            <span v-for="(t,i) in meta.redemption.tiers" :key="i" class="inline-block bg-gray-100 rounded px-2 py-1 ml-1">{{ t.points }} نقطة → <span v-if="t.percentOff">{{ t.percentOff }}%</span><span v-else-if="t.amountOff">{{ t.amountOff }}</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- XP / Progress -->
    <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div class="flex items-center justify-between text-sm mb-2">
        <div class="text-gray-600">المرتبة: {{ tier.name }}</div>
        <div class="text-gray-600">التقدم: {{ tier.progress }}%</div>
      </div>
      <div class="w-full h-2 bg-gray-200 rounded">
        <div class="h-2 bg-emerald-500 rounded" :style="{ width: tier.progress + '%' }"></div>
      </div>
    </div>

    <!-- Ledger -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <div class="flex items-center justify-between mb-2 text-sm text-gray-600">
        <div>مكتسب: <span class="text-green-600 font-semibold">+{{ earned }}</span></div>
        <div>مستخدم: <span class="text-red-600 font-semibold">{{ used }}</span></div>
      </div>
      <div v-if="log.length" class="divide-y">
        <div v-for="r in log" :key="r.id" class="py-2 flex items-center justify-between">
          <div>
            <div class="text-sm">{{ reasonLabel(r.reason) }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(r.createdAt) }} <span v-if="r.status" class="ml-2 inline-block bg-gray-100 px-2 py-0.5 rounded">{{ r.status }}</span></div>
          </div>
          <div :class="r.points>0? 'text-green-600':'text-red-600'" class="font-semibold">{{ r.points>0? '+' : '' }}{{ r.points }}</div>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">لا يوجد سجل حتى الآن</div>
    </div>
    </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { apiGet, apiPost } from '@/lib/api'
import { useUser } from '@/store/user'
import { useRouter } from 'vue-router'
const primary = '#8a1538'
const user = useUser()
const isLoggedIn = computed(()=> user.isLoggedIn)
const hydrated = ref(false)
const headerEl = ref<HTMLElement|null>(null)
const isScrolled = ref(false)
const router = useRouter()
const balance = ref(0)
const log = ref<any[]>([])
const redeemPts = ref<number>(0)
const couponPts = ref<number>(0)
const topupAmt = ref<number>(0)
const msg = ref('')
const walletBalance = ref(0)
const pointValue = ref(0.01)
const meta = ref<any>(null)
const earned = ref(0)
const used = ref(0)
const tier = ref<{ name:string; progress:number }>({ name:'Bronze', progress: 0 })
const checkedInToday = ref(false)
let onScroll: any
onMounted(async ()=>{
  onScroll = ()=>{ try{ isScrolled.value = (window.scrollY||0) > 4 }catch{} }
  try{ window.addEventListener('scroll', onScroll, { passive:true }) }catch{}
  try{
    const me = await apiGet<any>('/api/me')
    if (me && me.user) user.isLoggedIn = true; else user.isLoggedIn = false
  }catch{ user.isLoggedIn = false }
  if (!user.isLoggedIn){
    try{ router.replace('/login?return=/points') }catch{}
    return
  }
  try{
    const j = await apiGet<any>('/api/points/ledger')
    if (j && Array.isArray(j.rows)) log.value = j.rows
  }catch{}
  try{
    const b = await apiGet<any>('/api/points/balance')
    if (b && typeof b.points==='number') balance.value = Math.round(b.points)
  }catch{}
  try{
    const w = await apiGet<any>('/api/wallet/balance')
    walletBalance.value = Number(w?.balance||0)
  }catch{}
  try{
    const m = await apiGet<any>('/api/points/meta')
    meta.value = m||{}
    pointValue.value = Number(m?.pointValue||0.01)
  }catch{}
  computeStats()
  computeCheckin()
  hydrated.value = true
})

onUnmounted(()=>{ try{ if(onScroll) window.removeEventListener('scroll', onScroll) }catch{} })

function handleBack(){
  try{ if (window.history.length > 1) { router.back(); return } }catch{}
  router.push('/account')
}
function computeStats(){
  const pos = log.value.filter((x:any)=> Number(x.points)>0).reduce((s:number,x:any)=> s+Number(x.points||0), 0)
  const neg = log.value.filter((x:any)=> Number(x.points)<0).reduce((s:number,x:any)=> s+Number(x.points||0), 0)
  earned.value = pos
  used.value = neg
  const total = Math.max(0, pos + neg)
  let name='Bronze', progress=0
  const next = total < 1000 ? 1000 : (total < 5000 ? 5000 : 5000)
  if (total >= 5000) { name='Gold'; progress=100 }
  else if (total >= 1000) { name='Silver'; progress= Math.round(((total-1000)/(5000-1000))*100) }
  else { name='Bronze'; progress= Math.round((total/1000)*100) }
  tier.value = { name, progress: Math.max(0, Math.min(100, progress)) }
}
function computeCheckin(){
  try{
    const today = new Date(); const y=today.getFullYear(), m=today.getMonth(), d=today.getDate();
    const start = new Date(y, m, d, 0,0,0).getTime();
    checkedInToday.value = log.value.some((r:any)=> String(r?.reason||'')==='DAILY_CHECKIN' && new Date(r.createdAt).getTime()>=start)
  }catch{ checkedInToday.value = false }
}
async function redeemToWallet(){
  msg.value=''
  const r = await apiPost('/api/points/redeem-to-wallet', { points: redeemPts.value })
  if (r && r.ok){ msg.value = 'تم تحويل النقاط إلى المحفظة'; await refreshBalances() }
  else msg.value = 'فشل التحويل'
}
async function redeemToCoupon(){
  msg.value=''
  const r = await apiPost('/api/points/redeem', { points: couponPts.value, reason:'REDEEM_TO_COUPON' })
  msg.value = r? 'تم التحويل لقسيمة' : 'فشل التحويل'
}
async function topup(){
  msg.value=''
  const r = await apiPost('/api/wallet/topup', { amount: topupAmt.value })
  if (r && r.ok){ msg.value = 'تمت إضافة الرصيد للمحفظة'; await refreshBalances() }
  else msg.value = 'فشلت العملية'
}
async function refreshBalances(){
  try{ const b = await apiGet<any>('/api/points/balance'); balance.value = Math.round(b?.points||0) }catch{}
  try{ const w = await apiGet<any>('/api/wallet/balance'); walletBalance.value = Number(w?.balance||0) }catch{}
  try{ const j = await apiGet<any>('/api/points/ledger'); if (j && Array.isArray(j.rows)) log.value = j.rows }catch{}
  computeStats()
  computeCheckin()
}
function reasonLabel(x:any){
  const m: Record<string,string> = { ORDER_PLACED:'طلب معلّق', ORDER_PAID:'طلب مدفوع', ORDER_REDEEM:'استبدال عند الشراء', REDEEM_TO_WALLET:'تحويل للمحفظة', REDEEM_TO_COUPON:'تحويل لقسيمة', REFERRAL_PURCHASE:'إحالة (شراء)' }
  return m[String(x||'')] || String(x||'—')
}
function formatDate(d:any){ try{ return new Date(d).toLocaleString('ar') }catch{ return '' } }
async function checkin(){
  msg.value=''
  const r = await apiPost('/api/points/checkin', {})
  if (r && (r as any).ok){ msg.value='تم تسجيل الدخول اليومي'; await refreshBalances() }
  else if (r && (r as any).error==='disabled') msg.value = 'التسجيل اليومي غير مفعّل'
  else if (r && (r as any).error==='already_checked_in') msg.value = 'تم التسجيل اليوم'
  else msg.value = 'لا يمكن التسجيل الآن'
}
async function simulateReview(){
  const id = Math.random().toString(36).slice(2)
  const r = await apiPost('/api/points/event', { type:'review', eventId: id, meta:{ hasPhoto:true } })
  if (r && r.ok){ msg.value='تم احتساب نقاط تقييم تجريبية'; await refreshBalances() }
}
async function simulateShare(){
  const id = Math.random().toString(36).slice(2)
  const r = await apiPost('/api/points/event', { type:'share', eventId: id, meta:{} })
  if (r && r.ok){ msg.value='تم احتساب نقاط مشاركة تجريبية'; await refreshBalances() }
}
</script>

<style scoped>
.app{ min-height:100vh; }
.app{ background:#f5f6f8 }
:root{ --header-height: 72px }
.unified-header {
  height: var(--header-height);
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 60;
  transition: box-shadow 0.3s ease;
}
.unified-header.scrolled { box-shadow: 0 2px 10px rgba(0,0,0,0.1) }
.header-left, .header-right { display:flex; align-items:center; gap:12px }
.header-center { position:absolute; right:50%; transform: translateX(50%); }
.page-title{ font-size: 18px; font-weight: 700 }
.back-btn{ background:transparent; border:0; padding:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:50%; transition: background-color .2s }
.back-btn:hover{ background-color: rgba(0,0,0,0.05) }
.back-btn:focus{ outline: 2px solid var(--accent); outline-offset: 2px }
.pos{color:#16a34a}
.neg{color:#dc2626}
.muted{color:#64748b;margin-top:6px}
</style>

