<template>
  <div class="min-h-screen bg-[#f7f7f7] flex flex-col items-center" dir="rtl">
    <!-- الهيدر - نفس التصميم للحالتين -->
    <header class="w-full bg-white border-b border-gray-200 px-4 pt-3 pb-2">
      <div class="flex items-center justify-between">
        <!-- إذا كانت السلة ممتلئة - عرض تحديد الكل -->
        <div v-if="items.length" class="flex items-center gap-1.5">
          <button
            @click="toggleSelectAll"
            :class="`w-5 h-5 rounded-full border flex items-center justify-center ${
              selectAll ? 'bg-[#8a1538] border-[#8a1538]' : 'bg-white border-gray-400'
            }`"
            aria-label="تحديد جميع المنتجات"
          >
            <Check v-if="selectAll" class="w-4 h-4 text-white" />
          </button>
          <span class="text-[12px] text-gray-800 font-medium">جميع</span>
        </div>
        
        <!-- إذا كانت السلة فارغة - مساحة فارغة -->
        <div v-else class="w-16"></div>

        <!-- العنوان -->
        <h1 class="text-[15px] font-semibold text-gray-900 mx-auto">سلة التسوق</h1>

        <!-- الأزرار اليمنى -->
        <div class="flex items-center gap-1.5">
          <!-- إذا كانت السلة ممتلئة - قائمة الخيارات -->
          <div v-if="items.length" class="relative">
            <button @click="menuOpen = !menuOpen" aria-label="خيارات إضافية">
              <MoreHorizontal class="w-5 h-5 text-gray-600" />
            </button>
            <div v-if="menuOpen" class="absolute left-0 top-7 w-40 bg-white border border-gray-200 rounded-[6px] shadow-lg text-right z-50">
              <button class="w-full px-3 py-2 text-[12px] text-gray-800 flex items-center gap-2 hover:bg-gray-50">
                <Share2 class="w-4 h-4 text-gray-500" />
                مشاركة السلة
              </button>
              <button class="w-full px-3 py-2 text-[12px] text-gray-800 flex items-center gap-2 hover:bg-gray-50">
                <Settings class="w-4 h-4 text-gray-500" />
                إدارة
              </button>
              <button class="w-full px-3 py-2 text-[12px] text-gray-800 flex items-center gap-2 hover:bg-gray-50">
                <Heart class="w-4 h-4 text-gray-500" />
                قائمة الأمنيات
              </button>
            </div>
          </div>
          
          <!-- زر الإغلاق -->
          <button aria-label="إغلاق" @click="goBack">
            <X class="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>

      <!-- الشحن إلى - نص صغير مع سهم -->
      <div class="flex items-center justify-center mt-1 gap-1 text-[11px] text-gray-600">
        <span>يتم الشحن إلى {{ shippingAddress }}</span>
        <ChevronLeft class="w-4 h-4 text-gray-400" />
      </div>
    </header>

    <!-- المحتوى الرئيسي -->
    <main class="w-full flex-1">
      <!-- السلة الفارغة -->
      <section v-if="!items.length" class="bg-white w-full flex flex-col items-center justify-center py-8 space-y-4">
        <!-- أيقونة السلة -->
        <div class="w-20 h-20 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm">
          <ShoppingCart class="w-10 h-10 text-gray-400" />
        </div>

        <!-- النص -->
        <div class="text-[14px] text-gray-800 font-medium">
          عربة التسوق فارغة
        </div>

        <!-- أزرار الإجراءات -->
        <div class="flex gap-3">
          <button
            class="px-6 h-10 rounded-[6px] text-[13px] font-semibold text-white"
            style="background-color: #8a1538"
            @click="goShopping"
          >
            تسوق الآن
          </button>
          <button
            class="px-4 h-10 rounded-[6px] text-[13px] font-semibold border border-gray-300 text-gray-700"
            @click="addTestItems"
          >
            إضافة منتجات تجريبية
          </button>
        </div>
      </section>

      <!-- السلة الممتلئة -->
      <div v-else class="space-y-1 pt-1">
        <!-- المنتجات في السلة -->
        <section v-for="item in items" :key="item.id" class="bg-white w-[99.5%] mx-auto rounded-[6px] border border-gray-200 p-2 flex items-start gap-2">
          <!-- Select item -->
          <button
            @click="toggleItem(item.id)"
            :class="`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${
              selectedItems.includes(item.id) ? 'bg-[#8a1538] border-[#8a1538]' : 'bg-white border-gray-400'
            }`"
            aria-label="تحديد المنتج"
          >
            <Check v-if="selectedItems.includes(item.id)" class="w-4 h-4 text-white" />
          </button>

          <!-- Image -->
          <div class="w-20 h-20 bg-gray-100 rounded-[6px] overflow-hidden shrink-0">
            <img :src="item.img" :alt="item.title" class="w-full h-full object-cover" />
    </div>

          <!-- Details -->
          <div class="flex-1 text-right space-y-1.5">
            <div class="text-[13px] font-semibold text-gray-800 leading-5">{{ item.title }}</div>

            <!-- Variant chip oval gray with chevron-down -->
            <button
              @click="openOptions(item.id)"
              class="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-gray-100 text-[11px] text-gray-700 border border-gray-200"
              aria-label="تعديل اللون والمقاس"
            >
              <span>{{ item.variantColor || 'أبيض' }} / {{ item.variantSize || 'M' }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-gray-500" />
            </button>

            <!-- Price & qty (qty on left) -->
            <div class="flex items-center justify-between">
              <div class="text-[13px] text-[#8a1538] font-bold">
                {{ item.price.toFixed(2) }} ر.س
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  @click="changeQty(item.id, -1)"
                  class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                  aria-label="إنقاص الكمية"
                >
                  <Minus class="w-4 h-4 text-gray-600" />
                </button>
                <span class="text-[12px] text-gray-800 min-w-[1.5rem] text-center">{{ item.qty }}</span>
                <button
                  @click="changeQty(item.id, 1)"
                  class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                  aria-label="زيادة الكمية"
                >
                  <Plus class="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- بطاقة انتهى من المخزون + المنتجات غير صالحة -->
        <section v-if="hasOutOfStock" class="bg-white w-[99.5%] mx-auto rounded-[6px] border border-gray-200 p-3 space-y-3">
          <!-- شريط تنبيه أعلى البطاقة -->
          <div class="w-full rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 text-center">
            انتهى من المخزون والمنتجات غير صالحة
            </div>

          <!-- محتوى البطاقة -->
          <div class="flex items-start gap-3">
            <!-- صورة المنتج -->
            <div class="w-20 h-20 bg-gray-100 rounded-[6px] overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop"
                alt="منتج انتهى من المخزون"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- التفاصيل -->
            <div class="flex-1 text-right space-y-2">
              <div class="text-[13px] font-semibold text-gray-900 leading-5">
                منتج انتهى من المخزون
              </div>

              <!-- السعر والخصم -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[13px] font-bold text-[#8a1538]">9.00 ر.س</span>
                  <span class="text-[12px] text-gray-500 line-through">20.00 ر.س</span>
                  <span class="text-[11px] px-2 py-0.5 rounded-[4px] bg-rose-100 text-rose-700 border border-rose-200">
                    55%
                  </span>
                </div>

                <!-- أيقونات الإجراءات -->
                <div class="flex items-center gap-2">
                  <button class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center" aria-label="مشاركة">
                    <Share2 class="w-4 h-4 text-gray-600" />
                  </button>
                  <button class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center" aria-label="إضافة للمفضلة">
                    <Heart class="w-4 h-4 text-gray-600" />
                  </button>
                  <button class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center" aria-label="حذف">
                    <X class="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <!-- زر منتجات مشابهة -->
              <div class="flex justify-start">
                <button
                  class="h-9 px-3 rounded-[6px] text-[12px] font-semibold border border-[#8a1538] text-[#8a1538] bg-white"
                  aria-label="منتجات مشابهة"
                >
                  منتجات مشابهة
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- مسافة بسيطة -->
      <div class="h-4" />

      <!-- قسم قد ترغب في الملء - يظهر في الحالتين -->
      <section class="w-full bg-white px-4 py-4">
        <h2 class="text-[14px] font-semibold text-gray-800 text-center mb-3">
          قد ترغب في الملء
        </h2>

        <!-- المنتجات المقترحة -->
        <div class="space-y-4">
          <!-- هنا يمكن إضافة مكون عرض المنتجات المقترحة -->
          <div class="text-center text-gray-500 text-[12px] py-4">
            منتجات مقترحة ستظهر هنا
      </div>
    </div>
      </section>
    </main>

    <!-- شريط الدفع السفلي - يظهر فقط عندما تكون السلة ممتلئة -->
    <footer v-if="items.length" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex items-center justify-between z-50">
      <div class="text-[14px] font-semibold text-gray-900">{{ selectedTotal.toFixed(2) }} ر.س</div>
      <button
        class="flex items-center justify-center px-3 h-9 rounded-[6px] text-[12px] font-semibold text-white bg-[#8a1538]"
        aria-label="الانتقال إلى الدفع"
        @click="goToCheckout"
      >
        الانتقال إلى الدفع
      </button>
    </footer>

    <!-- مساحة إضافية للشريط السفلي عندما تكون السلة ممتلئة -->
    <div v-if="items.length" class="h-16"></div>

    <!-- Options modal: product-like design -->
    <ProductOptionsModal v-if="optionsModal.open" :onClose="closeOptionsModal" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { useRouter } from 'vue-router'
import { ref, computed, reactive } from 'vue'
import { 
  X, 
  ShoppingCart, 
  ChevronLeft, 
  Check, 
  MoreHorizontal, 
  Share2, 
  Settings, 
  Heart, 
  ChevronDown, 
  Plus, 
  Minus 
} from 'lucide-vue-next'
import ProductOptionsModal from '../components/ProductOptionsModal.vue'

const cart = useCart()
const router = useRouter()
const { items, total } = storeToRefs(cart)

// عنوان الشحن الديناميكي
const shippingAddress = "الوحدة معين، 13،22،14"

// حالة تحديد المنتجات
const selectedItems = ref<string[]>([])
const selectAll = ref(false)
const menuOpen = ref(false)
const hasOutOfStock = ref(true)

// Modal state
const optionsModal = reactive({
  open: false,
  productId: '',
  color: '',
  size: '',
  galleryIndex: 0
})

// إضافة خصائص المنتجات المفقودة
const enhancedItems = computed(() => {
  return items.value.map(item => ({
    ...item,
    variantColor: item.variantColor || 'أبيض',
    variantSize: item.variantSize || 'M'
  }))
})

// حساب الإجمالي للمنتجات المحددة
const selectedTotal = computed(() => {
  return selectedItems.value.reduce((sum, id) => {
    const item = items.value.find(i => i.id === id)
    if (!item) return sum
    return sum + item.price * item.qty
  }, 0)
})

// وظائف التنقل
function goBack() {
  router.back()
}

function goShopping() {
  router.push('/')
}

function goToCheckout() {
  router.push('/checkout')
}

// وظائف إدارة السلة
function toggleItem(id: string) {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
  updateSelectAll()
}

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  if (selectAll.value) {
    selectedItems.value = items.value.map(item => item.id)
  } else {
    selectedItems.value = []
  }
}

function updateSelectAll() {
  selectAll.value = selectedItems.value.length === items.value.length
}

function changeQty(id: string, delta: number) {
  const item = items.value.find(i => i.id === id)
  if (item) {
    const newQty = Math.max(1, item.qty + delta)
    cart.update(id, newQty)
  }
}

function openOptions(id: string) {
  const item = items.value.find(i => i.id === id)
  if (item) {
    optionsModal.open = true
    optionsModal.productId = id
    optionsModal.color = item.variantColor || 'أبيض'
    optionsModal.size = item.variantSize || 'M'
    optionsModal.galleryIndex = 0
  }
}

function closeOptionsModal() {
  optionsModal.open = false
}

// إضافة منتجات تجريبية للاختبار
function addTestItems() {
  if (items.value.length === 0) {
    cart.add({
      id: 'test-1',
      title: 'تيشيرت نسائي بياقة مستديرة وقماش مريح',
      price: 34.0,
      img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop',
      variantColor: 'أبيض',
      variantSize: 'S'
    }, 1)
    
    cart.add({
      id: 'test-2', 
      title: 'قميص بأكمام قصيرة وتفاصيل مجمعة',
      price: 27.2,
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop',
      variantColor: 'كحلي',
      variantSize: 'M'
    }, 1)
  }
}

// إضافة المنتجات التجريبية عند تحميل الصفحة
import { onMounted } from 'vue'
onMounted(() => {
  // يمكن إزالة هذا السطر لاختبار السلة الفارغة
  // addTestItems()
})
</script>

<style scoped>
/* استخدام Tailwind CSS - لا حاجة لأنماط إضافية */
</style>

