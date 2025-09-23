<template>
  <main dir="rtl" lang="ar" class="container">
    <header class="header" role="banner" aria-label="العنوان">
      <button class="back" aria-label="رجوع">←</button>
      <div class="ttl">عنوان الشحن</div>
    </header>

    <section class="notice" role="note">
      ⚠️ تَشترط جمارك المملكة العربية السعودية تقديم رقم الهوية/الإقامة لاستلام الشحنات. <a href="#" class="link">عرض المزيد</a>
    </section>

    <form class="form" @submit.prevent="onSubmit" novalidate>
      <div class="field">
        <label class="label">الدولة<span class="req">*</span></label>
        <div class="select" :class="err('country')">
          <select v-model="country" aria-required="true" aria-label="الدولة">
            <option value="SA">Saudi Arabia</option>
            <option value="AE">United Arab Emirates</option>
            <option value="KW">Kuwait</option>
            <option value="BH">Bahrain</option>
            <option value="OM">Oman</option>
            <option value="QA">Qatar</option>
          </select>
          <span class="caret">▾</span>
        </div>
        <div v-if="errors.country" class="error" :id="'err-country'">{{ errors.country }}</div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label class="label">الاسم الأول<span class="req">*</span></label>
          <input class="input" :class="err('firstName')" v-model.trim="firstName" autocomplete="given-name" aria-required="true" aria-describedby="err-firstName" placeholder="مثال: محمد" />
          <div v-if="errors.firstName" class="error" id="err-firstName">{{ errors.firstName }}</div>
        </div>
        <div class="field">
          <label class="label">اسم الأب</label>
          <input class="input" v-model.trim="middleName" autocomplete="additional-name" placeholder="اسم الأب" />
          <div class="small-hint">متطلبات الجمارك: يُفضّل إدخال الاسم الرباعي.</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label class="label">اسم العائلة<span class="req">*</span></label>
          <input class="input" :class="err('lastName')" v-model.trim="lastName" autocomplete="family-name" aria-required="true" placeholder="مثال: الأحمد" />
          <div v-if="errors.lastName" class="error">{{ errors.lastName }}</div>
        </div>
        <div class="field">
          <label class="label">الاسم الكامل بالإنجليزية</label>
          <input class="input" v-model.trim="fullNameEn" placeholder="Full name in English" />
        </div>
      </div>

      <div class="field">
        <label class="label">رقم الهاتف<span class="req">*</span></label>
        <div class="phone" :class="err('phone')">
          <button type="button" class="cc" aria-label="رمز الدولة">{{ phoneCode.label }} ▾</button>
          <input class="p-input" v-model.trim="phone" inputmode="tel" autocomplete="tel" placeholder="5XXXXXXXX" aria-required="true" />
        </div>
        <div class="small-hint">لتوصيل الطرود مطلوب رقم هاتف صحيح.</div>
        <div v-if="errors.phone" class="error">{{ errors.phone }}</div>
      </div>

      <div class="field">
        <label class="label">رقم هاتف بديل <span class="opt">(اختياري)</span></label>
        <div class="phone">
          <button type="button" class="cc" aria-label="رمز الدولة">{{ phoneCode.label }} ▾</button>
          <input class="p-input" v-model.trim="altPhone" inputmode="tel" autocomplete="tel" placeholder="5XXXXXXXX" />
        </div>
      </div>

      <button type="button" class="loc-btn" @click="openPlaces" aria-label="تحديد الموقع">📍 تحديد الموقع<span class="arrow">←</span></button>
      <div class="g-note"><img src="https://www.gstatic.com/images/branding/product/1x/google_g_24dp.png" alt="Google" /> <span>powered by Google</span></div>

      <div class="grid-3">
        <div class="field">
          <label class="label">المحافظة<span class="req">*</span></label>
          <div class="select" :class="err('province')">
            <select v-model="province" aria-required="true">
              <option value="">اختر المحافظة</option>
              <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
            </select>
            <span class="caret">▾</span>
          </div>
          <div v-if="errors.province" class="error">{{ errors.province }}</div>
        </div>
        <div class="field">
          <label class="label">المدينة<span class="req">*</span></label>
          <div class="select" :class="err('city')">
            <select v-model="city" aria-required="true">
              <option value="">اختر المدينة</option>
              <option v-for="c in citiesForProvince" :key="c" :value="c">{{ c }}</option>
            </select>
            <span class="caret">▾</span>
          </div>
          <div v-if="errors.city" class="error">{{ errors.city }}</div>
        </div>
        <div class="field">
          <label class="label">الحي</label>
          <div class="select">
            <select v-model="district">
              <option value="">اختر الحي</option>
              <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
            </select>
            <span class="caret">▾</span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">الشارع<span class="req">*</span></label>
        <textarea class="textarea" :class="err('street')" v-model.trim="street" rows="3" placeholder="اسم الشارع/رقم الشارع" aria-required="true"></textarea>
        <div v-if="errors.street" class="error">{{ errors.street }}</div>
      </div>

      <div class="field">
        <label class="label">تفاصيل العنوان<span class="req">*</span></label>
        <textarea class="textarea big" :class="err('details')" v-model.trim="details" rows="4" placeholder="رقم المبنى، الطابق، البوابة، وأقرب معلم" aria-required="true"></textarea>
        <div class="small-hint">أدخل رقم المبنى، الطابق، البوابة، وأقرب معلم.</div>
        <div v-if="errors.details" class="error">{{ errors.details }}</div>
      </div>

      <section class="notice minor">تَشترط جمارك المملكة تقديم رقم الهوية. <a href="#" class="link">عرض المزيد</a></section>

      <div class="actions">
        <button type="submit" class="button-full">حفظ ومتابعة</button>
        <button type="button" class="button-outline" @click="onCancel">إلغاء</button>
      </div>
    </form>

    <BottomNav />
  </main>
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import { ref, computed } from 'vue'

