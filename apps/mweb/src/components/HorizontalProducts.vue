<template>
  <div class="hp">
    <a v-for="p in items" :key="p.title" class="hp-card" :href="p.href || '#'">
      <img :src="p.img" :alt="p.title" />
      <div class="hp-title">{{ p.title }}</div>
      <div class="hp-price">{{ p.price }}</div>
    </a>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ items?: Array<{ img: string; title: string; price: string; href?: string }> }>();
const items = props.items || [
  { img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop', title: 'منتج 1', price: '89 ر.س' },
  { img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop', title: 'منتج 2', price: '129 ر.س' },
  { img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop', title: 'منتج 3', price: '59 ر.س' },
  { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop', title: 'منتج 4', price: '149 ر.س' },
];
</script>

<style scoped>
.hp{display:flex;gap:10px;overflow:auto;padding:4px 2px;margin:8px 0}
.hp-card{flex:0 0 auto;width:150px;border:1px solid var(--muted-2);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;background:#fff}
.hp-card img{width:150px;height:120px;object-fit:cover;display:block}
.hp-title{font-size:13px;padding:8px 8px 0 8px}
.hp-price{padding:0 8px 8px 8px;color:var(--primary);font-weight:700}
</style>

