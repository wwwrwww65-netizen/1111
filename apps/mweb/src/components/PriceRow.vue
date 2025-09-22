<template>
  <div class="price-row">
    <span v-if="original" class="original">{{ original }}</span>
    <span class="price">{{ price }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ price: string; original?: string }>()
</script>

<style scoped>
.price-row{display:flex;gap:6px;align-items:center}
.original{text-decoration:line-through;color:#94a3b8;font-size:12px}
.price{color:#dc2626;font-weight:800}
</style>