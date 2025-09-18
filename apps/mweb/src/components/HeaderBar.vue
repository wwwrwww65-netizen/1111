<template>
  <header class="header">
    <div class="header-inner">
      <div class="brand">jeeey</div>
      <div style="flex:1;display:flex;gap:8px;justify-content:flex-end">
        <div class="search-wrap">
          <Icon name="search" />
          <input placeholder="ابحث عن المنتجات" class="search" />
        </div>
        <a class="icon-btn" href="/cart" aria-label="Cart"><Icon name="cart" /></a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
</script>

<style scoped>
.search-wrap{display:flex;align-items:center;gap:6px;height:36px;border:1px solid var(--muted-2);border-radius:999px;padding:0 10px;min-width:180px}
.search{border:0;outline:none;flex:1;background:transparent}
.icon-btn{display:grid;place-items:center;width:36px;height:36px;border:1px solid var(--muted-2);border-radius:999px;text-decoration:none;color:inherit}
</style>