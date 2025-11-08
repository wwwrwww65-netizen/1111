<template>
  <main class="bg-gray-50 min-h-screen" dir="rtl" lang="ar">
    <!-- Hero Card -->
    <section class="bg-white rounded-xl shadow-sm p-4 m-3 relative text-center">
      <button class="absolute top-2 inset-inline-end-2 w-10 h-10 rounded-lg bg-transparent border-0 grid place-items-center" aria-label="الإعدادات" @click="go('/settings')">
        <Icon name="settings" class="w-5 h-5 text-gray-600" />
      </button>
      <div>
        <div class="text-[16px] font-bold text-gray-900">تسجيل الدخول / تسجيل</div>
        <div class="text-[12px] text-gray-500 mt-1">انضم للاستفادة من جميع المزايا</div>
        <div class="flex gap-2 justify-center mt-3">
          <button class="h-9 px-3 rounded-lg bg-gray-100 text-gray-900 font-bold text-[13px]" @click="loginNow">تسجيل الدخول</button>
          <button class="h-9 px-3 rounded-lg bg-orange-500 text-white font-bold text-[13px]" @click="loginNow">إنشاء حساب</button>
        </div>
      </div>
    </section>

    <!-- Club Join Card -->
    <section class="bg-white rounded-xl shadow-sm p-4 m-3 cursor-pointer text-center" role="button" @click="loginNow">
      <div class="text-[16px] font-extrabold mb-2">JEEEY CLUB</div>
      <div class="flex justify-around my-2">
        <div class="flex flex-col items-center gap-1">
          <div class="text-orange-500 font-extrabold text-[20px]">15x</div>
          <div class="text-[11px] text-gray-500">نقاط JEEEY Club</div>
        </div>
        <div class="flex flex-col items-center gap-1">
          <div class="text-orange-500 font-extrabold text-[20px]">5%</div>
          <div class="text-[11px] text-gray-500">خصم</div>
        </div>
      </div>
      <div class="inline-block bg-orange-500 text-white font-semibold rounded-md px-3 py-2 text-[13px]">انضم الآن</div>
    </section>

    <!-- Orders Section -->
    <section class="bg-white rounded-xl shadow-sm p-4 m-3">
      <div class="text-[13px] font-semibold mb-2">طلبي</div>
      <div class="flex justify-between gap-2 text-center">
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/orders?status=preparing')">
          <Icon name="package" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">تجهيز الطلب</span>
        </button>
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/orders?status=shipped')">
          <Icon name="truck" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">تم الشحن</span>
        </button>
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/orders?status=delivered')">
          <Icon name="check" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">تم التسليم</span>
        </button>
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/orders/returns')">
          <Icon name="refresh" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">إرجاع/استبدال</span>
        </button>
      </div>
    </section>

    <!-- More Services -->
    <section class="bg-white rounded-xl shadow-sm p-4 m-3">
      <div class="text-[13px] font-semibold mb-2">المزيد من الخدمات</div>
      <div class="flex justify-between gap-2 text-center">
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/addresses')">
          <Icon name="location" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">عنوان الشحن</span>
        </button>
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/notifications')">
          <Icon name="bell" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">إشعاراتي</span>
        </button>
        <button class="flex-1 flex flex-col items-center gap-1 bg-transparent border-0 text-gray-700" @click="go('/support')">
          <Icon name="headphones" class="w-5 h-5 text-gray-600" /><span class="text-[11px]">مركز المساعدة</span>
        </button>
      </div>
    </section>

    <!-- Wishlist Empty -->
    <section class="bg-white rounded-xl shadow-sm p-4 m-3 text-center">
      <div class="text-[13px] font-semibold mb-1">قائمة الأمنيات</div>
      <div class="text-[12px] text-gray-500">لم يتم حفظ أي شيء مؤخرًا</div>
    </section>

    <BottomNav active="account" />
    <div style="height:72px"></div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import Icon from '@/components/Icon.vue'
const router = useRouter()
function go(path: string){ router.push(path) }
function loginNow(){
  const ret = (typeof window!=='undefined') ? (location.pathname + location.search) : '/account'
  router.push({ path: '/login', query: { return: ret } })
}
</script>

