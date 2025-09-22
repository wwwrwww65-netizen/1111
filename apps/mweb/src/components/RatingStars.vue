<template>
  <div class="rating" :aria-label="`تقييم ${value} من 5`">
    <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= Math.round(value) }">★</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ value?: number }>(), { value: 4 })
</script>

<style scoped>
.rating{display:flex;gap:2px}
.star{font-size:12px;color:#d1d5db}
.star.on{color:#fbbf24}
</style>