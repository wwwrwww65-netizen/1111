<template>
  <div class="min-h-screen bg-[#f7f7f7] flex flex-col items-center" dir="rtl">
    <!-- الهيدر - نفس التصميم للحالتين -->
    <header class="w-full bg-white border-b border-gray-200 px-4 pt-3 pb-2">
      <div class="flex items-center justify-between">
        <!-- إذا كانت السلة ممتلئة - عرض تحديد الكل -->
        <div v-if="validItems.length" class="flex items-center gap-1.5">
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
      <section v-if="!items.length && !hasOutOfStock" class="bg-white w-full flex flex-col items-center justify-center py-8 space-y-4">
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
        <section v-for="item in validItems" :key="item.uid" class="bg-white w-[99.5%] mx-auto rounded-[6px] border border-gray-200 p-2 flex items-start gap-2">
          <!-- Select item -->
          <button
            @click="toggleItem(item.uid)"
            :class="`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${
              selectedItems.includes(item.uid) ? 'bg-[#8a1538] border-[#8a1538]' : 'bg-white border-gray-400'
            }`"
            aria-label="تحديد المنتج"
          >
            <Check v-if="selectedItems.includes(item.uid)" class="w-4 h-4 text-white" />
          </button>

          <!-- Image -->
          <div class="w-20 h-20 bg-gray-100 rounded-[6px] overflow-hidden shrink-0 cursor-pointer" @click="openProduct(item.id)">
            <img :src="item.img" :alt="item.title" class="w-full h-full object-cover" />
    </div>

          <!-- Details -->
          <div class="flex-1 text-right space-y-1.5">
            <div class="text-[13px] font-semibold text-gray-800 leading-5 cursor-pointer" @click="openProduct(item.id)">{{ item.title }}</div>

            <!-- Variant chip oval gray with chevron-down -->
            <button
              v-if="hasOptions(item.id)"
              @click="openOptions(item.uid)"
              class="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-gray-100 text-[11px] text-gray-700 border border-gray-200"
              aria-label="تعديل اللون والمقاس"
            >
              <span>{{ variantLabel(item.variantColor, item.variantSize) }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-gray-500" />
            </button>

            <!-- Price & qty (qty on left) -->
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[13px] text-[#8a1538] font-bold">{{ fmtPrice(item.price) }}</div>
                <div v-if="afterOf(item) != null" class="mt-1 inline-flex items-center gap-1 px-2 h-6 rounded" style="background: rgba(250,99,56,.10)">
                  <span class="text-[12px] font-extrabold" style="color:#fa6338">{{ fmtPrice(afterOf(item) || 0) }}</span>
                  <span class="text-[10px]" style="color:#fa6338">/بعد الكوبون</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <button v-if="item.qty > 1"
                  @click="changeQty(item.uid, -1)"
                  class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                  aria-label="إنقاص الكمية"
                >
                  <Minus class="w-4 h-4 text-gray-600" />
                </button>
                <button v-else
                  @click="cart.remove(item.uid)"
                  class="w-6 h-6 rounded-full border border-rose-300 flex items-center justify-center bg-rose-50"
                  aria-label="حذف المنتج"
                >
                  <Trash2 class="w-4 h-4 text-rose-600" />
                </button>
                <span class="text-[12px] text-gray-800 min-w-[1.5rem] text-center">{{ item.qty }}</span>
                <button
                  @click="changeQty(item.uid, 1)"
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
          <div class="w-full rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 text-center">
            انتهى من المخزون والمنتجات غير صالحة
          </div>
          <div v-for="item in oosItems" :key="'oos-'+item.uid" class="flex items-start gap-3">
            <div class="relative w-20 h-20 bg-gray-100 rounded-[6px] overflow-hidden shrink-0">
              <img :src="item.img" :alt="item.title" class="w-full h-full object-cover opacity-50" />
              <div class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[11px] text-center py-0.5">
                {{ statusOf(item.uid)==='invalid' ? 'غير صالح' : 'تم البيع' }}
              </div>
            </div>
            <div class="flex-1 text-right space-y-2">
              <div class="text-[13px] font-semibold text-gray-900 leading-5 opacity-60 line-clamp-2">{{ item.title }}</div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 opacity-60">
                  <span class="text-[13px] font-bold text-[#8a1538]">{{ fmtPrice(item.price) }}</span>
                  <span v-if="item.variantColor || item.variantSize" class="text-[11px] text-gray-500">{{ variantLabel(item.variantColor, item.variantSize) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center" aria-label="حذف" @click="cart.remove(item.uid)">
                    <X class="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div class="flex justify-start">
                <button class="h-9 px-3 rounded-[6px] text-[12px] font-semibold border border-[#8a1538] text-[#8a1538] bg-white" aria-label="منتجات مشابهة">
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
              <ProductGridCard 
                :product="{ id: p.id, title: p.title, images: (p.imagesNormalized&&p.imagesNormalized.length?p.imagesNormalized:[p.image]), brand: p.brand, discountPercent: p.discountPercent, bestRank: p.bestRank, bestRankCategory: p.bestRankCategory, basePrice: p.price.toFixed(2), soldPlus: p.soldPlus, couponPrice: p.couponPrice, isTrending: (p as any).isTrending===true || (Array.isArray((p as any).badges)&& (p as any).badges.some((b:any)=> /trending|trend|ترند/i.test(String(b?.key||b?.title||'')))) }"
                @add="openSuggestOptions"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- شريط الدفع السفلي - يظهر فقط عندما تكون السلة ممتلئة -->
    <footer v-if="validItems.length" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex items-center justify-between z-50">
      <div class="text-[12px] text-gray-500" v-if="effectiveDiscount>0">خصم مفعّل: -{{ fmtPrice(effectiveDiscount) }}</div>
      <div class="text-[14px] font-semibold" style="color:#fa6338">كوبونات · {{ fmtPrice(totalAfterCoupons) }}</div>
      <button
        class="flex items-center justify-center px-3 h-9 rounded-[6px] text-[12px] font-semibold text-white bg-[#8a1538]"
        aria-label="الانتقال إلى الدفع"
        @click="goToCheckout"
      >
        الانتقال إلى الدفع
      </button>
    </footer>

    <!-- Toast notification (مطابق لصفحة المنتج) -->
    <div 
      v-if="toast" 
      class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2"
    >
      <Check class="w-4 h-4 text-green-400" />
      <span>{{ toastText }}</span>
    </div>

    <!-- إشعار: يرجى تحديد الخيارات (نفس صفحة المنتج) -->
    <Transition name="fade">
      <div v-if="requireOptionsNotice" class="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div class="bg-black/80 text-white text-[13px] px-4 py-2.5 rounded-md shadow-lg">
          يرجى تحديد الخيارات
        </div>
      </div>
    </Transition>

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
      :groupValues="optionsModal.groupValues"
      :hideTitle="optionsModal.source==='edit' ? false : true"
      :primaryLabel="optionsModal.source==='edit' ? 'تحديث' : 'أضف إلى عربة التسوق بنجاح'"
      :showWishlist="false"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { useRouter } from 'vue-router'
import { ref, computed, reactive, onMounted, watch } from 'vue'
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
import { markTrending } from '@/lib/trending'

const cart = useCart()
const router = useRouter()
const { items, total } = storeToRefs(cart)

// عنوان الشحن الديناميكي: إظهار المحافظة والمنطقة فقط
const shippingAddress = ref('اليمن')
const hasAnyAddress = ref(false)

// حالة تحديد المنتجات
const selectedItems = ref<string[]>([])
const selectAll = ref(false)
const menuOpen = ref(false)
const hasOutOfStock = ref(false)
const oosMap = ref<Record<string,'oos'|'invalid'>>({})
const validItems = computed(()=> items.value.filter(i=> !oosMap.value[i.uid]))
const oosItems = computed(()=> items.value.filter(i=> !!oosMap.value[i.uid]))
function statusOf(uid: string){ return oosMap.value[uid] }
const isLoggedIn = ref(false)
const suggested = ref<Array<{ id:string; title:string; image:string; images?: string[]; imagesNormalized?: string[]; price:number; brand?:string; colors?: string[]; colorCount?: number; discountPercent?: number; soldPlus?: string; bestRank?: number; bestRankCategory?: string; couponPrice?: string }>>([])

// Modal state
const optionsModal = reactive({
  open: false,
  productId: '',
  color: '',
  size: '',
  galleryIndex: 0,
  groupValues: {} as Record<string,string>,
  source: 'edit' as 'edit'|'suggest'
})

const optionsCache = reactive<Record<string, any>>({})
const optionsProduct = computed(()=>{
  const pid = optionsModal.productId
  return pid ? optionsCache[pid] || null : null
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
const selectedSubtotal = computed(() => {
  return selectedItems.value.reduce((sum, uid) => {
    const item = items.value.find(i => i.uid === uid)
    if (!item) return sum
    if (oosMap.value[item.uid]) return sum
    return sum + item.price * item.qty
  }, 0)
})
const effectiveTotal = ref<number>(0)
const effectiveDiscount = ref<number>(0)
async function refreshEffectivePricing(){
  try{
    const { apiPost } = await import('@/lib/api')
    const itemsPayload = selectedItems.value.map(uid=>{ const it = items.value.find(i=> i.uid===uid); return it? { id: it.id, qty: it.qty } : null }).filter(Boolean)
    const j = await apiPost('/api/pricing/effective', { items: itemsPayload })
    effectiveTotal.value = Number((j as any)?.total||selectedSubtotal.value)
    effectiveDiscount.value = Number((j as any)?.discount||0)
  }catch{ effectiveTotal.value = selectedSubtotal.value; effectiveDiscount.value = 0 }
}
watch([selectedItems, items], ()=>{ refreshEffectivePricing() }, { deep:true })
onMounted(()=> refreshEffectivePricing())
// Always hydrate cart from server on cart page load to avoid stale local state
onMounted(()=> { try{ cart.syncFromServer(true) }catch{} })

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
  try{
    const { trackEvent } = await import('@/lib/track')
    const contents = (validItems.value||[]).filter(it=> selectedItems.value.includes(it.uid)).map(it=> ({ id: String(it.id), quantity: Number(it.qty||1), item_price: Number(it.price||0) }))
    await trackEvent('InitiateCheckout', { value: Number(effectiveTotal.value||0), currency: (window as any).__CURRENCY_CODE__||'YER', content_ids: contents.map(c=> c.id), content_type:'product_group', contents, num_items: contents.length })
  }catch{}
  // في حال لم يسجل المستخدم الدخول، نوجّهه لتسجيل الدخول ثم نعود للسلة
  if (!isLoggedIn.value) { router.push({ path:'/login', query: { return: '/cart' } }); return }
  const { apiGet } = await import('@/lib/api')
  try{
    const list = await apiGet<any[]>('/api/addresses')
    if (!list || list.length === 0) { router.push('/address?return=/checkout'); return }
  }catch{
    router.push('/address?return=/checkout'); return
  }
  // Persist selected items to sessionStorage for Checkout filtering
  try{ sessionStorage.setItem('checkout_selected_uids', JSON.stringify(selectedItems.value)) }catch{}
  router.push('/checkout')
}

const toast = ref(false)
const toastText = ref('')
function showToast(msg: string){
  toastText.value = msg
  toast.value = true
  setTimeout(()=>{ toast.value = false }, 1200)
}

// إشعار نقص الخيارات (مطابق لصفحة المنتج)
const requireOptionsNotice = ref(false)

function stripGroupLabels(title: string): string{
  try{
    // Replace occurrences like (مقاسات بالأحرف:M|مقاسات بالأرقام:42) → (M | 42)
    return String(title||'').replace(/\(([^)]*)\)/g, (_m, inner)=>{
      const parts = String(inner||'').split('|').map((p:string)=> String(p||'').trim()).filter(Boolean)
      const values = parts.map((p:string)=> p.includes(':')? p.split(':',2)[1]?.trim()||'' : p).filter(Boolean)
      return values.length? `(${values.join(' | ')})` : ''
    })
  }catch{ return title }
}

function formatSizeForChip(s?: string){
  const raw = String(s||'').trim()
  if (!raw) return '—'
  const parts = raw.split('|').map(p=> p.trim()).filter(Boolean)
  const values = parts.map(p=> p.includes(':')? p.split(':',2)[1]?.trim()||'' : p)
  const cleaned = values.filter(Boolean)
  return cleaned.length ? cleaned.join(' | ') : '—'
}

function variantLabel(color?: string, size?: string){
  const c = String(color||'').trim()
  const s = formatSizeForChip(size)
  if (c && s !== '—') return `${c} / ${s}`
  if (c) return c
  if (s !== '—') return s
  return ''
}

function parseSizeComposite(s?: string): Record<string,string> {
  const out: Record<string,string> = {}
  const raw = String(s||'').trim()
  if (!raw) return out
  for (const p of raw.split('|')){
    const seg = p.trim(); if (!seg) continue
    if (seg.includes(':')){ const [label,val] = seg.split(':',2); if (label && val) out[label.trim()] = val.trim() }
  }
  return out
}

// وظائف إدارة السلة
function toggleItem(uid: string) {
  const index = selectedItems.value.indexOf(uid)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(uid)
  }
  updateSelectAll()
}

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  if (selectAll.value) {
    selectedItems.value = validItems.value.map(item => item.uid)
  } else {
    selectedItems.value = []
  }
}

function updateSelectAll() {
  selectAll.value = selectedItems.value.length > 0 && selectedItems.value.length === validItems.value.length
}

function changeQty(uid: string, delta: number) {
  const item = items.value.find(i => i.uid === uid)
  if (item) {
    const newQty = Math.max(1, item.qty + delta)
    cart.update(uid, newQty)
  }
}

async function openOptions(uid: string) {
  const item = items.value.find(i => i.uid === uid)
  if (item) {
    optionsModal.source = 'edit'
    optionsModal.productId = item.id
    ;(optionsModal as any).uid = uid
    optionsModal.color = item.variantColor || 'أبيض'
    optionsModal.size = item.variantSize || ''
    optionsModal.groupValues = parseSizeComposite(item.variantSize)
    optionsModal.galleryIndex = 0
    // Open immediately; modal will show skeleton while fetching
    optionsModal.open = true
    fetchProductDetails(item.id)
  }
}

function closeOptionsModal() {
  optionsModal.open = false
}

function onOptionsSave(payload: { color: string; size: string }){
  const isSuggest = (optionsModal as any).source === 'suggest'
  const prod = optionsProduct.value
  // تحقق من اكتمال الخيارات (المقاسات مطلوبة فقط عند وجودها)
  try{
    const groups = Array.isArray(prod?.sizeGroups) ? prod!.sizeGroups : []
    if (groups.length){
      const composite = String(payload.size||'')
      const missing = groups.some(g=> !new RegExp(`(?:^|\|)${g.label}:[^|]+`).test(composite))
      if (missing){ requireOptionsNotice.value = true; setTimeout(()=> requireOptionsNotice.value = false, 2000); return }
    } else {
      const hasSizes = Array.isArray(prod?.sizes) && prod!.sizes.length>0
      if (hasSizes && !String(payload.size||'').trim()){ requireOptionsNotice.value = true; setTimeout(()=> requireOptionsNotice.value = false, 2000); return }
    }
  }catch{}

  // مسار بطاقات التوصيات: أضف عنصراً جديداً إلى السلة
  if (isSuggest || !(optionsModal as any).uid){
    try{
      const opt = optionsCache[optionsModal.productId]
      let img: string | undefined = undefined
      if (opt && Array.isArray(opt.colors)){
        const c = opt.colors.find((x:any)=> String(x.label||'').trim() === String(payload.color||'').trim())
        if (c && c.img) img = c.img
      }
      if (!img){
        const imgs = Array.isArray(prod?.images) ? prod!.images : []
        img = imgs && imgs[0] ? imgs[0] : '/images/placeholder-product.jpg'
      }
      const chosenColor = String(payload.color||'') || (Array.isArray(prod?.colors) && prod!.colors[0]?.label) || ''
      const chosenSize = String(payload.size||'') || undefined
      cart.add({ id: prod?.id || optionsModal.productId, title: prod?.title || '', price: Number(prod?.price||0), img, variantColor: chosenColor || undefined, variantSize: chosenSize || undefined }, 1)
      showToast('تمت الإضافة إلى السلة')
    }catch{}
    optionsModal.open = false
    return
  }

  // مسار تعديل عنصر موجود في السلة
  const uid = (optionsModal as any).uid as string
  const it = items.value.find(i=> i.uid === uid)
  if (!it) { optionsModal.open = false; return }
  if (payload.color) it.variantColor = payload.color
  if (payload.size) it.variantSize = payload.size
  try{
    const pid = optionsModal.productId
    const opt = optionsCache[pid]
    if (opt && Array.isArray(opt.colors)){
      const c = opt.colors.find((x:any)=> String(x.label||'').trim() === String(payload.color||'').trim())
      if (c && c.img){ it.img = c.img }
    }
  }catch{}
  cart.upsertVariantMeta(uid, { color: payload.color, size: payload.size, img: it.img })
  optionsModal.open = false
}

async function fetchProductDetails(id: string){
  try{
    if (optionsCache[id]) return optionsCache[id]
    const base = (await import('@/lib/api')).API_BASE
    const res = await fetch(`${base}/api/product/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } })
    if (!res.ok) return
    const d = await res.json()
    const imgs = Array.isArray(d.images)? d.images : []
    const filteredImgs = imgs.filter((u:string)=> /^https?:\/\//i.test(String(u)) && !String(u).startsWith('blob:'))
    const variants = Array.isArray(d.variants)? d.variants : []
    // ==== Helpers (align with PDP sanitation) ====
    const looksSizeToken = (s:string): boolean => {
      const v = String(s||'').trim()
      if (!v) return false
      // Support common alpha sizes and extended forms (2XL..5XL), case-insensitive
      if (/^(xxs|xs|s|m|l|xl|xxl|xxxl|xxxxl|xxxxxl|2xl|3xl|4xl|5xl)$/i.test(v)) return true
      // Numeric sizes (e.g., shoes 36-46, jeans 28-42)
      if (/^\d{1,3}$/.test(v)) return true
      return false
    }
    const COLOR_WORDS = new Set([
      'احمر','أحمر','red','ازرق','أزرق','blue','اخضر','أخضر','green','اصفر','أصفر','yellow','وردي','زهري','pink','اسود','أسود','black','ابيض','أبيض','white','بنفسجي','violet','purple','برتقالي','orange','بني','brown','رمادي','gray','grey','سماوي','turquoise','تركوازي','تركواز','بيج','beige','كحلي','navy','ذهبي','gold','فضي','silver'
    ])
    const isColorWord = (s:string): boolean => COLOR_WORDS.has(String(s||'').trim().toLowerCase())

    // ==== Sizes: only accept real size tokens, never color words ====
    let sizes = Array.isArray(d.sizes)? (d.sizes as any[]).filter((s:any)=> typeof s==='string' && looksSizeToken(String(s).trim()) && !isColorWord(String(s).trim())) : []
    if (!sizes.length && variants.length){
      const set = new Set<string>()
      for (const v of variants){
        const sv = String((v as any).size||'').trim()
        if (sv && looksSizeToken(sv) && !isColorWord(sv)) set.add(sv)
      }
      sizes = Array.from(set)
    }
    // Normalize and sort sizes in logical ascending order: letters then numbers
    const order = ['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL']
    sizes = sizes.sort((a:string,b:string)=>{
      const ai = order.indexOf(a.toUpperCase())
      const bi = order.indexOf(b.toUpperCase())
      if (ai!==-1 || bi!==-1) return (ai===-1? 999:ai) - (bi===-1? 999:bi)
      const an = parseFloat(a); const bn = parseFloat(b)
      if (!isNaN(an) && !isNaN(bn)) return an - bn
      return a.localeCompare(b, 'ar')
    })

    // ==== Colors: prefer attributes.color → colorGalleries; never derive from generic name/value ====
    const galleries = Array.isArray(d.colorGalleries) ? d.colorGalleries : []
    let colors: Array<{ label: string; img: string }> = []
    const normalizeImage = (u: any): string => {
      const s = String(u || '').trim()
      if (!s) return filteredImgs[0] || '/images/placeholder-product.jpg'
      if (/^https?:\/\//i.test(s)) return s
      if (s.startsWith('/uploads')) return `${base}${s}`
      if (s.startsWith('uploads/')) return `${base}/${s}`
      return s
    }
    const normToken = (s:string)=> String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9\u0600-\u06FF]/g,'')
    const pickFallbackByLabel = (label:string): string => {
      const t = normToken(label)
      for (const u of filteredImgs){
        const file = String(u).split('/').pop() || ''
        if (normToken(file).includes(t)) return normalizeImage(u)
      }
      return filteredImgs[0] || '/images/placeholder-product.jpg'
    }
    // Prefer attributes.color
    try{
      const attrs: Array<{ key:string; label:string; values:string[] }> = Array.isArray((d as any).attributes)? (d as any).attributes : []
      const col = attrs.find(a=> a.key==='color')
      const colVals: string[] = Array.isArray(col?.values)? col!.values : []
      if (colVals.length){
        colors = colVals.map((label:string)=>{
          const g = galleries.find((x:any)=> String(x?.name||'').trim().toLowerCase() === String(label||'').trim().toLowerCase())
          const chosen = g?.primaryImageUrl || (Array.isArray(g?.images)&&g!.images![0]) || pickFallbackByLabel(label)
          return { label, img: normalizeImage(chosen) }
        })
      }
    }catch{}
    // Fallback: colorGalleries by names
    if (!colors.length && galleries.length){
      colors = galleries.map((g:any)=> {
        const label = String(g.name||'').trim()
        const chosen = g.primaryImageUrl || (Array.isArray(g.images)&&g.images[0]) || pickFallbackByLabel(label)
        return { label, img: normalizeImage(chosen) }
      }).filter(c=> !!c.label)
    }
    // If still single color or none, hide colors by emptying the list
    if (colors.length <= 1) colors = []
    // Build simple two-row size groups: letters and numbers
    const isNumber = (x:string)=> /^\d{1,3}$/.test(String(x).trim())
    const letters = new Set<string>()
    const numbers = new Set<string>()
    for (const s of sizes){ if (isNumber(s)) numbers.add(s); else if (looksSizeToken(s)) letters.add(s) }
    const lettersOrder = ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL']
    const orderLetters = (vals:string[])=> Array.from(vals).sort((a,b)=> lettersOrder.indexOf(String(a).toUpperCase()) - lettersOrder.indexOf(String(b).toUpperCase()))
    const orderNumbers = (vals:string[])=> Array.from(vals).sort((a,b)=> (parseInt(a,10)||0) - (parseInt(b,10)||0))
    const sizeGroups = [] as Array<{ label:string; values:string[] }>
    if (letters.size) sizeGroups.push({ label: 'مقاسات بالأحرف', values: orderLetters(Array.from(letters)) })
    if (numbers.size) sizeGroups.push({ label: 'مقاسات بالأرقام', values: orderNumbers(Array.from(numbers)) })

    optionsCache[id] = {
      id: d.id || id,
      title: d.name || (items.value.find(i=>i.id===id)?.title) || '',
      price: Number(d.price || (items.value.find(i=>i.id===id)?.price) || 0),
      images: filteredImgs.length ? filteredImgs : [items.value.find(i=>i.id===id)?.img || '/images/placeholder-product.jpg'],
      colors,
      // Only expose validated sizes; never fall back to variant value/name tokens
      sizes: sizes,
      sizeGroups,
      colorGalleries: galleries
    }
    return optionsCache[id]
  }catch{}
}

