<template>
  <section aria-label="الفئات" dir="rtl">
    <div class="grid">
      <a v-for="c in cats" :key="c.title" class="cat" :href="c.href" tabindex="0" role="button" :aria-label="`تصنيف: ${c.title}`">
        <img class="img" :src="c.img" :alt="c.title" loading="lazy" />
        <div class="label">{{ c.title }}</div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
const cats = [
  { title:'فساتين', href:'/c/dresses', img:'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=300&auto=format&fit=crop' },
  { title:'بلوزات', href:'/c/tops', img:'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=300&auto=format&fit=crop' },
  { title:'بنطال', href:'/c/pants', img:'https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=300&auto=format&fit=crop' },
  { title:'رياضي', href:'/c/sports', img:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=300&auto=format&fit=crop' },
  { title:'أحذية', href:'/c/shoes', img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop' },
  { title:'حقائب', href:'/c/bags', img:'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=300&auto=format&fit=crop' },
]
</script>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px 0}
.cat{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit;padding:8px}
.img{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#F7F7F7;box-shadow:0 2px 6px rgba(0,0,0,.06);display:block}
.label{margin-top:8px;font-size:13px;color:#333;text-align:center;line-height:1.2;max-height:36px;overflow:hidden;text-overflow:ellipsis}
.cat:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:3px;border-radius:12px}
</style>

