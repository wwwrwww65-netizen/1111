<template>
  <div>
    <HeaderBar />
    <div class="container page" dir="rtl">
      <h1 class="title">الدفع</h1>
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>العنوان</div>
          <button class="btn btn-outline" @click="openAddress=true">اختيار/إضافة</button>
        </div>
        <div class="muted" v-if="!addressStr">لم يتم اختيار عنوان</div>
        <div v-else>{{ addressStr }}</div>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>وسيلة الشحن</div>
        </div>
        <div class="ship-list">
          <label class="ship-item" v-for="m in shippingMethods" :key="m.id" :class="{ on: shipping?.id===m.id }">
            <input type="radio" name="ship" :value="m.id" v-model="shipId"> {{ m.name }} — <strong>{{ m.price.toFixed(2) }} ر.س</strong>
          </label>
        </div>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>طريقة الدفع</div>
          <button class="btn btn-outline" @click="openPayment=true">اختيار</button>
        </div>
        <div class="muted" v-if="!payment">لم يتم تحديد طريقة الدفع</div>
        <div v-else>{{ payment }}</div>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>كوبون الخصم</div>
          <div class="row" style="gap:8px">
            <input class="input" style="height:36px" v-model="coupon" placeholder="أدخل الكود" />
            <button class="btn btn-outline" @click="applyCoupon">تطبيق</button>
          </div>
        </div>
        <div class="muted" v-if="couponMsg">{{ couponMsg }}</div>
      </div>
      <div class="card row" style="justify-content:space-between">
        <div>الإجمالي</div>
        <div style="font-weight:700">{{ total.toFixed(2) }} ر.س</div>
      </div>
      <button class="btn submit" :disabled="!addressStr || !payment || !shipping" @click="goConfirm">تأكيد الطلب</button>
    </div>

    <BottomSheet v-model="openAddress" height="65vh">
      <div class="sheet-title">العنوان</div>
      <div class="grid-form">
        <input class="input" placeholder="الاسم الأول" v-model="addrForm.firstName" />
        <input class="input" placeholder="اسم العائلة" v-model="addrForm.lastName" />
        <input class="input" placeholder="الهاتف" v-model="addrForm.phone" />
        <input class="input" placeholder="الدولة" v-model="addrForm.country" />
        <input class="input" placeholder="المنطقة" v-model="addrForm.province" />
        <input class="input" placeholder="المدينة" v-model="addrForm.city" />
        <input class="input" placeholder="الشارع" v-model="addrForm.street" />
        <input class="input" placeholder="تفاصيل" v-model="addrForm.details" />
      </div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">
        <button class="btn btn-outline" @click="openAddress=false">إلغاء</button>
        <button class="btn" @click="saveAddress">حفظ</button>
      </div>
    </BottomSheet>
    <BottomSheet v-model="openPayment" height="50vh">
      <div class="sheet-title">الدفع</div>
      <div class="list">
        <button class="list-item" v-for="m in paymentMethods" :key="m" @click="selectPayment(m)">{{ m }}</button>
      </div>
    </BottomSheet>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckout } from '@/store/checkout'
import { apiPost, apiGet } from '@/lib/api'