const country = ref('SA')
const firstName = ref('')
const middleName = ref('')
const lastName = ref('')
const fullNameEn = ref('')
const phoneCode = ref<{ code:string; label:string }>({ code: '+966', label: 'SA +966' })
const phone = ref('')
const altPhone = ref('')
const province = ref('')
const city = ref('')
const district = ref('')
const street = ref('')
const details = ref('')
const errors = ref<Record<string,string>>({})

const provinces = ['الرياض','مكة','المدينة','الشرقية','عسير','القصيم']
const citiesMap: Record<string,string[]> = {
  'الرياض': ['الرياض','الدرعية','الخرج'],
  'مكة': ['مكة','جدة','الطائف'],
  'المدينة': ['المدينة المنورة','ينبع'],
  'الشرقية': ['الدمام','الخبر','الظهران'],
  'عسير': ['أبها','خميس مشيط'],
  'القصيم': ['بريدة','عنيزة']
}
const districts = ['الملز','العليا','الربوة','السلام','السلامة']
const citiesForProvince = computed(()=> citiesMap[province.value] || [])

function openPlaces(){ /* TODO integrate Google Places - stub filling example */
  street.value = street.value || 'طريق الملك فهد'
  province.value = province.value || 'الرياض'
  city.value = city.value || 'الرياض'
}

