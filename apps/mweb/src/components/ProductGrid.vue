<template>
  <section :aria-label="label || 'منتجات'" dir="rtl">
    <div class="grid">
      <ProductCard v-for="p in visible" :key="p.id || p.title" v-bind="p" />
    </div>
    <div ref="sentinel" class="sentinel" aria-hidden="true"></div>
  </section>
  
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
const props = defineProps<{ label?: string; items: Array<any> }>()
const visible = ref<any[]>(props.items?.slice(0, 10) || [])
const sentinel = ref<HTMLElement|null>(null)
let io: IntersectionObserver | null = null
function loadMore(){
  const next = (visible.value.length + 10)
  visible.value = (props.items || []).slice(0, next)
}
onMounted(()=>{
  io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if (e.isIntersecting) loadMore() })
  }, { rootMargin: '200px' })
  if (sentinel.value) io.observe(sentinel.value)
})
onBeforeUnmount(()=>{ try{ io?.disconnect() }catch{} })
</script>

<style scoped>
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sentinel{height:1px}
</style>

