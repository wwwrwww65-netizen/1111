<template>
  <div class="min-h-screen bg-[#f7f7f7]" dir="rtl">
    <!-- الهيدر -->
    <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center justify-center">
      <button class="absolute right-3 w-10 h-10 flex items-center justify-center" @click="goBack" aria-label="رجوع">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <h1 class="text-lg font-semibold text-gray-900">عنواني</h1>
    </header>

    <!-- المحتوى -->
    <main class="pt-16">
      <!-- الحالة الفارغة -->
      <div v-if="!addresses.length" class="bg-white min-h-screen flex flex-col items-center justify-center">
        <div class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 mx-auto" viewBox="0 0 120 120" fill="none">
            <path d="M60 15c-12 0-22 10-22 22 0 16 22 43 22 43s22-27 22-43c0-12-10-22-22-22z" fill="#8a1538"/>
            <circle cx="60" cy="37" r="7" fill="white"/>
            <ellipse cx="45" cy="85" rx="18" ry="10" fill="#8a1538" fill-opacity="0.2"/>
            <ellipse cx="72" cy="85" rx="22" ry="12" fill="#8a1538" fill-opacity="0.25"/>
          </svg>
        </div>
        <p class="text-gray-700 text-sm mb-4">ليس لديك أي عناوين مضافة...</p>
      </div>

      <!-- الحالة الممتلئة -->
      <div v-else class="bg-white min-h-screen px-4 py-4 space-y-3">
        <div v-for="(addr, idx) in addresses" :key="addr.id" class="border border-gray-200">
          <div class="flex items-start justify-between px-3 pt-3" @click="editAddress(idx)">
            <div>
              <div class="text-[14px] font-semibold text-gray-900">{{ addr.fullName }}</div>
              <div class="text-[12px] text-gray-700 mt-0.5">{{ addr.city }}</div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-[12px] text-gray-800">{{ addr.phone }}</div>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12l-6 6V6l6 6z"/>
              </svg>
            </div>
          </div>
          <div class="px-3 mt-2 text-[12px] text-gray-900">
            {{ addr.country }} / {{ addr.governorate }} / {{ addr.city }} / {{ addr.street }}
            <span v-if="addr.landmarks"> / {{ addr.landmarks }}</span>
            <span v-if="addr.postal"> / {{ addr.postal }}</span>
          </div>
          <div class="h-[1px] bg-gray-200 mx-3 mt-3"></div>
          <div class="flex items-center justify-between px-3 py-2">
            <button class="flex items-center gap-2" @click.stop="togglePrimary(idx)">
              <span class="inline-flex items-center justify-center w-4 h-4 border rounded-full"
                    :style="{ borderColor: storeColor, backgroundColor: addr.isDefault ? storeColor : 'transparent' }">
                <svg v-if="addr.isDefault" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l8.1-8.1 1.4 1.4z"/>
                </svg>
              </span>
              <span class="text-[12px] text-gray-900">{{ addr.isDefault ? 'رئيسي' : 'أجعله افتراضيًا' }}</span>
            </button>
            <button class="text-gray-700" @click.stop="removeAddress(idx)" aria-label="حذف">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 7h12v2H6zM9 10h2v7H9zM13 10h2v7h-2zM10 4h4v2h5v2H5V6h5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- زر إضافة عنوان شحن -->
    <div class="px-4 pb-4 fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <button class="w-full bg-[#8a1538] text-white font-semibold py-2 text-sm" @click="openDrawer = true">
        + إضافة عنوان شحن
      </button>
    </div>

    <!-- منبثق عنوان الشحن -->
    <transition name="drawer-left">
      <div v-if="openDrawer" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40" @click="closeDrawer"></div>
        <div class="absolute inset-0 bg-[#f7f7f7] flex flex-col">
          <div class="h-12 bg-white border-b flex items-center justify-center relative">
            <h2 class="text-base font-semibold">عنوان الشحن</h2>
            <button class="absolute left-3" @click="closeDrawer">✕</button>
          </div>

          <div class="flex-1 overflow-y-auto">
            <!-- الحاوية الأولى -->
            <section class="bg-white border-t border-b px-4 py-3">
              <div class="mb-3">
                <label>الاسم الرباعي<span class="text-red-600">*</span></label>
                <input v-model="form.fullName" @blur="validateField('fullName')" type="text"
                       class="w-full border px-2 py-2" :class="inputClass(errors.fullName)" placeholder="اكتب الاسم الرباعي"/>
                <p v-if="errors.fullName" class="mt-1 text-xs text-red-600">{{ errors.fullName }}</p>
              </div>
              <div class="mb-3">
                <label>رقم الهاتف<span class="text-red-600">*</span></label>
                <div class="relative">
                  <div class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-700">| YE +967</div>
                  <input v-model="form.phone" @blur="validateField('phone')" type="tel" inputmode="numeric" maxlength="9" pattern="^7[0-9]{8}$"
                         class="w-full border pl-20 px-2 py-2" :class="inputClass(errors.phone)" placeholder="أدخل رقم الهاتف"/>
                </div>
                <p v-if="errors.phone" class="mt-1 text-xs text-red-600">{{ errors.phone }}</p>
              </div>
              <div>
                <label>رقم الهاتف البديل (اختياري)</label>
                <div class="relative">
                  <div class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-700">| YE +967</div>
                  <input v-model="form.altPhone" @blur="validateField('altPhone')" type="tel" inputmode="numeric" maxlength="9" pattern="^7[0-9]{8}$"
                         class="w-full border pl-20 px-2 py-2 border-gray-300" placeholder="أدخل رقم هاتف بديل (اختياري)"/>
                </div>
                <p v-if="errors.altPhone" class="mt-1 text-xs text-red-600">{{ errors.altPhone }}</p>
              </div>
            </section>

                        <!-- الحاوية الثانية -->
            <section class="mt-2 bg-white border-t border-b px-4 py-3">
              <!-- زر تحديد الموقع -->
              <button class="w-full flex items-center justify-between bg-white border px-3 py-2 text-[13px]"
                      style="border-radius:0; border-color:#ccc" @click="openMap = true">
                <span class="text-gray-900">حدد موقعك عبر الخريطة</span>
                <!-- أيقونة حديثة -->
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#8a1538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 110 10 5 5 0 010-10z"/>
                </svg>
              </button>
              <p class="mt-1 text-[11px] text-gray-600">اضغط لتحديد موقعك على الخريطة.</p>

              <!-- الدولة -->
              <div class="mt-3">
                <label>الدولة<span class="text-red-600">*</span></label>
                <input type="text" class="w-full border px-2 py-2 bg-gray-50" value="اليمن" readonly />
              </div>

              <!-- المحافظة -->
              <div class="mt-3">
                <label>المحافظة<span class="text-red-600">*</span></label>
                <div class="relative">
                  <button class="w-full text-right border px-2 py-2 bg-white"
                          :class="inputClass(errors.governorate)" @click="openGovPicker = true">
                    <span>{{ selectedGovernorate || 'اختر المحافظة' }}</span>
                  </button>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <p v-if="errors.governorate" class="mt-1 text-xs text-red-600">{{ errors.governorate }}</p>
              </div>

              <!-- المدينة/المديرية -->
              <div class="mt-3">
                <label>المدينة/المديرية<span class="text-red-600">*</span></label>
                <div class="relative">
                  <button class="w-full text-right border px-2 py-2 bg-white"
                          :class="inputClass(errors.city)" :disabled="!selectedGovernorate" @click="openCityPicker = true">
                    <span :class="!selectedGovernorate ? 'text-gray-400' : 'text-gray-700'">
                      {{ selectedCity || (selectedGovernorate ? 'اختر المدينة/المديرية' : 'اختر المحافظة أولاً') }}
                    </span>
                  </button>
                  <svg v-if="selectedGovernorate" xmlns="http://www.w3.org/2000/svg"
                       class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <p v-if="errors.city" class="mt-1 text-xs text-red-600">{{ errors.city }}</p>
              </div>

              <!-- الشارع -->
              <div class="mt-3">
                <label>الشارع<span class="text-red-600">*</span></label>
                <input v-model="form.street" @blur="validateField('street')" type="text"
                       class="w-full border px-2 py-2" :class="inputClass(errors.street)" placeholder="اسم الشارع"/>
                <p v-if="errors.street" class="mt-1 text-xs text-red-600">{{ errors.street }}</p>
              </div>

              <!-- المعالم الرئيسية -->
              <div class="mt-3">
                <label>المعالم الرئيسية</label>
                <input v-model="form.landmarks" type="text" class="w-full border px-2 py-2 border-gray-300" placeholder="أقرب معلم أو وصف مختصر"/>
                <p class="mt-1 text-xs text-gray-600">أدخل أقرب معلم بارز أو وصف للموقع لتسهيل الوصول إليك</p>
              </div>
            </section>

            <!-- الحاوية الثالثة: اجعله افتراضياً -->
            <section class="mt-2 bg-white border-t border-b px-4 py-3">
              <div class="flex items-center justify-between">
                <span>أجعله افتراضياً</span>
                <button class="relative w-12 h-6 border border-gray-300" @click="isDefault = !isDefault">
                  <span class="absolute top-0 right-0 w-6 h-6 transition-transform"
                        :style="{ backgroundColor: isDefault ? storeColor : '#ccc', transform: isDefault ? 'translateX(-100%)' : 'translateX(0%)' }"></span>
                </button>
              </div>
            </section>

            <!-- الحاوية الرابعة: الأمان -->
            <section class="mt-2 bg-white border-t border-b px-4 py-3">
              <div class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="7" y="11" width="10" height="8" rx="0" stroke="currentColor" stroke-width="2"/>
                  <path d="M9 11V8a3 3 0 116 0v3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <div>
                  <div class="font-semibold">الأمان والخصوصية</div>
                  <div class="text-sm text-gray-700">نحافظ على معايير الصناعة المادية والتقنية والإدارية لحماية معلوماتك الشخصية.</div>
                </div>
              </div>
            </section>

            <!-- الحاوية الخامسة: زر الحفظ -->
            <section class="px-4 py-4">
              <button class="w-full font-semibold py-2 text-sm text-white"
                      :style="{ backgroundColor: storeColor, opacity: canSave ? 1 : 0.5 }"
                      :class="{ 'cursor-not-allowed': !canSave }"
                      :disabled="!canSave"
                      @click="onSave">
                حفظ
              </button>
            </section>
          </div>
        </div>

        <!-- منبثق الموقع -->
        <transition name="drawer-left">
          <div v-if="openMap" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/40" @click="openMap=false"></div>
            <div class="absolute inset-0 bg-white flex flex-col">
              <div class="h-12 border-b flex items-center justify-center relative">
                <h3 class="text-base font-semibold">الموقع</h3>
                <button class="absolute left-3 text-gray-700" @click="openMap=false">✕</button>
              </div>
              <div class="flex-1 relative">
                <div class="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-600">
                  هنا تظهر الخريطة
                </div>
                <!-- Pin -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-[#8a1538]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
                  </svg>
                </div>
                <!-- زر تحديد موقعي صغير يمين -->
                <div class="absolute top-3 right-3">
                  <button class="flex items-center gap-1 bg-white border px-2 py-1 text-xs shadow"
                          @click="mapLocationSet = true">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-[#8a1538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    تحديد موقعي
                  </button>
                </div>
              </div>
              <!-- زر حفظ العنوان -->
              <div class="p-3 border-t">
                <button class="w-full font-semibold py-2 text-sm"
                        :class="mapLocationSet ? 'bg-[#8a1538] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'"
                        :disabled="!mapLocationSet"
                        @click="confirmMapLocation">
                  حفظ العنوان
                </button>
              </div>
            </div>
          </div>
        </transition>
        <!-- منبثق اختيار المحافظة -->
        <transition name="drawer-left">
          <div v-if="openGovPicker" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/40" @click="openGovPicker=false"></div>
            <div class="absolute inset-0 bg-white flex flex-col">
              <div class="h-12 border-b flex items-center justify-center relative">
                <h3 class="text-base font-semibold">اختر المحافظة</h3>
                <button class="absolute left-3 text-gray-700" @click="openGovPicker=false">✕</button>
              </div>
              <div class="flex-1 overflow-y-auto">
                <ul class="divide-y">
                  <li v-for="gov in governorates" :key="gov" class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50" @click="selectGovernorate(gov)">
                    {{ gov }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </transition>

        <!-- منبثق اختيار المدينة/المديرية -->
        <transition name="drawer-left">
          <div v-if="openCityPicker" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/40" @click="openCityPicker=false"></div>
            <div class="absolute inset-0 bg-white flex flex-col">
              <div class="h-12 border-b flex items-center justify-center relative">
                <h3 class="text-base font-semibold">اختر المدينة/المديرية</h3>
                <button class="absolute left-3 text-gray-700" @click="openCityPicker=false">✕</button>
              </div>
              <div class="flex-1 overflow-y-auto">
                <div v-if="!selectedGovernorate" class="p-4 text-sm text-gray-600">اختر المحافظة أولاً.</div>
                <ul v-else class="divide-y">
                  <li v-for="city in (citiesByGovernorate[selectedGovernorate] || [])" :key="city" class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50" @click="selectCity(city)">
                    {{ city }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const storeColor = '#8a1538'

function goBack(){ router.back() }

const addresses = ref<any[]>([])
const openDrawer = ref(false)
const openMap = ref(false)
const mapLocationSet = ref(false)

const form = ref({
  fullName: '',
  phone: '',
  altPhone: '',
  country: 'اليمن',
  street: '',
  landmarks: ''
})

const isDefault = ref(false)
const selectedGovernorate = ref<string | null>(null)
const selectedCity = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const openGovPicker = ref(false)
const openCityPicker = ref(false)

const governorates = [
  'صنعاء', 'عدن', 'تعز', 'إب', 'الحديدة', 'حضرموت'
]

const citiesByGovernorate: Record<string, string[]> = {
  'صنعاء': ['التحرير', 'معين', 'السبعين', 'بني الحارث'],
  'عدن': ['كريتر', 'المنصورة', 'خور مكسر', 'دار سعد'],
  'تعز': ['المظفر', 'صالة', 'القاهرة'],
  'إب': ['المدينة', 'المشنة'],
  'الحديدة': ['الحوك', 'الميناء'],
  'حضرموت': ['المكلا', 'سيئون']
}

function closeDrawer(){ openDrawer.value = false }

function inputClass(err?: string){ return err ? 'border-red-500' : 'border-gray-300' }

function validateField(field: string){
  switch(field){
    case 'fullName': errors.value.fullName = form.value.fullName.trim() ? '' : 'يرجى إدخال الاسم الرباعي بشكل صحيح'; break
    case 'phone': errors.value.phone = /^7[0-9]{8}$/.test(form.value.phone) ? '' : 'يجب أن يبدأ الرقم بـ 7 ويتكون من 9 أرقام'; break
    case 'altPhone': errors.value.altPhone = form.value.altPhone.trim() && !/^7[0-9]{8}$/.test(form.value.altPhone) ? 'يجب أن يبدأ الرقم البديل بـ 7 ويتكون من 9 أرقام' : ''; break
    case 'street': errors.value.street = form.value.street.trim() ? '' : 'يرجى إدخال اسم الشارع'; break
    case 'governorate': errors.value.governorate = selectedGovernorate.value ? '' : 'يرجى اختيار المحافظة'; break
    case 'city': errors.value.city = selectedCity.value ? '' : 'يرجى اختيار المدينة/المديرية'; break
  }
}

const canSave = computed(()=>{
  return !!(
    form.value.fullName.trim() &&
    /^7[0-9]{8}$/.test(form.value.phone) &&
    selectedGovernorate.value &&
    selectedCity.value &&
    form.value.street.trim()
  )
})

function onSave(){
  if (!canSave.value) return
  addresses.value.unshift({
    id: Date.now(),
    fullName: form.value.fullName,
    phone: form.value.phone,
    altPhone: form.value.altPhone,
    country: form.value.country,
    governorate: selectedGovernorate.value,
    city: selectedCity.value,
    street: form.value.street,
    landmarks: form.value.landmarks,
    isDefault: isDefault.value
  })
  openDrawer.value = false
  // إعادة تعيين النموذج
  form.value = { fullName: '', phone: '', altPhone: '', country: 'اليمن', street: '', landmarks: '' }
  selectedGovernorate.value = null
  selectedCity.value = null
  isDefault.value = false
  errors.value = {}
}

function togglePrimary(idx: number){
  addresses.value = addresses.value.map((a, i) => ({ ...a, isDefault: i === idx }))
}

function removeAddress(idx: number){ addresses.value.splice(idx, 1) }

function editAddress(idx: number){
  const a = addresses.value[idx]
  form.value.fullName = a.fullName
  form.value.phone = a.phone
  form.value.altPhone = a.altPhone
  form.value.country = a.country
  selectedGovernorate.value = a.governorate
  selectedCity.value = a.city
  form.value.street = a.street
  form.value.landmarks = a.landmarks
  isDefault.value = a.isDefault
  openDrawer.value = true
}

function confirmMapLocation(){
  if (!mapLocationSet.value) return
  openMap.value = false
}

function selectGovernorate(gov: string){
  selectedGovernorate.value = gov
  selectedCity.value = null
  openGovPicker.value = false
  validateField('governorate')
}

function selectCity(city: string){
  selectedCity.value = city
  openCityPicker.value = false
  validateField('city')
}
</script>

<style scoped>
.drawer-left-enter-active,
.drawer-left-leave-active { transition: transform 0.28s ease; }
.drawer-left-enter-from,
.drawer-left-leave-to { transform: translateX(-100%); }
</style>
