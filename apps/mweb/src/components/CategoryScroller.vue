<template>
  <section class="space-y-12">
    <h2 style="margin:0">التصنيفات</h2>
    <div class="cat-scroll">
      <a v-for="c in cats" :key="c.label" class="cat-item" href="#">
        <img :src="c.img" :alt="c.label" />
        <span>{{ c.label }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ cats?: Array<{ label: string; img: string }> }>();
const cats = props.cats || [
  { label: 'فساتين', img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=240&auto=format&fit=crop' },
  { label: 'بلايز', img: 'https://images.unsplash.com/photo-1520975922284-9d43a1661efe?q=80&w=240&auto=format&fit=crop' },
  { label: 'بناطيل', img: 'https://images.unsplash.com/photo-1618354691438-25e5f7b6aab2?q=80&w=240&auto=format&fit=crop' },
  { label: 'ملابس رياضية', img: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=240&auto=format&fit=crop' },
  { label: 'ملابس سباحة', img: 'https://images.unsplash.com/photo-1531907700752-62799b2a265f?q=80&w=240&auto=format&fit=crop' },
  { label: 'لانجري', img: 'https://images.unsplash.com/photo-1536682903602-c3c4d8b9ca42?q=80&w=240&auto=format&fit=crop' },
  { label: 'إكسسوارات', img: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=240&auto=format&fit=crop' },
  { label: 'أحذية', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=240&auto=format&fit=crop' },
  { label: 'شنط', img: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=240&auto=format&fit=crop' },
];
</script>

<style scoped>
.cat-scroll{display:flex;gap:12px;overflow:auto;padding:6px 2px}
.cat-item{flex:0 0 auto;width:76px;display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit}
.cat-item img{width:64px;height:64px;border-radius:999px;object-fit:cover;border:1px solid var(--muted-2);background:#fff}
.cat-item span{margin-top:6px;font-size:12px}
</style>