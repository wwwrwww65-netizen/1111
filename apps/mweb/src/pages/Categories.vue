<template>
  <div dir="rtl">
    <AppHeader />
    <TabsBar :tabs="tabs" v-model:active="activeTab" />
    <SortFilterBar :count="resultsCount" v-model:view="view" />
    <div class="layout">
      <aside class="side"><SideFilter :items="subcats" v-model="activeSub" /></aside>
      <section class="content">
        <CategoryGrid v-if="mode==='categories'" />
        <ProductGrid v-else :items="demoProducts" />
      </section>
    </div>
    <BottomNav />
  </div>
  
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import ProductGrid from '@/components/ProductGrid.vue'
import TabsBar from '@/components/TabsBar.vue'
import SortFilterBar from '@/components/SortFilterBar.vue'
import SideFilter from '@/components/SideFilter.vue'
import { ref, computed } from 'vue'

const tabs = ['كل','نساء','أطفال','رجال','مقاسات كبيرة','المنزل + الحيوانات الأليفة']
const activeTab = ref('كل')
const view = ref<'grid'|'list'>('grid')
const mode = ref<'categories'|'products'>('products')
const subcats = ref(Array.from({length:14}).map((_,i)=>({ id:`s${i}`, name:`فرعي ${i+1}` })))
const activeSub = ref('')
const demoProducts = Array.from({length:20}).map((_,i)=>({ id:`p${i}`, title:`منتج ${i+1}`, img:`https://picsum.photos/seed/p${i}/400/500`, price:`$${(10+i).toFixed(2)}`, original:`$${(20+i).toFixed(2)}`, badge: i%3===0? 'خصم' : (i%7===0? 'جديد' : undefined) }))
const resultsCount = computed(()=> mode.value==='products'? demoProducts.length : 0)
</script>

<style scoped>
.page{padding-top:68px}
.layout{display:grid;grid-template-columns:minmax(160px,220px) 1fr;gap:12px;padding:12px}
.side{position:sticky;top:120px;align-self:start}
@media (max-width: 768px){ .layout{grid-template-columns:1fr} .side{order:2} }
.title{font-size:18px;margin:12px 0}
.chips{display:flex;gap:8px;overflow:auto;padding:6px 0}
.chip{flex:0 0 auto;padding:8px 12px;border:1px solid var(--muted-2,#eee);border-radius:999px;text-decoration:none;color:inherit;background:#fff}
.chip.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
</style>

