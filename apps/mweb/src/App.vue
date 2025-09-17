<template>
  <router-view />
  <div id="gsap-root" style="position:fixed;inset:0;pointer-events:none"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import gsap from 'gsap';
import { homePath } from './routes.generated';
onMounted(()=>{
  gsap.to('#gsap-root', { opacity: 1, duration: 0.6 });
  const r = useRouter();
  if (homePath && homePath !== '/' && r.currentRoute.value.path === '/') {
    r.replace(homePath);
  }
});
</script>

