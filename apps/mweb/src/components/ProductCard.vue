<template>
  <article class="card prod-card">
    <div class="img-wrap">
      <img :src="img" :alt="title" />
      <span v-if="badge" class="badge badge-accent">{{ badge }}</span>
    </div>
    <div class="info">
      <div class="title">{{ title }}</div>
      <div class="price-wrap">
        <span v-if="original" class="original">{{ original }}</span>
        <span class="price">{{ price }}</span>
      </div>
    </div>
    <button class="btn add">إضافة للسلة</button>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{ img: string; title: string; price: string; original?: string; badge?: string }>();
const { img, title, price, original, badge } = props;
</script>

<style scoped>
.prod-card{padding:0;overflow:hidden}
.img-wrap{position:relative;aspect-ratio:3/4;background:#f8fafc}
.img-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.badge-accent{position:absolute;top:8px;left:8px}
.info{display:flex;justify-content:space-between;align-items:center;padding:10px 12px}
.title{font-weight:600;font-size:13px}
.price-wrap{display:flex;gap:6px;align-items:center}
.original{text-decoration:line-through;color:#94a3b8;font-size:12px}
.price{color:#dc2626;font-weight:800}
.add{margin:0 12px 12px}
</style>