function hasOptions(id: string){
  const it = items.value.find(i=> i.id===id)
  if (!it) return false
  const cached = optionsCache[id]
  if (cached){
    const hasColors = Array.isArray(cached.colors) && cached.colors.length>0
    const hasSizes = Array.isArray(cached.sizes) && cached.sizes.length>0
    return hasColors || hasSizes
  }
  // fallback: show button only if product carries options meta
  const meta = (it as any).options || {}
  const hasColorsMeta = Array.isArray(meta.colors) && meta.colors.length>0
  const hasSizesMeta = Array.isArray(meta.sizes) && meta.sizes.length>0
  return hasColorsMeta || hasSizesMeta || !!(it.variantColor || it.variantSize)
}

// Preload options for all cart items on page load
onMounted(async () => {
  // حدّد كل العناصر مبدئياً حتى يراها المستخدم محددة فوراً
  try{
    selectedItems.value = items.value.map(i=> i.uid)
    selectAll.value = selectedItems.value.length > 0
  }catch{}
  try{
    const ids = Array.from(new Set(items.value.map(i=> i.id)))
    await Promise.all(ids.map(id => fetchProductDetails(id)))
  }catch{}
  // تحقق من صلاحية وتوفر عناصر السلة الحالية
  try{
    const base = (await import('@/lib/api')).API_BASE
    const prods = await Promise.all(items.value.map(async (it)=>{
      try{
        const res = await fetch(`${base}/api/product/${encodeURIComponent(it.id)}`, { headers:{ 'Accept':'application/json' } })
        if (!res.ok) return { uid: it.uid, status: 'invalid' as const }
        const d = await res.json()
    const stock = (typeof d.stock === 'number' ? d.stock : (typeof d.stockQuantity === 'number' ? d.stockQuantity : (Array.isArray(d.variants)? d.variants.reduce((n:any,v:any)=> n + (Number(v.stockQuantity||0)), 0) : 0)))
        const isActive = d?.isActive !== false
        const available = isActive && stock > 0
        return { uid: it.uid, status: available ? null : ('oos' as const) }
      }catch{ return { uid: it.uid, status: 'invalid' as const } }
    }))
    const map: Record<string,'oos'|'invalid'> = {}
    for (const p of prods){ if (p.status) map[p.uid] = p.status }
    oosMap.value = map
    hasOutOfStock.value = Object.keys(map).length > 0
    // نظّف التحديدات لتقتصر على العناصر الصالحة فقط
    selectedItems.value = selectedItems.value.filter(uid => !map[uid])
    updateSelectAll()
    // في الزيارة الأولى: حدد جميع العناصر الصالحة تلقائياً
    if (selectedItems.value.length === 0 && validItems.value.length > 0){
      selectedItems.value = validItems.value.map(it=> it.uid)
      selectAll.value = true
    }
  }catch{}
  // حساب أسعار بعد الكوبون لعناصر السلة
  try{ await hydrateCartAfterCoupons() }catch{}
})


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
      const parts = [(a.state||a.province), a.area].filter((s:string)=>!!s)
      shippingAddress.value = parts.join(' / ') || '—'
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
    try{ markTrending(suggested.value as any[]) }catch{}
    try{ await hydrateCouponsAndPricesForSuggested() }catch{}
  }catch{}
})

