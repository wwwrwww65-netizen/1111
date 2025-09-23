<template>
  <nav class="bottom-nav">
    <a href="/" :aria-current="active==='home' ? 'page' : undefined"><Icon name="home" /><span>الرئيسية</span></a>
    <a href="/categories" :aria-current="active==='categories' ? 'page' : undefined"><Icon name="grid" /><span>التصنيفات</span></a>
    <a href="/new" :aria-current="active==='new' ? 'page' : undefined"><Icon name="sparkles" /><span>جديد</span></a>
    <a href="/cart" id="cart-target" class="cart-link" :aria-current="active==='cart' ? 'page' : undefined">
      <Icon name="cart" />
      <span class="badge" v-if="count>0">{{ count }}</span>
      <span>حقيبة التسوق</span>
    </a>
    <a href="/account" :aria-current="active==='account' ? 'page' : undefined"><Icon name="user" /><span>الحساب</span></a>
  </nav>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { useCart } from '@/store/cart'
import { storeToRefs } from 'pinia'
defineProps<{ active?: 'home'|'categories'|'new'|'cart'|'account' }>()
const cart = useCart()
const { count } = storeToRefs(cart)
</script>

<style scoped>
.bottom-nav{position:fixed;bottom:0;inset-inline:0;display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:1px solid var(--muted-2);padding:6px 4px;z-index:70;box-shadow:0 -4px 12px rgba(0,0,0,.06)}
.bottom-nav a{display:grid;place-items:center;text-decoration:none;color:inherit;font-size:11px;gap:2px;padding:4px 2px}
.bottom-nav a[aria-current="page"]{color:#0b5fff}
.cart-link{position:relative}
.badge{position:absolute;top:0;inset-inline-end:14px;background:#ef4444;color:#fff;border-radius:999px;min-width:18px;height:18px;display:grid;place-items:center;font-size:11px;padding:0 5px;line-height:18px}
</style>