<template>
  <div class="sfb" :class="{ sticky: stuck }" dir="rtl">
    <div class="left">
      <button class="btn" @click="$emit('open-filter')" aria-label="فلترة">فلترة</button>
      <div class="menu">
        <button class="btn" aria-haspopup="listbox" aria-label="فرز">فرز</button>
      </div>
      <button class="btn" @click="$emit('update:view', view==='grid'?'list':'grid')" :aria-label="view==='grid'?'عرض قائمة':'عرض شبكة'">{{ view==='grid'?'قائمة':'شبكة' }}</button>
    </div>
    <div class="right" aria-live="polite">{{ count.toLocaleString('ar') }} نتيجة</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps<{ count: number; view?: 'grid'|'list' }>()
defineEmits(['open-filter','update:view','sort'])
const view = ref<'grid'|'list'>(props.view || 'grid')
const stuck = ref(false)
function onScroll(){ stuck.value = window.scrollY > 98 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive:true }) })
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.sfb{position:sticky;top:100px;z-index:998;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:transparent}
.sticky{background:var(--surface,#fff);box-shadow:0 1px 6px rgba(0,0,0,.04)}
.left{display:flex;gap:8px}
.btn{border:1px solid var(--muted-2,#eee);background:#fff;border-radius:10px;padding:8px 12px}
</style>

