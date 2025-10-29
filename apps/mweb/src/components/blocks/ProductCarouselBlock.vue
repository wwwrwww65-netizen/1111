<template>
  <div dir="rtl">
    <div class="bg-white border border-gray-200 rounded-[4px] px-3 py-3">
    <div v-if="title" class="mb-1.5 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-900">{{ title }}</h2>
      <button class="flex items-center text-xs text-gray-700" aria-label="عرض المزيد" @click="goMore">
        <span class="mr-1">المزيد</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>
    <div class="overflow-x-auto no-scrollbar snap-x-start simple-row">
      <div class="simple-row-inner">
        <button v-for="i in count" :key="'card-'+i" class="text-start snap-item simple-item" aria-label="منتج">
          <div class="border border-gray-200 rounded-[4px] overflow-hidden bg-white">
            <div class="w-full aspect-[255/192] bg-gray-100" />
          </div>
          <div v-if="showPrice" class="mt-1"><span class="text-red-600 font-bold text-sm">99.00</span></div>
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

type Filter = { sortBy?: string; limit?: number }
type Cfg = { title?: string; showPrice?: boolean; products?: any[]; filter?: Filter }

const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const router = useRouter()
const showPrice = computed(()=> !!props.cfg?.showPrice)
const title = computed(()=> props.cfg?.title || '')
const count = computed(()=> (props.device ?? 'MOBILE') === 'MOBILE' ? 6 : 10)
function goMore(){ try{ router.push('/products') }catch{} }
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
.simple-row{--visible:4.15;--gap:6px}
.simple-row-inner{display:flex;gap:var(--gap)}
.simple-item{flex:0 0 calc((100% - (var(--visible) - 1) * var(--gap)) / var(--visible))}
</style>


