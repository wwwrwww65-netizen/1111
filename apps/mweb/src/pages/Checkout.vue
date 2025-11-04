<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <!-- الهيدر -->
    <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-3">
      <!-- زر رجوع -->
      <button @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <h1 class="text-lg font-semibold text-gray-900">تأكيد الطلب ({{ totalItems }})</h1>
      <!-- أيقونة سماعة كمبيوتر → خدمة العملاء -->
      <button @click="goSupport" aria-label="خدمة العملاء">
        <Headset class="w-6 h-6 text-gray-700" />
      </button>
    </header>

    <main class="pt-14 pb-28">
      <!-- العنوان -->
      <section class="bg-white px-4 py-3 mb-2 flex justify-between items-center" @click="openAddressPicker">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#8a1538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
          </svg>
          <div>
            <div class="font-semibold text-sm">{{ addrNameDisplay }}</div>
            <div class="text-sm text-gray-700">{{ addrPhoneDisplay }}</div>
            <div class="text-xs text-gray-600">{{ addrLineDisplay }}</div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </section>

      <!-- تفاصيل الطلب -->
      <section class="bg-white mb-2">
        <div class="px-4 py-2 text-sm font-semibold text-gray-800">تفاصيل الطلب</div>
        <div v-for="(item, idx) in items" :key="idx" class="px-4 py-3 flex gap-3" :class="{'border-t border-gray-200': idx>0}">
          <img :src="item.img" class="w-20 h-20 object-cover border bg-gray-100" />
          <div class="flex-1">
            <div class="text-sm text-gray-800">{{ item.title }}</div>
            <div class="text-xs text-gray-500 mt-1">
              <span v-if="item.variantColor">اللون: {{ item.variantColor }}</span>
              <span v-if="item.variantSize" class="mr-2">{{ item.variantSize }}</span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-[#8a1538] font-semibold">{{ Math.round(Number(afterOf(item) ?? item.price)) }} {{ currencySymbol }}</span>
              <!-- عداد -->
              <div class="flex items-center border rounded">
                <button class="px-2" @click="decreaseQty(idx)">-</button>
                <span class="px-3">{{ item.qty }}</span>
                <button class="px-2" @click="increaseQty(idx)">+</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- الشحن -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="font-semibold text-sm mb-2">طريقة الشحن</div>
        <div class="space-y-2">
          <div v-for="(ship, i) in shippingOptions" :key="i" class="bg-[#f7f7f7] px-3 py-2 rounded flex items-start gap-2">
            <!-- دائرة فارغة تتعبأ عند الاختيار -->
            <div class="relative mt-1">
              <div class="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center"
                   :class="selectedShipping === ship.id ? 'bg-[#8a1538] border-[#8a1538]' : 'bg-white'">
                <svg v-if="selectedShipping === ship.id" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <input type="radio" :value="ship.id" v-model="selectedShipping" class="absolute inset-0 opacity-0 cursor-pointer"/>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-[#8a1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>{{ ship.offerTitle || ship.name }}</span>
              </div>
              <div class="text-xs text-gray-600 ml-7">{{ formatEtaRange(ship.etaMinHours, ship.etaMaxHours) }} • {{ Number(ship.price||0).toFixed(2) }} {{ currencySymbol }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- الدفع -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold text-sm">طريقة الدفع</div>
          <div class="flex items-center gap-1 text-green-600 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            جميع البيانات مشفرة
          </div>
        </div>
        <div class="divide-y divide-gray-300 text-sm">
          <label v-for="(pay, i) in paymentOptions" :key="i" class="flex items-center gap-2 py-3">
            <input type="radio" name="payment" :value="pay.id" v-model="selectedPayment"/>
            <svg class="w-5 h-5 text-[#8a1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="pay.id === 'cod'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              <path v-else-if="pay.name === 'خدمة حاسب عبر الكريمي'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              <path v-else-if="pay.name === 'محفظة جوالي'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
               <span>{{ pay.id==='cod' ? 'الدفع عند الاستلام' : pay.name }}</span>
          </label>
        </div>
      </section>


      <!-- الخصومات -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="divide-y divide-gray-300 text-sm">
          <button class="w-full text-right py-3 flex justify-between" @click="openCouponDrawer"><span>رمز القسيمة</span><span class="text-lg flex items-center gap-2"><span v-if="discountFromCoupon>0" class="text-red-500 text-[14px]">-{{ discountFromCoupon.toFixed(2) }} {{ currencySymbol }}</span> ›</span></button>
          <button class="w-full text-right py-3 flex justify-between" @click="openGiftDrawer"><span>بطاقة هدية</span><span class="text-lg">›</span></button>
          <button class="w-full text-right py-3 flex justify-between" @click="openWalletSheet"><span>المحفظة</span><span class="text-lg">›</span></button>
          <button class="w-full text-right py-3 flex justify-between" @click="openPointsSheet">
            <span>النقاط</span>
            <span class="text-gray-600">إجمالي النقاط: {{ points }}</span>
          </button>
        </div>
      </section> 
      
    <!-- الأسعار -->
      <section class="bg-white px-4 py-3 space-y-2">
        <div class="flex justify-between text-sm"><span>المجموع</span><span>{{ subtotalOriginal.toFixed(2) }} {{ currencySymbol }}</span></div>
        <div class="flex justify-between text-sm"><span>الشحن</span><span>{{ shippingPrice.toFixed(2) }} {{ currencySymbol }}</span></div>

        <!-- الخصم -->
        <div class="flex justify-between text-sm items-center">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <span>الخصم</span>
          </div>
          <span class="text-orange-500">-{{ promoTotal.toFixed(2) }} {{ currencySymbol }}</span>
        </div>

        <!-- الكوبون -->
        <div class="flex justify-between text-sm items-center">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <span>كوبون</span>
          </div>
          <span class="text-orange-500">-{{ discountFromCoupon.toFixed(2) }} {{ currencySymbol }}</span>
        </div>

        <!-- الإجمالي -->
        <div class="flex justify-between items-center border-t pt-2">
          <span class="font-semibold text-base">الإجمالي</span>
          <span class="text-orange-500 font-bold text-xl">{{ totalAll.toFixed(2) }} {{ currencySymbol }}</span>
        </div>
        <div class="text-xs text-green-600">تم توفير {{ savingAll.toFixed(2) }} {{ currencySymbol }}</div>
      </section>

      <!-- نقاط المكافأة -->
      <section v-if="showRewards" class="bg-white px-4 py-3 mt-2">
        <span role="img" aria-label="عملة ذهبية" class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 text-yellow-900 font-extrabold shadow-md ring-1 ring-yellow-700/30">j</span>
        <span class="text-red-600 font-semibold">{{ points }}</span>
        <span class="text-sm">نقاط مكافأة</span>
        <button @click="showPointsInfo = true" class="ml-auto w-5 h-5 flex items-center justify-center rounded-full border text-gray-400">?</button>
      </section>

      <!-- منبثق نقاط المكافأة -->
      <div v-if="showPointsInfo" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-md p-4 w-80 text-center">
          <p class="text-sm text-gray-700 mb-4">
            سيتم إضافة نقاط جي jeeey إلى حسابك بعد تأكيد استلام طلبك.
            بعض المنتجات الموجودة في عربة التسوق الحالية غير مؤهلة للحصول على نقاط.
          </p>
          <button @click="showPointsInfo = false" class="w-full bg-[#8a1538] text-white py-2 rounded">حسناً</button>
        </div>
      </div>

      <!-- حاوية الأمان -->
      <section class="bg-white px-4 py-3 mt-2">
        <div class="flex justify-between items-center mb-3">
          <span class="font-semibold">تسوّق بأمان واستدامة</span>
          <span class="text-lg">›</span>
        </div>
        <div class="grid grid-cols-4 text-center text-xs text-gray-700 gap-2">
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-100">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span>ضمان التوصيل الآمن</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-100">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <span>ضمان أمان الدفع</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-100">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <span>الأمان والخصوصية</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-100">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <span>دعم العملاء</span>
          </div>
        </div>
      </section>

      <!-- نص الموافقة -->
      <section class="px-4 py-3 text-xs text-gray-500">
        من خلال تقديم الطلب، إنك توافق على
        <span class="underline text-gray-700 cursor-pointer"> الشروط والأحكام </span>
        و
        <span class="underline text-gray-700 cursor-pointer"> سياسة الخصوصية </span>
        لمنصة جي jeeey.
      </section>
    </main>

    <!-- Drawer: Coupon -->
    <div v-if="couponOpen" class="fixed inset-0 z-50 flex">
      <div class="flex-1 bg-black/40" @click="couponOpen=false"></div>
      <div class="w-80 max-w-[80%] bg-white h-full p-4 overflow-y-auto">
        <div class="font-semibold mb-2">إدخال رمز القسيمة</div>
        <input v-model="couponCode" class="w-full border px-2 py-2 mb-3" placeholder="أدخل الرمز" />
        <button class="w-full bg-[#8a1538] text-white py-2" :disabled="!couponCode" @click="onApplyCoupon">تطبيق</button>
      </div>
    </div>

    <!-- Drawer: Gift Card -->
    <div v-if="giftOpen" class="fixed inset-0 z-50 flex">
      <div class="flex-1 bg-black/40" @click="giftOpen=false"></div>
      <div class="w-80 max-w-[80%] bg-white h-full p-4 overflow-y-auto">
        <div class="font-semibold mb-2">إدخال كود بطاقة الهدية</div>
        <input v-model="giftCode" class="w-full border px-2 py-2 mb-3" placeholder="أدخل الكود" />
        <button class="w-full bg-[#8a1538] text-white py-2" :disabled="!giftCode" @click="onApplyGift">تطبيق</button>
      </div>
    </div>

    <!-- Bottom Sheet: Wallet -->
    <div v-if="walletOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="walletOpen=false"></div>
      <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-xl p-4">
        <div class="text-sm mb-2">إجمالي الرصيد: {{ walletBalance.toFixed(2) }} {{ currencySymbol }}</div>
        <div class="flex items-center gap-2 mb-3">
          <input v-model.number="walletAmount" type="number" min="0" :max="walletBalance" class="flex-1 border px-2 py-2" placeholder="اكتب المبلغ" />
          <button class="text-blue-600" @click="walletAmount = walletBalance">جميع</button>
        </div>
        <button class="w-full py-2 text-white" :style="{ backgroundColor: '#8a1538', opacity: walletAmount>0 ? 1 : 0.5 }" :disabled="!(walletAmount>0)" @click="applyWallet">تقديم</button>
      </div>
    </div>

    <!-- Bottom Sheet: Points -->
    <div v-if="pointsOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="pointsOpen=false"></div>
      <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-xl p-4">
        <div class="text-sm mb-2">إجمالي النقاط: {{ points }}</div>
        <div class="flex items-center gap-2 mb-3">
          <input v-model.number="pointsAmount" type="number" min="0" :max="points" class="flex-1 border px-2 py-2" placeholder="اكتب المبلغ" />
          <button class="text-blue-600" @click="pointsAmount = points">جميع</button>
        </div>
        <button class="w-full py-2 text-white" :style="{ backgroundColor: '#8a1538', opacity: pointsAmount>0 ? 1 : 0.5 }" :disabled="!(pointsAmount>0)" @click="applyPoints">تقديم</button>
      </div>
    </div>

    <!-- زر الدفع -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
      <button
        class="w-full bg-[#8a1538] text-white font-semibold py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="placing || !selectedPayment || !selectedShipping || items.length===0"
        @click="placeOrder"
      >
        <span v-if="!placing">تأكيد الطلب</span>
        <span v-else>جاري المعالجة…</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '@/lib/api'

const router = useRouter()
import { Headset } from 'lucide-vue-next'
function goBack(){ router.back() }
function goSupport(){ router.push('/help') }

const items = ref<any[]>([])
let selectedUids: string[] = []

function increaseQty(idx:number){ items.value[idx].qty++ }
function decreaseQty(idx:number){ if(items.value[idx].qty>1) items.value[idx].qty-- }

const totalItems = computed(()=> items.value.reduce((s,i)=>s+i.qty,0))

const shippingOptions = ref<Array<{ id:string; name:string; desc:string; price:number; offerTitle?: string; etaMinHours?:number; etaMaxHours?:number }>>([])
const selectedShipping = ref('')

const paymentOptions = ref<Array<{ id:string; name:string }>>([])
const selectedPayment = ref('')
const placing = ref(false)
const currencySymbol = ref('ر.س')
function formatEtaRange(minH:number|undefined|null, maxH:number|undefined|null): string {
  const min = Number(minH||0); const max = Number(maxH||0)
  if (max<=0 && min<=0) return ''
  const a = Math.max(0, min||max)
  const b = Math.max(a, max)
  if (b >= 24) {
    const da = Math.ceil(a/24)
    const db = Math.ceil(b/24)
    return da===db ? `${db} أيام` : `${da}-${db} أيام`
  }
  return `${a}-${b} ساعات`
}

const showPointsInfo = ref(false)
const showRewards = ref(false)

const addr = ref<any>(null)
const addrNameDisplay = computed(()=> addr?.value?.fullName || addr?.value?.name || '—')
const addrPhoneDisplay = computed(()=> addr?.value?.phone || '—')
const addrLineDisplay = computed(()=> [addr.value?.state||addr.value?.province, addr.value?.city, addr.value?.street].filter(Boolean).join('، '))
const shippingPrice = computed(()=> {
  const m = (shippingOptions.value||[]).find(x=> x.id===selectedShipping.value)
  return m ? Number(m.price||0) : 0
})
const subtotalOriginal = computed(()=> items.value.reduce((s,i)=> s + Number(i.price||0)*Number(i.qty||1), 0))
const subtotalAfterCoupons = computed(()=> items.value.reduce((s,i)=> s + Number((afterById.value[String(i.id)] ?? i.price)||0)*Number(i.qty||1), 0))
const couponAutoDiscount = computed(()=> Math.max(0, subtotalOriginal.value - subtotalAfterCoupons.value))
const discountFromPromo = ref(0)
const discountFromCoupon = ref(0)
const walletApplied = ref(0)
const pointsApplied = ref(0)
const promoTotal = computed(()=> discountFromPromo.value + walletApplied.value + pointsApplied.value)
watch([subtotalOriginal, subtotalAfterCoupons], ()=>{ try{ discountFromCoupon.value = couponAutoDiscount.value }catch{} })
const savingAll = computed(()=> (promoTotal.value + (discountFromCoupon.value || 0)))
const totalAll = computed(()=> Math.max(0, subtotalOriginal.value + shippingPrice.value - savingAll.value))

async function loadCart(){
  try{
    const { useCart } = await import('@/store/cart');
    const c = useCart();
    try{ const raw = sessionStorage.getItem('checkout_selected_uids'); selectedUids = raw ? (JSON.parse(raw)||[]) : [] }catch{ selectedUids = [] }
    const uidsSet = new Set((selectedUids||[]).map(String))
    const all = c.items
    items.value = uidsSet.size? all.filter((it:any)=> uidsSet.has(String(it.uid))) : all
  }catch{ items.value = [] }
}
async function loadAddress(){
  const list = await apiGet<any[]>('/api/addresses')
  addr.value = Array.isArray(list) ? (list.find((x:any)=>x.isDefault) || list[0] || null) : null
}
async function loadShipping(){ const r = await apiGet<{ items:any[] }>(`/api/shipping/methods?city=${encodeURIComponent(addr.value?.city||'')}`); shippingOptions.value = r?.items||[]; if (!selectedShipping.value && shippingOptions.value[0]) selectedShipping.value = shippingOptions.value[0].id }
async function loadPayments(){
  const r = await apiGet<{ items:any[] }>(`/api/payments/methods`)
  paymentOptions.value = r?.items?.filter((x:any)=> x && x.isActive !== false).sort((a:any,b:any)=> Number(a.sortOrder||0)-Number(b.sortOrder||0)).map((x:any)=>({ id:String(x.id), name:String(x.name) }))||[]
  if (!selectedPayment.value && paymentOptions.value[0]) selectedPayment.value = paymentOptions.value[0].id
}

function openAddressPicker(){ const ret = encodeURIComponent('/checkout'); router.push(`/address?return=${ret}`) }
async function placeOrder(){
  if (placing.value || !selectedPayment.value || !selectedShipping.value || items.value.length===0) return
  placing.value = true
  try{
    const payload = { shippingPrice: shippingPrice.value, discount: savingAll.value, selectedUids, paymentMethod: selectedPayment.value, shippingMethodId: selectedShipping.value, shippingAddressId: addr.value?.id }
    const ord = await apiPost('/api/orders', payload)
    if (ord && (ord as any).order?.id){
      // بعد نجاح إنشاء الطلب: نظّف عناصر السلة المحددة محلياً وعلى الخادم
      try{
        const { useCart } = await import('@/store/cart')
        const cart = useCart()
        const toRemove = (selectedUids && selectedUids.length)
          ? new Set((selectedUids||[]).map((u:string)=> String(u)))
          : new Set((items.value||[]).map((it:any)=> String(it.uid)))
        const removed = cart.items.filter((it:any)=> toRemove.has(String(it.uid)))
        cart.items = cart.items.filter((it:any)=> !toRemove.has(String(it.uid)))
        try{ cart.saveLocal() }catch{}
        try{
          const ids = Array.from(new Set(removed.map((r:any)=> String(r.id))))
          for (const pid of ids){ apiPost('/api/cart/remove', { productId: pid }).catch(()=>{}) }
        }catch{}
        try{ sessionStorage.removeItem('checkout_selected_uids') }catch{}
      }catch{}
      if (selectedPayment.value === 'cod') { router.push(`/order/${(ord as any).order.id}`); return }
      const session = await apiPost('/api/payments/session', { amount: totalAll.value, currency: (window as any).__CURRENCY_CODE__||'SAR', method: selectedPayment.value, returnUrl: location.origin + '/pay/success', cancelUrl: location.origin + '/pay/failure', ref: (ord as any).order.id })
      if (session && (session as any).redirectUrl){ location.href = (session as any).redirectUrl; return }
      router.push('/pay/processing')
    }
  } finally {
    placing.value = false
  }
}

onMounted(async ()=>{
  await loadCart()
  await loadAddress()
  await Promise.all([loadShipping(), loadPayments()])
  await loadBalances()
  try{ const c = await apiGet<any>('/api/currency'); if (c && c.symbol) { currencySymbol.value = c.symbol; (window as any).__CURRENCY_CODE__ = c.code; (window as any).__CURRENCY_SYMBOL__ = c.symbol } }catch{}
})

// Track AddPaymentInfo when user selects payment method
watch(selectedPayment, (v)=>{
  try{ const fbq = (window as any).fbq; if (typeof fbq==='function' && v){ fbq('track','AddPaymentInfo',{ value: Number(totalAll.value||0), currency: 'YER' }) } }catch{}
})

// خصومات ومحفظة/نقاط
const couponCode = ref('')
const giftCode = ref('')
const walletBalance = ref(0)
const useWallet = ref(false)
const points = ref(0)
const couponOpen = ref(false)
const giftOpen = ref(false)
const walletOpen = ref(false)
const pointsOpen = ref(false)
const walletAmount = ref(0)
const pointsAmount = ref(0)

// ===== كوبونات لعناصر صفحة الدفع =====
type SimpleCoupon = { code?:string; discountType:'PERCENTAGE'|'FIXED'; discountValue:number; audience?:string; kind?:string; rules?:{ includes?:string[]; excludes?:string[]; min?:number|null } }
const couponsCache = ref<SimpleCoupon[]>([])
const afterById = ref<Record<string, number>>({})

async function fetchCouponsList(): Promise<SimpleCoupon[]> {
  const { API_BASE } = await import('@/lib/api')
  const tryFetch = async (path: string) => { try{ const r = await fetch(`${API_BASE}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } }); if(!r.ok) return null; return await r.json() }catch{ return null } }
  let data: any = await tryFetch('/api/admin/me/coupons')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  data = await tryFetch('/api/admin/coupons/public')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  data = await tryFetch('/api/admin/coupons/list')
  if (data && Array.isArray(data.coupons)) return normalizeCoupons(data.coupons)
  return []
}
function normalizeCoupons(list:any[]): SimpleCoupon[] { return (list||[]).map((c:any)=> ({ code:c.code, discountType: (String(c.discountType||'PERCENTAGE').toUpperCase()==='FIXED'?'FIXED':'PERCENTAGE'), discountValue:Number(c.discountValue||c.discount||0), audience:c.audience?.target||c.audience||undefined, kind:c.kind||undefined, rules:c.rules||undefined })) }
function priceAfterCoupon(base:number, cup: SimpleCoupon): number { if(!Number.isFinite(base)||base<=0) return base; const v=Number(cup.discountValue||0); return cup.discountType==='FIXED'? Math.max(0, base-v) : Math.max(0, base*(1-v/100)) }
function isCouponSitewide(c: SimpleCoupon): boolean { return String(c.kind||'').toLowerCase()==='sitewide' || !Array.isArray(c?.rules?.includes) }
function eligibleByTokens(prod:any, c: SimpleCoupon): boolean { const inc=Array.isArray(c?.rules?.includes)?c.rules!.includes!:[]; const exc=Array.isArray(c?.rules?.excludes)?c.rules!.excludes!:[]; const tokens:string[]=[]; if(prod?.categoryId) tokens.push(`category:${prod.categoryId}`); if(prod?.id) tokens.push(`product:${prod.id}`); if(prod?.brand) tokens.push(`brand:${prod.brand}`); if(prod?.sku) tokens.push(`sku:${prod.sku}`); const hasInc=!inc.length||inc.some(t=>tokens.includes(t)); const hasExc=exc.length&&exc.some(t=>tokens.includes(t)); return hasInc&&!hasExc }
async function ensureProductMeta(id:string, item:any){ try{ const d = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`); if(!d) return { id, categoryId:null, brand:item?.brand, sku:item?.sku }; return { id, categoryId: d.categoryId||d.category?.id||d.category||null, brand: d.brand||item?.brand, sku: d.sku||item?.sku } }catch{ return { id, categoryId:null } }
}
async function hydrateAfterCoupons(){ try{ if(!couponsCache.value.length) couponsCache.value = await fetchCouponsList(); const cups=couponsCache.value||[]; if(!cups.length) return; const ids = Array.from(new Set(items.value.map(i=> String(i.id)))) ; for (const pid of ids){ const it = items.value.find(i=> String(i.id)===String(pid)); const base=Number(it?.price||0); if(!base) continue; const site = cups.find(isCouponSitewide); if(site){ afterById.value[pid]=priceAfterCoupon(base, site); continue } const meta=await ensureProductMeta(pid, it); const match=cups.find(c=> eligibleByTokens(meta,c)); if(match){ afterById.value[pid]=priceAfterCoupon(base, match) } } }catch{} }
onMounted(()=>{ hydrateAfterCoupons().catch(()=>{}) })
watch(items, ()=>{ hydrateAfterCoupons().catch(()=>{}) }, { deep:true })
function afterOf(it:any): number | null { const v = afterById.value[String(it.id)]; return (typeof v==='number')? v : null }

function openCouponDrawer(){ couponOpen.value = true }
function openGiftDrawer(){ giftOpen.value = true }
function openWalletSheet(){ walletOpen.value = true }
function openPointsSheet(){ pointsOpen.value = true }

async function applyCoupon(){
  if (!couponCode.value) return
  const r = await apiPost('/api/coupons/apply', { code: couponCode.value })
  if (r && (r as any).ok) discountFromCoupon.value = Number((r as any).discount?.value || 0)
}
function onApplyCoupon(){ applyCoupon().then(()=>{ couponOpen.value = false }) }
async function applyGift(){
  if (!giftCode.value) return
  const r = await apiPost('/api/giftcards/apply', { code: giftCode.value })
  if (r && (r as any).ok) { discountFromPromo.value += Number((r as any).giftcard?.value || 0); giftOpen.value = false }
}
async function loadBalances(){
  try{ const w = await apiGet<{ balance:number }>('/api/wallet/balance'); walletBalance.value = Number(w?.balance||0) }catch{}
  try{ const p = await apiGet<{ points:number }>('/api/points/balance'); points.value = Number(p?.points||0) }catch{}
  try{
    const settings = await apiGet<any>('/api/policies/rewards/settings')
    showRewards.value = !!settings?.enabled
  }catch{ showRewards.value = false }
}
async function applyWallet(){
  try{
    const r:any = await apiPost('/api/checkout/apply-wallet', { amount: Number(walletAmount.value||0), subtotal: Number(subtotalOriginal.value||0) })
    walletApplied.value = Number(r?.allowed||0)
  }catch{}
  walletOpen.value = false
}
async function applyPoints(){
  try{
    const r:any = await apiPost('/api/checkout/apply-points', { points: Number(pointsAmount.value||0), subtotal: Number(subtotalOriginal.value||0) })
    const amt = Number(r?.amount||0)
    pointsApplied.value = amt
  }catch{}
  pointsOpen.value = false
}
</script>
