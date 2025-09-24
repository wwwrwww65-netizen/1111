<template>
  <section class="card" dir="rtl" aria-label="ملخص الحساب">
    <div class="row">
      <button class="itm" aria-label="الطلبات: {{ user.orders }}"><Icon name="package" /><div class="tx"><div class="v">{{ user.orders }}</div><div class="k">الطلبات</div></div></button>
      <div class="sep"></div>
      <button class="itm" aria-label="المراجعات: {{ user.reviews }}"><Icon name="chat" /><div class="tx"><div class="v">{{ user.reviews }}</div><div class="k">المراجعات</div></div></button>
      <div class="sep"></div>
      <button class="itm" aria-label="النقاط: {{ user.points }}"><Icon name="star" /><div class="tx"><div class="v">{{ user.points }}</div><div class="k">النقاط</div></div></button>
      <div class="sep"></div>
      <button class="itm" aria-label="الكوبونات: {{ user.coupons }}"><Icon name="ticket" /><div class="tx"><div class="v">{{ user.coupons }}</div><div class="k">الكوبونات</div></div></button>
    </div>
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { useUser } from '@/store/user'
const user = useUser()
</script>

<style scoped>
.card{background:#fff;border-radius:12px;padding:12px;box-shadow:0 4px 12px rgba(0,0,0,.06)}
.row{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;align-items:center}
.sep{width:1px;height:36px;background:#EDEDED}
.itm{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:8px 0}
.tx{display:flex;flex-direction:column;align-items:center}
.v{font-size:18px;color:#222;font-weight:600}
.k{font-size:12px;color:#666}
.itm:focus-visible{outline:2px solid #0b5fff;border-radius:10px}
</style>

