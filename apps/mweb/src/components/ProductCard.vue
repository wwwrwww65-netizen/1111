<template>
  <article class="card" style="padding:0;overflow:hidden">
    <img class="img" :src="img" :alt="title" style="height:180px;object-fit:cover;border-radius:0" />
    <div class="row" style="justify-content:space-between;padding:10px 12px">
      <div style="font-weight:600">{{ title }}</div>
      <div class="text-accent" style="font-weight:700">{{ price }}</div>
    </div>
    <button class="btn" style="margin:0 12px 12px">إضافة للسلة</button>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{ img: string; title: string; price: string }>();
const { img, title, price } = props;
</script>