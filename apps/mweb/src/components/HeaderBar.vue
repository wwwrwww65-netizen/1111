<template>
  <header class="app-header" :class="{ scrolled }" role="banner" aria-label="App header">
    <div class="header-inner" dir="rtl">
      <div class="side right">
        <button class="icon-btn" aria-label="القائمة" tabindex="0"><Icon name="menu" /></button>
        <a class="icon-btn" href="/notifications" aria-label="الإشعارات" tabindex="0"><Icon name="bell" /></a>
      </div>
      <div class="brand" aria-label="jeeey">jeeey</div>
      <div class="side left">
        <a class="icon-btn" href="/cart" aria-label="سلة التسوق" tabindex="0"><Icon name="cart" /></a>
        <a class="icon-btn" href="/wishlist" aria-label="المفضلة" tabindex="0"><Icon name="heart" /></a>
        <a class="icon-btn" href="/search" aria-label="بحث" tabindex="0"><Icon name="search" /></a>
      </div>
    </div>
  </header>
  
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Icon from '@/components/Icon.vue'

const scrolled = ref(false);
function onScroll(){ scrolled.value = window.scrollY > 60; }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); });
onBeforeUnmount(()=>{ window.removeEventListener('scroll', onScroll); });
</script>

<style scoped>
.app-header{position:fixed;top:0;left:0;right:0;height:64px;z-index:1000;background:transparent;transition:background .2s,height .2s,transform .15s}
.app-header.scrolled{background:var(--surface,#fff);height:48px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:100%;padding:0 12px}
.brand{font-weight:800;font-size:18px;letter-spacing:.5px}
.side{display:flex;gap:8px;align-items:center}
.icon-btn{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:transparent;color:inherit;border:0}
.icon-btn:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:2px;border-radius:12px}
</style>