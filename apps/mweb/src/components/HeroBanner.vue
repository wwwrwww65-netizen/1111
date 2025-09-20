<template>
  <section class="hero-wrap">
    <div class="hero-panel">
      <h1 class="title">منطقة العلامات التجارية – أفضل العلامات المختارة</h1>
      <p class="sub">اكتشف Skechers وAdidas وXiaomi والمزيد</p>
      <button class="btn cta">تسوق الآن</button>
    </div>
    <div class="hero-products">
      <img class="img" :src="img" alt="Hero" />
      <img class="img" src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop" alt="Shoe" />
      <img class="img" src="https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop" alt="Bag" />
      <img class="img" src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop" alt="Watch" />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ img?: string }>();
const img = props.img || 'https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1080&auto=format&fit=crop';
</script>