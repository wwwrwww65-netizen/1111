<template>
  <div dir="rtl" lang="ar" class="page">
    <header class="header">
      <button class="back" aria-label="رجوع">←</button>
      <div class="title">تأكيد الطلب</div>
    </header>

    <section class="banner" role="status">
      ✓ إرجاع مجاني لجميع المنتجات
    </section>

    <section class="addr-card" aria-label="عنوان التوصيل">
      <div class="addr-pin">📍</div>
      <div class="addr-txt">
        <div class="addr-row">
          <span class="addr-name">{{ address.name }}</span>
          <span class="addr-phone">{{ address.phone }}</span>
        </div>
        <div class="addr-line">{{ address.line1 }}</div>
        <div class="addr-line muted">{{ address.city }}، {{ address.province }} — {{ address.country }}</div>
      </div>
      <button class="addr-edit" aria-label="تعديل العنوان">✎</button>
    </section>

    <section class="section">
      <div class="sec-h">
        <div class="sec-title">طلب المنتجات ({{ items.length }})</div>
        <div class="sec-note">{{ items.length }} منتجات أَرخص من سعرها عند الإضافة</div>
      </div>
      <div class="products">
        <article class="product-row" v-for="it in items" :key="it.id">
          <div class="img-wrap">
            <img class="product-img" :src="it.img" :alt="it.title" />
            <div v-if="it.off" class="off-badge">-{{ it.off }}%</div>
          </div>
          <div class="p-mid">
            <div class="p-title" @click="openProduct(it.id)">{{ it.title }}</div>
            <div class="p-opts">{{ it.size }} / {{ it.color }}</div>
            <div class="p-sub">
              <span>★ 5.0</span>
              <span class="dot">•</span>
              <span>500+ تقييم</span>
            </div>
            <div class="p-meta">
              <span class="price-current">{{ fmtPrice(priceAfter(it)) }}</span>
              <span v-if="it.priceOld" class="price-old">{{ fmtPrice(it.priceOld) }}</span>
            </div>
          </div>
          <div class="p-side">
            <div class="qty">
              <button class="qbtn" @click="decQty(it)">−</button>
              <div class="qval" aria-live="polite">{{ it.qty }}</div>
              <button class="qbtn" @click="incQty(it)">+</button>
            </div>
            <div class="icons">
              <span title="شحن سريع">🚚</span>
              <button class="rm" @click="removeItem(it.id)" aria-label="إزالة">✕</button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="promo">
      <div class="promo-txt">استمتع بشحن مجاني ومزايا حصرية مع عضوية Jeeey Club</div>
      <button class="promo-join" @click="joinClub">انضم</button>
    </section>

    <section class="section">
      <div class="sec-title">وسيلة الشحن</div>
      <div class="ship-list">
        <label class="shipping-card" v-for="m in shippingMethods" :key="m.id" :class="{ active: selectedShip===m.id }">
          <div class="ship-left">
            <input type="radio" name="ship" :value="m.id" v-model="selectedShip" />
            <div class="ship-text">
              <div class="ship-name">{{ m.name }}</div>
              <div class="ship-desc">{{ m.desc }}</div>
            </div>
          </div>
          <div class="ship-right">
            <div class="ship-price">{{ fmtPrice(m.price) }}</div>
            <div v-if="selectedShip===m.id" class="ship-badge">✓</div>
          </div>
        </label>
      </div>
    </section>

    <section class="section">
      <div class="sec-title">طريقة الدفع <span class="lock">🔒</span></div>
      <label class="pay-row disabled" title="الدفع عند الاستلام غير متاح لهذا الإجمالي" :class="{disabled: !codAvailable}">
        <input type="radio" name="pay" value="cod" v-model="payment" :disabled="!codAvailable" />
        <span>الدفع عند الاستلام (COD)</span>
      </label>
      <label class="pay-row">
        <input type="radio" name="pay" value="card" v-model="payment" />
        <span>بطاقة مدى/فيزا/ماستر</span>
      </label>
      <div class="small">قد لا تتوفر خدمة الدفع عند الاستلام إلا لطلبات ضمن حدود معينة.</div>
    </section>

    <div class="promo-bar" v-if="showPromoBar">
      <div>خصم إضافي عند الاشتراك بالعضوية</div>
      <button class="mini" @click="showPromoBar=false">متابعة</button>
    </div>

    <footer class="sticky-footer" aria-live="polite">
      <div class="sum">
        <div class="old" v-if="totalOld>total">{{ fmtPrice(totalOld) }} <span class="save">تم توفير {{ fmtPrice(totalOld-total) }}</span></div>
        <div class="cur">{{ fmtPrice(total) }}</div>
      </div>
      <button class="button-main" @click="onContinue">متابعة للدفع</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCheckout } from '@/store/checkout'

