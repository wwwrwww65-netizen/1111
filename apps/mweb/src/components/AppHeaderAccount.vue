<template>
  <header class="app-header" :class="{ solid: scrolled }" role="banner" aria-label="App header">
    <div class="inner" dir="rtl">
      <div class="right">
        <a class="icon" href="/settings" aria-label="الإعدادات"><Icon name="settings" /></a>
        <a class="icon" href="/qr" aria-label="رمز QR"><Icon name="qr" /></a>
      </div>
      <div class="center">
        <div class="username" aria-label="اسم المستخدم">{{ username }}</div>
        <a class="profile-link" href="/profile" role="link" aria-label="ملفي الشخصي">ملفي الشخصي</a>
      </div>
      <div class="left">
        <a class="icon" href="/notifications" aria-label="الإشعارات"><Icon name="bell" /></a>
        <a class="icon" href="/messages" aria-label="الرسائل"><Icon name="chat" /></a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Icon from '@/components/Icon.vue'
const props = defineProps<{ username?: string }>()
const username = props.username || 'اسم المستخدم'
const scrolled = ref(false)
function onScroll(){ scrolled.value = window.scrollY > 60 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive:true }) })
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.app-header{position:fixed;inset:0 0 auto 0;height:64px;z-index:1000;background:transparent;transition:background .2s,height .2s}
.solid{background:var(--surface,#fff);height:52px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.inner{height:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;padding-inline:12px}
.right,.left{display:flex;gap:8px;align-items:center}
.icon{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:transparent;border:0;color:inherit}
.icon:focus-visible{outline:2px solid var(--primary,#0B5FFF)}
.center{text-align:center;line-height:1}
.username{font-weight:800;font-size:16px}
.profile-link{display:inline-block;margin-top:2px;font-size:12px;color:var(--subtle,#666);text-decoration:none}
</style>

