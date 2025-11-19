<template>
  <div dir="rtl">
    <div class="bg-white p-3">
    <div class="flex overflow-x-auto gap-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" aria-label="عروض">
      <div v-for="(p,i) in tiles" :key="'tile-'+i" class="relative w-[100px] h-[50px] flex-shrink-0 border border-gray-200 rounded overflow-hidden bg-white snap-start">
        <img v-if="p.image" :src="p.image" :alt="p.title||''" class="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div v-if="!tiles.length" class="w-[100px] h-[50px] flex-shrink-0 border border-gray-200 rounded bg-gray-100"></div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Tile = { image?: string; title?: string; bg?: string }
type Cfg = { tiles?: Tile[] }

const props = defineProps<{ cfg?: Cfg }>()
const tiles = computed<Tile[]>(()=> Array.isArray(props.cfg?.tiles) ? props.cfg!.tiles! : [])

</script>


