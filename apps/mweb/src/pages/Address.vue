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
            {{ addr.country }} / {{ addr.governorate }} / {{ addr.city }}<span v-if="addr.area"> / {{ addr.area }}</span> / {{ addr.street }}
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
            <div class="flex items-center gap-3">
              <button v-if="returnTo" class="px-3 py-1 text-[12px] border border-[#8a1538] text-[#8a1538]" @click.stop="selectAndReturn()">اختيار</button>
              <button class="text-gray-700" @click.stop="removeAddress(idx)" aria-label="حذف">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 7h12v2H6zM9 10h2v7H9zM13 10h2v7h-2zM10 4h4v2h5v2H5V6h5z"/>
                </svg>
              </button>
            </div>
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
                      style="border-radius:0; border-color:#ccc" @click="openMapClick">
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
                          :class="inputClass(errors.governorate)" @click="openGovernorates()">
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
                          :class="inputClass(errors.city)" :disabled="!selectedGovernorate" @click="openCities()">
                    <span :class="!selectedGovernorate ? 'text-gray-400' : 'text-gray-700'">
                      {{ selectedCityName || (selectedGovernorate ? 'اختر المدينة/المديرية' : 'اختر المحافظة أولاً') }}
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

              <!-- الحي/المنطقة -->
              <div class="mt-3">
                <label>الحي/المنطقة</label>
                <div class="relative">
                  <button class="w-full text-right border px-2 py-2 bg-white"
                          :disabled="!selectedCityId" @click="openAreas()">
                    <span :class="!selectedCityId ? 'text-gray-400' : 'text-gray-700'">
                      {{ selectedArea || (selectedCityId ? 'اختر الحي/المنطقة (اختياري)' : 'اختر المدينة أولاً') }}
                    </span>
                  </button>
                  <svg v-if="selectedCityId" xmlns="http://www.w3.org/2000/svg"
                       class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
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
                <div id="addr_map" class="absolute inset-0"></div>
                <!-- زر تحديد موقعي صغير يمين -->
                <div class="absolute top-3 right-3">
                  <button class="flex items-center gap-1 bg-white border px-2 py-1 text-xs shadow" @click="locateMe">
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
                        :class="mapSelection ? 'bg-[#8a1538] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'"
                        :disabled="!mapSelection"
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
                  <li v-for="gov in governorates" :key="gov.name" class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50" @click="selectGovernorate(gov.name)">
                    {{ gov.name }}
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
                  <li v-for="c in cities" :key="c.id" class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50" @click="selectCity(c)">
                    {{ c.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </transition>

        <!-- منبثق اختيار الحي/المنطقة -->
        <transition name="drawer-left">
          <div v-if="openAreaPicker" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/40" @click="openAreaPicker=false"></div>
            <div class="absolute inset-0 bg-white flex flex-col">
              <div class="h-12 border-b flex items-center justify-center relative">
                <h3 class="text-base font-semibold">اختر الحي/المنطقة</h3>
                <button class="absolute left-3 text-gray-700" @click="openAreaPicker=false">✕</button>
              </div>
              <div class="flex-1 overflow-y-auto">
                <ul class="divide-y">
                  <li v-for="a in areas" :key="a.id" class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50" @click="selectArea(a.name)">
                    {{ a.name }}
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiGet, apiPost } from '@/lib/api'

const router = useRouter()
const route = useRoute()
const storeColor = '#8a1538'

function goBack(){ router.back() }

const addresses = ref<any[]>([])
const openDrawer = ref(false)
const openMap = ref(false)
const mapSelection = ref<{ lat:number; lng:number }|null>(null)
let gmap: any = null
let gmarker: any = null
let ggeocoder: any = null
const gmapsKey = ref<string>('')

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
const selectedCityId = ref<string | null>(null)
const selectedCityName = ref<string | null>(null)
const selectedArea = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const openGovPicker = ref(false)
const openCityPicker = ref(false)
const openAreaPicker = ref(false)

const governorates = ref<Array<{ name: string }>>([])
const cities = ref<Array<{ id: string; name: string }>>([])
const areas = ref<Array<{ id: string; name: string }>>([])

function closeDrawer(){ openDrawer.value = false }

function inputClass(err?: string){ return err ? 'border-red-500' : 'border-gray-300' }

function validateField(field: string){
  switch(field){
    case 'fullName': errors.value.fullName = form.value.fullName.trim() ? '' : 'يرجى إدخال الاسم الرباعي بشكل صحيح'; break
    case 'phone': errors.value.phone = /^7[0-9]{8}$/.test(form.value.phone) ? '' : 'يجب أن يبدأ الرقم بـ 7 ويتكون من 9 أرقام'; break
    case 'altPhone': errors.value.altPhone = form.value.altPhone.trim() && !/^7[0-9]{8}$/.test(form.value.altPhone) ? 'يجب أن يبدأ الرقم البديل بـ 7 ويتكون من 9 أرقام' : ''; break
    case 'street': errors.value.street = form.value.street.trim() ? '' : 'يرجى إدخال اسم الشارع'; break
    case 'governorate': errors.value.governorate = selectedGovernorate.value ? '' : 'يرجى اختيار المحافظة'; break
    case 'city': errors.value.city = selectedCityId.value ? '' : 'يرجى اختيار المدينة/المديرية'; break
  }
}

const canSave = computed(()=>{
  return !!(
    form.value.fullName.trim() &&
    /^7[0-9]{8}$/.test(form.value.phone) &&
    selectedGovernorate.value &&
    selectedCityId.value &&
    form.value.street.trim()
  )
})

function onSave(){
  if (!canSave.value) return
  // حفظ على الخادم
  apiPost('/api/addresses', {
    country: form.value.country,
    province: selectedGovernorate.value,
    city: selectedCityName.value,
    street: form.value.street,
    details: [selectedArea.value, form.value.landmarks].filter(Boolean).join(' - '),
    postalCode: ''
  }).then(()=> loadAddresses()).finally(()=>{
    openDrawer.value = false
    // إعادة تعيين النموذج
    form.value = { fullName: '', phone: '', altPhone: '', country: 'اليمن', street: '', landmarks: '' }
    selectedGovernorate.value = null
    selectedCityId.value = null
    selectedCityName.value = null
    selectedArea.value = null
    isDefault.value = false
    errors.value = {}
    // العودة للصفحة السابقة إذا كانت مطلوبة
    if (returnTo.value) router.push(returnTo.value)
  })
}

function togglePrimary(idx: number){
  addresses.value = addresses.value.map((a, i) => ({ ...a, isDefault: i === idx }))
}

function removeAddress(idx: number){
  // حذف من الخادم ثم التحديث محلياً
  apiPost('/api/addresses/delete', {}).finally(()=>{ loadAddresses() })
}

function editAddress(idx: number){
  const a = addresses.value[idx]
  form.value.fullName = a.fullName
  form.value.phone = a.phone
  form.value.altPhone = a.altPhone
  form.value.country = a.country
  selectedGovernorate.value = a.governorate
  selectedCityName.value = a.city
  selectedCityId.value = a.cityId || null
  selectedArea.value = a.area || null
  form.value.street = a.street
  form.value.landmarks = a.landmarks
  isDefault.value = a.isDefault
  openDrawer.value = true
}

function confirmMapLocation(){
  if (!mapSelection.value) return
  openMap.value = false
}

function selectGovernorate(gov: string){
  selectedGovernorate.value = gov
  selectedCityId.value = null
  selectedCityName.value = null
  selectedArea.value = null
  openGovPicker.value = false
  validateField('governorate')
}

function selectCity(city: { id: string; name: string }){
  selectedCityId.value = city.id
  selectedCityName.value = city.name
  selectedArea.value = null
  openCityPicker.value = false
  validateField('city')
}

function selectArea(name: string){
  selectedArea.value = name
  openAreaPicker.value = false
}

async function loadGovernorates(){
  const r = await apiGet<{ items: Array<{ name: string }> }>('/api/geo/governorates?country=YE')
  governorates.value = Array.isArray(r?.items) ? r!.items : []
}

async function loadCities(){
  cities.value = []
  areas.value = []
  if (!selectedGovernorate.value) return
  const q = encodeURIComponent(selectedGovernorate.value)
  const r = await apiGet<{ items: Array<{ id: string; name: string }> }>(`/api/geo/cities?country=YE&governorate=${q}`)
  cities.value = Array.isArray(r?.items) ? r!.items : []
}

async function loadAreas(){
  areas.value = []
  if (!selectedCityId.value && !selectedCityName.value) return
  const params = selectedCityId.value ? `cityId=${encodeURIComponent(String(selectedCityId.value))}` : `city=${encodeURIComponent(String(selectedCityName||''))}`
  const r = await apiGet<{ items: Array<{ id: string; name: string }> }>(`/api/geo/areas?${params}`)
  areas.value = Array.isArray(r?.items) ? r!.items : []
}

function openGovernorates(){ openGovPicker.value = true; if (!governorates.value.length) loadGovernorates() }
function openCities(){ if (!selectedGovernorate.value) return; openCityPicker.value = true; loadCities() }
function openAreas(){ if (!selectedCityId.value) return; openAreaPicker.value = true; loadAreas() }

async function loadAddresses(){
  // تحميل عنوان المستخدم الوحيد من الخادم (إن وجد)
  const r = await apiGet<any>('/api/addresses')
  const a = r || null
  addresses.value = a ? [{
    id: 'primary',
    fullName: form.value.fullName || '—',
    phone: form.value.phone || '—',
    altPhone: form.value.altPhone || '',
    country: a.country || 'اليمن',
    governorate: a.state || a.province || '',
    city: a.city || '',
    cityId: a.cityId || null,
    area: '',
    street: a.street || '',
    landmarks: a.details || '',
    isDefault: true
  }] : []
}

function prefillFromMap(){
  try{
    const snap = sessionStorage.getItem('gmaps_selection') || sessionStorage.getItem('gmaps_selection_latest')
    if (!snap) return
    const s = JSON.parse(snap)
    if (s.country) form.value.country = s.country
    if (s.state) selectedGovernorate.value = s.state
    if (s.city){ selectedCityName.value = s.city; selectedCityId.value = null }
    if (s.street) form.value.street = s.street
    if (s.addressLine && !form.value.landmarks) form.value.landmarks = s.addressLine
  }catch{}
}

onMounted(()=>{ loadGovernorates(); loadAddresses(); prefillFromMap() })

const returnTo = ref<string | null>(null)
onMounted(()=>{
  const r = String((route.query?.return as string)||'').trim()
  if (r) returnTo.value = r
})

function selectAndReturn(){ if (returnTo.value) router.push(returnTo.value) }

function openMapClick(){
  openMap.value = true
  setTimeout(initMap, 50)
}

async function loadGoogle(): Promise<void>{
  if ((window as any).google?.maps) return
  // resolve key from env or Admin Integrations (/api/tracking/keys)
  let key = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_KEY || gmapsKey.value
  if (!key){
    try{ const tk = await apiGet<{ keys: Record<string,string> }>(`/api/tracking/keys`); key = tk?.keys?.GOOGLE_MAPS_API_KEY || '' }catch{}
    if (key) gmapsKey.value = key
  }
  await new Promise<void>((resolve, reject)=>{
    if ((window as any).google?.maps){ resolve(); return }
    const s = document.createElement('script')
    const qs = key ? `key=${encodeURIComponent(key)}&` : ''
    s.src = `https://maps.googleapis.com/maps/api/js?${qs}libraries=places&language=ar`
    s.async = true
    s.onload = ()=> resolve()
    s.onerror = ()=> reject(new Error('gmaps load failed'))
    document.head.appendChild(s)
  })
}

async function initMap(){
  try{ await loadGoogle() }catch{}
  try{
    const el = document.getElementById('addr_map') as HTMLElement
    if (!el) return
    const center = { lat: 15.3694, lng: 44.1910 }
    gmap = new (window as any).google.maps.Map(el, { center, zoom: 13, disableDefaultUI: false })
    gmap.addListener('click', (e: any)=>{ if (e.latLng){ setMapSelection({ lat: e.latLng.lat(), lng: e.latLng.lng() }) } })
    setMapSelection(center)
  }catch{}
}

function setMapSelection(pos: { lat:number; lng:number }){
  mapSelection.value = { lat: pos.lat, lng: pos.lng }
  try{
    if (!gmarker){ gmarker = new (window as any).google.maps.Marker({ position: pos, map: gmap!, draggable: true })
      gmarker.addListener('dragend', ()=>{ const p = gmarker!.getPosition()!; setMapSelection({ lat: p.lat(), lng: p.lng() }) })
    } else { gmarker.setPosition(pos) }
    reverseGeocode(pos)
  }catch{}
}

function ensureGeocoder(){ try{ if (!ggeocoder) ggeocoder = new (window as any).google.maps.Geocoder() }catch{} }

function reverseGeocode(pos: {lat:number; lng:number}){
  try{
    ensureGeocoder()
    if (!ggeocoder) return
    ggeocoder.geocode({ location: pos }, (results: any[], status: string)=>{
      if (status === 'OK' && results && results[0]){
        const addr = results[0]
        const comps = addr.address_components || []
        const byType = (t:string)=> comps.find((c:any)=> (c.types||[]).includes(t))
        const countryC = byType('country')
        const stateC = byType('administrative_area_level_1') || byType('administrative_area_level_2')
        const cityC = byType('locality') || byType('sublocality') || byType('administrative_area_level_2')
        const routeC = byType('route')
        if (countryC?.long_name) form.value.country = countryC.long_name
        if (stateC?.long_name) selectedGovernorate.value = stateC.long_name
        if (cityC?.long_name){ selectedCityName.value = cityC.long_name; selectedCityId.value = null }
        if (routeC?.long_name) form.value.street = routeC.long_name
        if (addr.formatted_address && !form.value.landmarks) form.value.landmarks = addr.formatted_address
      }
    })
  }catch{}
}

function locateMe(){
  try{
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((res)=>{
      const pos = { lat: res.coords.latitude, lng: res.coords.longitude }
      try{ gmap && gmap.setCenter(pos); gmap && gmap.setZoom(15) }catch{}
      setMapSelection(pos)
    })
  }catch{}
}
</script>

<style scoped>
.drawer-left-enter-active,
.drawer-left-leave-active { transition: transform 0.28s ease; }
.drawer-left-enter-from,
.drawer-left-leave-to { transform: translateX(-100%); }
</style>
