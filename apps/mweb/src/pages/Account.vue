<template>
  <div v-if="!hydrated" class="account-loading" dir="rtl" lang="ar">
    <section class="box" style="margin-top:24px">جاري التحميل…</section>
  </div>
  <main class="account" dir="rtl" lang="ar" v-else-if="user.isLoggedIn">
    <ProfileHeroCard />
    <ClubStatsStrip />
    <ActivitySummaryRow />
    <OrderStatusRow />
    <section class="box"><ServicesGrid /></section>
    <section class="box"><PromoProductCard /></section>
    <BottomNav active="account" />
    <div style="height:72px"></div>
  </main>
  <GuestAccount v-else />
  
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import GuestAccount from '@/components/account/GuestAccount.vue'
import ProfileHeroCard from '@/components/account/ProfileHeroCard.vue'
import ClubStatsStrip from '@/components/account/ClubStatsStrip.vue'
import ActivitySummaryRow from '@/components/account/ActivitySummaryRow.vue'
import OrderStatusRow from '@/components/account/OrderStatusRow.vue'
import ServicesGrid from '@/components/ServicesGrid.vue'
import PromoProductCard from '@/components/account/PromoProductCard.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/store/user'
import { apiGet } from '@/lib/api'
const props = defineProps<{ userName?: string }>()
const user = useUser()
const username = computed(()=> props.userName || user.username || 'jeeey')
const router = useRouter()
function go(path:string){ router.push(path) }

onMounted(async ()=>{
  // Helpers
  const getApexDomain = (): string | null => {
    try{
      const host = location.hostname // e.g., m.jeeey.com
      if (host === 'localhost' || /^(\d+\.){3}\d+$/.test(host)) return null
      const parts = host.split('.')
      if (parts.length < 2) return null
      const apex = parts.slice(-2).join('.')
      return apex
    }catch{ return null }
  }
  const writeCookie = (name: string, value: string): void => {
    try{
      const apex = getApexDomain()
      const isHttps = typeof location !== 'undefined' && location.protocol === 'https:'
      const sameSite = isHttps ? 'None' : 'Lax'
      const secure = isHttps ? ';Secure' : ''
      const domainPart = apex ? `;domain=.${apex}` : ''
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60*60*24*30}${domainPart};SameSite=${sameSite}${secure}`
    }catch{}
  }
  const meWithRetry = async (retries = 2): Promise<any|null> => {
    for (let i=0;i<=retries;i++){
      try{
        const me = await apiGet<any>('/api/me?ts=' + Date.now())
        if (me && me.user) return me
      }catch{}
      await new Promise(res=> setTimeout(res, 250))
    }
    return null
  }

  try{
    // Capture token from URL (OAuth callback) and persist cookies before requesting /api/me
    const sp = new URLSearchParams(typeof window!=='undefined' ? location.search : '')
    const t = sp.get('t') || ''
    if (t) {
      writeCookie('auth_token', t)
      writeCookie('shop_auth_token', t)
      try{ localStorage.setItem('shop_token', t) }catch{}
      try{ const u = new URL(location.href); u.searchParams.delete('t'); history.replaceState(null,'',u.toString()) }catch{}
    }

    const me = await meWithRetry(2)
    if (me && me.user) {
      user.isLoggedIn = true
      if (me.user.name || me.user.email || me.user.phone) {
        user.username = String(me.user.name || me.user.email || me.user.phone)
      }
      // If profile incomplete (no or weak name), guide to complete-profile
      const name = String(me.user.name||'').trim()
      const incomplete = !name || name.length < 2 || /^\d+$/.test(name)
      if (incomplete){
        const ret = (typeof window!=='undefined') ? (location.pathname + location.search) : '/account'
        router.push({ path: '/complete-profile', query: { return: ret } })
        hydrated.value = true
        return
      }
      hydrated.value = true
      return
    }
  }catch{}

  // If no user after retries: clear cookies and show guest account (no redirect)
  try{
    const clear = (name:string)=>{ document.cookie = `${name}=; Max-Age=0; path=/; domain=.jeeey.com; SameSite=None; Secure`; document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`; }
    clear('shop_auth_token'); clear('auth_token')
  }catch{}
  user.isLoggedIn = false
  hydrated.value = true
  // Stay on guest account page; user can choose to login from the page CTA
})

const hydrated = ref(false)
</script>

<style scoped>
.account{background:#f5f6f8;min-height:100dvh}
.box{margin:0 12px}
.account-loading{background:#f5f6f8;min-height:100dvh;display:flex;align-items:flex-start;justify-content:stretch}
</style>

