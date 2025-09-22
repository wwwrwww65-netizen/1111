<template>
  <section :aria-label="label || 'منتجات'" dir="rtl">
    <div class="grid">
      <template v-for="(p,idx) in visible" :key="(p.id || p.title)+idx">
        <ProductCard v-bind="p" />
        <a v-if="(idx+1)%6===0" class="inline-banner" href="#" aria-label="عرض ترويجي">
          <img src="https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=600&auto=format&fit=crop" alt="عرض خاص" loading="lazy" />
        </a>
      </template>
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
.inline-banner{grid-column:1 / -1;border-radius:12px;overflow:hidden;display:block;border:1px solid var(--muted-2)}
.inline-banner img{width:100%;height:120px;object-fit:cover;display:block}
</style>

