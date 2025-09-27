<template>
  <main class="account" dir="rtl" lang="ar" v-if="user.isLoggedIn">
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
import { computed, onMounted } from 'vue'
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
    const me = await apiGet<any>('/api/me')
    if (me && me.user) {
      user.isLoggedIn = true
      if (me.user.name) user.username = String(me.user.name)
      return
    }
  }catch{}
  user.isLoggedIn = false
})
</script>

<style scoped>
.account{background:#f5f6f8;min-height:100dvh}
.box{margin:0 12px}
</style>

