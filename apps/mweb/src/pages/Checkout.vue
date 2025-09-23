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
        <div class="muted" v-if="!address">لم يتم اختيار عنوان</div>
        <div v-else>{{ address }}</div>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>طريقة الدفع</div>
          <button class="btn btn-outline" @click="openPayment=true">اختيار</button>
        </div>
        <div class="muted" v-if="!payment">لم يتم تحديد طريقة الدفع</div>
        <div v-else>{{ payment }}</div>
      </div>
      <div class="card row" style="justify-content:space-between">
        <div>الإجمالي</div>
        <div style="font-weight:700">{{ total.toFixed(2) }} ر.س</div>
      </div>
      <button class="btn submit" :disabled="!address || !payment" @click="goConfirm">تأكيد الطلب</button>
    </div>

    <BottomSheet v-model="openAddress" height="65vh">
      <div class="sheet-title">العناوين</div>
      <div class="list">
        <button class="list-item" v-for="(a,idx) in demoAddresses" :key="idx" @click="selectAddress(a)">{{ a }}</button>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckout } from '@/store/checkout'

const cart = useCart()
const { total } = storeToRefs(cart)
const openAddress = ref(false)
const openPayment = ref(false)
const checkout = useCheckout()
const address = computed(()=> checkout.address ? `${checkout.address.city} - ${checkout.address.street}` : undefined)
const payment = computed(()=> checkout.payment)
const demoAddresses = ['الرياض - حي الياسمين - شارع العليا', 'جدة - حي الروضة - الأمير سلطان']
const paymentMethods = ['بطاقة ائتمانية', 'Apple Pay', 'الدفع عند الاستلام']
function selectAddress(a:string){ address.value = a; openAddress.value = false }
function selectPayment(p:string){ checkout.setPayment(p); openPayment.value = false }
const router = useRouter()
function goConfirm(){ if(address.value && payment.value){ router.push('/confirm') } }
</script>

<style scoped>
.page{padding-top:68px}
.title{margin:12px 0}
.muted{color:#64748b}
.sheet-title{font-weight:700;margin-bottom:8px}
.list{display:grid;gap:8px}
.list-item{display:block;width:100%;text-align:right;border:1px solid var(--muted-2);border-radius:12px;padding:10px;background:#fff}
.submit{width:100%}
</style>

