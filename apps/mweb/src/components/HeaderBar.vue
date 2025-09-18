<template>
  <header class="header">
    <div class="header-inner">
      <div class="brand">jeeey</div>
      <div style="flex:1;display:flex;gap:8px;justify-content:flex-end">
        <input placeholder="ابحث عن المنتجات" class="search" />
        <a class="icon-btn" href="/cart" aria-label="Cart">🧺</a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
</script>

<style scoped>
.search{height:36px;border:1px solid var(--muted-2);border-radius:999px;padding:0 12px;min-width:160px}
.icon-btn{display:grid;place-items:center;width:36px;height:36px;border:1px solid var(--muted-2);border-radius:999px;text-decoration:none;color:inherit}
</style>