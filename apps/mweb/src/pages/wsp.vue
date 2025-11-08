<template>
  <div></div>
</template>

<script setup>
import { onMounted } from 'vue'

// رقم الواتساب بدون اشارات
const phone = '967781436625'

// الرسالة الافتراضية
const message = `مرحباً،
أنا مهتم بهذا المنتج بجامه فرو ناعم.

هل يمكن تزويدي بتفاصيل أكثر قبل إتمام الطلب؟`

const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

onMounted(() => {
  // تحديث عنوان الصفحة ووصفها لأغراض SEO
  document.title = 'جي jeeey المنصه الأكبر والاسرع في اليمن لشراء كافة مستلزماتك'

  let desc = document.querySelector('meta[name="description"]')
  if (!desc) {
    desc = document.createElement('meta')
    desc.setAttribute('name', 'description')
    document.head.appendChild(desc)
  }
  desc.setAttribute('content', 'جي jeeey — المنصّة الأكبر والأسرع في اليمن لشراء كافة مستلزماتك. تصفّح العروض واطلب مباشرة عبر واتساب.')

  // إعادة توجيه فورية إلى واتساب دون عرض المحتوى
  // نستخدم replace() حتى لا يبقى صفًّا في تاريخ المتصفح
  window.location.replace(waLink)
})
</script>

<style scoped>
/* لا يُعرض أي محتوى، الصفحة فارغة عن قصد */
</style>