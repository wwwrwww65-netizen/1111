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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import gsap from 'gsap';
import ConsentBanner from '@/components/ConsentBanner.vue'
import PromoHost from '@/components/PromoHost.vue'
import { apiGet, API_BASE } from '@/lib/api';

const faviconLink = ref({ rel: 'icon', href: '/favicon.ico', key: 'favicon' })
// useHead must be active in setup(). The object inside is reactive.
useHead({
  link: [faviconLink]
})

onMounted(async ()=>{
  gsap.to('#gsap-root', { opacity: 1, duration: 0.6 });

  // Fetch global site settings (favicon)
  try {
    const seo = await apiGet<any>('/api/seo/meta?slug=/');
    if (seo && seo.siteLogo) {
      // Process circular favicon
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      // Use proxy for guaranteed CORS headers and caching
      img.src = `${API_BASE}/api/media/proxy?url=${encodeURIComponent(seo.siteLogo)}`;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const size = 64; 
          canvas.width = size; canvas.height = size;
          ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, 2*Math.PI); ctx.closePath(); ctx.clip();
          ctx.drawImage(img, 0, 0, size, size);
          // Safe reactive update
          faviconLink.value = { rel: 'icon', href: canvas.toDataURL('image/png'), key: 'favicon' };
        } catch {}
      };
      // Fallback
      img.onerror = () => {
         faviconLink.value = { rel: 'icon', href: seo.siteLogo, key: 'favicon' };
      }
    }
  } catch {}
});
</script>

