<template>
  <section class="grid" dir="rtl" aria-label="الخدمات">
    <a v-for="s in services" :key="s.label" href="#" class="svc" :aria-label="s.label">
      <Icon :name="s.icon" />
      <div class="tx">{{ s.label }}<span v-if="s.badge" class="badge">{{ s.badge }}</span></div>
    </a>
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
const services = [
  { icon:'location', label:'العناوين' },
  { icon:'card', label:'طرق الدفع' },
  { icon:'heart', label:'المفضلة' },
  { icon:'support', label:'خدمة العملاء' },
  { icon:'grid', label:'المزيد من الخدمات' }
]
</script>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media (max-width: 768px){ .grid{grid-template-columns:repeat(2,1fr)} }
.svc{border:1px solid var(--muted-2,#eee);border-radius:12px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:84px;text-decoration:none;color:inherit;box-shadow:0 4px 12px rgba(0,0,0,.06);transition:transform .08s ease}
.svc:active{transform:scale(.98)}
.tx{font-size:12px;margin-top:6px}
.badge{margin-inline-start:6px;background:#ff2d55;color:#fff;border-radius:6px;font-size:10px;padding:0 6px}
</style>

