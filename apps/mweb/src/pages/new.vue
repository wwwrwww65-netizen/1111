<template>
  <main dir="rtl" lang="ar" class="page">
    <header class="top" role="banner" aria-label="الهيدر">
      <button class="icon" aria-label="المفضلة">❤️</button>
      <div class="ttl">جديد</div>
      <div class="spacer"></div>
      <button class="icon" aria-label="بحث">🔍</button>
      <button class="icon" aria-label="الرسائل">✉️</button>
    </header>

    <DailyNewStrip />
    <CategoryPills />

    <section class="products" aria-label="شبكة المنتجات">
      <div class="grid">
        <article v-for="(p,i) in items" :key="p.id" class="card" role="article">
          <div class="img-wrap">
            <img :src="p.img" :alt="p.title" loading="lazy" />
            <span v-if="p.badge" class="badge">{{ p.badge }}</span>
            <button class="heart" aria-label="إضافة للمفضلة">❤</button>
            <button class="add" aria-label="إضافة للسلة">🛒</button>
          </div>
          <div class="name" :title="p.title">{{ p.title }}</div>
          <div class="prices">
            <span class="now">{{ p.price }}</span>
            <span class="coupon">بعد الكوبون {{ p.after }}</span>
            <span class="old" v-if="p.old">{{ p.old }}</span>
          </div>
        </article>
      </div>
    </section>

    <BottomNav />
  </main>
</template>

<script setup lang="ts">
import DailyNewStrip from '@/components/DailyNewStrip.vue'
import CategoryPills from '@/components/CategoryPills.vue'
import BottomNav from '@/components/BottomNav.vue'

const items = Array.from({ length: 12 }).map((_,i)=>({
  id:`n${i}`,
  title:`منتج جديد ${i+1}`,
  img:`https://picsum.photos/seed/new${i}/474/600`,
  price:`SR ${(16+i).toFixed(2)}`,
  after:`SR ${(14.8+i).toFixed(2)}`,
  old: i%3===0 ? `SR ${(22+i).toFixed(2)}` : '' ,
  badge: i%4===0 ? 'خصم 20%' : ''
}))
</script>

<style scoped>
.page{background:#F7F7F7;min-height:100vh;padding-bottom:72px}
.top{height:56px;padding:0 16px;display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;background:#fff;border-bottom:1px solid #ECECEC;position:sticky;top:0;z-index:50}
.ttl{justify-self:center;font-size:16px;font-weight:700;color:#222}
.icon{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:transparent;border:0}
.products{padding:12px 16px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{background:#fff;border-radius:8px;padding:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.img-wrap{position:relative}
.img-wrap img{width:100%;height:200px;object-fit:cover;border-radius:6px;background:#f3f3f3}
.badge{position:absolute;top:8px;left:8px;background:#FF6B4A;color:#fff;border-radius:8px;padding:0 6px;height:20px;display:inline-grid;place-items:center;font-size:12px}
.heart{position:absolute;top:8px;right:8px;width:20px;height:20px;border:0;background:transparent}
.add{position:absolute;bottom:8px;right:8px;width:36px;height:36px;border-radius:999px;border:1px solid #ECECEC;background:#fff}
.name{font-size:14px;font-weight:600;margin-top:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prices{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.now{font-size:14px;font-weight:700;color:#222}
.coupon{font-size:13px;color:#FF6B4A}
.old{font-size:12px;color:#999;text-decoration:line-through}
</style>

