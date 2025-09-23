<template>
  <section class="card" dir="rtl" aria-label="حالات الطلبات">
    <div class="row">
      <button class="st" aria-label="قيد التجهيز"><Icon name="box" /><span>قيد التجهيز</span></button>
      <button class="st" aria-label="تم الشحن"><Icon name="truck" /><span>تم الشحن</span></button>
      <button class="st" aria-label="في التوصيل"><Icon name="pin" /><span>في التوصيل</span><em v-if="user.orders>0" class="badge">{{ user.orders }}</em></button>
      <button class="st" aria-label="مُسترجع"><Icon name="undo" /><span>مسترجع</span></button>
    </div>
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { useUser } from '@/store/user'
const user = useUser()
</script>

<style scoped>
.card{background:#fff;border-radius:12px;padding:10px;box-shadow:0 4px 12px rgba(0,0,0,.06)}
.row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.st{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px;border:1px solid #eee;border-radius:12px;background:#fff}
.st span{font-size:12px;color:#333}
.badge{position:absolute;top:6px;inset-inline-end:8px;background:#111;color:#fff;border-radius:999px;min-width:18px;height:18px;display:grid;place-items:center;font-size:11px;padding:0 6px}
.st:active{transform:scale(.98)}
.st:focus-visible{outline:2px solid #0b5fff}
</style>

