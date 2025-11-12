<template>
  <article class="product-card" tabindex="0" role="article" dir="rtl" @click="onCardClick">
    <div class="image-wrap" @click.stop="go()">
      <div v-if="!imgLoaded" class="skeleton"></div>
      <picture>
        <source :srcset="`${img}&fm=avif 1x, ${img}&fm=avif&w=1200 2x`" type="image/avif" />
        <source :srcset="`${img}&fm=webp 1x, ${img}&fm=webp&w=1200 2x`" type="image/webp" />
        <img class="product-img" :src="img" :alt="title" loading="lazy" decoding="async" fetchpriority="low" @error="onImgError" @load="onImgLoad" />
      </picture>
      <div v-if="discountPercent" class="discount-badge">-{{ discountPercent }}%</div>
      <div v-if="badgeRank" class="rank-badge">#{{ badgeRank }}</div>
      <button class="wish" aria-label="إضافة للمفضلة"><Icon name="heart" /></button>
    </div>
    <div class="content">
      <a class="title" href="#" :title="title" @click.prevent.stop="go()">{{ title }}</a>
      <div class="meta">
        <span v-if="sizeText">{{ sizeText }}</span>
        <span v-if="colorText">· {{ colorText }}</span>
        <span v-if="soldCount" class="sold">· تم بيع +{{ soldCount }}</span>
      </div>
      <div class="price-row">
        <div class="price-current">{{ price }}</div>
        <div v-if="original" class="price-old">{{ original }}</div>
      </div>
      <div v-if="afterCoupon" class="price-after">بعد الكوبون {{ afterCoupon }}</div>
      <div class="actions">
        <button class="btn-add" @click.stop.prevent="addToCart($event)" aria-label="أضف إلى الحقيبة">🛒</button>
        <button class="btn-wish" @click.stop="toggleWish" aria-label="إضافة للمفضلة">♡</button>
        <span v-if="isFastShipping" class="ship-tag">شحن سريع</span>
      </div>
      <div v-if="thumbs && thumbs.length" class="thumbs">
        <img v-for="(t,i) in thumbs.slice(0,4)" :key="i" :src="t" :alt="`صورة ${i+1} - ${title}`" loading="lazy" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useCart } from '@/store/cart'
import gsap from 'gsap'
import Icon from '@/components/Icon.vue'
import { useRouter } from 'vue-router'
import { useWishlist } from '@/store/wishlist'
const props = defineProps<{ id?: string; img: string; title: string; price: string; original?: string; afterCoupon?: string; discountPercent?: number; soldCount?: number; isFastShipping?: boolean; badgeRank?: number; thumbs?: string[]; href?: string; sizeText?: string; colorText?: string }>();
const { id = Math.random().toString(36).slice(2), img, title, price, original, afterCoupon, discountPercent, soldCount, isFastShipping = false, badgeRank, thumbs, href, sizeText, colorText } = props;
const cart = useCart()
const wl = useWishlist()
const router = useRouter()
const imgLoaded = ref(false)
function onImgLoad(){ imgLoaded.value = true }
function onImgError(e: Event){
  const t = e.target as HTMLImageElement
  if (!t) return
  t.onerror = null
  t.src = '/images/placeholder-product.jpg'
}
function go(){
  const to = href || `/p?id=${encodeURIComponent(id)}`
  router.push(to)
}
function onCardClick(e: MouseEvent){
  const target = e.target as HTMLElement
  if (target.closest('.btn-add') || target.closest('.btn-wish') || target.closest('.wish')) return
  go()
}
function addToCart(ev?: MouseEvent){
  cart.add({ id, title, price: Number((price||'').replace(/[^\d.]/g,''))||0, img }, 1)
  try {
    const cartEl = document.getElementById('cart-target')
    const btn = (ev?.currentTarget as HTMLElement) || null
    const imgEl = (btn?.closest('.product-card') as HTMLElement)?.querySelector('img') as HTMLImageElement | null
    if (cartEl && imgEl) {
      const r1 = imgEl.getBoundingClientRect();
      const r2 = cartEl.getBoundingClientRect();
      const ghost = imgEl.cloneNode(true) as HTMLImageElement
      Object.assign(ghost.style, { position:'fixed', left:`${r1.left}px`, top:`${r1.top}px`, width:`${r1.width}px`, height:`${r1.height}px`, borderRadius:'8px', zIndex:'9999', pointerEvents:'none' })
      document.body.appendChild(ghost)
      gsap.to(ghost, { duration: 0.6, ease:'power1.inOut', left: r2.left + r2.width/2 - r1.width/4, top: r2.top + r2.height/2 - r1.height/4, width: r1.width/2, height: r1.height/2, opacity: 0.3, onComplete(){ ghost.remove() } })
      gsap.fromTo(cartEl, { scale: 1 }, { scale: 1.1, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out' })
    } else {
      gsap.fromTo('.add', { y: 0 }, { y: -6, yoyo: true, repeat: 1, duration: 0.15, ease: 'power1.out' })
    }
  } catch {}
}
function toggleWish(){ wl.toggle({ id, title, price: Number((price||'').replace(/[^\d.]/g,''))||0, img }) }
</script>

<style scoped>
.product-card{width:100%;background:#fff;border-radius:8px;padding:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.image-wrap{position:relative;width:100%;height:200px;overflow:hidden;border-radius:8px}
.skeleton{position:absolute;inset:0;background:#e5e7eb;animation:pulse 1.3s ease-in-out infinite}
.product-img{width:100%;height:100%;object-fit:cover;display:block;background:#f3f3f3}
.discount-badge{position:absolute;top:8px;left:8px;background:#FF6B4A;color:#fff;padding:2px 6px;height:20px;display:grid;place-items:center;font-size:12px;border-radius:6px}
.rank-badge{position:absolute;top:8px;right:8px;background:#FFD166;color:#222;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-weight:700}
.wish{position:absolute;top:8px;inset-inline-end:8px;width:36px;height:36px;display:grid;place-items:center;border-radius:999px;border:0;background:rgba(255,255,255,.7)}
.content{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.title{font-size:14px;font-weight:600;color:#222;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.meta{font-size:12px;color:#777}
.sold{color:#777}
.price-row{display:flex;align-items:center;gap:8px}
.price-current{font-weight:700;font-size:15px;color:#FF6B4A}
.price-old{font-size:12px;color:#999;text-decoration:line-through}
.price-after{font-size:13px;color:#FF6B4A}
.actions{display:flex;align-items:center;gap:8px}
.btn-add,.btn-wish{width:36px;height:36px;border-radius:999px;border:1px solid #ECECEC;background:#fff;display:flex;align-items:center;justify-content:center}
.ship-tag{background:#E8F8EF;color:#27AE60;font-size:12px;padding:4px 6px;border-radius:6px}
.thumbs{display:flex;gap:6px;margin-top:6px}
.thumbs img{width:48px;height:48px;border-radius:6px;object-fit:cover;background:#f3f3f3}
@keyframes pulse{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
</style>