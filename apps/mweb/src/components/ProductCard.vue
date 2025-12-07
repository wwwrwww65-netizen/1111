<template>
  <a :href="href" class="product-card block relative bg-white border border-gray-100 rounded-lg overflow-hidden transition-shadow hover:shadow-md" @click.prevent="onClick">
    <div class="relative w-full pb-[133%] bg-gray-50">
      <img
        :src="thumb"
        :alt="title"
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div v-if="discountPercent" class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
        -{{ discountPercent }}%
      </div>
    </div>
    <div class="p-2">
      <div class="text-[13px] text-gray-800 leading-tight line-clamp-2 h-9 mb-1">
        {{ title }}
      </div>
      <div class="flex items-center gap-2">
        <span class="font-bold text-black">{{ displayPrice }}</span>
        <span v-if="origPrice" class="text-xs text-gray-400 line-through">{{ origPrice }}</span>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id: string
  title: string
  image?: string
  images?: string[]
  price: number | string
  basePrice?: number | string
  href?: string
  discountPercent?: number
}>()

const thumb = computed(() => {
  return (Array.isArray(props.images) && props.images[0]) || props.image || ''
})

const displayPrice = computed(() => Number(props.price || props.basePrice || 0).toLocaleString())
const origPrice = computed(() => {
  if (props.discountPercent) {
    const p = Number(props.price || props.basePrice || 0)
    return Math.floor(p / (1 - (props.discountPercent / 100))).toLocaleString()
  }
  return null
})

function onClick() {
  if (props.href) window.location.href = props.href
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