type Item = { id:string; title:string; img:string; size:string; color:string; price:number; priceOld?:number; off?:number; qty:number }

const checkout = useCheckout()
const address = ref({ name:'محمد الأحمد', phone:'+966 5XXXXXXX', line1:'طريق الملك فهد، مبنى 12، الطابق 3، شقة 8', city:'الرياض', province:'الرياض', country:'السعودية' })
if (checkout.address){
  address.value = {
    name: `${checkout.address.firstName} ${checkout.address.lastName}`.trim(),
    phone: checkout.address.phone,
    line1: checkout.address.details,
    city: checkout.address.city,
    province: checkout.address.province,
    country: checkout.address.country
  }
}
const items = ref<Item[]>([
  { id:'sku-1', title:'جاكيت شتوي مبطن مقاوم للمطر', img:'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', size:'L', color:'أسود', price:129.00, priceOld:169.00, off:24, qty:1 },
  { id:'sku-2', title:'حذاء رياضي خفيف للتمارين اليومية', img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop', size:'42', color:'رمادي', price:89.00, priceOld:99.00, off:10, qty:1 }
])

const shippingMethods = ref([
  { id:'fast', name:'شحن سريع', desc:'توصيل خلال 2-6 أيام عمل', price:30.00 },
  { id:'std', name:'شحن عادي', desc:'توصيل خلال 4-9 أيام عمل', price:18.00 }
])
const selectedShip = ref('std')
const payment = ref<'cod'|'card'>('card')
const showPromoBar = ref(true)

function incQty(it: Item){ it.qty = Math.min(99, it.qty + 1) }
function decQty(it: Item){ it.qty = Math.max(1, it.qty - 1) }
function removeItem(id:string){ items.value = items.value.filter(i=>i.id!==id) }
function openProduct(id:string){ console.log('open product', id) }
function joinClub(){ alert('انضممت إلى العضوية!') }

function priceAfter(it: Item){ return it.price }
const subTotal = computed(()=> items.value.reduce((s,it)=> s + priceAfter(it)*it.qty, 0))
const subTotalOld = computed(()=> items.value.reduce((s,it)=> s + (it.priceOld||it.price)*it.qty, 0))
const shipPrice = computed(()=> shippingMethods.value.find(m=>m.id===selectedShip.value)?.price || 0)
const total = computed(()=> round2(subTotal.value + shipPrice.value))
const totalOld = computed(()=> round2(subTotalOld.value + shipPrice.value))

const codAvailable = computed(()=> total.value >= 75.01 && total.value <= 1875.35)

function round2(n:number){ return Math.round(n*100)/100 }
function fmtPrice(n:number){ return `${n.toFixed(2)} ر.س` }

function onContinue(){
  if (payment.value==='cod' && !codAvailable.value){
    alert('الدفع عند الاستلام غير متاح لهذا الإجمالي.')
    return
  }
  if (!items.value.length){ alert('لا توجد منتجات في السلة'); return }
  alert('جارٍ المتابعة للدفع...')
}
</script>

<style scoped>
.page{padding:16px;max-width:360px;margin:0 auto;direction:rtl;background:#fff;padding-bottom:96px}
.header{height:56px;display:flex;align-items:center;gap:8px;padding:0 8px;border-bottom:1px solid #ECECEC}
.back{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;border:0;background:transparent}
.title{margin:0 auto;margin-inline-start:0;margin-inline-end:auto;font-size:16px;font-weight:700;color:#222}
.banner{background:#E9F7EE;color:#2E7D32;padding:10px 12px;border-radius:6px;font-size:13px;margin:12px 0}
.addr-card{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:8px;border:1px solid #F0F0F0;background:#fff}
.addr-pin{font-size:18px;line-height:1}
.addr-txt{flex:1;min-width:0}
.addr-row{display:flex;gap:8px;align-items:center}
.addr-name{font-weight:700;font-size:14px}
.addr-phone{font-size:13px;color:#555}
.addr-line{font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.muted{color:#777}
.addr-edit{border:0;background:transparent}
.section{margin-top:12px}
.sec-h{display:flex;flex-direction:column;gap:4px}
.sec-title{font-size:15px;font-weight:700;color:#222}
.sec-note{font-size:13px;color:#FF6B4A}
.products{display:flex;flex-direction:column}
.product-row{display:grid;grid-template-columns:84px 1fr auto;gap:12px;padding:10px 0;border-bottom:1px solid #F3F3F3}
.img-wrap{position:relative}
.product-img{width:84px;height:84px;border-radius:6px;object-fit:cover}
.off-badge{position:absolute;inset-inline-start:4px;top:4px;background:#FF6B4A;color:#fff;font-size:12px;border-radius:4px;padding:2px 6px}
.p-mid{display:flex;flex-direction:column;gap:4px;min-width:0}
.p-title{font-size:14px;font-weight:600;color:#222;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.p-opts{font-size:12px;color:#777}
.p-sub{font-size:12px;color:#777;display:flex;gap:6px;align-items:center}
.dot{opacity:.6}
.p-meta{display:flex;gap:8px;align-items:baseline}
.price-current{color:#FF6B4A;font-weight:700;font-size:16px}
.price-old{color:#999;font-size:12px;text-decoration:line-through}
.p-side{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end}
.qty{display:grid;grid-template-columns:36px 36px 36px;align-items:center}
.qbtn{width:36px;height:36px;border:1px solid #E6E6E6;border-radius:6px;background:#fff}
.qval{display:grid;place-items:center;width:36px;height:36px}
.icons{display:flex;gap:8px;align-items:center;color:#555}
.rm{border:0;background:transparent}
.promo{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#FFF2EC;border:1px solid #FFE1D7;padding:12px;border-radius:8px;font-size:13px;margin-top:12px}
.promo-join{width:40px;height:40px;border-radius:20px;border:0;background:#111;color:#fff}
.ship-list{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.shipping-card{padding:10px;border-radius:8px;border:1px solid #EEE;display:flex;align-items:center;justify-content:space-between;background:#fff}
.shipping-card.active{border-color:#111}
.ship-left{display:flex;align-items:center;gap:10px}
.ship-text{display:flex;flex-direction:column}
.ship-name{font-size:14px;font-weight:700}
.ship-desc{font-size:12px;color:#777}
.ship-right{display:flex;align-items:center;gap:8px}
.ship-price{font-size:14px;font-weight:700;color:#222}
.ship-badge{background:#111;color:#fff;border-radius:12px;padding:2px 6px;font-size:12px}
.pay-row{display:flex;align-items:center;gap:10px;border:1px solid #EEE;border-radius:8px;padding:10px;margin-top:8px}
.pay-row.disabled{opacity:.6}
.small{font-size:12px;color:#777;margin-top:6px}
.promo-bar{position:fixed;left:0;right:0;bottom:64px;background:#111;color:#fff;padding:8px 16px;display:flex;align-items:center;justify-content:space-between}
.mini{background:#fff;color:#111;border:0;border-radius:6px;padding:6px 10px}
.sticky-footer{position:fixed;left:0;right:0;bottom:0;padding:10px 16px;background:linear-gradient(#fff,#fff);box-shadow:0 -4px 12px rgba(0,0,0,0.06);display:flex;gap:12px;align-items:center}
.sum{margin-inline-start:auto;margin-inline-end:0;text-align:end}
.old{font-size:13px;color:#999;text-decoration:line-through}
.save{color:#FF6B4A;margin-inline-start:6px;text-decoration:none}
.cur{font-size:18px;font-weight:700;color:#FF6B4A}
.button-main{background:#111;color:#fff;padding:12px 16px;border-radius:6px;font-weight:700;flex:1;text-align:center;border:0}
</style>

