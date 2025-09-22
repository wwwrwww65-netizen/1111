<template>
  <section class="hero" aria-label="العرض الرئيسي">
    <picture>
      <source :srcset="`${img}&fm=webp`" type="image/webp" />
      <img class="hero-img" :src="img" alt="عروض رئيسية" loading="eager" />
    </picture>
    <div class="overlay" aria-hidden="true"></div>
    <div class="panel">
      <h1 class="title">منطقة العلامات التجارية – أفضل العلامات المختارة</h1>
      <p class="sub">خصومات حتى 70% على مختارات الموسم</p>
      <a href="/shop" class="btn cta" aria-label="تسوّق الآن">تسوّق الآن</a>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ img?: string }>();
const img = props.img || 'https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1200&auto=format&fit=crop';
</script>

<style scoped>
.hero{position:relative;min-height:46vh;border-radius:0;overflow:hidden}
.hero-img{width:100%;height:100%;object-fit:cover;display:block}
.overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.18) 40%,rgba(0,0,0,0))}
.panel{position:absolute;inset-inline:12px;bottom:16px;color:#fff}
.title{margin:0 0 6px 0;font-size:20px;font-weight:800}
.sub{margin:0 0 10px 0;color:#e5e7eb}
.cta{background:#0B5FFF;color:#fff;border-radius:12px;padding:10px 14px;text-decoration:none;display:inline-block}
.cta:focus-visible{outline:2px solid #fff;outline-offset:2px}
</style>