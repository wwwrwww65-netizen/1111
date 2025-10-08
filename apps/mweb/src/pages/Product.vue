<template>
  <div class="bg-white pb-24" dir="rtl">
    <!-- Header -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200">
      <div class="flex items-center gap-3">
        <div class="relative inline-flex" @click="router.push('/cart')" aria-label="السلة">
          <ShoppingCart :size="24" />
          <span v-if="cart.count" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[11px] px-1 border border-white">{{ cart.count }}</span>
        </div>
        <button class="bg-transparent border-0" aria-label="مشاركة" @click="share"><Share :size="24" /></button>
        <button class="bg-transparent border-0" aria-label="بحث" @click="router.push('/search')"><Search :size="24" /></button>
      </div>
      <div class="text-[20px] font-extrabold tracking-widest">jeeey</div>
      <div class="flex items-center gap-3">
        <button class="bg-transparent border-0" aria-label="القائمة"><Menu :size="24" /></button>
        <div class="text-gray-400">›</div>
      </div>
    </div>

    <!-- Product Image Gallery (swipeable) -->
    <div class="relative">
      <div ref="galleryRef" class="w-full overflow-x-auto snap-x snap-mandatory no-scrollbar" @scroll.passive="onGalleryScroll" @click="openLightbox(activeIdx)">
        <div class="flex">
          <img v-for="(img,idx) in images" :key="'hero-'+idx" :src="img" :alt="title" class="w-full h-auto object-cover block flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" />
        </div>
      </div>
      <div class="absolute bottom-3 inset-x-0 flex justify-center gap-1">
        <button v-for="(img,i) in images" :key="'dot-'+i" class="w-1.5 h-1.5 rounded-full" :class="i===activeIdx ? 'bg-white' : 'bg-white/50'" @click="scrollToIdx(i)" aria-label="اذهب إلى الصورة" />
      </div>
      <div class="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 rounded-[6px]">
        <div class="text-[12px] font-bold">{{ images.length }} صور</div>
        <div class="text-[11px] text-orange-500">S • VERIFIED</div>
      </div>
    </div>

    <!-- Lightbox fullscreen -->
    <div v-if="lightbox" class="fixed inset-0 bg-black/95 z-50 flex flex-col" @keydown.esc="closeLightbox" tabindex="0">
      <div class="flex justify-between items-center p-3 text-white">
        <button class="px-3 py-1 rounded border border-white/30" @click="closeLightbox">إغلاق</button>
        <div class="text-[13px]">{{ lightboxIdx+1 }} / {{ images.length }}</div>
      </div>
      <div class="flex-1 relative">
        <div ref="lightboxRef" class="w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
          <div class="flex h-full">
            <img v-for="(img,i) in images" :key="'lb-'+i" :src="img" class="w-full h-full object-contain flex-shrink-0 snap-start" style="min-width:100%" />
          </div>
        </div>
        <button class="absolute left-2 top-1/2 -translate-y-1/2 text-white text-2xl" @click="prevLightbox" aria-label="السابق">‹</button>
        <button class="absolute right-2 top-1/2 -translate-y-1/2 text-white text-2xl" @click="nextLightbox" aria-label="التالي">›</button>
      </div>
      <div class="p-2 flex justify-center gap-1">
        <span v-for="(img,i) in images" :key="'lbdot-'+i" class="w-1.5 h-1.5 rounded-full" :class="i===lightboxIdx? 'bg-white' : 'bg-white/40'" />
      </div>
    </div>

    <!-- Info -->
    <div class="p-3">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center h-[22px] px-2 rounded-full text-[12px] bg-violet-50 text-violet-700">تنزيلات</span>
        <span class="text-violet-400 text-[12px]">الموضة في متناول الجميع</span>
      </div>

      <div>
        <div class="flex items-center gap-2">
          <span class="text-orange-500 font-extrabold text-[18px]">{{ displayPrice }}</span>
          <span v-if="original" class="text-gray-400 line-through">{{ original }}</span>
          <span class="text-orange-500 text-[12px]">بعد تطبيق الكوبون.</span>
        </div>
        <div class="border border-orange-300 text-orange-700 rounded-[6px] px-2 py-1 text-[12px] my-1.5">خصم 20%: بدون حد أدنى للشراء</div>
        <div class="flex items-center justify-between bg-orange-50 rounded-[6px] px-2 py-1.5">
          <span>وفر بخصم {{ clubSave }} على هذا المنتج بعد الانضمام.</span>
          <div class="inline-flex items-center gap-1.5">
            <span class="bg-orange-500 text-white rounded-full px-1.5 py-0.5 text-[11px]">S</span>
            <span class="font-bold">jeeey CLUB</span>
          </div>
        </div>
      </div>

      <div class="mt-1">
        <span class="inline-flex items-center h-[22px] px-2 rounded-full text-[12px] bg-violet-50 text-violet-700">تنزيلات</span>
      </div>
      <h1 class="text-[16px] font-bold my-1.5">{{ title }}</h1>
      <p class="text-gray-600 text-[12px] mb-1.5">تصميم راقية الدانتيل قطع السمكة</p>
      <div class="flex items-center gap-1.5">
        <span class="font-semibold">{{ avgRating.toFixed(2) }}</span>
        <StarIcon :size="16" class="text-yellow-400" />
        <span class="text-gray-600">(+{{ reviews.length || 500 }})</span>
      </div>

      <div class="flex items-center gap-1.5 my-2">
        <span class="bg-orange-500 text-white rounded-[6px] px-1.5 py-0.5 text-[12px]">#5</span>
        <span class="text-[12px]">الأفضل مبيعاً في عطلة فساتين ماكسي للنساء</span>
      </div>

      <div class="mt-2">
        <div class="flex items-center gap-2">
          <img v-for="(img,i) in images.slice(0,5)" :key="'thumb'+i" :src="img" class="w-12 h-12 rounded-[6px] border object-cover cursor-pointer" :class="i===activeIdx ? 'border-black ring-2 ring-black' : 'border-gray-200'" :alt="'thumbnail '+i" @click="selectThumb(i)" />
        </div>
      </div>

      <div class="mt-2">
        <div class="flex items-center justify-between">
          <span class="font-semibold">المقاس</span>
          <div class="flex items-center gap-2 text-[12px]">
            <button class="text-blue-600" @click="openSizeGuide">مرجع المقاس</button>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <button v-for="s in sizes" :key="s" class="min-w-[50px] border rounded-[6px] px-2 py-2 bg-white" :class="size===s ? 'border-black' : 'border-gray-300'" @click="size=s">{{ s }}</button>
        </div>
        <div v-if="sizesSecondary.length" class="mt-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold">مقاس إضافي</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <button v-for="s in sizesSecondary" :key="'s2-'+s" class="min-w-[50px] border rounded-[6px] px-2 py-2 bg-white" :class="size2===s ? 'border-black' : 'border-gray-300'" @click="size2=s">{{ s }}</button>
          </div>
        </div>
      </div>

      <!-- ألوان كمصغرات دائرية -->
      <div class="mt-3">
        <div class="flex items-center justify-between">
          <span class="font-semibold">اللون</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <button v-for="(c,i) in colorOptions" :key="'c-'+i" class="w-8 h-8 rounded-full border" :class="i===colorIdx ? 'border-black ring-2 ring-black' : 'border-gray-300'" :style="{ background: c.hex }" @click="selectColor(i)" :aria-label="c.name"></button>
        </div>
      </div>

      <div class="mt-3 inline-flex items-center gap-2">
        <button class="w-8 h-8 rounded border" @click="decQty" aria-label="-">-</button>
        <div class="min-w-[28px] text-center">{{ qty }}</div>
        <button class="w-8 h-8 rounded border" @click="incQty" aria-label="+">+</button>
      </div>

      <div class="my-2 text-[13px]">
        <span class="text-orange-500 font-bold">96%</span>
        <span class="text-gray-600">يعتقد من العملاء أن المقاس حقيقي ومناسب</span>
        <div class="text-gray-600 text-[12px] mt-1">ليس مقياسك؟ اخبرنا ما هو مقياسك</div>
      </div>

      <!-- أقسام قابلة للطي -->
      <div class="divide-y divide-gray-200 border-t">
        <div v-for="sec in sections" :key="sec.key" class="py-2">
          <button class="w-full flex items-center justify-between py-2" @click="toggleSection(sec.key)">
            <span class="font-semibold">{{ sec.title }}</span>
            <span>{{ openSections[sec.key] ? '▾' : '▸' }}</span>
          </button>
          <div v-if="openSections[sec.key]" class="text-gray-700 text-[13px] leading-relaxed">
            <template v-if="Array.isArray(sec.content)">
              <ul class="list-disc pr-5 space-y-1">
                <li v-for="(li,idx) in sec.content" :key="'li-'+idx">{{ li }}</li>
              </ul>
            </template>
            <template v-else>
              <p>{{ sec.content }}</p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-3 flex items-center gap-2">
      <button class="flex-1 h-12 rounded-[8px] bg-black text-white" @click="addToCart">أضف إلى عربة التسوق</button>
      <button class="w-10 h-10 rounded-[8px] border border-gray-300 bg-white inline-flex items-center justify-center" :aria-label="hasWish ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'" @click="toggleWish"><HeartIcon :size="20" :class="hasWish ? 'text-red-500' : ''" /></button>
      <button class="w-10 h-10 rounded-[8px] border border-gray-300 bg-white inline-flex items-center justify-center" aria-label="المقاسات" @click="openSizeGuide"><RulerIcon :size="20" /></button>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-3 py-2 rounded shadow z-50">تمت الإضافة إلى الحقيبة</div>

  <!-- ورقة مرجع المقاس السفلية -->
  <div v-if="sizeGuideOpen" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/50" @click="closeSizeGuide"></div>
    <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-[12px] p-4 max-h-[70vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-[16px]">مرجع المقاس</h3>
        <button class="text-[20px]" @click="closeSizeGuide">×</button>
      </div>
      <div class="text-[13px] text-gray-700 leading-relaxed">
        <p>تحويلات تقريبية: XS (EU 34) • S (EU 36) • M (EU 38) • L (EU 40) • XL (EU 42) • XXL (EU 44)</p>
        <p class="mt-2">قد تختلف المقاسات حسب التصميم والخامة. يُفضل مراجعة التعليقات لمعرفة الانطباعات عن الملاءمة.</p>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useCart } from '@/store/cart'
