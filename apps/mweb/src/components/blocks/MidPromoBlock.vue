<template>
  <div class="px-0" dir="rtl">
    <div class="w-full h-[90px] border border-gray-200 rounded overflow-hidden relative bg-white">
      <img
        v-if="cfg?.image"
        :src="thumb(cfg?.image)"
        :srcset="`${thumbW(cfg?.image,480)} 480w, ${thumbW(cfg?.image,640)} 640w, ${thumbW(cfg?.image,800)} 800w`"
        sizes="100vw"
        :alt="cfg?.alt || cfg?.text || 'عرض'"
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div class="absolute inset-0 bg-black/10" />
      <div v-if="cfg?.text" class="absolute left-3 right-3 top-1/2 -translate-y-1/2 text-white text-[12px] font-semibold">{{ cfg.text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildThumbUrl } from '../../lib/media'
type Cfg = { image?: string; alt?: string; text?: string; href?: string }
defineProps<{ cfg?: Cfg }>()

function thumb(u?: string): string {
  return buildThumbUrl(String(u||''), 800, 60)
}
function thumbW(u?: string, w = 640): string {
  return buildThumbUrl(String(u||''), w, 60)
}
</script>


