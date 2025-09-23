<template>
  <div class="cart-page" dir="rtl" lang="ar">
    <header class="cart-header" role="banner" aria-label="رأس صفحة السلة">
      <button class="icon" aria-label="قائمة">⋮</button>
      <div class="title">حقيبة التسوق ({{ cartCount }})</div>
      <button class="icon sm" aria-label="مشاركة">🔗</button>
      <button class="icon" aria-label="بحث">🔍</button>
    </header>

    <div class="promos" role="region" aria-label="عروض وتنبيهات">
      <button class="pill" aria-label="تخفيضات">🔥 تخفيضات</button>
      <button class="pill" aria-label="الكمية على وشك الانتهاء">⏳ الكمية على وشك الانتهاء</button>
    </div>

    <div class="container body">
      <div v-if="!items.length" class="card empty">لا توجد عناصر في السلة</div>
      <div v-else class="list">
        <article v-for="i in items" :key="i.id" class="card item" aria-label="عنصر في السلة">
          <button class="select" :aria-pressed="isSelected(i.id)" @click="toggle(i.id)">⭕</button>
          <img class="thumb" :src="i.img" :alt="i.title" loading="lazy" />
          <div class="meta">
            <div class="line name">
              <span class="shop">🏬</span>
              <span class="txt" :title="i.title">{{ i.title }}</span>
              <button class="wish" aria-label="إضافة للمفضلة">❤</button>
            </div>
            <div class="line opts">
              <select class="sel" aria-label="المقاس/اللون">
                <option>مقاس: M</option>
                <option>مقاس: L</option>
              </select>
            </div>
            <div class="line price">
              <span class="now">{{ i.price.toFixed(2) }} ﷼</span>
              <span class="sale">{{ (i.price*0.90).toFixed(2) }} ﷼</span>
              <span class="cut">{{ (i.price*1.20).toFixed(2) }} ﷼</span>
            </div>
            <div class="line qty-row">
              <button class="qty-btn" @click="dec(i.id)" aria-label="نقص">➖</button>
              <input class="qty-input" type="number" v-model.number="map[i.id]" @change="apply(i.id)" min="1" aria-label="الكمية" />
              <button class="qty-btn" @click="inc(i.id)" aria-label="زيادة">➕</button>
              <button class="trash" @click="remove(i.id)" aria-label="حذف">🗑</button>
            </div>
          </div>
        </article>
        <div class="quick-promo" aria-live="polite">🎁 أضف 99.00 للحصول على هدية مجانية</div>
      </div>
    </div>

    <div class="checkout-bar" role="region" aria-label="إتمام الشراء">
      <div class="sum">
        <div class="coupon">كوبون التوفير</div>
        <div class="total">{{ totalFormatted }}</div>
      </div>
      <a class="pay" href="/checkout" aria-label="الدفع">الدفع</a>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { computed, reactive, ref } from 'vue'

const cart = useCart()
const { items, total } = storeToRefs(cart)
const remove = (id:string)=> cart.remove(id)
const map = reactive<Record<string, number>>({})
const selected = reactive<Set<string>>(new Set())
const cartCount = computed(()=> items.value.reduce((n,i)=> n+i.qty, 0))
const totalFormatted = computed(()=> `${(total.value).toFixed(2)} ﷼`)
function sync(){ items.value.forEach(i=> map[i.id] = i.qty) }
function inc(id:string){ const it = items.value.find(i=>i.id===id); if(it){ it.qty++; map[id]=it.qty } }
function dec(id:string){ const it = items.value.find(i=>i.id===id); if(it && it.qty>1){ it.qty--; map[id]=it.qty } }
function apply(id:string){ const it = items.value.find(i=>i.id===id); if(it){ it.qty = Math.max(1, Number(map[id]||1)) } }
function toggle(id:string){ if(selected.has(id)) selected.delete(id); else selected.add(id) }
function isSelected(id:string){ return selected.has(id) }
sync()
</script>

<style scoped>
.cart-page{background:#F5F5F5;color:#222;min-height:100vh;padding-bottom:120px}
.cart-header{height:56px;display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;padding:0 12px;background:transparent;position:sticky;top:0;z-index:20}
.title{font-size:16px;font-weight:800}
.icon{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:transparent;border:0}
.icon.sm{width:36px;height:36px}
.promos{display:flex;gap:8px;align-items:center;background:#f0f0f0;padding:6px 12px;height:40px}
.pill{height:28px;padding:0 12px;border-radius:14px;border:0;background:#fff;font-size:14px}
.body{padding-top:8px}
.list{display:flex;flex-direction:column;gap:12px}
.item{display:grid;grid-template-columns:auto 100px 1fr;gap:10px;align-items:center;min-height:120px}
.select{width:24px;height:24px;display:grid;place-items:center;background:transparent;border:0}
.thumb{width:100px;height:100px;object-fit:cover;border-radius:6px;background:#eee}
.meta{display:flex;flex-direction:column;gap:8px}
.line{display:flex;align-items:center;gap:8px}
.name .txt{font-size:14px;font-weight:600;max-width:100%;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.opts .sel{height:28px;border:1px solid #e5e5e5;border-radius:8px;padding:0 8px;font-size:12px;background:#fff}
.price{gap:10px}
.price .now{font-size:14px;font-weight:800;color:#222}
.price .sale{font-size:14px;color:#FF5722}
.price .cut{font-size:12px;color:#999;text-decoration:line-through}
.qty-row{gap:8px}
.qty-btn{width:24px;height:24px;border-radius:6px;border:1px solid #e5e5e5;background:#fff}
.qty-input{width:40px;height:28px;text-align:center;border:1px solid #e5e5e5;border-radius:6px}
.trash{margin-inline-start:auto;background:transparent;border:0;width:24px;height:24px}
.quick-promo{font-size:12px;color:#FF5722;padding:0 12px 8px}
.checkout-bar{position:fixed;bottom:56px;left:0;right:0;background:#fff;border-top:1px solid #eee;padding:8px 12px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;z-index:60}
.sum{display:flex;flex-direction:column;gap:2px}
.coupon{font-size:14px;color:#444}
.total{font-size:16px;font-weight:800}
.pay{display:block;text-align:center;background:#000;color:#fff;border-radius:10px;height:50px;line-height:50px;text-decoration:none}
</style>

