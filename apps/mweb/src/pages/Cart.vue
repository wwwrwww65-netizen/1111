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
      <div class="flex items-center justify-center mt-1 gap-1 text-[11px] text-gray-600 cursor-pointer" @click="goShippingAddresses" aria-label="تغيير عنوان الشحن">
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
          <button v-if="!isLoggedIn"
            class="px-4 h-10 rounded-[6px] text-[13px] font-semibold border border-gray-300 text-gray-700"
            @click="goLogin"
          >
            تسجيل الدخول
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
          <div class="w-20 h-20 bg-gray-100 rounded-[6px] overflow-hidden shrink-0 cursor-pointer" @click="openProduct(item.id)">
            <img :src="item.img" :alt="item.title" class="w-full h-full object-cover" />
    </div>

          <!-- Details -->
          <div class="flex-1 text-right space-y-1.5">
            <div class="text-[13px] font-semibold text-gray-800 leading-5 cursor-pointer" @click="openProduct(item.id)">{{ item.title }}</div>

            <!-- Variant chip oval gray with chevron-down -->
            <button v-if="hasOptions(item.id)"
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
                {{ fmtPrice(item.price) }}
              </div>
              <div class="flex items-center gap-1.5">
                <button v-if="item.qty > 1"
                  @click="changeQty(item.id, -1)"
                  class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                  aria-label="إنقاص الكمية"
                >
                  <Minus class="w-4 h-4 text-gray-600" />
                </button>
                <button v-else
                  @click="cart.remove(item.id)"
                  class="w-6 h-6 rounded-full border border-rose-300 flex items-center justify-center bg-rose-50"
                  aria-label="حذف المنتج"
                >
                  <Trash2 class="w-4 h-4 text-rose-600" />
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
            <div class="relative w-20 h-20 bg-gray-100 rounded-[6px] overflow-hidden shrink-0">
              <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop" alt="منتج انتهى من المخزون" class="w-full h-full object-cover opacity-50" />
              <div class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[11px] text-center py-0.5">تم البيع</div>
            </div>

            <!-- التفاصيل -->
            <div class="flex-1 text-right space-y-2">
              <div class="text-[13px] font-semibold text-gray-900 leading-5 opacity-60">
                منتج انتهى من المخزون
              </div>

              <!-- السعر والخصم -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 opacity-60">
                  <span class="text-[13px] font-bold text-[#8a1538]">{{ fmtPrice(9) }}</span>
                  <span class="text-[12px] text-gray-500 line-through">{{ fmtPrice(20) }}</span>
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

      <!-- قسم قد ترغب في الملء - العنوان فقط داخل الحاوية -->
      <section class="w-full bg-white px-4 py-4">
        <h2 class="text-[14px] font-semibold text-gray-800 text-center mb-1">
          قد ترغب في الملء
        </h2>
      </section>

      <!-- المنتجات المقترحة خارج الحاوية وبملء العرض، دون هوامش جانبية إضافية -->
      <div>
        <div v-if="!suggested.length" class="text-center text-gray-500 text-[12px] py-4">لا توجد مقترحات حالياً</div>
        <div v-else class="px-2 py-2">
          <div class="columns-2 gap-1 [column-fill:_balance]">
            <div v-for="(p,i) in suggested" :key="'sug-'+i" class="mb-1 break-inside-avoid">
              <ProductGridCard :product="{ id: p.id, title: p.title, images: (p.imagesNormalized&&p.imagesNormalized.length?p.imagesNormalized:[p.image]), brand: p.brand, discountPercent: p.discountPercent, bestRank: p.bestRank, bestRankCategory: p.bestRankCategory, basePrice: p.price.toFixed(2), soldPlus: p.soldPlus, couponPrice: p.couponPrice }" />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- شريط الدفع السفلي - يظهر فقط عندما تكون السلة ممتلئة -->
    <footer v-if="items.length" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex items-center justify-between z-50">
      <div class="text-[14px] font-semibold text-gray-900">{{ fmtPrice(selectedTotal) }}</div>
      <button
        class="flex items-center justify-center px-3 h-9 rounded-[6px] text-[12px] font-semibold text-white bg-[#8a1538]"
        aria-label="الانتقال إلى الدفع"
        @click="goToCheckout"
      >
        الانتقال إلى الدفع
      </button>
    </footer>

    <!-- Toast notification -->
    <div v-if="toast" class="fixed inset-0 flex items-center justify-center z-[60]">
      <div class="bg-black/80 text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg">
        {{ toastText }}
      </div>
    </div>

    <!-- مساحة إضافية للشريط السفلي عندما تكون السلة ممتلئة -->
    <div v-if="items.length" class="h-16"></div>

    <!-- Options modal: product-like design -->
    <ProductOptionsModal
      v-if="optionsModal.open"
      :onClose="closeOptionsModal"
      :onSave="onOptionsSave"
      :product="optionsProduct"
      :selectedColor="optionsModal.color"
      :selectedSize="optionsModal.size"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { useRouter } from 'vue-router'
