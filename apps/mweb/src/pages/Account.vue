<template>
  <main class="account" dir="rtl">
    <div class="container page">
      <ProfileHeroCard />
      <ClubStatsStrip style="margin-top:12px" />
      <ActivitySummaryRow style="margin-top:12px" />
      <OrderStatusRow style="margin-top:12px" />
      <ServicesGrid style="margin-top:12px" />
      <PromoProductCard style="margin:12px 0 72px" />
    </div>
    <BottomNav active="account" />
  </main>
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import ServicesGrid from '@/components/ServicesGrid.vue'
import ProfileHeroCard from '@/components/account/ProfileHeroCard.vue'
import ClubStatsStrip from '@/components/account/ClubStatsStrip.vue'
import ActivitySummaryRow from '@/components/account/ActivitySummaryRow.vue'
import OrderStatusRow from '@/components/account/OrderStatusRow.vue'
import PromoProductCard from '@/components/account/PromoProductCard.vue'
</script>

<style scoped>
.account{background:#F7F7F9;min-height:100dvh}
.page{padding-top:12px;padding-bottom:84px}
</style>

