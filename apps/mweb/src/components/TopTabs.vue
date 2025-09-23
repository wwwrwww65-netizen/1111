<template>
  <nav class="tabs-wrap" :class="{ scrolled }" role="tablist" aria-label="الأقسام" dir="rtl">
    <div class="tabs-inner" ref="inner">
      <button
        v-for="(t,idx) in tabs"
        :key="t.label"
        class="tab"
        role="tab"
        :aria-selected="idx===activeIndex"
        tabindex="0"
        @click="activate(idx)"
        @keydown="onKey($event, idx)"
        :ref="setBtnRef(idx)"
      >{{ t.label }}</button>
      <span class="indicator" :style="indicatorStyle" aria-hidden="true"></span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
const props = defineProps<{ tabs?: Array<{ label: string; href?: string }> }>();
const tabs = props.tabs || [
  { label: 'كل', href: '/c/all' },
  { label: 'نساء', href: '/c/women' },
  { label: 'رجال', href: '/c/men' },
  { label: 'أطفال', href: '/c/kids' },
  { label: 'مقاسات كبيرة', href: '/c/plus' },
  { label: 'جمال', href: '/c/beauty' },
  { label: 'المنزل', href: '/c/home' },
  { label: 'أحذية', href: '/c/shoes' },
  { label: 'فساتين', href: '/c/dresses' },
];
const activeIndex = ref(0)
import { useRouter } from 'vue-router'
const router = useRouter()
function activate(i:number){ activeIndex.value = i; nextTick(positionIndicator); const href = tabs[i]?.href; if (href) router.push(href) }
function onKey(e: KeyboardEvent, i:number){
  if (e.key==='ArrowRight'){ activate(Math.max(0, i-1)); }
  else if (e.key==='ArrowLeft'){ activate(Math.min(tabs.length-1, i+1)); }
}
const scrolled = ref(false); function onScroll(){ scrolled.value = window.scrollY>60 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); nextTick(positionIndicator); window.addEventListener('resize', positionIndicator) })
onBeforeUnmount(()=> { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', positionIndicator) })

// underline indicator logic
const inner = ref<HTMLDivElement|null>(null)
const btnRefs = ref<Record<number, HTMLButtonElement | null>>({})
function setBtnRef(i:number){
  return (el: HTMLButtonElement | null) => { btnRefs.value[i] = el }
}
const indicatorStyle = ref<string>('transform: translateX(0); width: 0px;')
function positionIndicator(){
  const el = btnRefs.value[activeIndex.value]
  const wrap = inner.value
  if (!el || !wrap) return
  const r1 = el.getBoundingClientRect();
  const r0 = wrap.getBoundingClientRect();
  const x = r1.left - r0.left + wrap.scrollLeft
  indicatorStyle.value = `transform: translateX(${x}px); width: ${r1.width}px;`
}
watch(activeIndex, ()=> positionIndicator())
</script>

<style scoped>
.tabs-wrap{position:sticky;top:64px;background:transparent;z-index:999}
.tabs-wrap.scrolled{background:var(--surface,#fff);box-shadow:0 2px 8px rgba(0,0,0,.06);top:48px}
.tabs-inner{position:relative;display:flex;gap:8px;overflow:auto;padding:8px 12px;scroll-snap-type:x mandatory}
.tab{flex:0 0 auto;min-height:44px;min-width:44px;padding:8px 12px;border-radius:999px;text-decoration:none;color:inherit;background:transparent;font-size:13px;scroll-snap-align:start;border:0}
.tab[aria-selected="true"]{background:rgba(11,95,255,.08);outline:2px solid transparent}
.tab:focus-visible{outline:2px solid var(--primary,#0B5FFF);outline-offset:2px}
.indicator{position:absolute;bottom:0;height:3px;background:#0B5FFF;border-radius:2px;transition:transform .2s ease,width .2s ease;will-change:transform,width}
</style>

