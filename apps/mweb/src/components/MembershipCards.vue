<template>
  <section class="grid" dir="rtl">
    <article class="card saver">
      <div class="title">خصم 25%</div>
      <button class="join" aria-label="انضم الآن">انضم الآن</button>
    </article>
    <article class="card club">
      <div class="row price"><span class="old">99 ر.س</span><span class="new">69 ر.س</span></div>
      <ul class="perks" aria-label="المميزات">
        <li>خصومات حصرية</li>
        <li>نقاط مكافآت</li>
        <li>كوبونات شهرية</li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.card{min-height:130px;border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between}
.saver{background:linear-gradient(135deg,#ffe0f0,#fff)}
.club{background:#f7fafc}
.title{font-size:18px;font-weight:800}
.join{height:38px;background:#ff2d55;color:#fff;border:0;border-radius:8px}
.price{display:flex;gap:8px;align-items:center}
.old{text-decoration:line-through;color:#999;font-size:12px}
.new{font-weight:700}
.perks{margin:0;padding-inline-start:16px;font-size:12px}
</style>

