<template>
  <div dir="rtl">
    <HeaderSearch />
    <TopTabs />
    <div class="page container">
      <div class="flex">
        <CategorySidebar class="rightbar" />
        <div class="main">
          <CategoryGrid />
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
  
</template>

<script setup lang="ts">
import HeaderSearch from '@/components/HeaderSearch.vue'
import BottomNav from '@/components/BottomNav.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import TopTabs from '@/components/TopTabs.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
</script>

<style scoped>
.page{padding-top:68px}
.page{padding-top:8px}
.flex{display:flex;gap:12px}
.rightbar{order:2}
.main{flex:1}
.title{font-size:18px;margin:12px 0}
.chips{display:flex;gap:8px;overflow:auto;padding:6px 0}
.chip{flex:0 0 auto;padding:8px 12px;border:1px solid var(--muted-2,#eee);border-radius:999px;text-decoration:none;color:inherit;background:#fff}
.chip.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
</style>