const cart = useCart()
const { total } = storeToRefs(cart)
const openAddress = ref(false)
const openPayment = ref(false)
const checkout = useCheckout()
const addressStr = computed(()=> checkout.address ? `${checkout.address.city} - ${checkout.address.street}` : undefined)
const payment = computed(()=> checkout.payment)
const demoAddresses = ['الرياض - حي الياسمين - شارع العليا', 'جدة - حي الروضة - الأمير سلطان']
const paymentMethods = ['بطاقة ائتمانية', 'Apple Pay', 'الدفع عند الاستلام']
function selectAddress(a:string){
  checkout.setAddress({ country:'السعودية', firstName:'', lastName:'', phone:'', province:'', city:a.split(' - ')[0]||'', street:a, details:a })
  openAddress.value = false
}
function selectPayment(p:string){ checkout.setPayment(p); openPayment.value = false }
const router = useRouter()
const coupon = ref('')
const couponMsg = ref('')
async function goConfirm(){
  if(!(addressStr.value && payment.value && shipping.value)) return
  if (payment.value === 'الدفع عند الاستلام'){
    // COD: إنشاء طلب ثم وسمه مدفوعاً (مكتمل) مباشرة
    const created = await apiPost('/api/orders', { shippingAddressId: undefined, shippingMethodId: shipping.value?.id, payment: 'COD', ref: sessionStorage.getItem('affiliate_ref')||undefined })
    if (created && (created as any).order && (created as any).order.id){
      const oid = (created as any).order.id
      const paid = await apiPost(`/api/orders/${encodeURIComponent(oid)}/pay`, { method: 'CASH_ON_DELIVERY' })
      if (paid && (paid as any).success){ router.push('/pay/success') }
      else { router.push('/pay/failure') }
    } else { router.push('/pay/failure') }
    return
  }
  // CARD: إنشاء جلسة دفع ثم تحويل
  const session = await apiPost('/api/payments/session', { amount: Number(total.value.toFixed(2)), currency: 'SAR', method: 'CARD', ref: sessionStorage.getItem('affiliate_ref')||undefined, returnUrl: location.origin + '/pay/success', cancelUrl: location.origin + '/pay/failure' })
  if (session && (session as any).redirectUrl){
    router.push('/pay/processing')
    location.href = (session as any).redirectUrl
  } else {
    router.push('/pay/failure')
  }
}

async function applyCoupon(){
  couponMsg.value=''
  if(!coupon.value.trim()) return
  const res = await apiPost('/api/coupons/apply', { code: coupon.value })
  if (res && (res as any).ok){ couponMsg.value = 'تم تطبيق الكوبون'; }
  else { couponMsg.value = 'كوبون غير صالح' }
}

// Load addresses from server on open
watch(openAddress, async (v)=>{
  if (v){
    const arr = await apiGet<any[]>('/api/addresses')
    if (Array.isArray(arr) && arr.length){
      const a = arr[0]
      checkout.setAddress({ country:a.country||'السعودية', firstName:a.firstName||'', lastName:a.lastName||'', phone:a.phone||'', province:a.state||'', city:a.city||'', street:a.street||'', details:(a.details||'').toString() })
    }
  }
})

// Shipping selection
import type { ShippingMethod } from '@/store/checkout'
const shippingMethods = ref<ShippingMethod[]>([
  { id:'std', name:'شحن عادي', price: 18 },
  { id:'fast', name:'شحن سريع', price: 30 }
])
const shipId = ref<string>('std')
const shipping = computed(()=> shippingMethods.value.find(m=>m.id===shipId.value))
watch(shipId, (id)=>{ const m = shippingMethods.value.find(x=>x.id===id); if(m) checkout.setShipping(m) }, { immediate:true })

// dynamic shipping quote
import { watchEffect } from 'vue'
watchEffect(async ()=>{
  if (!checkout.address || !shipping.value) return
  try{
    const q = await apiGet<any>(`/api/shipping/quote?city=${encodeURIComponent(checkout.address.city)}&method=${encodeURIComponent(shipping.value.id)}`)
    if (q && q.price!=null){
      const m = shippingMethods.value.find(x=>x.id===shipping.value?.id)
      if (m) m.price = Number(q.price)
    }
  }catch{}
})

// Address form model
const addrForm = ref({ country:'السعودية', firstName:'', lastName:'', phone:'', province:'', city:'', street:'', details:'' })
function saveAddress(){
  const f = addrForm.value
  checkout.setAddress({ country:f.country, firstName:f.firstName, lastName:f.lastName, phone:f.phone, province:f.province, city:f.city, street:f.street, details:f.details })
  openAddress.value = false
}
</script>

<style scoped>
.page{padding-top:68px}
.title{margin:12px 0}
.muted{color:#64748b}
.sheet-title{font-weight:700;margin-bottom:8px}
.list{display:grid;gap:8px}
.list-item{display:block;width:100%;text-align:right;border:1px solid var(--muted-2);border-radius:12px;padding:10px;background:#fff}
.submit{width:100%}
.grid-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (max-width:480px){ .grid-form{grid-template-columns:1fr} }
.input{border:1px solid var(--muted-2);border-radius:10px;padding:10px}
.ship-list{display:grid;gap:8px;margin-top:8px}
.ship-item{display:flex;align-items:center;gap:8px;border:1px solid var(--muted-2);border-radius:10px;padding:10px;background:#fff}
.ship-item.on{border-color:#111}
</style>

