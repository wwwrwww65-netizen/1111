<template>
  <div>
    <HeaderBar />
    <div class="container">
      <h1 class="title">حسابي</h1>
      <div class="card grid-2">
        <a href="/orders" class="link">طلباتي</a>
        <a href="/addresses" class="link">العناوين</a>
        <a href="/payments" class="link">طرق الدفع</a>
        <a href="/wishlist" class="link">المفضلة</a>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
</script>

<style scoped>
.title{margin:12px 0}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.link{display:block;border:1px solid var(--muted-2);border-radius:12px;padding:12px;text-decoration:none;color:inherit;text-align:center}
</style>

