<template>
  <section class="space-y-12">
    <h2 style="margin:0">التصنيفات</h2>
    <div class="cat-scroll">
      <a v-for="c in cats" :key="c" class="cat-pill" href="#">{{ c }}</a>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ cats?: string[] }>();
const cats = props.cats || ['ملابس','أحذية','اكسسوارات','أجهزة','ساعات','حقائب'];
</script>