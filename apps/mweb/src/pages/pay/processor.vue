<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 shadow z-50 flex items-center justify-center">
      <h1 class="text-lg font-semibold text-gray-900">الدفع</h1>
      <button class="absolute right-3 w-10 h-10 flex items-center justify-center" @click="closePage">✕</button>
    </header>

    <main class="pt-14 pb-28">
      <section class="bg-white p-4 mb-3">
        <div class="font-semibold mb-3">طرق الدفع المقبولة</div>
        <div class="flex gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" class="h-6"/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" class="h-6"/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" class="h-6"/>
        </div>
      </section>

      <section class="bg-white p-4 mb-3">
        <div>
          <label class="text-sm">رقم البطاقة</label>
          <input v-model="card.number" type="text" maxlength="16" inputmode="numeric" class="w-full border px-3 py-2 mt-1 rounded" placeholder="•••• •••• •••• ••••"/>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-sm">تاريخ الانتهاء</label>
            <input v-model="card.expiry" type="text" maxlength="5" placeholder="MM/YY" class="w-full border px-3 py-2 mt-1 rounded"/>
          </div>
          <div class="flex-1">
            <label class="text-sm">رمز الأمان CVV</label>
            <input v-model="card.cvv" type="text" maxlength="3" inputmode="numeric" class="w-full border px-3 py-2 mt-1 rounded" placeholder="•••"/>
          </div>
        </div>
      </section>

      <section class="bg-white p-4 mb-3">
        <div class="font-semibold mb-2">عنوان الفاتورة</div>
        <div class="text-sm text-gray-700 leading-5">
          {{ billingName }}<br/>
          {{ billingPhone }}<br/>
          {{ billingLine }}
        </div>
      </section>

      <section class="bg-white p-4 mb-3">
        <div class="flex justify-between text-sm"><span>سعر الوحدة</span><span>{{ unitTotal.toFixed(2) }} ر.س</span></div>
        <div class="flex justify-between text-sm"><span>إجمالي الشحن</span><span>{{ shippingCost.toFixed(2) }} ر.س</span></div>
        <div class="flex justify-between text-sm" v-if="discountTotal>0"><span>خصم</span><span class="text-orange-500">-{{ discountTotal.toFixed(2) }} ر.س</span></div>
        <div class="flex justify-between font-semibold text-base border-t pt-2">
          <span>المجموع</span>
          <span>{{ grandTotal.toFixed(2) }} ر.س</span>
        </div>
      </section>

      <section class="bg-white p-2 space-y-3">
        <div>
          <div class="flex items-center gap-2 text-green-600 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-green-600" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm2-4h2V7H5v2zm2-4h2V3H7v2zm2 0h2V3H9v2zm2 0h2V3h-2v2zm2 0h2V3h-2v2zm2 0h2V3h-2v2zm2 2h2V5h-2v2zm0 2h2V7h-2v2zm0 2h2v-2h-2v2zm0 2h2v-2h-2v2z"/></svg>
            ضمان التوصيل الآمن
          </div>
          <p class="text-sm text-gray-700 mt-2">نضمن وصول طلبك بأمان وفي الموعد.</p>
        </div>
        <div>
          <div class="flex items-center gap-2 text-green-600 font-semibold"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-green-600" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18L19 7v4c0 4.97-3.36 9.58-8 10.82C7.36 20.58 4 15.97 4 11V7l8-3.82z"/><text x="9" y="16" font-size="8" fill="white">$</text></svg>أمن الدفع</div>
          <p class="text-sm text-gray-700 mt-2">لا نخزن معلومات بطاقتك؛ تتم المعالجة عبر مزودي الدفع.</p>
        </div>
      </section>

      <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex items-center">
        <div class="font-bold text-base text-gray-800"><span class="mr-1">الإجمالي:</span><span class="text-[#8a1538] font-bold">{{ grandTotal.toFixed(2) }} ر.س</span></div>
        <button class="mr-4 flex-1 bg-[#8a1538] text-white font-bold py-3 text-base rounded-none text-center" :disabled="!isCardValid" :class="!isCardValid ? 'opacity-50 cursor-not-allowed' : ''" @click="confirmPayment">تأكيد الدفع</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCart } from '@/store/cart'
import { useCheckout } from '@/store/checkout'
import { apiPost } from '@/lib/api'

const router = useRouter()
const route = useRoute()
function closePage(){ router.back() }

const cart = useCart()
const checkout = useCheckout()

const unitTotal = computed(()=> cart.total)
const shippingCost = computed(()=> checkout.shipping?.price || 0)
const discountTotal = ref(0)
const grandTotal = computed(()=> Math.max(0, unitTotal.value + shippingCost.value - discountTotal.value))

const billingName = computed(()=> (checkout.address?.firstName||'') + ' ' + (checkout.address?.lastName||''))
const billingPhone = computed(()=> checkout.address?.phone || '')
const billingLine = computed(()=> `${checkout.address?.province||''} ${checkout.address?.city||''} ${checkout.address?.street||''}`.trim())

const card = ref({ number:'', expiry:'', cvv:'' })
const isCardValid = computed(()=> card.value.number.length===16 && card.value.expiry.length===5 && card.value.cvv.length===3)

async function confirmPayment(){
  if (!isCardValid.value) return
  // Create payment session (mocked as CARD)
  const session = await apiPost('/api/payments/session', { amount: Number(grandTotal.value.toFixed(2)), currency:'SAR', method:'CARD', returnUrl: location.origin + '/pay/success', cancelUrl: location.origin + '/pay/failure' })
  if (session && (session as any).redirectUrl) {
    router.push('/pay/processing')
    location.href = (session as any).redirectUrl
  } else {
    router.push('/pay/failure')
  }
}
</script>

<style scoped>
.drawer-left-enter-active,.drawer-left-leave-active{ transition: transform 0.28s ease }
.drawer-left-enter-from,.drawer-left-leave-to{ transform: translateX(-100%) }
.line-clamp-2{ display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden }
</style>
