<template>
  <div class="grid" :style="{'--cols': cols}">
    <div v-for="i in count" :key="i" class="card">
      <div class="img shimmer"></div>
      <div class="l1 shimmer"></div>
      <div class="l2 shimmer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count?: number; cols?: number }>()
</script>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(var(--cols,2),1fr);gap:12px}
.card{background:#fff;border:1px solid #eee;border-radius:12px;padding:10px}
.img{height:150px;border-radius:8px;background:#f3f3f3;margin-bottom:8px}
.l1,.l2{height:12px;border-radius:6px;background:#f3f3f3;margin:6px 0}
.l2{width:60%}
.shimmer{position:relative;overflow:hidden}
.shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);transform:translateX(-100%);animation:sh 1.2s infinite}
@keyframes sh{to{transform:translateX(100%)}}
</style>

