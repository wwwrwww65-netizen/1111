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

      <!-- معرض الصور: صورتين واضحتين + الثالثة يظهر جزء منها -->
      <div class="w-full overflow-x-auto no-scrollbar mb-3">
        <div class="flex gap-2 w-max pr-2">
          <div
            v-for="(src, idx) in galleryImages"
            :key="idx"
            class="w-[48%] h-40 rounded-[8px] overflow-hidden shrink-0 bg-gray-100"
          >
            <img
              :src="src"
              :alt="`صورة ${idx + 1}`"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- اسم المنتج + السعر -->
      <div class="mb-4">
        <div class="text-[13px] font-semibold text-gray-900 leading-5">
          تيشيرت نسائي بياقة مستديرة وقماش مريح
        </div>
        <div class="text-[13px] text-[#8a1538] font-bold">34.00 ر.س</div>
      </div>

      <!-- الألوان -->
      <div class="mb-4">
        <div class="text-[12px] text-gray-700 mb-2">
          اللون: {{ selectedColor }}
        </div>
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            v-for="color in colors"
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
            />
          </button>
        </div>
      </div>

      <!-- المقاسات -->
      <div class="mb-4">
        <div class="text-[12px] text-gray-700 mb-2">اختر المقاس:</div>
        <div class="flex items-center flex-wrap gap-2">
          <button
            v-for="size in sizes"
            :key="size"
            @click="selectedSize = size"
            :class="`px-3 h-8 rounded-full border text-[12px] ${
              selectedSize === size
                ? 'border-[#8a1538] text-[#8a1538]'
                : 'border-gray-300'
            }`"
          >
            {{ size }}
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
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  onClose: () => void
}>()

const selectedColor = ref('أبيض')
const selectedSize = ref('S')

const galleryImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop'
]

const colors = [
  { label: 'أبيض', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=100&auto=format&fit=crop' },
  { label: 'بيج', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100&auto=format&fit=crop' },
  { label: 'زهري', img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=100&auto=format&fit=crop' },
  { label: 'أحمر', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&auto=format&fit=crop' },
  { label: 'أسود', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=100&auto=format&fit=crop' }
]

const sizes = ['XS', 'S', 'M', 'L', 'XL']

function updateOptions() {
  // هنا يمكن إضافة منطق تحديث خيارات المنتج
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
