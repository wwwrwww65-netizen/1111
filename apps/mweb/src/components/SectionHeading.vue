<template>
  <div class="sh">
    <h2>{{ title }}</h2>
    <a v-if="href" class="more" :href="href">المزيد</a>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; href?: string }>();
</script>

<style scoped>
.sh{display:flex;align-items:center;justify-content:space-between;margin:8px 0}
.sh h2{margin:0;font-size:16px}
.more{font-size:13px;color:var(--primary);text-decoration:none}
</style>

