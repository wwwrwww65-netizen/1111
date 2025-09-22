<template>
  <nav class="tabs-wrap" :class="{ scrolled }" role="tablist" aria-label="الأقسام" dir="rtl">
    <button v-for="(t,idx) in tabs" :key="t.label" class="tab" role="tab" :aria-selected="idx===activeIndex" tabindex="0" @click="activate(idx)" @keydown="onKey($event, idx)">{{ t.label }}</button>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
const props = defineProps<{ tabs?: Array<{ label: string; href?: string }> }>();
const tabs = props.tabs || [
  { label: 'نساء', href: '/c/women' },
  { label: 'رجال', href: '/c/men' },
  { label: 'أطفال', href: '/c/kids' },
  { label: 'مقاسات كبيرة', href: '/c/plus' },
  { label: 'جمال', href: '/c/beauty' },
  { label: 'المنزل', href: '/c/home' },
  { label: 'أحذية', href: '/c/shoes' },
  { label: 'فساتين', href: '/c/dresses' },
  { label: 'الكل', href: '/c/all' },
];
const activeIndex = ref(0)
function activate(i:number){ activeIndex.value = i }
function onKey(e: KeyboardEvent, i:number){
  if (e.key==='ArrowRight'){ activate(Math.max(0, i-1)); }
  else if (e.key==='ArrowLeft'){ activate(Math.min(tabs.length-1, i+1)); }
}
const scrolled = ref(false); function onScroll(){ scrolled.value = window.scrollY>60 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive: true }) })
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.tabs-wrap{position:sticky;top:48px;display:flex;gap:8px;overflow:auto;padding:8px 12px;background:transparent;scroll-snap-type:x mandatory;z-index:999}
.tabs-wrap.scrolled{background:var(--surface,#fff);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.tab{flex:0 0 auto;padding:8px 12px;border-radius:999px;text-decoration:none;color:inherit;background:transparent;font-size:13px;scroll-snap-align:start;border:0}
.tab[aria-selected="true"]{background:rgba(11,95,255,.08);outline:2px solid transparent}
.tab:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:2px}
</style>

