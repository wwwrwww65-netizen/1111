<template>
  <div class="container" dir="rtl" style="padding-top:68px">
    <h1 style="margin:12px 0">تتبع الطلب #{{ id }}</h1>
    <div class="card" style="padding:12px">
      <div class="timeline">
        <div v-for="(s,i) in steps" :key="s.key" class="step" :class="{on: i<=activeIdx}">
          <div class="dot"></div>
          <div class="txt">
            <div class="name">{{ s.name }}</div>
            <div class="time" v-if="s.time">{{ s.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet } from '@/lib/api'
const route = useRoute()
const id = String(route.query.id||'')
type Step = { key:string; name:string; time?:string }
const steps = ref<Step[]>([
  { key:'PLACED', name:'تم إنشاء الطلب' },
  { key:'PAID', name:'تم الدفع' },
  { key:'PACKING', name:'قيد التحضير' },
  { key:'SHIPPED', name:'تم الشحن' },
  { key:'DELIVERED', name:'تم التسليم' }
])
const activeIdx = ref(0)
onMounted(async ()=>{
  const data = await apiGet<any>(`/api/orders/${encodeURIComponent(id)}/track`)
  if (data && Array.isArray(data.timeline)){
    steps.value = data.timeline
    activeIdx.value = Math.max(0, data.timeline.findIndex((x:any)=>x.active))
  }
})
</script>

<style scoped>
.timeline{display:flex;flex-direction:column;gap:12px}
.step{display:flex;gap:10px;align-items:flex-start;opacity:.5}
.step.on{opacity:1}
.dot{width:14px;height:14px;border-radius:999px;border:2px solid #111;margin-top:4px}
.step.on .dot{background:#111}
.name{font-weight:700}
.time{font-size:12px;color:#64748b}
</style>

