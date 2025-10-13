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
      <!-- أيقونة سماعة -->
      <button>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
      </button>
    </header>

    <main class="pt-14 pb-28">
      <!-- العنوان -->
      <section class="bg-white px-4 py-3 mb-2 flex justify-between items-center">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#8a1538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
          </svg>
          <div>
            <div class="font-semibold text-sm">hesham jaifi</div>
            <div class="text-sm text-gray-700">22545625</div>
            <div class="text-xs text-gray-600">sanaa Abu Baham Capital Governorate Bahrain 999089</div>
          </div>
        </div>
        <!-- سهم معكوس -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </section>

      <!-- تفاصيل الطلب -->
      <section class="bg-white mb-2">
        <div class="px-4 py-2 text-sm font-semibold text-gray-800">تفاصيل الطلب</div>
        <div v-for="(item, idx) in items" :key="idx" class="px-4 py-3 flex gap-3" :class="{'border-t border-gray-200': idx>0}">
          <img src="https://via.placeholder.com/80" class="w-20 h-20 object-cover border" />
          <div class="flex-1">
            <div class="text-sm text-gray-800">{{ item.name }}</div>
            <div class="text-xs text-gray-500 mt-1">اللون: {{ item.color }}</div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-[#8a1538] font-semibold">{{ item.price }} ر.س</span>
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
                   :class="selectedShipping === ship.name ? 'bg-[#8a1538] border-[#8a1538]' : 'bg-white'">
                <svg v-if="selectedShipping === ship.name" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <input type="radio" :value="ship.name" v-model="selectedShipping" class="absolute inset-0 opacity-0 cursor-pointer"/>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-[#8a1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="ship.name === 'شحن مجاني'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  <path v-else-if="ship.name === 'شحن سريع'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17l4 4 4-4m-4-5v9m0-13a4 4 0 00-4 4v1a2 2 0 002 2h4a2 2 0 002-2V8a4 4 0 00-4-4z"/>
                </svg>
                <span>{{ ship.name }}</span>
              </div>
              <div class="text-xs text-gray-600 ml-7">{{ ship.desc }}</div>
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
            <input type="radio" :value="pay.name" v-model="selectedPayment"/>
            <svg class="w-5 h-5 text-[#8a1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="pay.name === 'الدفع عند الاستلام'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              <path v-else-if="pay.name === 'خدمة حاسب عبر الكريمي'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              <path v-else-if="pay.name === 'محفظة جوالي'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            <span>{{ pay.name }}</span>
          </label>
        </div>
      </section>

      <!-- الخصومات -->
      <section class="bg-white px-4 py-3 mb-2">
        <div class="divide-y divide-gray-300 text-sm">
          <div class="py-3 flex justify-between"><span>رمز القسيمة:</span><span class="text-lg">›</span></div>
          <div class="py-3 flex justify-between"><span>بطاقة هدية</span><span class="text-lg">›</span></div>
          <div class="py-3 flex justify-between"><span>المحفظة:</span><span class="text-lg">›</span></div>
          <div class="py-3 flex justify-between">
            <span>النقاط:</span>
            <span class="text-gray-400">إجمالي النقاط: 0 ›</span>
          </div>
        </div>
      </section>

      <!-- الأسعار -->
      <section class="bg-white px-4 py-3 space-y-2">
        <div class="flex justify-between text-sm"><span>سعر الوحدة</span><span>‏74.00 ر.س</span></div>
        <div class="flex justify-between text-sm"><span>الشحن</span><span>‏15.00 ر.س</span></div>

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
          <span class="text-orange-500">-‏0.74 ر.س</span>
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
          <span class="text-orange-500">-‏14.65 ر.س</span>
        </div>

        <!-- الإجمالي -->
        <div class="flex justify-between items-center border-t pt-2">
          <span class="font-semibold text-base">الإجمالي</span>
          <span class="text-orange-500 font-bold text-xl">‏88.61 ر.س</span>
        </div>
        <div class="text-xs text-green-600">تم توفير ‏15.39 ر.س</div>
      </section>

      <!-- نقاط المكافأة -->
      <section class="bg-white px-4 py-3 mt-2">
       <!-- عملة ذهبية دائرية -->
       <span
       role="img"
       aria-label="عملة ذهبية"
       class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 text-yellow-900 font-extrabold shadow-md ring-1 ring-yellow-700/30"
       >
       j
       </span>

       <span class="text-red-600 font-semibold">31</span>
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

    <!-- زر الدفع -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
      <button class="w-full bg-[#8a1538] text-white font-semibold py-2 text-sm">تأكيد الطلب</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function goBack(){ router.back() }

const items = ref([
  { name: 'حقيبة كتف نسائية ذات طابع فاخر، ذات سعة كبيرة، مع حقيبة صغيرة', color: 'رمادي', price: '58.61', qty: 1 }
])

function increaseQty(idx:number){ items.value[idx].qty++ }
function decreaseQty(idx:number){ if(items.value[idx].qty>1) items.value[idx].qty-- }

const totalItems = computed(()=> items.value.reduce((s,i)=>s+i.qty,0))

const shippingOptions = [
  { name:'شحن مجاني', desc:'12 - 20 يوم عمل', icon:'📦' },
  { name:'شحن سريع', desc:'2 - 5 أيام عمل', icon:'🚀' },
  { name:'شحن عادي', desc:'7 - 10 أيام عمل', icon:'🚚' }
]
const selectedShipping = ref('شحن مجاني')

const paymentOptions = [
  { name:'الدفع عند الاستلام', icon:'💵' },
  { name:'خدمة حاسب عبر الكريمي', icon:'🧮' },
  { name:'محفظة جوالي', icon:'📱' },
  { name:'محفظة جيب', icon:'👛' }
]
const selectedPayment = ref('الدفع عند الاستلام')

const showPointsInfo = ref(false)
</script>
