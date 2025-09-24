<template>
  <main class="guest" dir="rtl" lang="ar">
    <!-- Profile Hero Card -->
    <section class="card hero">
      <button class="settings" aria-label="الإعدادات" @click="go('/settings')"><Icon name="settings" /></button>
      <div class="hero-text">
        <div class="title">تسجيل الدخول / تسجيل</div>
        <div class="sub">انضم للاستفادة من جميع المزايا</div>
      </div>
    </section>

    <!-- Club Join Card -->
    <section class="card club-join" role="button" @click="go('/club')">
      <div class="club-title">JEEEY CLUB</div>
      <div class="club-perks">
        <div class="perk">
          <div class="v">15x</div>
          <div class="k">نقاط JEEEY Club</div>
        </div>
        <div class="perk">
          <div class="v">5%</div>
          <div class="k">خصم</div>
        </div>
      </div>
      <div class="club-cta">انضم الآن</div>
    </section>

    <!-- Orders Section -->
    <section class="card orders">
      <div class="h">طلبي</div>
      <div class="row">
        <button class="itm" @click="go('/orders?status=preparing')">
          <Icon name="package" /><span>تجهيز الطلب</span>
        </button>
        <button class="itm" @click="go('/orders?status=shipped')">
          <Icon name="truck" /><span>تم الشحن</span>
        </button>
        <button class="itm" @click="go('/orders?status=delivered')">
          <Icon name="check" /><span>تم التسليم</span>
        </button>
        <button class="itm" @click="go('/orders/returns')">
          <Icon name="refresh" /><span>إرجاع/استبدال</span>
        </button>
      </div>
    </section>

    <!-- More Services -->
    <section class="card more">
      <div class="h">المزيد من الخدمات</div>
      <div class="row">
        <button class="itm" @click="go('/addresses')">
          <Icon name="location" /><span>عنوان الشحن</span>
        </button>
        <button class="itm" @click="go('/notifications')">
          <Icon name="bell" /><span>إشعاراتي</span>
        </button>
        <button class="itm" @click="go('/support')">
          <Icon name="headphones" /><span>مركز المساعدة</span>
        </button>
      </div>
    </section>

    <!-- Wishlist Empty -->
    <section class="card wishlist">
      <div class="h">قائمة الأمنيات</div>
      <div class="muted">لم يتم حفظ أي شيء مؤخرًا</div>
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
</script>

<style scoped>
.guest{background:#f5f6f8;min-height:100dvh}
.card{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:12px;margin:12px}

/* Hero */
.hero{position:relative;text-align:center;padding:24px 12px}
.settings{position:absolute;top:10px;inset-inline-end:10px;width:40px;height:40px;border-radius:10px;border:0;background:transparent;display:grid;place-items:center}
.hero-text .title{font-size:16px;font-weight:700;color:#111827}
.hero-text .sub{font-size:12px;color:#6b7280;margin-top:4px}

/* Club */
.club-join{text-align:center}
.club-title{font-weight:800;font-size:16px;margin-bottom:8px}
.club-perks{display:flex;justify-content:space-around;margin:8px 0 12px}
.perk{display:flex;flex-direction:column;gap:4px;align-items:center}
.perk .v{color:#f97316;font-weight:800;font-size:20px}
.perk .k{font-size:11px;color:#6b7280}
.club-cta{display:inline-block;background:#f97316;color:#fff;font-weight:600;border-radius:8px;padding:8px 14px;font-size:13px}

/* Orders */
.orders .h,.more .h{font-size:13px;font-weight:600;margin-bottom:8px}
.row{display:flex;justify-content:space-between;gap:8px;text-align:center}
.itm{flex:1;display:flex;flex-direction:column;gap:6px;align-items:center;background:transparent;border:0;color:inherit;padding:6px}
.itm span{font-size:11px}

/* Wishlist */
.wishlist .h{font-size:13px;font-weight:600;margin-bottom:4px;text-align:center}
.muted{font-size:12px;color:#6b7280;text-align:center}
</style>

