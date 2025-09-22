<template>
  <article class="card prod-card" tabindex="0">
    <div class="img-wrap">
      <picture>
        <source :srcset="`${img}&fm=webp`" type="image/webp" />
        <img :src="img" :alt="title" loading="lazy" />
      </picture>
      <span v-if="badge" class="badge badge-accent">{{ badge }}</span>
      <button class="wish" aria-label="إضافة للمفضلة"><Icon name="heart" /></button>
    </div>
    <div class="info">
      <div class="title">{{ title }}</div>
      <PriceRow :price="price" :original="original" />
      <RatingStars :value="rating" />
    </div>
    <button class="btn add" @click="addToCart($event)" aria-label="إضافة للسلة">إضافة للسلة</button>
  </article>
</template>

<script setup lang="ts">
import { useCart } from '@/store/cart'
import gsap from 'gsap'
import Icon from '@/components/Icon.vue'
import RatingStars from '@/components/RatingStars.vue'
import PriceRow from '@/components/PriceRow.vue'
const props = defineProps<{ id?: string; img: string; title: string; price: string; original?: string; badge?: string; rating?: number }>();
const { id = Math.random().toString(36).slice(2), img, title, price, original, badge, rating = 4 } = props;
const cart = useCart()
function addToCart(ev?: MouseEvent){
  cart.add({ id, title, price: Number((price||'').replace(/[^\d.]/g,''))||0, img }, 1)
  try {
    const cartEl = document.getElementById('cart-target')
    const btn = (ev?.currentTarget as HTMLElement) || null
    const imgEl = (btn?.closest('.prod-card') as HTMLElement)?.querySelector('img') as HTMLImageElement | null
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
</script>

<style scoped>
.prod-card{padding:0;overflow:hidden}
.img-wrap{position:relative;aspect-ratio:3/4;background:#f8fafc}
.img-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.badge-accent{position:absolute;top:8px;left:8px}
.wish{position:absolute;top:8px;right:8px;width:36px;height:36px;display:grid;place-items:center;border-radius:999px;border:0;background:rgba(255,255,255,.7)}
.wish:focus-visible{outline:2px solid var(--primary,#0B5FFF)}
.info{display:flex;justify-content:space-between;align-items:center;padding:10px 12px}
.title{font-weight:600;font-size:13px}
.rating{margin-top:6px}
.add{margin:0 12px 12px}
</style>