function goLogin(){ router.push({ path:'/login', query: { return: '/cart' } }) }
function openProduct(p:any){ const id = typeof p==='string'? p : (p?.id||''); if (id) router.push(`/p?id=${encodeURIComponent(String(id))}`) }
function addSugToCart(p:any){
  cart.add({ id: String(p.id), title: String(p.title), price: Number(p.price||0), img: String(p.image||'') }, 1)
}

// Open options modal from suggested grid cards
async function openSuggestOptions(id: string){
  try{
    // Probe product to decide if options are needed
    const base = (await import('@/lib/api')).API_BASE
    const res = await fetch(`${base}/api/product/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } })
    if (res.ok){
      const d = await res.json()
      const galleries = Array.isArray(d?.colorGalleries) ? d.colorGalleries : []
      const colorsCount = galleries.filter((g:any)=> String(g?.name||'').trim()).length
      const hasColors = colorsCount > 1
      const sizesArr = Array.isArray(d?.sizes) ? (d.sizes as any[]).filter((s:any)=> typeof s==='string' && String(s).trim()) : []
      const variantsHasSize = Array.isArray(d?.variants) && d.variants.some((v:any)=> !!v?.size || /size|مقاس/i.test(String(v?.name||'')))
      const hasSizes = (new Set(sizesArr.map((s:string)=> s.trim().toLowerCase()))).size > 1 || (!!variantsHasSize && (sizesArr.length>1))
      if (!hasColors && !hasSizes){
        const p = suggested.value.find(x=> String(x.id)===String(id))
        if (p){ cart.add({ id: String(p.id), title: String(p.title), price: Number(p.price||0), img: String(p.image||'') }, 1); showToast('تمت الإضافة إلى السلة') }
        return
      }
    }
  }catch{}
  // Has options → open modal
  try{
    optionsModal.source = 'suggest'
    optionsModal.productId = id
    optionsModal.color = ''
    optionsModal.size = ''
    optionsModal.groupValues = {}
    optionsModal.open = true
    await fetchProductDetails(id)
    // محاكاة إضافة إلى السلة عند الحفظ لعرض نفس توست صفحة المنتج
    ;(optionsModal as any)._afterSaveAdd = true
  }catch{}
}

function goShippingAddresses(){
  if (hasAnyAddress.value) router.push('/address?return=/cart')
  else router.push('/address?return=/cart&open=1')
}

// ===== كوبونات لعناصر السلة =====
type CartCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCacheCart = ref<CartCoupon[]>([])
const afterById = ref<Record<string, number>>({})

async function fetchCouponsListCart(): Promise<CartCoupon[]> {
  const { API_BASE } = await import('@/lib/api')
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${API_BASE}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
  let data: any = await tryFetch('/api/me/coupons')
  if (data && Array.isArray(data.coupons)) return normalizeCouponsCart(data.coupons)
  data = await tryFetch('/api/coupons/public')
  if (data && Array.isArray(data.coupons)) return normalizeCouponsCart(data.coupons)
  // لا تستخدم مسارات المشرف من الواجهة العامة
  return []
}
function normalizeCouponsCart(list:any[]): CartCoupon[] {
  return (list||[]).map((c:any)=> ({ code:c.code, discountType: (String(c.discountType||'PERCENTAGE').toUpperCase()==='FIXED'?'FIXED':'PERCENTAGE'), discountValue:Number(c.discountValue||c.discount||0), audience:c.audience?.target||c.audience||undefined, kind:c.kind||undefined, rules:c.rules||undefined }))
}
function priceAfterCouponCart(base:number, cup: CartCoupon): number { if(!Number.isFinite(base)||base<=0) return base; const v=Number(cup.discountValue||0); return cup.discountType==='FIXED'? Math.max(0, base-v) : Math.max(0, base*(1-v/100)) }
function isCouponSitewideCart(c: CartCoupon): boolean { return String(c.kind||'').toLowerCase()==='sitewide' || !Array.isArray(c?.rules?.includes) }
function eligibleByTokensCart(prod:any, c: CartCoupon): boolean { const inc=Array.isArray(c?.rules?.includes)?c.rules!.includes!:[]; const exc=Array.isArray(c?.rules?.excludes)?c.rules!.excludes!:[]; const tokens:string[]=[]; if(prod?.categoryId) tokens.push(`category:${prod.categoryId}`); if(prod?.id) tokens.push(`product:${prod.id}`); if(prod?.brand) tokens.push(`brand:${prod.brand}`); if(prod?.sku) tokens.push(`sku:${prod.sku}`); const hasInc=!inc.length||inc.some(t=>tokens.includes(t)); const hasExc=exc.length&&exc.some(t=>tokens.includes(t)); return hasInc&&!hasExc }
async function ensureProductMetaCart(id:string, item:any){ try{ const d = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`); if(!d) return { id, categoryId:null, brand:item?.brand, sku:item?.sku }; return { id, categoryId: d.categoryId||d.category?.id||d.category||null, brand: d.brand||item?.brand, sku: d.sku||item?.sku } }catch{ return { id, categoryId:null } }
}
async function hydrateCartAfterCoupons(){
  try{
    if (!couponsCacheCart.value.length) couponsCacheCart.value = await fetchCouponsListCart()
    const cups = couponsCacheCart.value||[]
    if (!cups.length) return
    const ids = Array.from(new Set(items.value.map(i=> String(i.id))))
    for (const pid of ids){
      const baseItem = items.value.find(i=> String(i.id)===String(pid))
      const basePrice = Number(baseItem?.price||0)
      if (!basePrice){ continue }
      const site = cups.find(isCouponSitewideCart)
      if (site){ afterById.value[pid] = priceAfterCouponCart(basePrice, site); continue }
      const meta = await ensureProductMetaCart(pid, baseItem)
      const match = cups.find(c=> eligibleByTokensCart(meta, c))
      if (match){ afterById.value[pid] = priceAfterCouponCart(basePrice, match) }
    }
  }catch{}
}
watch(items, ()=>{ hydrateCartAfterCoupons().catch(()=>{}) }, { deep:true })
function afterOf(item:any): number | null { const v = afterById.value[String(item.id)]; return (typeof v==='number')? v : null }
const totalAfterCoupons = computed(()=> items.value.reduce((s,it)=> s + Number((afterById.value[String(it.id)]??it.price)||0)*Number(it.qty||1), 0))
// ===== كوبونات للمنتجات المقترحة في السلة =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const { API_BASE } = await import('@/lib/api')
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${API_BASE}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
  let data: any = await tryFetch('/api/me/coupons')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  data = await tryFetch('/api/coupons/public')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  // لا تستخدم مسارات المشرف من الواجهة العامة
  return []
}

