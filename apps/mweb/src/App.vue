<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive include="CategoryPage,ProductsPage">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
  <div id="gsap-root" style="position:fixed;inset:0;pointer-events:none"></div>
  <ConsentBanner />
  <PromoHost />
  
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import gsap from 'gsap';
import ConsentBanner from '@/components/ConsentBanner.vue'
import PromoHost from '@/components/PromoHost.vue'
onMounted(()=>{
  gsap.to('#gsap-root', { opacity: 1, duration: 0.6 });
});
</script>

