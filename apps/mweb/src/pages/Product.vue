<template>
  <div dir="rtl" lang="ar" class="product-page">
    <header class="ph" :class="{ solid: scrolled }" role="banner" aria-label="الهيدر">
      <button class="i" aria-label="قائمة">☰</button>
      <button class="i" aria-label="الإشعارات">🔔</button>
      <div class="logo" aria-label="jeeey">jeeey</div>
      <button class="i" aria-label="السلة">🛒</button>
      <button class="i" aria-label="المفضلة" @click="toggleWish">❤</button>
      <button class="i" aria-label="بحث">🔍</button>
    </header>

    <section class="gallery" role="region" aria-label="صور المنتج">
      <div class="main">
        <img :src="activeImg" :alt="title" loading="lazy" />
        <button class="share" aria-label="مشاركة">↗</button>
        <button class="fav" aria-label="مفضلة">❤</button>
      </div>
      <div class="thumbs">
        <img v-for="(t,idx) in images" :key="idx" class="t" :class="{on: activeIdx===idx}" :src="t" :alt="`${title} ${idx+1}`" loading="lazy" @click="setActive(idx)" />
      </div>
    </section>

    <section class="container info" aria-label="معلومات المنتج">
      <h1 class="title">{{ title }}</h1>
      <div class="pricebox">
        <span class="now">{{ price }}</span>
        <span class="old" v-if="original">{{ original }}</span>
      </div>
      <div class="meta">
        <RatingStars :value="rating" />
        <span class="ship">🚚 شحن مجاني</span>
      </div>

      <div class="variants">
        <div class="row vcolors" aria-label="الألوان">
          <button v-for="(c,i) in colors" :key="c" class="dot" :style="{ background: c }" :class="{ on: colorIdx===i }" aria-label="لون" @click="colorIdx=i"></button>
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
        <div class="ttl">التقييمات</div>
        <RatingStars :value="rating" />
      </div>
      <div class="photos">
        <img v-for="i in 6" :key="i" :src="`https://picsum.photos/seed/r${i}/120/120`" alt="صورة عميل" loading="lazy" />
      </div>
      <div class="comment" v-for="i in 2" :key="'c'+i">منتج رائع، الجودة ممتازة والشحن سريع.</div>
    </section>

    <section class="container related" id="related" aria-label="منتجات مشابهة">
      <HorizontalProducts :items="related" label="منتجات مشابهة" />
    </section>

    <div class="cta-bar" role="region" aria-label="أزرار الشراء">
      <a class="buy" href="#" aria-label="اشتري الآن" @click.prevent="buyNow">اشترِ الآن</a>
      <button class="add" @click="addToCart" aria-label="أضف إلى السلة">🛒 أضف إلى السلة</button>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useCart } from '@/store/cart'
import { API_BASE, apiPost } from '@/lib/api'
import { useWishlist } from '@/store/wishlist'
import RatingStars from '@/components/RatingStars.vue'
import TabsBar from '@/components/TabsBar.vue'
import HorizontalProducts from '@/components/HorizontalProducts.vue'
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
const sizes = ['XS','S','M','L','XL']
const size = ref<string>('M')
const colors = ['#111','#c00','#0a7','#f5a623']
const colorIdx = ref(0)
const rating = ref(4.9)
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
})
async function buyNow(){
  addToCart()
  const created = await apiPost('/api/orders', { shippingAddressId: undefined })
  if (created && (created as any).order){ router.push('/confirm') }
  else { alert('تعذر إنشاء الطلب، حاول لاحقًا') }
}
</script>

<style scoped>
.product-page{background:#fff;padding-bottom:120px}
.ph{position:sticky;top:0;height:56px;display:grid;grid-template-columns:repeat(2,auto) 1fr repeat(3,auto);align-items:center;gap:6px;padding:0 10px;background:transparent;z-index:50;transition:background .2s}
.ph.solid{background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.i{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:transparent;border:0}
.logo{justify-self:center;font-weight:900;font-size:20px}
.gallery{padding:0}
.main{position:relative}
.main img{width:100%;height:440px;object-fit:cover;background:#f3f3f3}
.share{position:absolute;top:10px;right:10px;width:24px;height:24px;border:0;background:transparent}
.fav{position:absolute;top:10px;left:10px;width:24px;height:24px;border:0;background:transparent}
.thumbs{display:flex;gap:8px;overflow:auto;padding:10px 12px}
.t{width:80px;height:100px;border-radius:6px;object-fit:cover;opacity:.7}
.t.on{opacity:1;outline:2px solid #27AE60}
.container{padding:0 16px}
.info{padding-top:8px}
.title{font-size:16px;font-weight:600}
.pricebox{display:flex;gap:10px;align-items:baseline;margin-top:6px}
.now{font-size:18px;font-weight:800;color:#FF6B4A}
.old{font-size:14px;color:#999;text-decoration:line-through}
.meta{display:flex;gap:12px;align-items:center;margin-top:6px}
.ship{font-size:12px;background:#E8F8EF;color:#1a5;padding:2px 8px;border-radius:999px}
.variants{margin-top:12px;display:flex;flex-direction:column;gap:10px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dot{width:32px;height:32px;border-radius:999px;border:2px solid #e5e5e5}
.dot.on{outline:2px solid #27AE60}
.sz{width:40px;height:40px;border:1px solid #e5e5e5;border-radius:8px;background:#fff}
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
.comment{font-size:14px;color:#222;margin:6px 0}
.related{margin-top:8px}
.cta-bar{position:fixed;bottom:56px;left:0;right:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;padding:8px 12px;background:#fff;border-top:1px solid #ececec;z-index:60}
.add{height:48px;border-radius:10px;background:#000;color:#fff;border:0}
.buy{height:48px;border-radius:10px;background:#ff2d55;color:#fff;text-align:center;line-height:48px;text-decoration:none}
</style>

