<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-3">
      <button @click="goBack" aria-label="رجوع">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      <h1 class="text-lg font-semibold text-gray-900">تأكيد الطلب ({{ totalItems }})</h1>
      <span class="w-6"></span>
    </header>

    <main class="pt-14 pb-28">
      <!-- Address -->
      <section class="bg-white px-4 py-3 mb-2 flex justify-between items-center" @click="openAddress=true">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#8a1538]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/></svg>
          <div>
            <div class="font-semibold text-sm">{{ addressName }}</div>
            <div class="text-sm text-gray-700">{{ addressPhone }}</div>
            <div class="text-xs text-gray-600 truncate max-w-[70vw]">{{ addressLine }}</div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </section>

      <!-- Items -->
      <section class="bg-white mb-2">
        <div class="px-4 py-2 text-sm font-semibold text-gray-800">تفاصيل الطلب</div>
        <div v-for="ci in items" :key="ci.id" class="px-4 py-3 flex gap-3 border-t border-gray-200 first:border-t-0">
          <img :src="ci.img" class="w-20 h-20 object-cover border" alt="" />
          <div class="flex-1">
            <div class="text-sm text-gray-800 line-clamp-2">{{ ci.title }}</div>
            <div class="text-xs text-gray-500 mt-1" v-if="ci.variantSize || ci.variantColor">{{ ci.variantColor ? ('اللون: '+ci.variantColor+' ') : '' }}{{ ci.variantSize ? ('المقاس: '+ci.variantSize) : '' }}</div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-[#8a1538] font-semibold">{{ ci.price.toFixed(2) }} ر.س</span>
              <div class="flex items-center border rounded">
                <button class="px-2" @click="decreaseQty(ci.id)">-</button>
                <span class="px-3">{{ ci.qty }}</span>
                <button class="px-2" @click="increaseQty(ci.id)">+</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Shipping -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="font-semibold text-sm mb-2">طريقة الشحن</div>
        <div class="space-y-2">
          <div v-for="m in shippingMethods" :key="m.id" class="bg-[#f7f7f7] px-3 py-2 rounded flex items-start gap-2">
            <div class="relative mt-1">
              <div class="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center" :class="shipId===m.id ? 'bg-[#8a1538] border-[#8a1538]' : 'bg-white'">
                <svg v-if="shipId===m.id" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </div>
              <input type="radio" :value="m.id" v-model="shipId" class="absolute inset-0 opacity-0 cursor-pointer"/>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2"><svg class="w-5 h-5 text-[#8a1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg><span>{{ m.name }}</span></div>
              <div class="text-xs text-gray-600 ml-7">{{ m.desc }}</div>
            </div>
            <div class="text-sm font-semibold">{{ m.price.toFixed(2) }} ر.س</div>
          </div>
        </div>
      </section>

      <!-- Payment -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="flex items-center justify-between mb-2"><div class="font-semibold text-sm">طريقة الدفع</div><div class="flex items-center gap-1 text-green-600 text-xs"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>جميع البيانات مشفرة</div></div>
        <div class="divide-y divide-gray-300 text-sm">
          <label v-for="p in paymentMethods" :key="p" class="flex items-center gap-2 py-3"><input type="radio" :value="p" v-model="payment"/><svg class="w-5 h-5 text-[#8a1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg><span>{{ p }}</span></label>
        </div>
      </section>

      <!-- Discounts -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="divide-y divide-gray-300 text-sm">
          <div class="py-3 flex justify-between items-center gap-2"><span>رمز القسيمة:</span><div class="flex items-center gap-2"><input class="border px-2 py-1 text-sm" v-model="coupon" placeholder="أدخل الكود" /><button class="px-3 py-1 border rounded" @click="applyCoupon">تطبيق</button></div></div>
          <div class="py-3 flex justify-between"><span>بطاقة هدية</span><span class="text-lg">›</span></div>
          <div class="py-3 flex justify-between"><span>المحفظة:</span><span class="text-lg">›</span></div>
          <div class="py-3 flex justify-between"><span>النقاط:</span><span class="text-gray-400">إجمالي النقاط: 0 ›</span></div>
          <div class="text-xs text-green-700" v-if="couponMsg">{{ couponMsg }}</div>
        </div>
      </section>

      <!-- Totals -->
      <section class="bg-white px-4 py-3 space-y-2">
        <div class="flex justify-between text-sm"><span>سعر الوحدة</span><span>{{ unitTotal.toFixed(2) }} ر.س</span></div>
        <div class="flex justify-between text-sm"><span>الشحن</span><span>{{ shippingCost.toFixed(2) }} ر.س</span></div>
        <div class="flex justify-between text-sm items-center" v-if="discountTotal>0"><div class="flex items-center gap-2"><div class="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500"><svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></div><span>الخصم</span></div><span class="text-orange-500">-{{ discountTotal.toFixed(2) }} ر.س</span></div>
        <div class="flex justify-between items-center border-t pt-2"><span class="font-semibold text-base">الإجمالي</span><span class="text-orange-500 font-bold text-xl">{{ grandTotal.toFixed(2) }} ر.س</span></div>
      </section>
    </main>

    <!-- Confirm button -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3"><button class="w-full bg-[#8a1538] text-white font-semibold py-2 text-sm" :disabled="!canConfirm" @click="goConfirm">تأكيد الطلب</button></div>

    <!-- Address sheet -->
    <transition name="drawer-left">
      <div v-if="openAddress" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40" @click="openAddress=false"></div>
        <div class="absolute inset-0 bg-white flex flex-col">
          <div class="h-12 border-b flex items-center justify-center relative">
            <h3 class="text-base font-semibold">اختر/أضف عنوان</h3>
            <button class="absolute left-3" @click="openAddress=false">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <div v-for="a in serverAddresses" :key="a.id" class="border rounded p-2 flex items-center justify-between">
              <div class="text-sm">{{ a.city }} - {{ a.street }}</div>
              <button class="text-xs border px-2 py-1 rounded" @click="chooseAddress(a)">اختيار</button>
            </div>
            <div class="grid grid-cols-1 gap-2 border-t pt-2 mt-2">
              <input class="border px-2 py-2" placeholder="الدولة" v-model="addrForm.country"/>
              <input class="border px-2 py-2" placeholder="المحافظة" v-model="addrForm.province"/>
              <input class="border px-2 py-2" placeholder="المدينة" v-model="addrForm.city"/>
              <input class="border px-2 py-2" placeholder="الشارع" v-model="addrForm.street"/>
              <input class="border px-2 py-2" placeholder="تفاصيل" v-model="addrForm.details"/>
            </div>
          </div>
          <div class="p-3 border-t flex items-center justify-end gap-2">
            <button class="border px-3 py-1 rounded" @click="openAddress=false">إلغاء</button>
            <button class="bg-[#8a1538] text-white px-3 py-1 rounded" @click="saveAddress">حفظ</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { ref, computed, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckout } from '@/store/checkout'
import { apiPost, apiGet } from '@/lib/api'

const router = useRouter()
const cart = useCart()
const { total } = storeToRefs(cart)
const items = computed(()=> cart.items)
const totalItems = computed(()=> cart.count)

// Address
const openAddress = ref(false)
const checkout = useCheckout()
const addressName = computed(()=> checkout.address ? (checkout.address.firstName||'') + ' ' + (checkout.address.lastName||'') : '—')
const addressPhone = computed(()=> checkout.address?.phone || '')
const addressLine = computed(()=> checkout.address ? `${checkout.address.province||''} ${checkout.address.city||''} ${checkout.address.street||''}`.trim() : '—')
const addressStr = computed(()=> checkout.address ? `${checkout.address.city} - ${checkout.address.street}` : undefined)

// Payment
const payment = ref<string | undefined>(checkout.payment)
const paymentMethods = ['بطاقة ائتمانية', 'Apple Pay', 'الدفع عند الاستلام']
watch(payment, (p)=>{ if (p) checkout.setPayment(p) })

// Coupon
const coupon = ref('')
const couponMsg = ref('')

async function goConfirm(){
  if(!canConfirm.value) return
  if (payment.value === 'الدفع عند الاستلام'){
    const created = await apiPost('/api/orders', { shippingAddressId: undefined, shippingMethodId: shipping.value?.id, payment: 'COD', ref: sessionStorage.getItem('affiliate_ref')||undefined })
    if (created && (created as any).order && (created as any).order.id){
      const oid = (created as any).order.id
      const paid = await apiPost(`/api/orders/${encodeURIComponent(oid)}/pay`, { method: 'CASH_ON_DELIVERY' })
      if (paid && (paid as any).success){ router.push('/pay/success') }
      else { router.push('/pay/failure') }
    } else { router.push('/pay/failure') }
    return
  }
  // لطرق الدفع الأخرى ننقل إلى صفحة المعالجة الجديدة
  router.push('/pay/processor')
}

async function applyCoupon(){
  couponMsg.value=''
  if(!coupon.value.trim()) return
  const res = await apiPost('/api/coupons/apply', { code: coupon.value })
  if (res && (res as any).ok){ couponMsg.value = 'تم تطبيق الكوبون'; discountTotal.value = Math.min(0.15 * unitTotal.value, unitTotal.value * 0.2) }
  else { couponMsg.value = 'كوبون غير صالح' }
}

// Load addresses on open
const serverAddresses = ref<any[]>([])
watch(openAddress, async (v)=>{
  if (v){
    const arr = await apiGet<any[]>('/api/addresses')
    serverAddresses.value = Array.isArray(arr)? arr : []
    if (!checkout.address && serverAddresses.value.length){
      const a = serverAddresses.value[0]
      checkout.setAddress({ country:a.country||'السعودية', firstName:a.firstName||'', lastName:a.lastName||'', phone:a.phone||'', province:a.state||'', city:a.city||'', street:a.street||'', details:(a.details||'').toString() })
    }
  }
})

// Shipping
import type { ShippingMethod } from '@/store/checkout'
const shippingMethods = ref<ShippingMethod[]>([
  { id:'std', name:'شحن عادي', price: 18, desc:'7 - 10 أيام عمل' },
  { id:'fast', name:'شحن سريع', price: 30, desc:'2 - 5 أيام عمل' }
])
const shipId = ref<string>('std')
const shipping = computed(()=> shippingMethods.value.find(m=>m.id===shipId.value))
watch(shipId, (id)=>{ const m = shippingMethods.value.find(x=>x.id===id); if(m) checkout.setShipping(m) }, { immediate:true })

watchEffect(async ()=>{
  if (!checkout.address || !shipping.value) return
  try{
    const q = await apiGet<any>(`/api/shipping/quote?city=${encodeURIComponent(checkout.address.city)}&method=${encodeURIComponent(shipping.value.id)}`)
    if (q && q.price!=null){ const m = shippingMethods.value.find(x=>x.id===shipping.value?.id); if (m) m.price = Number(q.price) }
  }catch{}
})

// Address form (create)
const addrForm = ref({ country:'السعودية', province:'', city:'', street:'', details:'' })
async function saveAddress(){
  const f = addrForm.value
  await apiPost('/api/addresses', { country:'SA', province:f.province, city:f.city, street:f.street, details:f.details })
  checkout.setAddress({ country:f.country, firstName:'', lastName:'', phone:'', province:f.province, city:f.city, street:f.street, details:f.details })
  openAddress.value = false
}
function chooseAddress(a:any){ checkout.setAddress({ country:a.country||'السعودية', firstName:a.firstName||'', lastName:a.lastName||'', phone:a.phone||'', province:a.state||'', city:a.city||'', street:a.street||'', details:(a.details||'').toString() }); openAddress.value=false }

// Totals & points
const unitTotal = computed(()=> cart.total)
const shippingCost = computed(()=> shipping.value?.price || 0)
const discountTotal = ref(0)
const grandTotal = computed(()=> Math.max(0, unitTotal.value + shippingCost.value - discountTotal.value))
const canConfirm = computed(()=> !!(checkout.address && payment.value && shipping.value && items.value.length))

// Qty change
function increaseQty(id:string){ const it = items.value.find(i=>i.id===id); if (!it) return; cart.update(id, it.qty+1) }
function decreaseQty(id:string){ const it = items.value.find(i=>i.id===id); if (!it) return; if (it.qty>1) cart.update(id, it.qty-1) }

function goBack(){ router.back() }
</script>

<style scoped>
.drawer-left-enter-active,.drawer-left-leave-active{ transition: transform 0.28s ease }
.drawer-left-enter-from,.drawer-left-leave-to{ transform: translateX(-100%) }
.line-clamp-2{ display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden }
</style>
