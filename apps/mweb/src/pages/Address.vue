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
              <button v-if="returnTo" class="px-3 py-1 text-[12px] border border-[#8a1538] text-[#8a1538]" @click.stop="selectAndReturn(idx)">اختيار</button>
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
              <div style="display:none">
                <button class="w-full flex items-center justify-between bg-white border px-3 py-2 text-[13px]"
                        style="border-radius:0; border-color:#ccc" @click="openMapClick">
                  <span class="text-gray-900">حدد موقعك عبر الخريطة</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#8a1538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 110 10 5 5 0 010-10z"/>
                  </svg>
                </button>
                <p class="mt-1 text-[11px] text-gray-600">اضغط لتحديد موقعك على الخريطة.</p>
              </div>

              <!-- الدولة -->
              <div class="mt-3">
                <label>الدولة<span class="text-red-600">*</span></label>
                <input type="text" class="w-full border px-2 py-2 bg-gray-50" value="اليمن" readonly />
              </div>

              <!-- المحافظة -->
              <div class="mt-3">
                <label>المحافظة<span class="text-red-600">*</span></label>
                <div class="relative">
                  <button class="w-full text-right border px-2 py-2 bg-white" ref="governorateBtnRef"
                          :class="inputClass(errors.governorate)" @click="openGovernorates()">
                    <span>{{ selectedGovernorate || 'اختر المحافظة' }}</span>
                  </button>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <p v-if="errors.governorate" class="mt-1 text-xs text-red-600">{{ errors.governorate }}</p>
              </div>

              <!-- المدينة/المديرية: مخفية حسب طلب العميل -->
              <div class="mt-3" style="display:none">
                <label>المدينة/المديرية</label>
                <div class="relative">
                  <button class="w-full text-right border px-2 py-2 bg-white" disabled>
                    <span class="text-gray-400">تم الإخفاء</span>
                  </button>
                </div>
              </div>

              <!-- الحي/المنطقة -->
              <div class="mt-3">
                <label>الحي/المنطقة</label>
                <div class="relative">
                  <button class="w-full text-right border px-2 py-2 bg-white"
                          :disabled="!selectedGovernorate" @click="openAreas()">
                    <span :class="!selectedGovernorate ? 'text-gray-400' : 'text-gray-700'">
                      {{ selectedArea || (selectedGovernorate ? 'اختر الحي/المنطقة (اختياري)' : 'اختر المحافظة أولاً') }}
                    </span>
                  </button>
                  <svg v-if="selectedGovernorate" xmlns="http://www.w3.org/2000/svg"
                       class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              <!-- الشارع -->
              <div class="mt-3">
                <label>الشارع<span class="text-red-600">*</span></label>
                <input v-model="form.street" @blur="validateField('street')" type="text" ref="streetInputRef"
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
                <div class="absolute top-3 right-3 z-[1000]">
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
                  <li v-for="gov in governorates" :key="gov.name" class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50" @click="selectGovernorate(gov)">
                    {{ gov.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </transition>

        <!-- منبثق اختيار المدينة/المديرية: مخفي -->
        <transition name="drawer-left"></transition>

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
import { ref, computed, onMounted, nextTick } from 'vue'
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
let lmap: any = null
let lmarker: any = null
const governorateBtnRef = ref<HTMLElement | null>(null)
const streetInputRef = ref<HTMLInputElement | null>(null)
const disableGoogleMaps = false
const gmapsKey = ref<string>('')
const gmapsLoading = ref<boolean>(false)
const gmapsError = ref<string>('')

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

const governorates = ref<Array<{ id: string; name: string }>>([])
const cities = ref<Array<{ id: string; name: string }>>([])
const areas = ref<Array<{ id: string; name: string }>>([])
const adminCountryId = ref<string|null>(null)

// ترتيب بحسب أول إدخال: createdAt (أقدم أولاً)، ثم id تصاعدياً كبديل
function sortByInserted(items: any[]): any[] {
  try{
    return [...items].sort((a:any, b:any)=>{
      const ta = Date.parse(String(a?.createdAt||a?.created_at||'')) || NaN
      const tb = Date.parse(String(b?.createdAt||b?.created_at||'')) || NaN
      const hasTa = Number.isFinite(ta); const hasTb = Number.isFinite(tb)
      if (hasTa && hasTb) return ta - tb
      if (hasTa && !hasTb) return -1
      if (!hasTa && hasTb) return 1
      const ia = parseInt(String(a?.id||a?._id||''), 10)
      const ib = parseInt(String(b?.id||b?._id||''), 10)
      const hasIa = !Number.isNaN(ia); const hasIb = !Number.isNaN(ib)
      if (hasIa && hasIb) return ia - ib
      return 0
    })
  }catch{ return items }
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
    // خيار المدينة مخفي حالياً
    case 'city': errors.value.city = ''; break
  }
}

const canSave = computed(()=>{
  return !!(
    form.value.fullName.trim() &&
    /^7[0-9]{8}$/.test(form.value.phone) &&
    selectedGovernorate.value &&
    form.value.street.trim()
  )
})

function onSave(){
  if (!canSave.value) return
  // حفظ على الخادم
  apiPost('/api/addresses', {
    fullName: form.value.fullName,
    phone: form.value.phone,
    altPhone: form.value.altPhone,
    country: form.value.country,
    province: selectedGovernorate.value,
    // Store Area in 'city' column (backend) to keep it distinct from landmarks
    city: selectedArea.value,
    street: form.value.street,
    details: form.value.landmarks,
    postalCode: '',
    lat: mapSelection.value?.lat,
    lng: mapSelection.value?.lng,
    isDefault: isDefault.value
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
  const id = addresses.value[idx]?.id
  if (!id) return
  apiPost('/api/addresses/default', { id }).finally(()=> loadAddresses())
}

function removeAddress(idx: number){
  // حذف من الخادم ثم التحديث محلياً
  const id = addresses.value[idx]?.id
  apiPost('/api/addresses/delete', id? { id } : {}).finally(()=>{ loadAddresses() })
}

function editAddress(idx: number){
  const a = addresses.value[idx]
  form.value.fullName = a.fullName
  form.value.phone = a.phone
  form.value.altPhone = a.altPhone
  form.value.country = a.country
  selectedGovernorate.value = a.governorate
  // Since we treat Governorate as City, selectedCityName should reflect the governorate name
  selectedCityName.value = a.governorate
  selectedCityId.value = a.cityId || null
  selectedArea.value = a.area || null
  form.value.street = a.street
  form.value.landmarks = a.landmarks
  isDefault.value = a.isDefault
  openDrawer.value = true
}

async function confirmMapLocation(){
  if (!mapSelection.value) return
  try{
    await fetch('/api/geo/ensure', {
      method: 'POST', credentials: 'include', headers: { 'content-type':'application/json' },
      body: JSON.stringify({ countryCode: 'YE', countryName: form.value.country, governorate: selectedGovernorate.value, city: selectedCityName.value, area: selectedArea.value })
    })
  }catch{}
  openMap.value = false
  nextTick(()=>{
    try{
      if (!selectedGovernorate.value){
        governorateBtnRef.value?.focus()
      } else {
        streetInputRef.value?.focus()
      }
    }catch{}
  })
}

function selectGovernorate(gov: { id: string; name: string }){
  selectedGovernorate.value = gov.name
  // Use the ID from the selected governorate (City) to ensure correct area filtering
  selectedCityId.value = gov.id
  selectedCityName.value = gov.name
  
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
  // Public: يعكس Cities من لوحة التحكم عبر API المتجر
  try{
    const r:any = await apiGet<any>('/api/geo/governorates?country=YE')
    const items = Array.isArray(r?.items) ? r.items : []
    // العناصر مرتبة من الباك-إند حسب أول إدخال؛ نطبعها مباشرة
    governorates.value = items.map((x:any)=> ({ id: String(x.id||''), name: String(x.name||'').trim() })).filter((x:any)=> x.name)
  }catch{
    governorates.value = []
  }
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
  if (!selectedGovernorate.value) return
  try{
    const url = selectedCityId.value
      ? `/api/geo/areas?country=YE&cityId=${encodeURIComponent(String(selectedCityId.value))}`
      : `/api/geo/areas?country=YE&governorate=${encodeURIComponent(String(selectedGovernorate.value))}`
    const r:any = await apiGet<any>(url)
    const items = Array.isArray(r?.items) ? r.items : []
    areas.value = items.map((x:any)=> ({ id: String(x.id||''), name: String(x.name||'').trim() })).filter((x:any)=> x.name)
  }catch{ areas.value = [] }
}

function openGovernorates(){ openGovPicker.value = true; if (!governorates.value.length) loadGovernorates() }
function openCities(){ if (!selectedGovernorate.value) return; openCityPicker.value = true; loadCities() }
function openAreas(){ if (!selectedGovernorate.value) return; openAreaPicker.value = true; loadAreas() }

async function loadAddresses(){
  // واجهة API تُعيد مصفوفة عناوين (متعددة لكل مستخدم)
  const r = await apiGet<any[]>('/api/addresses')
  const list = Array.isArray(r) ? r : []
  addresses.value = list.map((a:any)=> {
    // New format: Area is stored in 'city' column. Old format: Area is in 'details' (Area - Landmark)
    // If a.city is present, we assume it's the Area (new format).
    const isNewFormat = !!a.city
    const realArea = isNewFormat ? a.city : (a.details || '').split(' - ')[0]
    let realLandmarks = isNewFormat ? a.details : (a.details || '').split(' - ').slice(1).join(' - ')

    // Safety: Strip Area from Landmarks if it's duplicated (e.g. hybrid data state)
    if (realArea && realLandmarks && String(realLandmarks).trim().startsWith(String(realArea).trim() + ' - ')) {
      realLandmarks = String(realLandmarks).trim().substring((String(realArea).trim() + ' - ').length)
    }

    return {
      id: a.id,
      fullName: a.fullName || '',
      phone: a.phone || '',
      altPhone: a.altPhone || '',
      country: a.country || 'اليمن',
      governorate: a.state || a.province || '',
      city: '', // Keep empty for frontend display to avoid duplicating Area (since we store Area in city column now)
      cityId: a.cityId || null,
      area: realArea || '',
      street: a.street || '',
      landmarks: realLandmarks || '',
      isDefault: !!a.isDefault
    }
  })
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

onMounted(()=>{ loadGovernorates(); loadAddresses(); prefillFromMap(); fetchMapsKey(); loadLeaflet().catch(()=>{}) })

async function fetchMapsKey(){
  try {
    const tk = await apiGet<{ keys: Record<string,string> }>(`/api/tracking/keys`)
    const k = tk?.keys?.GOOGLE_MAPS_API_KEY || ''
    if (k) gmapsKey.value = k
  } catch {}
}

const returnTo = ref<string | null>(null)
onMounted(()=>{
  const r = String((route.query?.return as string)||'').trim()
  if (r) returnTo.value = r
  const open = String((route.query?.open as string)||'').trim()
  if (open === '1') openDrawer.value = true
})

async function selectAndReturn(idx?: number){
  try{
    const a = (typeof idx==='number' ? addresses.value[idx] : null) || addresses.value.find(x=> x.isDefault) || addresses.value[0]
    if (a?.id){
      try{ sessionStorage.setItem('checkout_selected_address_id', String(a.id)) }catch{}
    }
  }catch{}
  if (returnTo.value) router.push(returnTo.value)
}

function openMapClick(){
  openMap.value = true
  setTimeout(initMap, 50)
}

async function loadGoogle(): Promise<void>{
  if ((window as any).google?.maps) return
  gmapsLoading.value = true
  gmapsError.value = ''
  // resolve key from env or Admin Integrations (/api/tracking/keys)
  let key = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_KEY || gmapsKey.value
  if (!key){
    try{ const tk = await apiGet<{ keys: Record<string,string> }>(`/api/tracking/keys`); key = tk?.keys?.GOOGLE_MAPS_API_KEY || '' }catch{}
    if (key) gmapsKey.value = key
  }
  try {
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
  } catch (e) {
    gmapsError.value = 'تعذر تحميل خريطة جوجل. تحقق من صلاحيات المفتاح.'
    // محاولة أخيرة بدون مفتاح (تعمل في حدود ضيقة)
    try {
      await new Promise<void>((resolve, reject)=>{
        const s = document.createElement('script')
        s.src = `https://maps.googleapis.com/maps/api/js?libraries=places&language=ar`
        s.async = true
        s.onload = ()=> resolve()
        s.onerror = ()=> reject(new Error('gmaps load failed'))
        document.head.appendChild(s)
      })
      gmapsError.value = ''
    } catch {}
  } finally {
    gmapsLoading.value = false
  }
}

async function initMap(){
  const el = document.getElementById('addr_map') as HTMLElement
  if (!el) return
  const center = { lat: 15.3694, lng: 44.1910 }
  // Try Google Maps first
  if (!disableGoogleMaps){
    try { await loadGoogle() } catch {}
  }
  if (!disableGoogleMaps && (window as any).google?.maps){
    try{
      gmap = new (window as any).google.maps.Map(el, { center, zoom: 17, disableDefaultUI: false })
      gmap.addListener('click', (e: any)=>{ if (e.latLng){ setMapSelection({ lat: e.latLng.lat(), lng: e.latLng.lng() }) } })
      setMapSelection(center)
      return
    }catch{}
  }
  // Fallback to Leaflet + OSM
  await initLeafletMap(el, center)
}

async function loadLeaflet(): Promise<void>{
  if ((window as any).L) return
  await new Promise<void>((resolve, reject)=>{
    const onCss = ()=>{
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.async = true
      s.crossOrigin = 'anonymous'
      s.onload = ()=> resolve()
      s.onerror = ()=> reject(new Error('leaflet load failed'))
      document.head.appendChild(s)
    }
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    l.onload = onCss
    l.onerror = ()=> reject(new Error('leaflet css load failed'))
    document.head.appendChild(l)
  })
}

async function initLeafletMap(el: HTMLElement, center: {lat:number; lng:number}){
  try{ await loadLeaflet() }catch{}
  const L = (window as any).L
  if (!L) return
  lmap = L.map(el, { preferCanvas: true, zoomControl: true }).setView([center.lat, center.lng], 17)
  // High-precision OSM tiles and attribution
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(lmap)
  // Add geolocation control for finer accuracy if available
  try { (navigator as any).permissions?.query?.({ name: 'geolocation' as any }).then(()=>{}).catch(()=>{}) } catch {}
  lmap.on('click', (e: any)=>{
    if (e?.latlng){ setMapSelection({ lat: e.latlng.lat, lng: e.latlng.lng }) }
  })
  setMapSelection(center)
}

function setMapSelection(pos: { lat:number; lng:number }){
  mapSelection.value = { lat: pos.lat, lng: pos.lng }
  try{
    if (!gmarker){ gmarker = new (window as any).google.maps.Marker({ position: pos, map: gmap!, draggable: true })
      gmarker.addListener('dragend', ()=>{ const p = gmarker!.getPosition()!; setMapSelection({ lat: p.lat(), lng: p.lng() }) })
    } else { gmarker.setPosition(pos) }
    reverseGeocode(pos)
  }catch{}
  try{
    const L = (window as any).L
    if (lmap && L){
      if (!lmarker){
        const pin = L.divIcon({ className:'leaflet-div-icon', html:`<div style="width:24px;height:24px;border-radius:50%;background:#8a1538;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`, iconSize:[24,24], iconAnchor:[12,24] })
        lmarker = L.marker([pos.lat, pos.lng], { draggable: true, icon: pin }).addTo(lmap)
        lmarker.on('dragend', (e: any)=>{
          const p = e.target.getLatLng()
          setMapSelection({ lat: p.lat, lng: p.lng })
        })
      } else {
        lmarker.setLatLng([pos.lat, pos.lng])
      }
      // Keep map centered when selection updates
      try { lmap.panTo([pos.lat, pos.lng]) } catch {}
      reverseGeocode(pos)
    }
  }catch{}
  // Ensure form has coordinates saved even if reverse geocoding fails
  try {
    form.value.landmarks = form.value.landmarks || `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`
  } catch {}
}

function ensureGeocoder(){ try{ if (!ggeocoder) ggeocoder = new (window as any).google.maps.Geocoder() }catch{} }

function reverseGeocode(pos: {lat:number; lng:number}){
  // Prefer Google if available, otherwise use OSM Nominatim
  if (!disableGoogleMaps && (window as any).google?.maps){
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
          const cityC = byType('locality') || byType('administrative_area_level_2') || byType('sublocality')
          const areaC = byType('sublocality') || byType('neighborhood') || byType('sublocality_level_1') || byType('administrative_area_level_3')
          const routeC = byType('route')
          if (countryC?.long_name) form.value.country = countryC.long_name
          if (stateC?.long_name) selectedGovernorate.value = stateC.long_name
          if (cityC?.long_name){ selectedCityName.value = cityC.long_name; selectedCityId.value = null }
          if (routeC?.long_name) form.value.street = routeC.long_name
          if (addr.formatted_address && !form.value.landmarks) form.value.landmarks = addr.formatted_address
          const areaName = areaC?.long_name || ''
          // Resolve area against known list
          if (selectedGovernorate.value) {
            loadAreas().then(()=>{
              const norm = (s:string)=> String(s||'').toLowerCase().replace(/\s+/g,'')
              const candidates = [areaName, selectedCityName.value].filter(Boolean) as string[]
              for (const cand of candidates){
                const found = areas.value.find(x => norm(x.name)===norm(cand) || norm(x.name).includes(norm(cand)))
                if (found){ selectedArea.value = found.name; break }
              }
              if (!selectedArea.value && areaName) selectedArea.value = areaName
            })
          } else {
            if (areaName) selectedArea.value = areaName
          }
          // Ensure backend has geo entries
          try {
            fetch('/api/geo/ensure', {
              method: 'POST',
              credentials: 'include',
              headers: { 'content-type':'application/json' },
              body: JSON.stringify({ countryCode: 'YE', countryName: form.value.country, governorate: selectedGovernorate.value, city: selectedCityName.value, area: selectedArea.value || areaName })
            })
          } catch {}
        }
      })
      return
    }catch{}
  }
  reverseGeocodeOSM(pos)
}

