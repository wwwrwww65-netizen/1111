<template>
<nav class="tabs" :class="{ sticky: stuck, solid: solid || stuck }" role="tablist" dir="rtl">
    <button v-for="t in tabs" :key="t" class="tab" role="tab" :aria-selected="t===active" @click="$emit('update:active', t)">
      <span>{{ t }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps<{ tabs: string[]; active?: string; solid?: boolean }>()
defineEmits(['update:active'])
const active = props.active ?? (props.tabs?.[0]||'')
const stuck = ref(false)
function onScroll(){ stuck.value = window.scrollY > 60 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive:true }) })
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.tabs{position:sticky;top:52px;z-index:999;background:transparent;display:flex;gap:8px;overflow:auto;padding:8px}
.tabs.sticky,.tabs.solid{background:var(--surface,#fff);box-shadow:0 1px 6px rgba(0,0,0,.04)}
.tab{position:relative;flex:0 0 auto;border:0;background:transparent;padding:10px 12px;border-radius:10px}
.tab[aria-selected="true"]{color:var(--primary,#0B5FFF);font-weight:700}

</style>

