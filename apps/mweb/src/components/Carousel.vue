<template>
  <div class="caro" @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend.passive="onEnd">
    <div class="track" :style="{ transform: `translateX(-${index * 100}%)` }">
      <div v-for="(s,i) in slides" :key="i" class="slide">
        <img :src="s.img" :alt="s.alt || `slide-${i}`" />
      </div>
    </div>
    <div class="dots">
      <button v-for="(s,i) in slides" :key="i" class="dot" :class="{ active: i===index }" @click="index=i" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ slides: Array<{ img: string; alt?: string }> }>()
const index = ref(0)
let startX = 0, dx = 0
const onStart = (e: TouchEvent)=>{ startX = e.touches[0].clientX; dx = 0 }
const onMove = (e: TouchEvent)=>{ dx = e.touches[0].clientX - startX }
const onEnd = ()=>{
  if (dx < -40 && index.value < props.slides.length - 1) index.value++
  else if (dx > 40 && index.value > 0) index.value--
}
</script>

<style scoped>
.caro{position:relative;overflow:hidden;border-radius:12px;border:1px solid var(--muted-2);background:#fff}
.track{display:flex;transition:transform .3s ease}
.slide{flex:0 0 100%}
.slide img{display:block;width:100%;height:180px;object-fit:cover}
.dots{position:absolute;inset-inline:0;bottom:8px;display:flex;gap:6px;justify-content:center}
.dot{width:8px;height:8px;border-radius:999px;background:#cbd5e1;border:0}
.dot.active{background:#0b5fff}
</style>

