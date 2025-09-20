<template>
  <header class="header">
    <div class="header-inner">
      <a class="icon-btn" href="#" aria-label="Menu"><Icon name="menu" /></a>
      <div class="brand">jeeey</div>
      <div style="display:flex;gap:8px">
        <a class="icon-btn" href="/search" aria-label="Search"><Icon name="search" /></a>
        <a class="icon-btn" href="/wishlist" aria-label="Wishlist"><Icon name="heart" /></a>
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