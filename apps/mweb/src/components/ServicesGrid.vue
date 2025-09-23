<template>
  <section class="grid" dir="rtl">
    <a v-for="s in services" :key="s.label" href="#" class="svc" :aria-label="s.label">
      <Icon :name="s.icon" />
      <div class="tx">{{ s.label }}<span v-if="s.badge" class="badge">{{ s.badge }}</span></div>
    </a>
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
const services = [
  { icon:'store', label:'مركز التجربة' },
  { icon:'live', label:'بث مباشر' },
  { icon:'survey', label:'استطلاعات' },
  { icon:'login', label:'تسجيل الدخول', badge:'جديد' },
  { icon:'support', label:'خدمة العملاء' }
]
</script>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.svc{border:1px solid var(--muted-2,#eee);border-radius:12px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:84px;text-decoration:none;color:inherit}
.tx{font-size:12px;margin-top:6px}
.badge{margin-inline-start:6px;background:#ff2d55;color:#fff;border-radius:6px;font-size:10px;padding:0 6px}
</style>

