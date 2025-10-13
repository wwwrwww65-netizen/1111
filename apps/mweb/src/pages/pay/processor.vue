<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <!-- الهيدر ثابت -->
    <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 shadow z-50 flex items-center justify-center">
      <h1 class="text-lg font-semibold text-gray-900">الدفع</h1>
      <!-- زر إغلاق -->
      <button class="absolute right-3 w-10 h-10 flex items-center justify-center" @click="closePage">
        ✕
      </button>
    </header>


    <main class="pt-14 pb-28">
      <!-- طرق الدفع -->
      <section class="bg-white p-4 mb-3">
        <div class="font-semibold mb-3">طرق الدفع المقبولة</div>
        <div class="flex gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" class="h-6"/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" class="h-6"/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" class="h-6"/>
        </div>
      </section>

      <!-- بيانات البطاقة -->
      <section class="bg-white p-4 mb-3">
        <div>
          <label class="text-sm">رقم البطاقة</label>
          <input v-model="card.number" type="text" maxlength="16" inputmode="numeric"
                 class="w-full border px-3 py-2 mt-1 rounded" placeholder="•••• •••• •••• ••••"/>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-sm">تاريخ الانتهاء</label>
            <input v-model="card.expiry" type="text" maxlength="5" placeholder="MM/YY"
                   class="w-full border px-3 py-2 mt-1 rounded"/>
          </div>
          <div class="flex-1">
            <label class="text-sm">رمز الأمان CVV</label>
            <input v-model="card.cvv" type="text" maxlength="3" inputmode="numeric"
                   class="w-full border px-3 py-2 mt-1 rounded" placeholder="•••"/>
          </div>
        </div>
      </section>

      <!-- عنوان الفاتورة -->
      <section class="bg-white p-4 mb-3">
        <div class="font-semibold mb-2">عنوان الفاتورة</div>
        <div class="text-sm text-gray-700 leading-5">
          hesham jafii<br/>
          2255625<br/>
          sanaa, Abu Baham Capital Governorate Bahrain 990089
        </div>
      </section>

      <!-- تفاصيل الطلب -->
      <section class="bg-white p-4 mb-3">
        <div class="flex justify-between text-sm"><span>رقم الطلب</span><span>USH14C05U000001LMS</span></div>
        <div class="flex justify-between text-sm"><span>سعر الوحدة</span><span>BD14.88</span></div>
        <div class="flex justify-between text-sm"><span>إجمالي الشحن</span><span>BD1.72</span></div>
        <div class="flex justify-between text-sm"><span>إجمالي الطلب</span><span>BD3.02</span></div>
        <div class="flex justify-between text-sm text-orange-500"><span>خصم</span><span>-BD2.94</span></div>
        <div class="flex justify-between font-semibold text-base border-t pt-2">
          <span>المجموع</span>
          <span>BD14.80</span>
        </div>
      </section>

      <!-- الحاوية الأخيرة (الأمان) -->
      <section class="bg-white p-2">
        <!-- ضمان التوصيل الآمن -->
        <div>
          <div class="flex items-center gap-2 text-green-600 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-green-600" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm2-4h2V7H5v2zm2-4h2V3H7v2zm2 0h2V3H9v2zm2 0h2V3h-2v2zm2 0h2V3h-2v2zm2 0h2V3h-2v2zm2 2h2V5h-2v2zm0 2h2V7h-2v2zm0 2h2v-2h-2v2zm0 2h2v-2h-2v2z"/>
            </svg>
            ضمان التوصيل الآمن
          </div>
          <p class="text-sm text-gray-700 mt-2">
            جي jeeey تتعاون مع شركاء شحن موثوقين. نضمن لك وصول طلبك إليك بأمان وفي الوقت المحدد.
            في حال وجود أي مشاكل أثناء شحن مشترياتك، كالتلف أو الضياع أو التأخير، نضمن لك بذل قصارى جهدنا لحلها وتقديم الحلول المناسبة.
          </p>
        </div>

        <!-- أمن الدفع -->
        <div>
          <div class="flex items-center gap-2 text-green-600 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-green-600" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18L19 7v4c0 4.97-3.36 9.58-8 10.82C7.36 20.58 4 15.97 4 11V7l8-3.82z"/>
              <text x="9" y="16" font-size="8" fill="white">$</text>
            </svg>
            أمن الدفع
          </div>
          <p class="text-sm text-gray-700 mt-2">
            جي jeeey تلتزم بحماية معلومات الدفع الخاصة بك ولا تشارك سوى معلومات بطاقتك الائتمانية
            مع مزودي خدمة الدفع لدينا الذين وافقوا على حماية معلوماتك.
          </p>
        </div>

        <!-- الأمان والخصوصية -->
        <div>
          <div class="flex items-center gap-2 text-green-600 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-green-600" viewBox="0 0 24 24">
              <path d="M12 1C7 1 3 5 3 10v4c0 5 4 9 9 9s9-4 9-9v-4c0-5-4-9-9-9zm0 2c3.86 0 7 3.14 7 7v4c0 3.86-3.14 7-7 7s-7-3.14-7-7v-4c0-3.86 3.14-7 7-7zm-1 5v4h2V8h-2z"/>
            </svg>
            الأمان والخصوصية
          </div>
          <p class="text-sm text-gray-700 mt-2">
            يقوم شريك معالج الدفع التابع الخاص بشي إن بتخزين تفاصيل بطاقتك الائتمانية باستخدام تقنية تشفير البيانات المتوافقة مع المعايير الصناعة.
            لن تقوم جي jeeey بتخزين معلومات بطاقتك الائتمانية الفعلية.
          </p>
        </div>
      </section>

      <!-- زر تأكيد الدفع مع الإجمالي -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex items-center">
        <!-- السعر مثبت في اليمين -->
        <div class="font-bold text-base text-gray-800">
         <span class="mr-1">الإجمالي:</span>
         <span class="text-[#8a1538] font-bold">BD14.80</span>
        </div>

        <!-- الزر في اليسار مع مسافة فاصلة بينه وبين السعر -->
        <button class="mr-4 flex-1 bg-[#8a1538] text-white font-bold py-3 text-base rounded-none text-center"
         :disabled="!isCardValid"
         :class="!isCardValid ? 'opacity-50 cursor-not-allowed' : ''">
         تأكيد الدفع
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function closePage(){ router.back() }

const card = ref({ number:'', expiry:'', cvv:'' })

// التحقق من صحة بيانات البطاقة
const isCardValid = computed(()=>{
  return card.value.number.length===16 && card.value.expiry.length===5 && card.value.cvv.length===3
})
</script>
