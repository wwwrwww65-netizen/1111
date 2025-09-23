<template>
  <nav class="pills" dir="rtl" role="tablist" aria-label="فلاتر">
    <button v-for="(p,i) in list" :key="p" class="pill" role="tab" :aria-selected="i===active" @click="active=i">{{ p }}</button>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ items?: string[] }>()
const list = props.items ?? ['الكل','ملابس','أحذية','إكسسوارات','أجهزة','أطفال','رجال','نساء']
const active = ref(0)
</script>

<style scoped>
.pills{display:flex;gap:8px;overflow:auto;padding:6px 16px;height:44px;align-items:center}
.pill{height:32px;padding:0 12px;border-radius:20px;background:#F3F3F3;border:1px solid #F3F3F3;font-size:14px}
.pill[aria-selected="true"]{background:#E8F8EF;border-color:#27AE60;color:#1a5}
</style>