async function reverseGeocodeOSM(pos: {lat:number; lng:number}){
  try{
    // Use backend proxy to avoid CORS
    const url = `/api/reverse-geocode?lat=${encodeURIComponent(pos.lat)}&lng=${encodeURIComponent(pos.lng)}`
    const res = await fetch(url, { credentials:'include', headers: { 'Accept': 'application/json' } })
    if (!res.ok) return
    const data = await res.json()
    const a = data?.address || {}
    if (a.country) form.value.country = a.country
    // Governorate (state-level)
    const gov = a.state || a.state_district || a.region || a.province || a.county
    if (gov) selectedGovernorate.value = gov
    // City/district
    const city = a.city || a.town || a.municipality || a.district || a.village || a.hamlet
    if (city){ selectedCityName.value = city; selectedCityId.value = null }
    // Area (sub-level)
    const areaName = a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.locality
    // Street
    const road = a.road || a.residential || a.pedestrian || a.path
    if (road) form.value.street = road
    const disp = data?.display_name
    if (disp && !form.value.landmarks) form.value.landmarks = disp
    if (selectedGovernorate.value) {
      await loadAreas()
      const norm = (s:string)=> String(s||'').toLowerCase().replace(/\s+/g,'')
      const candidates = [areaName, selectedCityName.value].filter(Boolean) as string[]
      for (const cand of candidates){
        const found = areas.value.find(x => norm(x.name)===norm(cand) || norm(x.name).includes(norm(cand)))
        if (found){ selectedArea.value = found.name; break }
      }
      // If no match, just keep areaName as text for user context
      if (!selectedArea.value && areaName) selectedArea.value = areaName
    }
  // Ensure backend has these geo entries for future lists
  try {
    await fetch('/api/geo/ensure', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ countryCode: 'YE', countryName: form.value.country, governorate: selectedGovernorate.value, city: selectedCityName.value, area: selectedArea.value })
    })
  } catch {}
  }catch{}
}

function locateMe(){
  try{
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((res)=>{
      const pos = { lat: res.coords.latitude, lng: res.coords.longitude }
      try{
        if (gmap){ gmap.setCenter(pos); gmap.setZoom(18) }
        if (lmap){ lmap.setView([pos.lat, pos.lng], 18) }
      }catch{}
      setMapSelection(pos)
    }, (_err)=>{
      // fallback accuracy: keep existing center
      try{
        if (lmap){ const c = lmap.getCenter(); setMapSelection({ lat:c.lat, lng:c.lng }) }
      }catch{}
    }, { enableHighAccuracy:true, timeout:8000, maximumAge:1000 })
  }catch{}
}

function pinCenter(){
  try{
    if (gmap){ const c = gmap.getCenter(); setMapSelection({ lat: c.lat(), lng: c.lng() }) }
    else if (lmap){ const c = lmap.getCenter(); setMapSelection({ lat: c.lat, lng: c.lng }) }
  }catch{}
}
</script>

<style scoped>
.drawer-left-enter-active,
.drawer-left-leave-active { transition: transform 0.28s ease; }
.drawer-left-enter-from,
.drawer-left-leave-to { transform: translateX(-100%); }
</style>