import { ref, computed, reactive, onMounted } from 'vue'
import { initCurrency, fmtPrice } from '@/lib/currency'
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
  Minus, 
  Store, 
  Trash2 
} from 'lucide-vue-next'
import ProductOptionsModal from '../components/ProductOptionsModal.vue'
import ProductGridCard from '@/components/ProductGridCard.vue'
import ProductCard from '@/components/ProductCard.vue'

const cart = useCart()
const router = useRouter()
const { items, total } = storeToRefs(cart)

// عنوان الشحن الديناميكي
const shippingAddress = ref('اليمن')
const hasAnyAddress = ref(false)

// حالة تحديد المنتجات
const selectedItems = ref<string[]>([])
const selectAll = ref(false)
const menuOpen = ref(false)
const hasOutOfStock = ref(true)
const isLoggedIn = ref(false)
const suggested = ref<Array<{ id:string; title:string; image:string; images?: string[]; imagesNormalized?: string[]; price:number; brand?:string; colors?: string[]; colorCount?: number; discountPercent?: number; soldPlus?: string; bestRank?: number; bestRankCategory?: string; couponPrice?: string }>>([])

// Modal state
const optionsModal = reactive({
  open: false,
  productId: '',
  color: '',
  size: '',
  galleryIndex: 0
})

