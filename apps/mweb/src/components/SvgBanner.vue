<template>
  <section class="svg-banner">
    <img :src="src" alt="Hero Banner" />
  </section>
</template>

<script setup lang="ts">
defineProps<{ src: string }>()
</script>

<style scoped>
.svg-banner img{display:block;width:100%;height:auto;border-radius:12px;border:1px solid var(--muted-2)}
</style>

