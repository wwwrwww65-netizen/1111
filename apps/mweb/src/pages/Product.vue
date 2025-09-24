<template>
  <div dir="rtl" lang="ar" class="product-page">
    <header class="topbar" role="banner" aria-label="الهيدر">
      <div class="bar">
        <button class="p2" aria-label="رجوع" @click="goBack">←</button>
        <div class="spacer"></div>
        <button class="p2" aria-label="مشاركة" @click="share">↗</button>
        <button class="p2 cart" aria-label="عربة التسوق" @click="router.push('/cart')">
          🛒
          <span v-if="cart.count" class="badge">{{ cart.count }}</span>
        </button>
      </div>
    </header>

    <section class="hero-img" role="region" aria-label="صورة المنتج">
      <img :src="activeImg" :alt="title" loading="lazy" />
    </section>

    <section class="container info" aria-label="معلومات المنتج">
      <h1 class="title">{{ title }}</h1>
      <div class="pricebox">
        <span class="now">{{ price }}</span>
        <span class="old" v-if="original">{{ original }}</span>
        <span class="disc">-50%</span>
      </div>
      <div class="offer">ينتهي العرض خلال: <strong class="t">{{ offerEnds }}</strong></div>
      <div class="meta">
        ⭐ <span class="rate">{{ avgRating.toFixed(1) }}</span>
        <span class="cnt">(1158 مراجعة)</span>
        <span class="sep">|</span>
        <span class="ord">3000+ طلب</span>
      </div>

      <div class="variants">
        <div class="row vcolors" aria-label="الألوان">
          <button v-for="(c,i) in colors" :key="c.name" class="dot" :style="{ background: c.hex }" :class="{ on: colorIdx===i }" :aria-label="`لون ${c.name}`" @click="colorIdx=i"></button>
        </div>
        <div class="row vsizes" aria-label="المقاسات">
          <button v-for="s in sizes" :key="s" class="sz" :class="{ on: size===s }" @click="size=s">{{ s }}</button>
          <button class="chart" aria-label="جدول المقاسات">📏 جدول المقاسات</button>
        </div>
      </div>

      <div class="delivery" aria-label="معلومات التوصيل">
        <div class="loc">📍 التوصيل إلى موقعك الحالي</div>
        <div class="time">يصل خلال 2-4 أيام</div>
      </div>
    </section>

    <TabsBar :tabs="tabs" v-model:active="activeTab" />

    <section class="container desc" id="desc" aria-label="الوصف">
      <div class="text" :class="{ clip: !more }">{{ description }}</div>
      <button class="more" @click="more=!more" :aria-expanded="more">{{ more?'إخفاء':'المزيد ▼' }}</button>
    </section>

    <section class="container reviews" id="reviews" aria-label="التقييمات">
      <div class="head">
        <div class="ttl">مراجعات العملاء</div>
        <RatingStars :value="avgRating" />
      </div>
      <div class="photos">
        <img v-for="i in 4" :key="i" :src="`https://via.placeholder.com/150?text=${i}`" :alt="`Review ${i}`" loading="lazy" />
      </div>
      <p class="sample">“الخامة جيدة والمقاس مناسب جدًا. الشحن كان سريعًا.”</p>
      <div class="comment" v-for="r in reviews" :key="r.id">
        <div class="row" style="justify-content:space-between"><strong>{{ r.user||'مستخدم' }}</strong><span>{{ r.stars }}★</span></div>
        <div>{{ r.text }}</div>
      </div>
      <form class="card" @submit.prevent="submitReview" style="margin-top:8px;display:grid;gap:6px;padding:8px">
        <select v-model.number="stars" class="input" required>
          <option :value="5">5 نجوم</option>
          <option :value="4">4 نجوم</option>
          <option :value="3">3 نجوم</option>
          <option :value="2">2 نجوم</option>
          <option :value="1">1 نجمة</option>
        </select>
        <textarea v-model="text" class="input" rows="3" placeholder="اكتب مراجعتك" required></textarea>
        <button class="btn">إرسال المراجعة</button>
      </form>
    </section>

    <section class="container related" id="related" aria-label="منتجات مشابهة">
      <div class="grid2">
        <div v-for="(i,idx) in related" :key="idx" class="card">
          <img :src="i.img" :alt="`Related ${idx+1}`" loading="lazy" />
          <div class="p">
            <div class="nm">{{ i.title }}</div>
            <div class="pr">{{ i.price }}</div>
          </div>
        </div>
      </div>
    </section>

    <div class="cta-bar" role="region" aria-label="شريط الإجراءات">
      <button class="add" @click="addToCart" aria-label="أضف إلى عربة التسوق">أضف إلى عربة التسوق</button>
      <button class="fav-btn" aria-label="المفضلة" title="المفضلة" @click="toggleWish">❤</button>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useCart } from '@/store/cart'