const optionsProductDetails = ref<any|null>(null)
const optionsProduct = computed(()=>{
  if (optionsProductDetails.value) return optionsProductDetails.value
  const it = items.value.find(i=> i.id === optionsModal.productId)
  if (!it) return null
  const images = it.img ? [it.img] : []
  return { id: it.id, title: it.title, price: it.price, images, colors: [{ label: it.variantColor||'أبيض', img: it.img||'/images/placeholder-product.jpg' }], sizes: ['XS','S','M','L','XL'] }
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

async function goToCheckout() {
  if (!selectedItems.value.length) {
    showToast('يرجى تحديد المنتجات المطلوبة')
    return
  }
  const { apiGet } = await import('@/lib/api')
  try{
    const list = await apiGet<any[]>('/api/addresses')
    if (!list || list.length === 0) { router.push('/address?return=/checkout'); return }
  }catch{
    router.push('/address?return=/checkout'); return
  }
  // Persist selected items to sessionStorage for Checkout filtering
  try{ sessionStorage.setItem('checkout_selected_ids', JSON.stringify(selectedItems.value)) }catch{}
  router.push('/checkout')
}

const toast = ref(false)
const toastText = ref('')
function showToast(msg: string){
  toastText.value = msg
  toast.value = true
  setTimeout(()=>{ toast.value = false }, 1200)
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
    // Fetch full product details (images, colors, sizes)
    fetchProductDetails(id)
  }
}

function closeOptionsModal() {
  optionsModal.open = false
}

function onOptionsSave(payload: { color: string; size: string }){
  const it = items.value.find(i=> i.id === optionsModal.productId)
  if (!it) return
  // حفظ اللون والمقاس داخل عنصر السلة
  it.variantColor = payload.color
  it.variantSize = payload.size
  cart.saveLocal()
}

async function fetchProductDetails(id: string){
  try{
    const base = (await import('@/lib/api')).API_BASE
    const res = await fetch(`${base}/api/product/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } })
    if (!res.ok) return
    const d = await res.json()
    const imgs = Array.isArray(d.images)? d.images : []
    const filteredImgs = imgs.filter((u:string)=> /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
    const variants = Array.isArray(d.variants)? d.variants : []
    const sizes = Array.isArray(d.sizes)? d.sizes.filter((s:any)=> typeof s==='string' && s.trim()) : []
    const colorLabels = Array.from(new Set(variants.map((v:any)=> String(v.color||v.name||v.value||'').trim()).filter(Boolean)))
    const colors = colorLabels.map((label:string)=> ({ label, img: filteredImgs[0] || '/images/placeholder-product.jpg' }))
    optionsProductDetails.value = {
      id: d.id || id,
      title: d.name || (items.value.find(i=>i.id===id)?.title) || '',
      price: Number(d.price || (items.value.find(i=>i.id===id)?.price) || 0),
      images: filteredImgs.length ? filteredImgs : [items.value.find(i=>i.id===id)?.img || '/images/placeholder-product.jpg'],
      colors,
      sizes: sizes.length ? sizes : Array.from(new Set(variants.map((v:any)=> String(v.size||v.value||v.name||'').trim()).filter(Boolean)))
    }
  }catch{}
}

function hasOptions(id: string){
  const it = items.value.find(i=> i.id===id)
  if (!it) return false
  if (optionsProductDetails.value && optionsModal.productId===id){
    const hasColors = Array.isArray(optionsProductDetails.value.colors) && optionsProductDetails.value.colors.length>0
    const hasSizes = Array.isArray(optionsProductDetails.value.sizes) && optionsProductDetails.value.sizes.length>0
    return hasColors || hasSizes
  }
  // fallback: show button only if product carries options meta
  const meta = (it as any).options || {}
  const hasColorsMeta = Array.isArray(meta.colors) && meta.colors.length>0
  const hasSizesMeta = Array.isArray(meta.sizes) && meta.sizes.length>0
  return hasColorsMeta || hasSizesMeta || !!(it.variantColor || it.variantSize)
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
onMounted(async () => {
  // تحقق من تسجيل الدخول
  try{ const me = await (await import('@/lib/api')).apiGet<any>('/api/me'); isLoggedIn.value = !!me?.user }catch{ isLoggedIn.value = false }
  // Initialize currency from backend
  try{ await initCurrency() }catch{}
  // جلب عنوان الشحن الافتراضي
  try{
    const list = await (await import('@/lib/api')).apiGet<any[]>('/api/addresses')
    hasAnyAddress.value = Array.isArray(list) && list.length>0
    if (hasAnyAddress.value){
      const a = (list.find((x:any)=>x.isDefault) || list[0]) || {}
      const parts = [a.country || 'اليمن', (a.state||a.province), a.city, a.area, a.street].filter((s:string)=>!!s)
      shippingAddress.value = parts.join(' / ') || 'اليمن'
    } else {
      shippingAddress.value = 'اليمن'
    }
  }catch{ shippingAddress.value = 'اليمن'; hasAnyAddress.value = false }
  // جلب منتجات مقترحة
  try{
    const r = await (await import('@/lib/api')).apiGet<any>('/api/products?limit=6')
    const items = r?.items || []
    const normalizeList = (arr: string[]|undefined): string[] => {
      const list = Array.isArray(arr) ? arr : []
      const filtered = list.filter(u => /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
      return filtered.length ? filtered : ['/images/placeholder-product.jpg']
    }
    suggested.value = items.map((x:any)=> ({
      id: x.id,
      title: x.name,
      image: (normalizeList(x.images)[0]||'/images/placeholder-product.jpg'),
      images: normalizeList(x.images),
      imagesNormalized: normalizeList(x.images),
      price: Number(x.price||0),
      brand: x.brand||'',
      discountPercent: typeof x.discountPercent==='number'? x.discountPercent : undefined,
      soldPlus: x.soldPlus||undefined,
      bestRank: typeof x.bestRank==='number'? x.bestRank : undefined,
      bestRankCategory: x.bestRankCategory||undefined,
      couponPrice: x.couponPrice||undefined,
      options: { colors: (x.variants||[]).map((v:any)=>v.color).filter((c:any)=>!!c), sizes: (x.variants||[]).map((v:any)=>v.size).filter((s:any)=>!!s) }
    }))
  }catch{}
})

function goLogin(){ router.push('/login?next=/cart') }
function openProduct(p:any){ const id = typeof p==='string'? p : (p?.id||''); if (id) router.push(`/p?id=${encodeURIComponent(String(id))}`) }
function addSugToCart(p:any){
  cart.add({ id: String(p.id), title: String(p.title), price: Number(p.price||0), img: String(p.image||'') }, 1)
}

function goShippingAddresses(){
  if (hasAnyAddress.value) router.push('/address?return=/cart')
  else router.push('/address?return=/cart&open=1')
}
</script>

<style scoped>
/* استخدام Tailwind CSS - لا حاجة لأنماط إضافية */
</style>