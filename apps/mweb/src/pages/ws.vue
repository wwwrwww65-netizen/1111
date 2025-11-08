<template>
  <main class="ws-page" dir="rtl">
    <section class="card">
      <h1 class="title">عروض الشتاء جي jeeey</h1>
      <p class="subtitle">خصومات وتخفيضات خاصة — تواصل معنا عبر واتساب الآن.</p>
      <a
        class="wa-btn"
        :href="waUrl"
        rel="noopener"
        aria-label="تواصل عبر واتساب"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" class="wa-ico">
          <path fill="currentColor" d="M19.11 17.19c-.29-.15-1.69-.83-1.95-.92-.26-.1-.45-.15-.64.15-.19.29-.74.91-.91 1.09-.17.19-.34.21-.63.08-.29-.15-1.22-.45-2.32-1.44-.86-.74-1.45-1.65-1.62-1.94-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.52.15-.17.19-.29.29-.48.1-.19.06-.36-.02-.52-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.48h-.55c-.19 0-.5.06-.76.36s-1 1-1 2.46 1.03 2.86 1.17 3.05c.15.19 2.03 3.1 4.91 4.35.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.11.55-.08 1.69-.69 1.92-1.36.23-.67.23-1.24.17-1.36-.06-.13-.23-.19-.52-.34zM16.08 28c-2.09 0-4.16-.56-5.97-1.61l-4.14 1.35 1.35-4.03C5.2 21.84 4.7 19.91 4.7 18 4.7 10.83 10.83 4.7 18 4.7S31.3 10.83 31.3 18 25.17 31.3 18 31.3h-1.92zM6.78 24.66l.26.15a10.9 10.9 0 0 0 5.58 1.57H18c6.05 0 11-4.95 11-11s-4.95-11-11-11-11 4.95-11 11c0 1.87.48 3.73 1.4 5.37l.15.26-.83 2.5 2.06-.85z"/>
        </svg>
        تواصل عبر واتساب
      </a>
      <small class="hint">نقر الزر يفتح واتساب مع رسالة جاهزة.</small>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// رابط واتساب (يمكن تغييره)
const waUrl = 'https://wa.me/967781436625?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%0A%D8%A3%D9%86%D8%A7%20%D9%85%D9%87%D8%AA%D9%85%20%D8%A8%D9%87%D8%B0%D8%A7%20%D8%A7%D9%84%D9%85%D9%86%D8%AA%D8%AC%20%D8%A8%D8%AC%D8%A7%D9%85%D9%87%20%D9%81%D8%B1%D9%88%20%D9%86%D8%A7%D8%B9%D9%85.%0A%0A%D9%87%D9%84%20%D9%8A%D9%85%D9%83%D9%86%20%D8%AA%D8%B2%D9%88%D9%8A%D8%AF%D9%8A%20%D8%A8%D8%AA%D9%81%D8%A7%D8%B5%D9%8A%D9%84%20%D8%A3%D9%83%D8%AB%D8%B1%20%D9%82%D8%A8%D9%84%20%D8%A5%D8%AA%D9%85%D8%A7%D9%85%20%D8%A7%D9%84%D8%B7%D9%84%D8%A8%D8%9F'

// لتفعيل التحويل المباشر إلى واتساب دون فتح الصفحة: اجعل القيمة true
const AUTO_REDIRECT = true

onMounted(() => {
  // تحسين SEO بسيط للعربية
  document.title = 'عروض الشتاء جي jeeey — تواصل عبر واتساب'
  const meta = document.querySelector('meta[name="description"]') || (() => {
    const m = document.createElement('meta')
    m.setAttribute('name', 'description')
    document.head.appendChild(m)
    return m
  })()
  meta.setAttribute('content', 'عروض الشتاء من جي jeeey — تواصل معنا عبر واتساب للحصول على التفاصيل والطلبات.')

  // التحويل المباشر (فعّل عبر AUTO_REDIRECT = true)
  if (AUTO_REDIRECT) {
    try { window.location.replace(waUrl) } catch { window.location.href = waUrl }
  }
})
</script>

<style scoped>
.ws-page{
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f8fafc;
  padding: 16px;
}
.card{
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
  text-align: center;
}
.title{
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}
.subtitle{
  margin: 8px 0 16px;
  color: #6b7280;
  font-size: 14px;
}
.wa-btn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  background: #25d366;
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(37,211,102,.25);
}
.wa-btn:hover{ filter: brightness(1.05); }
.wa-btn:active{ transform: translateY(1px); }
.wa-ico{ width: 20px; height: 20px; }
.hint{
  display: block;
  margin-top: 10px;
  color: #9ca3af;
  font-size: 12px;
}
@media (max-width: 480px){
  .card{ padding: 16px; border-radius: 14px; }
  .title{ font-size: 20px; }
  .subtitle{ font-size: 13px; }
  .wa-btn{ padding: 12px 14px; border-radius: 10px; }
}
</style>


