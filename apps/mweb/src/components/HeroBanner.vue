<template>
  <section class="hero-wrap">
    <div class="hero-panel">
      <h1 style="margin:0 0 8px 0">مرحبا بك في jeeey</h1>
      <p class="text-muted" style="margin:0 0 12px 0">تسوق أحدث المنتجات والعروض اليومية</p>
      <button class="btn">تسوق الآن</button>
    </div>
    <img class="img" :src="img" alt="Hero" />
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ img?: string }>();
const img = props.img || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop';
</script>