import { API_BASE, apiPost, apiGet } from '@/lib/api'
import { ShoppingCart, Share, Search, Menu, Star as StarIcon, Heart as HeartIcon, Ruler as RulerIcon } from 'lucide-vue-next'
const route = useRoute()
const router = useRouter()
const id = route.query.id as string || 'p1'
const title = ref('منتج تجريبي')
const price = ref<number>(129)
const original = ref('179 ر.س')
const images = ref<string[]>([
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop'
])
const activeIdx = ref(0)
const activeImg = computed(()=> images.value[activeIdx.value] || '')
const displayPrice = computed(()=> (Number(price.value)||0) + ' ر.س')
const sizes = ref<string[]>(['S','M','L','XL'])
const sizesSecondary = ref<string[]>([])
const size = ref<string>('M')
const size2 = ref<string | null>(null)
const colorOptions = [
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#ffffff' },
  { name: 'blue', hex: '#2a62ff' },
  { name: 'gray', hex: '#9aa0a6' },
  { name: 'beige', hex: '#d9c3a3' },
]
const colorIdx = ref(0)
function selectColor(i:number){ colorIdx.value = i }
const qty = ref(1)
function incQty(){ qty.value = Math.min(99, qty.value + 1) }
function decQty(){ qty.value = Math.max(1, qty.value - 1) }
const avgRating = ref(4.9)
const reviews = ref<any[]>([])
const stars = ref<number>(5)
const text = ref('')
const description = 'تصميم راقية الدانتيل قطع السمكة'
const related: any[] = []
const cart = useCart()
const toast = ref(false)
function addToCart(){
  const variantNote = [size.value, (size2.value||'')].filter(Boolean).join(' / ')
  cart.add({ id, title: title.value + (variantNote? ` (${variantNote})` : ''), price: Number(price.value)||0, img: activeImg.value }, qty.value)
  toast.value = true
  setTimeout(()=> toast.value=false, 1200)
}
const hasWish = ref(false)
function toggleWish(){ hasWish.value = !hasWish.value }
const sizeGuideOpen = ref(false)
function openSizeGuide(){ sizeGuideOpen.value = true }
function closeSizeGuide(){ sizeGuideOpen.value = false }
const openSections = ref<Record<string, boolean>>({})
const sections = ref<Array<{ key:string; title:string; content:string|string[] }>>([
  { key:'details', title:'التفاصيل', content: description },
  { key:'shipping', title:'الشحن والإرجاع', content: ['شحن خلال 2-5 أيام عمل','إرجاع خلال 14 يومًا وفق السياسة'] },
  { key:'reviews', title:'المراجعات', content: [`التقييم المتوسط: ${avgRating.value} من 5`, `عدد المراجعات: ${reviews.value.length || 500}`] },
])
function toggleSection(k:string){ openSections.value[k] = !openSections.value[k] }
function setActive(i:number){ activeIdx.value = i }
const galleryRef = ref<HTMLDivElement|null>(null)
const lightboxRef = ref<HTMLDivElement|null>(null)
const lightbox = ref(false)
const lightboxIdx = ref(0)
function scrollToIdx(i:number){
  activeIdx.value = i
  const el = galleryRef.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}
