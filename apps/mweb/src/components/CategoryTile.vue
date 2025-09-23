<template>
  <button class="tile" :aria-label="`فتح فئة: ${title}`" role="link">
    <img :src="img" :alt="title" loading="lazy" />
    <div class="label">{{ title }}</div>
  </button>
</template>

<script setup lang="ts">
defineProps<{ img: string; title: string }>()
</script>

<style scoped>
.tile{display:flex;flex-direction:column;align-items:center;gap:8px;background:transparent;border:0}
img{width:96px;height:96px;border-radius:999px;object-fit:cover;border:1px solid var(--muted-2,#eee)}
.label{font-size:12px}
</style>

