<template>
  <section class="py-3" aria-label="الفئات" dir="rtl">
    <div class="overflow-x-auto no-scrollbar px-0">
      <div class="flex gap-2 pb-0.5 px-3">
        <div v-for="(col,ci) in catColsLocked" :key="'col-'+ci" class="flex flex-col gap-1">
          <RouterLink v-for="(c,ri) in col" :key="(c.name||c.id)+'-'+ci+'-'+ri" class="w-[96px] flex-shrink-0 text-center bg-transparent border-0 inline-block" :to="'/c/'+encodeURIComponent(c.slug||c.id||c.name||'')">
            <div class="w-[68px] h-[68px] border border-gray-200 rounded-full overflow-hidden mx-auto mb-2 bg-white">
              <img
                v-if="c.image"
                :src="thumb(c.image)"
                :srcset="`${thumbW(c.image,96)} 96w, ${thumbW(c.image,120)} 120w, ${thumbW(c.image,160)} 160w, ${thumbW(c.image,200)} 200w`"
                sizes="96px"
                :alt="c.name||c.id"
                class="w-full h-full object-cover"
                :loading="(ci*3 + ri) < 9 ? 'eager' : 'lazy'"
                :fetchpriority="(ci*3 + ri) < 9 ? 'high' : 'auto'"
                decoding="async"
              />
            </div>
            <div class="text-[11px] text-gray-700">{{ c.name||c.id||'-' }}</div>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'CategoriesBlock' })
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { buildThumbUrl } from '../../lib/media'

type Item = { id?: string; name?: string; image?: string; slug?: string }
type Cfg = { categories?: Item[]; brands?: Item[] }

const props = defineProps<{ cfg?: Cfg }>()
const list = computed<Item[]>(()=>{
  const cfg = props.cfg || {}
  if (Array.isArray(cfg.categories) && cfg.categories.length) return cfg.categories
  if (Array.isArray(cfg.brands) && cfg.brands.length) return cfg.brands
  return []
})
function thumb(u?: string): string {
  return buildThumbUrl(String(u||''), 160, 60)
}
function thumbW(u?: string, w = 120): string {
  return buildThumbUrl(String(u||''), w, 60)
}
const catColsLocked = computed(()=>{
  const perCol = 3
  const arr = list.value || []
  const cols = Math.ceil(arr.length / perCol) || 1
  const out: Item[][] = []
  for (let c=0;c<cols;c++) out[c] = arr.slice(c*perCol, (c+1)*perCol)
  return out
})
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
</style>


