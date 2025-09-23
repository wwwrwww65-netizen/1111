<template>
  <div class="page" dir="rtl">
    <AppHeader solid />
    <TabsBar :tabs="tabs" v-model:active="activeTab" solid />
    <div class="catalog-layout rtl container">
      <SideFilter :items="sideItems" v-model="activeSide" />
      <div class="main">
        <CategoryGrid />
      </div>
    </div>
    <BottomNav />
  </div>
  
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import TabsBar from '@/components/TabsBar.vue'
import SideFilter from '@/components/SideFilter.vue'
import { ref } from 'vue'
const tabs = ['كل','نساء','أطفال','رجال','مقاسات كبيرة','المنزل + الحيوانات الأليفة','تجميل']
const activeTab = ref(tabs[0])
const sideItems = [
  { id:'new-in', name:'جديد في' },
  { id:'women', name:'ملابس نسائية' },
  { id:'kids', name:'الأطفال' },
  { id:'men', name:'الرجال' },
  { id:'plus', name:'فساتين كبيرة' },
  { id:'home', name:'المنزل والاحتياجات اليومية' },
]
const activeSide = ref(sideItems[0].id)
</script>

<style scoped>
.page{display:flex;flex-direction:column;min-height:100dvh;background:#fff}
.catalog-layout{display:grid;grid-template-columns:180px 1fr;column-gap:0;row-gap:0;flex:1;min-height:0;align-items:stretch}
/* ازالة هوامش الحاوية لهذه الصفحة */
.catalog-layout.container{padding-left:0;padding-right:0;max-width:none}
@media (max-width: 768px){ .catalog-layout{grid-template-columns:110px 1fr} }
.main{height:100%;min-height:0;overflow:hidden}
.title{font-size:18px;margin:12px 0}
.chips{display:flex;gap:8px;overflow:auto;padding:6px 0}
.chip{flex:0 0 auto;padding:8px 12px;border:1px solid var(--muted-2,#eee);border-radius:999px;text-decoration:none;color:inherit;background:#fff}
.chip.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
</style>

