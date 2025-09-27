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

    <!-- Product Image with overlays -->
    <div class="relative">
      <img :src="activeImg" :alt="title" class="w-full h-96 object-cover" loading="lazy" />
      <div class="absolute bottom-3 left-3 text-white text-[12px]">{{ images.length }} / {{ activeIdx+1 }}</div>
      <div class="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 rounded-[6px]">
        <div class="text-[12px] font-bold">استطالة% 50</div>
        <div class="text-[11px] text-orange-500">S • VERIFIED</div>
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
          <span class="text-orange-500 font-extrabold text-[18px]">{{ price }}</span>
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
          <img v-for="(img,i) in images.slice(0,3)" :key="'v'+i" :src="img" class="w-12 h-12 rounded-[6px] border border-gray-200 object-cover" :alt="'variant '+i" />
        </div>
      </div>

      <div class="mt-2">
        <div class="flex items-center justify-between">
          <span class="font-semibold">مقاس</span>
          <div class="flex items-center gap-2 text-[12px]">
            <span class="text-blue-600">الافتراضي</span>
            <span class="text-gray-600">مرجع المقاس</span>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <button v-for="s in sizes" :key="s" class="min-w-[50px] border border-gray-300 rounded-[6px] px-2 py-2 bg-white" :class="{ 'border-black': size===s }" @click="size=s">{{ s }}</button>
        </div>
      </div>

      <div class="my-2 text-[13px]">
        <span class="text-orange-500 font-bold">96%</span>
        <span class="text-gray-600">يعتقد من العملاء أن المقاس حقيقي ومناسب</span>
        <div class="text-gray-600 text-[12px] mt-1">ليس مقياسك؟ اخبرنا ما هو مقياسك</div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-3 flex items-center gap-2">
      <button class="flex-1 h-12 rounded-[8px] bg-black text-white" @click="addToCart">أضف إلى عربة التسوق بنجاح</button>
      <button class="w-10 h-10 rounded-[8px] border border-gray-300 bg-white inline-flex items-center justify-center" aria-label="المفضلة"><HeartIcon :size="20" /></button>
      <button class="w-10 h-10 rounded-[8px] border border-gray-300 bg-white inline-flex items-center justify-center" aria-label="المقاسات"><RulerIcon :size="20" /></button>
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
const price = ref('129 ر.س')
const original = ref('179 ر.س')
const images = ref<string[]>([
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop'
])
const activeIdx = ref(0)
const activeImg = computed(()=> images.value[activeIdx.value] || '')
const sizes = ['S','M','L','XL']
const size = ref<string>('M')
const colors = [
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#ffffff' },
  { name: 'blue', hex: '#2a62ff' },
  { name: 'gray', hex: '#9aa0a6' },
  { name: 'beige', hex: '#d9c3a3' },
]
const colorIdx = ref(0)
const avgRating = ref(4.9)
const reviews = ref<any[]>([])
const stars = ref<number>(5)
const text = ref('')
const description = 'تصميم راقية الدانتيل قطع السمكة'
const related: any[] = []
const cart = useCart()
function addToCart(){ cart.add({ id, title: title.value, price: Number(price.value.replace(/[^\d.]/g,''))||0, img: activeImg.value }, 1) }
function toggleWish(){}
function setActive(i:number){ activeIdx.value = i }
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
      price.value = (d.price||129) + ' ر.س'
      const imgs = Array.isArray(d.images)? d.images : []
      if (imgs.length) images.value = imgs
      original.value = d.original ? d.original + ' ر.س' : original.value
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
.shein-root{background:#ffffff;padding-bottom:96px}
.head{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #e5e7eb}
.left,.right{display:flex;align-items:center;gap:12px}
.cartwrap{position:relative;display:inline-flex}
.badge{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border-radius:999px;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;padding:0 4px;border:1px solid #fff}
.logo{font-size:20px;font-weight:800;letter-spacing:.15em}
.icon{background:transparent;border:0}
.caret{color:#9ca3af}
.hero{position:relative}
.hero-img{width:100%;height:384px;object-fit:cover}
.hero-count{position:absolute;bottom:12px;left:12px;color:#fff;font-size:12px}
.hero-badge{position:absolute;bottom:12px;right:12px;background:rgba(255,255,255,.9);padding:6px 10px;border-radius:6px}
.hero-badge .b1{font-size:12px;font-weight:700}
.hero-badge .b2{font-size:11px;color:#F97316}
.box{padding:12px}
.row{display:flex;align-items:center}
.space{justify-content:space-between}
.gap{gap:8px}
.small{font-size:12px}
.chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:12px}
.purple{background:#f5f3ff;color:#6D28D9}
.slogan{color:#a78bfa;font-size:12px}
.prices .now{color:#F97316;font-weight:800;font-size:18px}
.prices .old{color:#9ca3af;text-decoration:line-through}
.after{color:#F97316;font-size:12px}
.coupon-box{border:1px solid #FDBA74;color:#C2410C;border-radius:6px;padding:6px 8px;font-size:12px;margin:6px 0}
.club{display:flex;align-items:center;justify-content:space-between;background:#FFF7ED;border-radius:6px;padding:6px 8px}
.clubtag{display:inline-flex;align-items:center;gap:6px}
.clubtag .S{background:#F97316;color:#fff;border-radius:999px;padding:2px 6px;font-size:11px}
.clubtag .name{font-weight:700}
.title-row{margin-top:6px}
.ttl{font-size:16px;font-weight:700;margin:6px 0}
.desc{color:#6b7280;font-size:12px;margin-bottom:6px}
.rate-row{display:flex;align-items:center;gap:6px}
.ystar{color:#EAB308}
.rcnt{color:#6b7280}
.best{display:flex;align-items:center;gap:6px;margin:8px 0}
.rank{background:#F97316;color:#fff;border-radius:6px;padding:2px 6px;font-size:12px}
.besttxt{font-size:12px}
.vimg{width:48px;height:48px;border-radius:6px;border:1px solid #e5e7eb;object-fit:cover}
.sizes{margin-top:8px}
.lbl{font-weight:600}
.blue{color:#1A73E8}
.muted{color:#6b7280}
.sz{min-width:50px;border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;background:#fff}
.sz.on{border-color:#111}
.fit{margin:10px 0;font-size:13px}
.orange{color:#F97316}
.bold{font-weight:700}
.actions{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e5e7eb;padding:12px;display:flex;align-items:center;gap:8px}
.addtocart{flex:1;height:48px;border-radius:8px;background:#000;color:#fff;border:0}
.square{width:40px;height:40px;border-radius:8px;border:1px solid #d1d5db;background:#fff;display:inline-flex;align-items:center;justify-content:center}
</style>

