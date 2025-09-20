<template>
  <section class="promo-grid">
    <div class="discounts">
      <div class="d-card" v-for="d in discounts" :key="d.t"><div class="d-t">{{ d.t }}</div><div class="d-s">{{ d.s }}</div></div>
      <div class="coupon">
        <div>رمز الخصم</div>
        <div class="code">SAO</div>
      </div>
    </div>
    <a class="promo" :href="b.href" v-for="b in banners" :key="b.title" :style="{ background: b.bg }">
      <div class="promo-inner">
        <div>
          <div class="promo-title">{{ b.title }}</div>
          <div class="promo-sub">{{ b.sub }}</div>
        </div>
        <img class="promo-img" :src="b.img" :alt="b.title" />
      </div>
    </a>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ items?: Array<{ title: string; sub: string; img: string; href: string; bg?: string }> }>();
const banners = props.items || [
  { title: 'خصومات الصيف', sub: 'حتى 50%', href: '/shop?deal=summer', bg: '#EEF2FF', img: 'https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1080&auto=format&fit=crop' },
  { title: 'وصل حديثاً', sub: 'تسوّق الآن', href: '/products?new=1', bg: '#F0FDF4', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1080&auto=format&fit=crop' },
];
const discounts = [
  { t: '%18', s: 'فوق 299 ر.س' },
  { t: '%16', s: 'فوق 399 ر.س' },
  { t: '%15', s: 'فوق 499 ر.س' },
];
</script>

<style scoped>
.promo-grid{display:grid;grid-template-columns:1fr;gap:12px;margin:16px 0}
.promo{display:block;border:1px solid var(--muted-2);border-radius:12px;color:inherit;text-decoration:none}
.promo-inner{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px}
.promo-title{font-weight:800;font-size:16px}
.promo-sub{color:#475569;margin-top:4px}
.promo-img{width:120px;height:80px;object-fit:cover;border-radius:10px;border:1px solid var(--muted-2)}
@media (min-width:420px){.promo-grid{grid-template-columns:1fr 1fr}}
.discounts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.d-card{background:#fff;border:1px solid var(--muted-2);border-radius:12px;padding:12px;display:grid;place-items:center}
.d-t{font-size:18px;font-weight:900;color:#dc2626}
.d-s{color:#475569}
.coupon{background:#0f172a;color:#fff;border-radius:12px;padding:12px;display:grid;place-items:center}
.coupon .code{font-weight:900;font-size:18px;letter-spacing:2px}
</style>