function normalizeCoupons(list:any[]): SimpleCoupon[] {
  return (list||[]).map((c:any)=> ({
    code: c.code,
    discountType: (String(c.discountType||'PERCENTAGE').toUpperCase()==='FIXED' ? 'FIXED' : 'PERCENTAGE'),
    discountValue: Number(c.discountValue||c.discount||0),
    audience: c.audience?.target || c.audience || undefined,
    kind: c.kind || undefined,
    rules: c.rules || undefined
  }))
}

function priceAfterCoupon(base:number, cup: SimpleCoupon): number {
  if (!Number.isFinite(base) || base<=0) return base
  const v = Number(cup.discountValue||0)
  if (cup.discountType==='FIXED') return Math.max(0, base - v)
  return Math.max(0, base * (1 - v/100))
}

function isCouponSitewide(c: SimpleCoupon): boolean { return String(c.kind||'').toLowerCase()==='sitewide' || !Array.isArray(c?.rules?.includes) }

function eligibleByTokens(prod: any, c: SimpleCoupon): boolean {
  const inc = Array.isArray(c?.rules?.includes) ? c.rules!.includes! : []
  const exc = Array.isArray(c?.rules?.excludes) ? c.rules!.excludes! : []
  const tokens: string[] = []
  if (prod?.categoryId) tokens.push(`category:${prod.categoryId}`)
  if (prod?.id) tokens.push(`product:${prod.id}`)
  if (prod?.brand) tokens.push(`brand:${prod.brand}`)
  if (prod?.sku) tokens.push(`sku:${prod.sku}`)
  const hasInc = !inc.length || inc.some(t=> tokens.includes(t))
  const hasExc = exc.length && exc.some(t=> tokens.includes(t))
  return hasInc && !hasExc
}

