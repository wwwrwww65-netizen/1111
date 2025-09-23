<template>
  <header class="hdr" role="banner" aria-label="شريط العنوان والبحث" dir="rtl">
    <div class="inner">
      <button class="icon" aria-label="المفضلة"><Icon name="heart" /></button>
      <div class="pill" role="search">
        <button class="icon dark" aria-label="بحث"><Icon name="search" /></button>
        <input class="input" type="search" :placeholder="placeholder" aria-label="بحث" />
        <button class="icon cam" aria-label="كاميرا"><Icon name="camera" /></button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
const props = defineProps<{ placeholder?: string }>()
const placeholder = props.placeholder || 'ابحث عن منتج أو فئة'
</script>

<style scoped>
.hdr{position:sticky;top:0;z-index:1001;background:transparent;backdrop-filter:saturate(180%) blur(4px)}
.inner{height:56px;display:flex;align-items:center;gap:12px;padding:0 16px}
.pill{flex:1;display:flex;align-items:center;gap:10px;height:56px;border-radius:28px;border:1px solid #EAEAEA;padding:0 8px;background:#fff}
.icon{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:transparent;border:0}
.icon.dark{background:#111;color:#fff;border-radius:999px}
.icon.cam{width:36px;height:36px;border-radius:999px}
.input{flex:1;border:0;outline:0;font-size:16px;color:#222}
.input::placeholder{color:#777}
</style>

