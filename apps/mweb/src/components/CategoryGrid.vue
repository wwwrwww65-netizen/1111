<template>
  <section aria-label="الفئات" dir="rtl">
    <div class="grid">
      <a v-for="c in cats" :key="c.title" class="cat" :href="c.href" tabindex="0">
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
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:12px}
@media(min-width:420px){.grid{grid-template-columns:repeat(5,1fr)}}
.cat{display:grid;justify-items:center;text-decoration:none;color:inherit}
.img{width:64px;height:64px;border-radius:999px;object-fit:cover;border:1px solid var(--muted-2)}
.label{margin-top:6px;font-size:12px}
.cat:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:3px;border-radius:12px}
</style>

