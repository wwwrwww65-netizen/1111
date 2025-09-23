<template>
  <main dir="rtl">
    <AppHeaderAccount :username="username" />
    <div class="container page">
      <UserInfoCard :username="username" />
      <MembershipCards style="margin-top:12px" />
      <WalletBar style="margin-top:12px" />
      <OrdersStatusBar style="margin-top:12px" />
      <QuickLinksBar style="margin-top:12px" />
      <ServicesGrid style="margin-top:12px" />
      <RecommendedProducts style="margin:12px 0" />
    </div>
    <BottomNav />
  </main>
</template>

<script setup lang="ts">
import AppHeaderAccount from '@/components/AppHeaderAccount.vue'
import BottomNav from '@/components/BottomNav.vue'
import UserInfoCard from '@/components/UserInfoCard.vue'
import MembershipCards from '@/components/MembershipCards.vue'
import WalletBar from '@/components/WalletBar.vue'
import OrdersStatusBar from '@/components/OrdersStatusBar.vue'
import QuickLinksBar from '@/components/QuickLinksBar.vue'
import ServicesGrid from '@/components/ServicesGrid.vue'
import RecommendedProducts from '@/components/RecommendedProducts.vue'
const username = 'محمد أحمد'
</script>

<style scoped>
.page{padding-top:68px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.link{display:block;border:1px solid var(--muted-2);border-radius:12px;padding:12px;text-decoration:none;color:inherit;text-align:center}
</style>

