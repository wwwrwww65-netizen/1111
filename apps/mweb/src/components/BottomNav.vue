<template>
  <nav class="bottom-nav">
    <a href="/" aria-current="page">
      <Icon name="home" />
      <span>الرئيسية</span>
    </a>
    <a href="/products">
      <Icon name="bag" />
      <span>تسوّق</span>
    </a>
    <a href="/cart">
      <Icon name="cart" />
      <span>السلة</span>
    </a>
    <a href="/login">
      <Icon name="user" />
      <span>حسابي</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
</script>