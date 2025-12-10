<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive include="CategoryPage,ProductsPage,SearchResultPage,ProductPage,TabsPage,CategoriesIndex">
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
import { useHead } from '@unhead/vue';
import gsap from 'gsap';
import ConsentBanner from '@/components/ConsentBanner.vue'
import PromoHost from '@/components/PromoHost.vue'
import { apiGet } from '@/lib/api';

useHead({
  link: [
    { rel: 'icon', href: '/favicon.ico', key: 'favicon' }
  ]
})

onMounted(async ()=>{
  gsap.to('#gsap-root', { opacity: 1, duration: 0.6 });

  // Fetch global site settings (favicon)
  try {
    const seo = await apiGet<any>('/api/seo/meta?slug=/');
    if (seo && seo.siteLogo) {
      useHead({
        link: [
          { rel: 'icon', href: seo.siteLogo, key: 'favicon' }
        ]
      });
    }
  } catch {}
});
</script>