function validate(){
  const e: Record<string,string> = {}
  if (!country.value) e.country = 'اختر الدولة'
  if (!firstName.value || firstName.value.length < 2) e.firstName = 'يرجى إدخال الاسم الأول'
  if (!lastName.value || lastName.value.length < 2) e.lastName = 'يرجى إدخال اسم العائلة'
  const phoneDigits = phone.value.replace(/\D/g,'')
  if (!/^5\d{8}$/.test(phoneDigits)) e.phone = 'أدخل رقم يبدأ بـ 5 وطوله 9 أرقام'
  if (!province.value) e.province = 'اختر المحافظة'
  if (!city.value) e.city = 'اختر المدينة'
  if (!street.value || street.value.length < 3) e.street = 'أدخل اسم الشارع'
  if (!details.value || details.value.length < 8) e.details = 'التفاصيل يجب ألا تقل عن 8 أحرف'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit(){
  if (!validate()) return
  const payload = {
    country: country.value,
    firstName: firstName.value,
    middleName: middleName.value,
    lastName: lastName.value,
    fullNameEn: fullNameEn.value,
    phone: `${phoneCode.value.code}${phone.value}`,
    altPhone: altPhone.value ? `${phoneCode.value.code}${altPhone.value}` : undefined,
    province: province.value,
    city: city.value,
    district: district.value,
    street: street.value,
    details: details.value
  }
  // simulate save
  console.log('address.save', payload)
  alert('تم حفظ العنوان')
}

function onCancel(){ history.back() }

function err(key:string){ return errors.value[key] ? 'error-field' : '' }
</script>

<style scoped>
.container{padding:12px 16px;max-width:360px;margin:0 auto;background:#fff}
.header{height:56px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #ECECEC}
.back{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;border:0;background:transparent}
.ttl{font-size:16px;font-weight:700;color:#222}
.notice{background:#FFF4D9;color:#5A4B00;padding:12px 16px;border-radius:6px;font-size:13px;line-height:1.4;margin:12px 0}
.notice.minor{margin-top:8px}
.link{color:#1A73E8;font-weight:600;text-decoration:none}
.form{display:flex;flex-direction:column;gap:12px}
.label{display:block;font-size:13px;margin-bottom:6px}
.req{color:#FF6B4A;margin-inline-start:4px}
.opt{color:#9A9A9A;font-weight:500}
.input{height:48px;border:1px solid #E6E6E6;border-radius:6px;padding:0 12px;font-size:14px}
.input::placeholder{color:#BDBDBD}
.textarea{border:1px solid #E6E6E6;border-radius:6px;padding:8px 12px;font-size:14px;min-height:64px}
.textarea.big{min-height:96px}
.input:focus,.textarea:focus{border-color:#27AE60;outline:none;box-shadow:0 0 0 3px rgba(39,174,96,0.06)}
.select{position:relative;border:1px solid #E6E6E6;border-radius:6px;overflow:hidden}
.select select{appearance:none;-webkit-appearance:none;border:0;outline:0;width:100%;height:48px;padding:0 36px 0 12px;font-size:14px;background:#fff;color:#222}
.select .caret{position:absolute;inset-inline-start:8px;top:50%;transform:translateY(-50%);pointer-events:none;color:#777}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.phone{display:grid;grid-template-columns:96px 1fr;border:1px solid #E6E6E6;border-radius:6px;overflow:hidden;height:48px}
.cc{border:0;border-inline-end:1px solid #E6E6E6;background:#F7F7F7;padding:0 8px}
.p-input{border:0;outline:0;padding:0 12px;font-size:14px}
.small-hint{font-size:12px;color:#9A9A9A;margin-top:6px}
.error{color:#D32F2F;font-size:12px;margin-top:6px}
.error-field{box-shadow:0 0 0 3px rgba(211,47,47,0.06);border-color:#D32F2F}
.loc-btn{width:100%;height:52px;border:1px solid #E0E0E0;border-radius:6px;background:#fff;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px}
.arrow{margin-inline-start:auto}
.g-note{display:flex;align-items:center;gap:6px;opacity:.6;margin-top:6px;font-size:12px}
.g-note img{height:14px;width:auto}
.actions{display:flex;flex-direction:column;gap:8px;margin:8px 0 18px}
.button-full{width:100%;height:52px;border-radius:6px;background:#222;color:#fff;font-weight:700;font-size:16px;border:none}
.button-outline{width:100%;height:48px;border-radius:6px;background:transparent;border:1px solid #E6E6E6}
</style>

