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
  try{
    // Try to load session from API; this requires the auth_token cookie sent with credentials
    const sp = new URLSearchParams(typeof window!=='undefined'?location.search:'')
    const t = sp.get('t')||''
    // If token present in URL (from OAuth callback), persist it via a same-site cookie and strip from URL
    if (t) {
      try{ document.cookie = `auth_token=${encodeURIComponent(t)};path=/;domain=.jeeey.com;max-age=${60*60*24*30};SameSite=None;Secure` }catch{}
      try{ const u = new URL(location.href); u.searchParams.delete('t'); history.replaceState(null,'',u.toString()) }catch{}
    }
    const me = await apiGet<any>('/api/me?ts='+Date.now())
    if (me && me.user) {
      user.isLoggedIn = true
      if (me.user.name || me.user.email || me.user.phone) {
        user.username = String(me.user.name || me.user.email || me.user.phone)
      }
      // If profile incomplete (no name), guide to complete-profile
      const name = String(me.user.name||'').trim()
      if (!name){
        const ret = (typeof window!=='undefined') ? (location.pathname + location.search) : '/account'
        router.push({ path: '/complete-profile', query: { return: ret } })
        hydrated.value = true
        return
      }
      hydrated.value = true
      return
    }
  }catch{}
  user.isLoggedIn = false
  hydrated.value = true
})

const hydrated = ref(false)
</script>

<style scoped>
.account{background:#f5f6f8;min-height:100dvh}
.box{margin:0 12px}
.account-loading{background:#f5f6f8;min-height:100dvh;display:flex;align-items:flex-start;justify-content:stretch}
</style>

