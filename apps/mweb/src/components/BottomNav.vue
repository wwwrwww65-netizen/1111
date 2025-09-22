<template>
  <nav class="bottom-nav">
    <a href="/" aria-current="page"><Icon name="home" /><span>الرئيسية</span></a>
    <a href="/categories"><Icon name="grid" /><span>التصنيفات</span></a>
    <a href="/new"><Icon name="sparkles" /><span>جديد</span></a>
    <a href="/cart" id="cart-target" class="cart-link">
      <Icon name="cart" />
      <span class="badge" v-if="count>0">{{ count }}</span>
      <span>حقيبة التسوق</span>
    </a>
    <a href="/account"><Icon name="user" /><span>الحساب</span></a>
  </nav>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { useCart } from '@/store/cart'
const cart = useCart()
const count = cart.count
</script>

<style scoped>
.bottom-nav{position:fixed;bottom:0;inset-inline:0;display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:1px solid var(--muted-2);padding:6px 4px;z-index:70}
.bottom-nav a{display:grid;place-items:center;text-decoration:none;color:inherit;font-size:11px;gap:2px;padding:4px 2px}
.bottom-nav a[aria-current="page"]{color:#0b5fff}
.cart-link{position:relative}
.badge{position:absolute;top:0;inset-inline-end:14px;background:#ef4444;color:#fff;border-radius:999px;min-width:18px;height:18px;display:grid;place-items:center;font-size:11px;padding:0 5px;line-height:18px}
</style>