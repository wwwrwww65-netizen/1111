<template>
  <article class="card" dir="rtl" aria-label="بطاقة ترويجية">
    <a href="#" class="media" aria-label="عرض المنتج">
      <img ref="imgRef" :src="visible ? img : placeholder" :srcset="visible ? imgSet : undefined" :alt="title" loading="lazy" />
    </a>
    <div class="body">
      <h3 class="title">{{ title }}</h3>
      <div class="price">
        <s>23.00 ر.س</s>
        <strong>18.40 ر.س</strong>
      </div>
      <button class="fav" aria-label="حفظ"><Icon name="heart" /></button>
      <span class="badge">-20%</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Icon from '@/components/Icon.vue'
const title = 'لباس علوي قصير من SHEIN Privé'
const img = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&fm=webp&w=400&auto=format&fit=crop'
const imgSet = img + ' 1x, https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&fm=webp&w=800&auto=format&fit=crop 2x'
const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const visible = ref(false)
const imgRef = ref<HTMLImageElement|null>(null)
let observer: IntersectionObserver | null = null
onMounted(()=>{
  observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ visible.value = true; observer?.disconnect(); } })
  }, { rootMargin: '200px' })
  if(imgRef.value) observer.observe(imgRef.value)
})
onBeforeUnmount(()=>{ observer?.disconnect() })
</script>

<style scoped>
.card{position:relative;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);overflow:hidden}
.media{display:block}
img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}
.body{position:relative;padding:12px}
.title{font-size:14px;color:#222;line-height:1.3;max-height:2.6em;overflow:hidden}
.price{display:flex;gap:8px;align-items:center;margin-top:6px}
.price s{color:#999;font-size:13px}
.price strong{color:#e11d48;font-size:16px}
.fav{position:absolute;top:8px;inset-inline-end:8px;width:40px;height:40px;display:grid;place-items:center;background:#fff;border:1px solid #eee;border-radius:10px}
.badge{position:absolute;top:8px;inset-inline-start:8px;background:#111;color:#fff;border-radius:999px;padding:2px 8px;font-size:12px}
.card:focus-within{outline:2px solid #0b5fff}
</style>

