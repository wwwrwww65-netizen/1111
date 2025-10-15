<template>
  <div class="fixed inset-0 z-50" dir="rtl">
    <!-- خلفية -->
    <button
      class="absolute inset-0 bg-black/30"
      @click="onClose"
      aria-label="إغلاق"
    />

    <!-- اللوحة -->
    <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[12px] shadow-lg p-4 max-h-[85vh] overflow-y-auto">
      <!-- رأس -->
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-[14px] font-semibold text-gray-800">تعديل الخيارات</h2>
        <button @click="onClose">
          <X class="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <!-- معرض الصور: صورتان واضحتان + الثالثة يظهر جزء منها (218×164) -->
      <div class="w-full overflow-x-auto no-scrollbar mb-3">
        <div class="flex gap-2 w-max">
          <div
            v-for="(src, idx) in gallery"
            :key="idx"
            class="w-[164px] h-[218px] rounded-[8px] overflow-hidden shrink-0 bg-gray-100"
          >
            <img
              :src="src"
              :alt="`صورة ${idx + 1}`"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <!-- اسم المنتج + السعر -->
      <div class="mb-4">
        <div class="text-[13px] font-semibold text-gray-900 leading-5">
          {{ product?.title || '' }}
        </div>
        <div class="text-[13px] text-[#8a1538] font-bold">{{ displayPrice }}</div>
      </div>

      <!-- الألوان -->
      <div class="mb-4">
        <div class="text-[12px] text-gray-700 mb-2">
          اللون: {{ selectedColor }}
        </div>
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            v-for="color in productColors"
            :key="color.label"
            @click="selectedColor = color.label"
            :class="`w-14 h-14 rounded-[6px] overflow-hidden border ${
              selectedColor === color.label
                ? 'border-[#8a1538]'
                : 'border-gray-200'
            }`"
          >
            <img
              :src="color.img"
              :alt="color.label"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        </div>
      </div>

      <!-- المقاسات -->
      <div class="mb-4">
        <div class="text-[12px] text-gray-700 mb-2">اختر المقاس:</div>
        <div class="flex items-center flex-wrap gap-2">
          <button
            v-for="s in productSizes"
            :key="s"
            @click="selectedSize = s"
            :class="`px-3 h-8 rounded-full border text-[12px] ${
              selectedSize === s
                ? 'border-[#8a1538] text-[#8a1538]'
                : 'border-gray-300'
            }`"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- زر التحديث -->
      <button
        class="w-full h-10 rounded-[6px] text-[12px] font-semibold text-white bg-[#8a1538]"
        @click="updateOptions"
      >
        تحديث
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  onClose: () => void
  onSave: (payload: { color: string; size: string }) => void
  product: { id: string; title: string; price: number; images?: string[]; colors?: Array<{ label: string; img: string }>; sizes?: string[] } | null
  selectedColor?: string
  selectedSize?: string
}>()

const selectedColor = ref(props.selectedColor || 'أبيض')
const selectedSize = ref(props.selectedSize || 'S')

const gallery = computed(()=>{
  const imgs = Array.isArray(props.product?.images) ? props.product!.images! : []
  const filtered = imgs.filter(u => /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
  return filtered.length ? filtered : ['/images/placeholder-product.jpg']
})

const productColors = computed(()=> Array.isArray(props.product?.colors) ? props.product!.colors! : [])
const productSizes = computed(()=> Array.isArray(props.product?.sizes) ? props.product!.sizes! : ['XS','S','M','L','XL'])
import { fmtPrice } from '@/lib/currency'
const displayPrice = computed(()=> fmtPrice(Number(props.product?.price||0)))

watchEffect(()=>{
  if (props.selectedColor) selectedColor.value = props.selectedColor
  if (props.selectedSize) selectedSize.value = props.selectedSize
})

function updateOptions() {
  props.onSave({ color: selectedColor.value, size: selectedSize.value })
  props.onClose()
}
</script>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
