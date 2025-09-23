<template>
  <section class="card" dir="rtl" aria-label="بطاقة الحساب">
    <div class="top-actions">
      <button class="icon" aria-label="الإعدادات"><Icon name="settings" /></button>
      <button class="icon" aria-label="الرسائل"><Icon name="inbox" /></button>
    </div>
    <div class="row">
      <div class="name">
        <span class="username">{{ user.username }}</span>
        <span class="badge" :aria-label="`مستوى الحساب ${user.clubLevel}`">{{ user.clubLevel }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { useUser } from '@/store/user'
const user = useUser()
</script>

<style scoped>
.card{position:relative;background:#fff;border-radius:12px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,.06)}
.top-actions{position:absolute;top:8px;inset-inline-end:8px;display:flex;gap:6px}
.icon{width:44px;height:44px;display:grid;place-items:center;background:#fff;border:1px solid #eee;border-radius:10px}
.row{display:flex;align-items:center;justify-content:space-between}
.name{display:flex;align-items:center;gap:8px}
.username{font-size:20px;color:#222;font-weight:600}
.badge{background:#111;color:#fff;border-radius:8px;padding:2px 8px;font-size:12px}
</style>

