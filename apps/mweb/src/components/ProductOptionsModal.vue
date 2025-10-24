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
        <h2 class="text-[14px] font-semibold text-gray-800">
          <template v-if="!loading">تعديل الخيارات</template>
          <template v-else>
            <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </template>
        </h2>
        <button @click="onClose">
          <X class="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <!-- معرض الصور: صورتان واضحتان + الثالثة يظهر جزء منها (218×164) -->
      <div class="w-full overflow-x-auto no-scrollbar mb-3">
        <div class="flex gap-2 w-max">
          <template v-if="!loading">
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
          </template>
          <template v-else>
            <div v-for="n in 3" :key="'sk-'+n" class="w-[164px] h-[218px] rounded-[8px] overflow-hidden shrink-0 bg-gray-100 animate-pulse" />
          </template>
        </div>
      </div>

      <!-- اسم المنتج + السعر -->
      <div class="mb-4">
        <div class="text-[13px] font-semibold text-gray-900 leading-5">
          <template v-if="!loading">{{ product?.title || '' }}</template>
          <template v-else>
            <div class="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          </template>
        </div>
        <div class="text-[13px] text-[#8a1538] font-bold">
          <template v-if="!loading">{{ displayPrice }}</template>
          <template v-else>
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </template>
        </div>
      </div>

      <!-- الألوان -->
      <div class="mb-4">
        <div class="text-[12px] text-gray-700 mb-2 text-right">اللون: {{ selectedColor || '—' }}</div>
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar justify-start">
          <template v-if="!loading">
            <button
              v-for="color in productColors"
              :key="color.label"
              @click="selectedColor = color.label"
              :class="`w-14 h-14 rounded-[8px] overflow-hidden border relative ${
                selectedColor === color.label ? 'border-[#8a1538] ring-2 ring-[#8a1538]/30' : 'border-gray-200'
              }`"
            >
              <img
                :src="color.img"
                :alt="color.label"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-if="selectedColor === color.label" class="absolute inset-0 rounded-[8px] ring-2 ring-offset-2 ring-[#8a1538]/50 pointer-events-none"></div>
            </button>
          </template>
          <template v-else>
            <div v-for="n in 6" :key="'cs-'+n" class="w-14 h-14 rounded-[6px] bg-gray-100 border border-gray-200 animate-pulse" />
          </template>
        </div>
      </div>

      <!-- المقاسات -->
      <div class="mb-3">
        <!-- Render groups in separate rows when available -->
        <template v-if="productGroups.length">
          <div class="space-y-3">
            <div v-for="(g,gi) in productGroups" :key="'cg-'+gi">
              <div class="text-[12px] text-gray-600 mb-1 text-right">{{ g.label }}: {{ groupSelected[g.label] || '—' }}</div>
              <div class="flex items-center flex-wrap gap-2 justify-start">
                <button
                  v-for="val in g.values"
                  :key="val"
                  @click="pickGrouped(g.label, val)"
                  :class="`px-3 h-8 rounded-full border text-[12px] ${
                    groupSelected[g.label] === val ? 'border-[#8a1538] text-[#8a1538]' : 'border-gray-300'
                  }`"
                >
                  {{ val }}
                </button>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="flex items-center flex-wrap gap-2 justify-start">
          <template v-if="!loading">
            <button
              v-for="s in productSizes"
              :key="s"
              @click="selectedSize = s"
              :class="`px-3 h-8 rounded-full border text-[12px] ${
                selectedSize === s ? 'border-[#8a1538] text-[#8a1538]' : 'border-gray-300'
              }`"
            >
              {{ s }}
            </button>
          </template>
          <template v-else>
            <div v-for="n in 5" :key="'ss-'+n" class="px-6 h-8 rounded-full border border-gray-300 bg-gray-100 animate-pulse" />
          </template>
        </div>
      </div>

      <!-- زر التحديث -->
      <button
        class="w-full h-10 rounded-[6px] text-[12px] font-semibold text-white bg-[#8a1538] disabled:opacity-60 mt-2"
        @click="updateOptions"
        :disabled="loading"
      >
        <template v-if="!loading">تحديث</template>
        <template v-else>جار التحميل…</template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  onClose: () => void
  onSave: (payload: { color: string; size: string }) => void
  product: { id: string; title: string; price: number; images?: string[]; colors?: Array<{ label: string; img: string }>; sizes?: string[]; sizeGroups?: Array<{ label:string; values:string[] }> } | null
  selectedColor?: string
  selectedSize?: string
  groupValues?: Record<string,string>
}>()

const selectedColor = ref(props.selectedColor || 'أبيض')
const selectedSize = ref('')
const groupValues = ref<Record<string,string>>({})

const loading = computed(()=> !props.product)
const gallery = computed(()=>{
  const imgs = Array.isArray(props.product?.images) ? props.product!.images! : []
  const filtered = imgs.filter(u => /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
  return filtered.length ? filtered : ['/images/placeholder-product.jpg']
})

const productColors = computed(()=> Array.isArray(props.product?.colors) ? props.product!.colors! : [])
const productSizes = computed(()=> Array.isArray(props.product?.sizes) ? props.product!.sizes! : [])
const productGroups = computed(()=> {
  const groups = Array.isArray((props.product as any)?.sizeGroups) ? (props.product as any).sizeGroups as Array<{ label:string; values:string[] }> : []
  return groups.filter(g => Array.isArray(g.values) && g.values.length > 0)
})
import { fmtPrice } from '@/lib/currency'
const displayPrice = computed(()=> fmtPrice(Number(props.product?.price||0)))
const groupSelected = ref<Record<string,string>>({})
const initialized = ref(false)

function coerceSize(val?: string): string{
  const raw = String(val||'').trim()
  if (!raw) return ''
  const parts = raw.split('|').map(p=> p.trim()).filter(Boolean)
  const values = parts.map(p=> p.includes(':')? p.split(':',2)[1]?.trim()||'' : p).filter(Boolean)
  // pick the last value (most specific) or first
  return values[values.length-1] || values[0] || ''
}

watchEffect(()=>{
  if (typeof props.selectedColor !== 'undefined') selectedColor.value = props.selectedColor || ''
  const hasGroups = productGroups.value.length > 0
  if (!initialized.value){
    if (hasGroups){
      if (props.groupValues && Object.keys(props.groupValues).length){
        groupSelected.value = { ...props.groupValues }
        selectedSize.value = Object.entries(groupSelected.value).map(([k,v])=> `${k}:${v}`).join('|')
      } else if (typeof props.selectedSize !== 'undefined'){
        const raw = String(props.selectedSize||'').trim()
        const out: Record<string,string> = {}
        for (const seg of raw.split('|')){
          const p = seg.trim(); if (!p || !p.includes(':')) continue
          const [label,val] = p.split(':',2)
          if (label && val) out[label.trim()] = val.trim()
        }
        groupSelected.value = out
        selectedSize.value = raw
      }
    } else {
      if (typeof props.selectedSize !== 'undefined') selectedSize.value = coerceSize(props.selectedSize)
    }
    initialized.value = true
  }
})

watch(() => props.product?.id, () => {
  initialized.value = false
})

function pickGrouped(label: string, val: string){
  groupSelected.value = Object.assign({}, groupSelected.value, { [label]: val })
  const composite = Object.entries(groupSelected.value).map(([k,v])=> `${k}:${v}`).join('|')
  selectedSize.value = composite || val
}

// No grouped sizes in cart modal; use flat sizes only

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
