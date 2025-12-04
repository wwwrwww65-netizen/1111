<template>
  <div class="bottom-nav-container">
    <nav class="nav-content">
      <!-- Home (Right in RTL) -->
      <RouterLink to="/" class="nav-item home-item" :class="{ active: active === 'home' }">
        <svg class="icon home-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10 L12 3 L21 10 V21 H15 V14 H9 V21 H3 Z" />
        </svg>
        <span class="label">الرئيسية</span>
      </RouterLink>

      <!-- Categories -->
      <RouterLink to="/categories" class="nav-item categories-item" :class="{ active: active === 'categories' }">
        <svg class="icon categories-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6H21" />
          <path d="M3 11H10" />
          <path d="M3 16H10" />
          <path d="M3 21H10" />
          <circle cx="16.5" cy="16.5" r="4.5" />
          <path d="M19.5 19.5L22 22" />
        </svg>
        <span class="label">الفئات</span>
      </RouterLink>

      <!-- Trends (Center Floating) -->
      <div class="nav-item center-placeholder">
        <RouterLink to="/products" class="fab-wrapper">
          <div class="fab-circle">
            <span class="fab-text-lg">جديدنا</span>
            <div class="fab-badge"></div>
          </div>
        </RouterLink>
      </div>

      <!-- Cart -->
      <RouterLink to="/cart" class="nav-item" :class="{ active: active === 'cart' }">
        <div class="relative">
          <ShoppingCart class="icon" stroke-width="1.5" />
          <span class="badge" v-if="count > 0">{{ count }}</span>
        </div>
        <span class="label">حقيبة التسوق</span>
      </RouterLink>

      <!-- Account -->
      <RouterLink to="/account" class="nav-item account-item" :class="{ active: active === 'account' }">
        <User class="icon account-icon" stroke-width="1.5" />
        <span class="label">أنا</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useCart } from '@/store/cart'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { ShoppingCart, User } from 'lucide-vue-next'

defineProps<{ active?: 'home'|'categories'|'new'|'cart'|'account' }>()
const cart = useCart()
const { count } = storeToRefs(cart)
</script>

<style scoped>
.bottom-nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.03);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-decoration: none;
  color: #222;
}

.icon {
  width: 22px;
  height: 22px;
  margin-bottom: 2px;
  color: #8a1538 !important;
  fill: none;
}

.home-icon {
  fill: none;
}

.home-item.active .home-icon {
  fill: #8a1538 !important;
  stroke: #8a1538 !important;
}

.label {
  font-size: 9px;
  font-weight: 400;
  line-height: 1;
  color: #520f23 !important;
}

.nav-item.active .icon {
  stroke-width: 2;
  fill: #8a1538 !important;
}

.nav-item.active .label {
  font-weight: 700;
}

/* Categories Icon Specific Styles */
.categories-item.active .categories-icon {
  fill: none !important;
  stroke-width: 2.5 !important; /* Thicker stroke */
  transform: scale(1.1); /* Slightly bigger */
  transition: transform 0.2s ease;
}

/* Center Button */
.center-placeholder {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fab-wrapper {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 58px;
  height: 58px;
  border-radius: 50%;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.fab-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc 0%, #7c3aed 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.fab-text-sm {
  font-size: 9px;
  line-height: 1;
  margin-bottom: 1px;
}

.fab-text-lg {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.fab-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ef4444;
  color: #fff;
  border-radius: 99px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  padding: 0 3px;
  border: 1px solid #fff;
  font-weight: bold;
}

.relative {
  position: relative;
}
</style>