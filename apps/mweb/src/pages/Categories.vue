<template>
  <div dir="rtl">
    <HeaderBar />
    <div class="container page">
      <h1 class="title">تسوق حسب الفئة</h1>
      <div class="chips" role="tablist">
        <a class="chip active" href="/c/all" role="tab" aria-selected="true">الكل</a>
        <a class="chip" href="/c/women" role="tab">نساء</a>
        <a class="chip" href="/c/men" role="tab">رجال</a>
        <a class="chip" href="/c/kids" role="tab">أطفال</a>
        <a class="chip" href="/c/plus" role="tab">مقاسات كبيرة</a>
      </div>
      <CategoryGrid />
    </div>
    <BottomNav />
  </div>
  
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
</script>

<style scoped>
.page{padding-top:68px}
.title{font-size:18px;margin:12px 0}
.chips{display:flex;gap:8px;overflow:auto;padding:6px 0}
.chip{flex:0 0 auto;padding:8px 12px;border:1px solid var(--muted-2,#eee);border-radius:999px;text-decoration:none;color:inherit;background:#fff}
.chip.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
</style>