import { API_BASE, apiPost, apiGet } from '@/lib/api'
import { useWishlist } from '@/store/wishlist'
import RatingStars from '@/components/RatingStars.vue'
import TabsBar from '@/components/TabsBar.vue'
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
const tabs = ['الوصف','المراجعات','التوصية','الأكثر مبيعًا']
const activeTab = ref(tabs[0])
const description = 'وصف تفصيلي للمنتج يوضح المواصفات والفوائد والاستخدام وخامات التصنيع وغير ذلك من المعلومات المهمة للمستخدم.'
const more = ref(false)
const related = Array.from({length:8}).map((_,i)=>({ img:`https://picsum.photos/seed/rel${i}/320/240`, title:`منتج ${i+1}`, price:`SR ${(19+i).toFixed(2)}` }))
const cart = useCart()
const wl = useWishlist()
function addToCart(){ cart.add({ id, title: title.value, price: Number(price.value.replace(/[^\d.]/g,''))||0, img: activeImg.value }, 1) }
function toggleWish(){ wl.toggle({ id, title: title.value, price: Number(price.value.replace(/[^\d.]/g,''))||0, img: activeImg.value }) }
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
  try{
    const rec = await apiGet<any>(`/api/recommendations/product?productId=${encodeURIComponent(id)}`)
    if (rec && Array.isArray(rec.items)){
      // show in related
      related.splice(0, related.length, ...rec.items.map((p:any)=>({ img:p.images?.[0]||'https://picsum.photos/seed/rel/320/240', title:p.name, price:`SR ${(p.price||0).toFixed(2)}` })))
    }
  }catch{}
})
async function submitReview(){
  const ok = await apiPost('/api/reviews', { productId: id, stars: stars.value, text: text.value })
  if (ok){ reviews.value.unshift({ id: Math.random().toString(36).slice(2), user:'أنت', stars: stars.value, text: text.value }); text.value=''; stars.value=5 }
}
async function buyNow(){
  addToCart()
  const created = await apiPost('/api/orders', { shippingAddressId: undefined })
  if (created && (created as any).order){ router.push('/confirm') }
  else { alert('تعذر إنشاء الطلب، حاول لاحقًا') }
}
</script>

<style scoped>
.product-page{background:#f9fafb;padding-bottom:120px}
.topbar{position:sticky;top:0;z-index:60;background:#fff;border-bottom:1px solid #e5e7eb}
.bar{height:48px;display:flex;align-items:center;gap:6px;padding:0 8px}
.spacer{flex:1}
.p2{width:40px;height:40px;border:0;background:transparent;display:grid;place-items:center;border-radius:10px}
.cart{position:relative}
.badge{position:absolute;top:-4px;inset-inline-start:-4px;background:#ef4444;color:#fff;border-radius:999px;width:16px;height:16px;display:grid;place-items:center;font-size:10px}
.hero-img img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff}
.container{padding:0 16px}
.info{padding-top:8px}
.title{font-size:14px;color:#111827;line-height:1.6}
.pricebox{display:flex;gap:10px;align-items:center;margin-top:6px}
.now{font-size:20px;font-weight:800;color:#dc2626}
.old{font-size:13px;color:#9ca3af;text-decoration:line-through}
.disc{background:#fee2e2;color:#b91c1c;border-radius:8px;padding:2px 8px;font-size:12px}
.offer{margin-top:8px;font-size:13px;color:#374151}
.offer .t{color:#dc2626}
.meta{display:flex;gap:8px;align-items:center;margin-top:6px;font-size:13px;color:#4b5563}
.sep{color:#d1d5db}
.variants{margin-top:12px;display:flex;flex-direction:column;gap:10px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dot{width:40px;height:40px;border-radius:8px;border:1px solid #e5e7eb}
.dot.on{outline:2px solid #111827}
.sz{min-width:48px;height:40px;border:1px solid #e5e7eb;border-radius:8px;background:#fff}
.sz.on{border-color:#111}
.chart{margin-inline-start:auto;border:0;background:transparent;color:#1A73E8;font-size:14px}
.delivery{margin-top:8px}
.loc{font-size:14px}
.time{font-size:12px;color:#777;margin-top:2px}
.desc{margin-top:12px}
.text{font-size:14px;color:#222;line-height:1.6}
.text.clip{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.more{border:0;background:transparent;color:#1A73E8;margin-top:6px}
.reviews{margin-top:8px}
.head{display:flex;gap:10px;align-items:center;font-weight:800;font-size:16px}
.photos{display:flex;gap:8px;overflow:auto;margin:8px 0}
.photos img{width:60px;height:60px;border-radius:8px;object-fit:cover}
.sample{font-size:12px;color:#6b7280}
.related{margin-top:8px}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.card{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff}
.card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.card .p{padding:6px}
.nm{font-size:12px;color:#111827}
.pr{font-size:12px;color:#dc2626;font-weight:700;margin-top:2px}
.cta-bar{position:fixed;bottom:56px;left:0;right:0;display:grid;grid-template-columns:1fr 56px;gap:8px;align-items:center;padding:8px 12px;background:#fff;border-top:1px solid #ececec;z-index:60}
.add{height:48px;border-radius:10px;background:#dc2626;color:#fff;border:0;font-weight:700}
.fav-btn{height:48px;border-radius:10px;background:#fff;border:1px solid #e5e7eb}
</style>

