<template>
<section class="cat-grid" aria-label="الفئات" dir="rtl">
    <div class="grid">
      <RouterLink v-for="c in cats" :key="c.title" class="cat" :to="c.href" tabindex="0" role="button" :aria-label="`تصنيف: ${c.title}`">
        <img class="img" :src="c.img" :alt="c.title" />
        <div class="label">{{ c.title }}</div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/lib/api'
import { RouterLink } from 'vue-router'
type Cat = { id?: string; title: string; href: string; img: string; srcset?: string }
const cats = ref<Cat[]>([])
onMounted(async ()=>{
  const data = await apiGet<any>('/api/categories?limit=30')
  if (data && Array.isArray(data.categories)){
    cats.value = data.categories.map((c:any)=> ({ title: c.name || c.title, href: `/c/${encodeURIComponent(c.slug||c.id||c.name)}`, img: String(c.image||'') || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=300&auto=format&fit=crop' }))
  } else {
    cats.value = [
      { title:'فساتين', href:'/c/dresses', img:'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&fm=webp&w=300&auto=format&fit=crop' },
      { title:'تنانير', href:'/c/skirts', img:'https://images.unsplash.com/photo-1548100323-25ca725d4a99?q=80&fm=webp&w=300&auto=format&fit=crop' },
      { title:'بناطلين', href:'/c/pants', img:'https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&fm=webp&w=300&auto=format&fit=crop' },
      { title:'جاكيتات', href:'/c/jackets', img:'https://images.unsplash.com/photo-1520974735194-79a9dc9755a0?q=80&fm=webp&w=300&auto=format&fit=crop' },
      { title:'دينيم', href:'/c/denim', img:'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&fm=webp&w=300&auto=format&fit=crop' },
      { title:'بلايز', href:'/c/tops', img:'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&fm=webp&w=300&auto=format&fit=crop' },
      { title:'تي شيرتات', href:'/c/tees', img:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&fm=webp&w=300&auto=format&fit=crop' },
    ]
  }
})
</script>

<style scoped>
.cat-grid{background:#fff;height:100%;min-height:0;border-radius:0;padding:12px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.cat{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-decoration:none;color:inherit;padding:8px}
.img{width:96px;height:96px;border-radius:50%;object-fit:cover;object-position:center;background:#F7F7F7;box-shadow:0 2px 6px rgba(0,0,0,.06);display:block}
.label{margin-top:8px;font-size:13px;color:#333;text-align:center;line-height:1.2;max-height:36px;overflow:hidden;text-overflow:ellipsis}
.cat:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:3px;border-radius:12px}
@media (max-width: 768px){
  .grid{grid-template-columns:repeat(2,1fr)}
  .img{width:84px;height:84px}
}
</style>

