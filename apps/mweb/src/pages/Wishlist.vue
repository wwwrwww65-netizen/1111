<template>
  <div>
    <HeaderBar />
    <div class="container">
      <h1 class="title">المفضلة</h1>
      <div v-if="!items.length" class="card">لا توجد عناصر في المفضلة</div>
      <div v-else class="grid">
        <ProductCard v-for="p in items" :key="p.id" :img="p.img" :title="p.title" :price="p.price + ' ر.س'" />
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import ProductCard from '@/components/ProductCard.vue'
import { storeToRefs } from 'pinia'
import { useWishlist } from '@/store/wishlist'
const wl = useWishlist()
const { items } = storeToRefs(wl)
</script>

<style scoped>
.title{margin:12px 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
</style>