async function ensureProductMeta(p:any): Promise<any> {
  if (p.categoryId!=null) return p
  try{
    const d = await (await import('@/lib/api')).apiGet<any>(`/api/product/${encodeURIComponent(p.id)}`)
    if (d){ p.categoryId = d.categoryId || d.category?.id || d.category || null; p.brand = p.brand || d.brand; p.sku = p.sku || d.sku }
  }catch{}
  return p
}

async function hydrateCouponsAndPricesForSuggested(){
  if (!couponsCache.value.length){ couponsCache.value = await fetchCouponsList() }
  await computeCouponPricesForSuggested(suggested.value)
}

async function computeCouponPricesForSuggested(list:any[]){
  const cups = couponsCache.value||[]
  if (!cups.length) return
  for (const p of list){
    const base = Number(String(p.price||'0').replace(/[^0-9.]/g,''))||0
    if (!base) { p.couponPrice = undefined; continue }
    const site = cups.find(isCouponSitewide)
    if (site){ p.couponPrice = priceAfterCoupon(base, site).toFixed(2); continue }
    await ensureProductMeta(p)
    const match = cups.find(c=> eligibleByTokens(p, c))
    if (match){ p.couponPrice = priceAfterCoupon(base, match).toFixed(2) }
  }
}
</script>

<style scoped>
/* استخدام Tailwind CSS - لا حاجة لأنماط إضافية */
</style>