function selectThumb(i:number){ selectColor(i); scrollToIdx(i) }
function openLightbox(i:number){ lightbox.value = true; lightboxIdx.value = i; requestAnimationFrame(()=>{ const el = lightboxRef.value; if(el) el.scrollTo({ left: i * el.clientWidth }) }) }
function closeLightbox(){ lightbox.value = false }
function nextLightbox(){ const el = lightboxRef.value; if(!el) return; const i = Math.min(images.value.length-1, lightboxIdx.value+1); lightboxIdx.value=i; el.scrollTo({ left: i*el.clientWidth, behavior:'smooth' }) }
function prevLightbox(){ const el = lightboxRef.value; if(!el) return; const i = Math.max(0, lightboxIdx.value-1); lightboxIdx.value=i; el.scrollTo({ left: i*el.clientWidth, behavior:'smooth' }) }
function onLightboxScroll(){ const el = lightboxRef.value; if(!el) return; const i = Math.round(el.scrollLeft/el.clientWidth); if(i!==lightboxIdx.value) lightboxIdx.value=i }
function onGalleryScroll(){
  const el = galleryRef.value
  if (!el) return
  const i = Math.round(el.scrollLeft / el.clientWidth)
  if (i !== activeIdx.value) activeIdx.value = i
}
const scrolled = ref(false)
function onScroll(){ scrolled.value = window.scrollY > 60 }
onMounted(()=>{ onScroll(); window.addEventListener('scroll', onScroll, { passive:true }) })
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
const offerEnds = '1d 18h 59m 52s'
function goBack(){ if (window.history.length > 1) router.back(); else router.push('/') }
async function share(){
  try{
    const data = { title: title.value, text: title.value, url: location.href }
    if ((navigator as any).share) await (navigator as any).share(data)
    else await navigator.clipboard.writeText(location.href)
  }catch{}
}
onMounted(async ()=>{
  try{
    const res = await fetch(`${API_BASE}/api/product/${encodeURIComponent(id)}`, { credentials:'omit', headers:{ 'Accept':'application/json' } })
    if(res.ok){
      const d = await res.json()
      title.value = d.name || title.value
      price.value = Number(d.price||129)
      const imgs = Array.isArray(d.images)? d.images : []
      if (imgs.length) images.value = imgs
      original.value = d.original ? d.original + ' ر.س' : original.value
      // sizes from API if available
      const s1 = Array.isArray(d.sizes)? d.sizes : []
      const s2 = Array.isArray(d.variants)? d.variants.map((v:any)=> v?.size).filter((x:any)=> typeof x==='string') : []
      const s = [...new Set([...s1, ...s2].filter((x:any)=> typeof x==='string' && x.trim()))]
      if (s.length){ sizes.value = s as string[]; size.value = sizes.value[0] }
      const sSecond = Array.isArray(d.sizes2)? d.sizes2.filter((x:any)=> typeof x==='string' && x.trim()) : []
      if (sSecond.length){ sizesSecondary.value = sSecond as string[]; size2.value = sizesSecondary.value[0] }
    }
  }catch{}
  try{
    const list = await apiGet<any>(`/api/reviews?productId=${encodeURIComponent(id)}`)
    if (list && Array.isArray(list.items)){
      reviews.value = list.items
      const sum = list.items.reduce((s:any,r:any)=>s+(r.stars||0),0)
      avgRating.value = list.items.length? (sum/list.items.length) : avgRating.value
    }
  }catch{}
  // skip related in this design
})
async function submitReview(){}
async function buyNow(){ addToCart() }
</script>

<style scoped>
/* Removed custom layout styles in favor of Tailwind classes already in template */
</style>

