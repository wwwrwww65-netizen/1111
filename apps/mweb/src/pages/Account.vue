<template>
  <main class="account" dir="rtl" lang="ar">
    <!-- Header -->
    <header class="hdr">
      <button class="ic" aria-label="الإعدادات"><Icon name="settings" /></button>
      <div class="ubox">
        <span class="badge">SO %</span>
        <span class="uname">{{ username }}</span>
      </div>
    </header>

    <!-- Club Card -->
    <section class="card club">
      <div class="club-top">
        <span class="club-tag">JEEEY CLUB</span>
      </div>
      <div class="club-sub">انضم للحصول على المزايا 3+</div>
      <div class="club-perks">
        <div class="perk">
          <div class="perk-bubble"><span>5%</span></div>
          <div class="perk-txt">نقاط يومية 5%</div>
        </div>
        <div class="perk">
          <div class="perk-big">15%</div>
          <div class="perk-txt">خصومات حتى 15%</div>
        </div>
        <div class="perk">
          <div class="perk-big">10%</div>
          <div class="perk-txt">10%-2% تكلفة الشحن</div>
        </div>
      </div>
      <div class="club-offer">
        <span class="old">₪33.99 (بدلاً من 93)</span>
        <span class="now">₪22.99</span>
        <span class="cta">انضم الآن</span>
      </div>
    </section>

    <!-- Stats -->
    <section class="card stats">
      <div class="stat">
        <div class="v">0</div>
        <div class="k">بانتظار الشحن</div>
      </div>
      <div class="stat">
        <div class="v">0</div>
        <div class="k">نقاط</div>
      </div>
      <div class="stat">
        <div class="v">1</div>
        <div class="k">عربات</div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="box">
      <div class="box-h">الأوامر المحفوظة</div>
      <div class="card qa">
        <button class="qa-itm"><Icon name="heart" /><span>المنتجات المحفوظة</span></button>
        <button class="qa-itm"><Icon name="package" /><span>تتبع</span></button>
        <button class="qa-itm"><Icon name="truck" /><span>مركز الشحن</span></button>
        <button class="qa-itm"><Icon name="credit-card" /><span>في التحضير</span></button>
        <button class="qa-itm"><Icon name="gift" /><span>عرض مجاني</span></button>
      </div>
    </section>

    <!-- More services -->
    <section class="box">
      <div class="box-h">المزيد من الخدمات</div>
      <div class="card srv">
        <button class="srv-itm">
          <div class="sq">مجاني</div>
          <span>مجاني</span>
        </button>
        <button class="srv-itm">
          <div class="sq"><Icon name="camera" /></div>
          <span>كتب</span>
        </button>
        <button class="srv-itm">
          <div class="sq"><Icon name="megaphone" /></div>
          <span>شركة</span>
        </button>
        <button class="srv-itm">
          <div class="sq"><Icon name="file-text" color="#ef4444" /></div>
          <span>مركز الآراء</span>
        </button>
        <button class="srv-itm">
          <div class="sq"><Icon name="headphones" /></div>
          <span>خدمة العملاء</span>
        </button>
      </div>
    </section>

    <!-- Recommendation -->
    <section class="box">
      <div class="box-h">تقييم الأسبوع</div>
      <article class="card promo">
        <img src="https://csspicker.dev/api/image/?q=black+tank+top+jeans&image_type=photo" alt="Product" />
        <div class="p-body">
          <div class="p-title">SHEIN Privé قميص علوي ملائم جداً</div>
          <div class="p-row">
            <div class="now">₪18.40</div>
            <div class="old">₪23.00</div>
          </div>
          <div class="muted">تم شراؤه من قبل 1000+ مشتري</div>
        </div>
      </article>
    </section>

    <BottomNav active="account" />
    <div style="height:72px"></div>
  </main>
  
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import Icon from '@/components/Icon.vue'
import { computed } from 'vue'
import { useUser } from '@/store/user'
const props = defineProps<{ userName?: string }>()
const user = useUser()
const username = computed(()=> props.userName || user.username || 'jeeey')
</script>

<style scoped>
.account{background:#f5f6f8;min-height:100dvh}
.hdr{position:sticky;top:0;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #eee;z-index:10}
.ic{width:40px;height:40px;display:grid;place-items:center;border-radius:10px;border:0;background:transparent}
.ubox{display:flex;align-items:center;gap:8px}
.badge{background:#9ca3af;color:#fff;border-radius:6px;padding:2px 6px;font-size:11px}
.uname{font-size:16px;font-weight:600}

.card{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:12px;margin:12px}
.club{padding:16px}
.club-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.club-tag{background:#f97316;color:#fff;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:800}
.club-sub{color:#666;font-size:13px;margin-bottom:10px}
.club-perks{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}
.perk{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.perk-bubble{width:48px;height:48px;border-radius:999px;background:#ffedd5;color:#f97316;display:grid;place-items:center;font-weight:800}
.perk-big{font-weight:800;font-size:20px}
.perk-txt{font-size:12px;color:#666}
.club-offer{background:#fff7ed;border:1px dashed #fdba74;border-radius:10px;padding:8px;display:flex;justify-content:center;gap:8px;color:#f97316}
.club-offer .old{text-decoration:line-through}
.club-offer .now{font-weight:800}
.club-offer .cta{font-size:12px}

.stats{display:flex;justify-content:space-between;text-align:center}
.stat .v{font-weight:800;font-size:18px}
.stat .k{font-size:12px;color:#666}

.box{margin:0 12px}
.box-h{font-size:13px;color:#6b7280;margin:8px 4px}
.qa{display:flex;justify-content:space-between;gap:12px;padding:12px}
.qa-itm{display:flex;flex-direction:column;align-items:center;gap:6px;background:transparent;border:0}
.qa-itm span{font-size:12px;color:#666}

.srv{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:12px}
.srv-itm{display:flex;flex-direction:column;align-items:center;gap:6px;background:transparent;border:0}
.srv-itm span{font-size:12px;color:#666}
.sq{width:48px;height:48px;border-radius:10px;background:#f3f4f6;display:grid;place-items:center}

.promo img{width:100%;height:180px;object-fit:cover;border-radius:10px}
.p-body{padding:10px}
.p-title{font-size:14px;font-weight:600}
.p-row{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
.p-row .now{color:#ef4444;font-weight:800}
.p-row .old{color:#9ca3af}

@media (min-width:480px){
  .srv{grid-template-columns:repeat(6,1fr)}
}
@media (min-width:768px){
  .club-perks{justify-content:center;gap:24px}
  .qa{justify-content:center}
  .srv{grid-template-columns:repeat(8,1fr)}
  .stats{justify-content:center;gap:48px}
}
</style>

