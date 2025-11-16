<template>
  <div dir="rtl">
    <div class="relative w-full overflow-hidden" :style="{ height: isMobile ? '257.172px' : '360px' }">
      <Swiper
        :modules="[Autoplay]"
        :slides-per-view="1"
        :loop="true"
        :autoplay="autoplayCfg"
        :space-between="0"
        class="h-full"
        dir="rtl"
        @swiper="onSwiper"
        @slide-change="onSlideChange"
      >
        <SwiperSlide v-for="(sl,i) in slides" :key="'sl-'+i">
          <a :href="sl.href || '#'" class="block relative w-full h-full">
            <img :src="thumb(sl.image)" alt="slide" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />
          </a>
        </SwiperSlide>
        <SwiperSlide v-if="!slides.length">
          <div class="w-full h-full bg-gray-200" />
        </SwiperSlide>
      </Swiper>
      <div class="easy-pagination absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1.5" dir="rtl">
        <button v-for="(_,i) in slides" :key="'pg-'+i" class="w-1.5 h-1.5 rounded-full transition-colors" :class="i===activeBanner ? 'bg-white' : 'bg-white/50'" aria-label="انتقل إلى البنر" @click="goTo(i)" />
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { buildThumbUrl } from '../../lib/media'

type Slide = { image: string; href?: string }
type Cfg = { slides?: Slide[]; image?: string; ctaHref?: string }

const props = defineProps<{ cfg?: Cfg; device?: 'MOBILE'|'DESKTOP' }>()
const isMobile = computed(()=> (props.device ?? 'MOBILE') === 'MOBILE')
const slides = computed<Slide[]>(()=>{
  const cfg = props.cfg || {}
  if (Array.isArray(cfg.slides) && cfg.slides.length) return cfg.slides
  if (cfg.image) return [{ image: cfg.image, href: cfg.ctaHref }]
  return []
})
function thumb(u: string): string {
  const w = isMobile.value ? 720 : 1200
  return buildThumbUrl(u, w, 60)
}
const autoplayCfg: any = { delay: 5000, disableOnInteraction: true, reverseDirection: false }
let swiperInstance: any = null
const activeBanner = ref<number>(0)
function onSwiper(sw: any){ swiperInstance = sw }
function onSlideChange(sw: any){ activeBanner.value = sw.realIndex || 0 }
function goTo(i: number){ try{ if (swiperInstance) swiperInstance.slideTo(i) }catch{} }
</script>

<style scoped>
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none;height:0;width:0;background:transparent}
.easy-pagination { position:absolute; bottom:8px; left:50%; transform:translateX(-50%); display:flex; justify-content:center; align-items:center; gap:6px; z-index:10 }
</style>


