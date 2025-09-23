<template>
  <section class="card" dir="rtl" aria-label="إحصاءات النادي">
    <div class="cells">
      <div class="cell" role="button" aria-label="خصم 5 بالمئة"><span class="v"><span class="badgep">%5</span></span><span class="k">خصم</span></div>
      <div class="sep"></div>
      <div class="cell" role="button" aria-label="هذا الشهر 15"><span class="v">{{ user.monthPoints }}</span><span class="k">هذا الشهر</span></div>
      <div class="sep"></div>
      <div class="cell" role="button" aria-label="الشهر الماضي 10"><span class="v">{{ user.lastMonthPoints }}</span><span class="k">الشهر الماضي</span></div>
    </div>
    <div class="offer" role="button" aria-label="عرض 22.99 مقابل 33.99">
      <span class="tx">عرض: <strong>22.99</strong> (93 نقطة) بدل <s>33.99</s></span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useUser } from '@/store/user'
const user = useUser()
</script>

<style scoped>
.card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,.06)}
.cells{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center}
.cell{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 0}
.v{font-size:16px;color:#222;font-weight:600}
.k{font-size:12px;color:#666}
.sep{width:1px;height:26px;background:#EDEDED}
.offer{margin-top:8px;background:#f5f7ff;border:1px dashed #d5defa;border-radius:10px;padding:8px 10px;color:#222}
.tx strong{font-weight:700}
.tx s{color:#999}
.badgep{display:inline-block;background:#111;color:#fff;border-radius:6px;padding:2px 6px;font-size:12px;line-height:1}
</style>

