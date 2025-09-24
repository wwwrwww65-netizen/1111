<template>
  <div class="container" dir="rtl" style="padding-top:68px">
    <h1 style="margin:12px 0">نقاطي</h1>
    <div class="card" style="padding:12px">
      <div>الرصيد: <strong>{{ balance }}</strong> نقطة</div>
      <div class="list">
        <div v-for="r in log" :key="r.id" class="row" style="justify-content:space-between;border-bottom:1px solid #eee;padding:6px 0">
          <div>{{ r.reason||'—' }}</div>
          <div :class="{pos:r.points>0,neg:r.points<0}">{{ r.points>0? '+':'' }}{{ r.points }}</div>
        </div>
      </div>
      <div class="row" style="gap:8px;margin-top:12px">
        <input class="input" v-model.number="redeemPts" type="number" placeholder="نقاط للتحويل" />
        <button class="btn" @click="redeem">تحويل لقسيمة</button>
      </div>
      <div class="muted" v-if="msg">{{ msg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPost } from '@/lib/api'
const balance = ref(0)
const log = ref<any[]>([])
const redeemPts = ref<number>(0)
const msg = ref('')
onMounted(async ()=>{
  try{
    const j = await apiGet<any>('/api/admin/points/log')
    if (j && Array.isArray(j.rows)) log.value = j.rows
    const s = await apiGet<any>('/api/admin/loyalty/list')
    if (s && Array.isArray(s.points)){
      const me = s.points.find((p:any)=>p.userId)
      if (me) balance.value = Math.round(me.points)
    }
  }catch{}
})
async function redeem(){
  msg.value=''
  const r = await apiPost('/api/admin/points/redeem', { points: redeemPts.value, reason:'REDEEM_TO_COUPON' })
  msg.value = r? 'تم التحويل لقسيمة' : 'فشل التحويل'
}
</script>

<style scoped>
.pos{color:#16a34a}
.neg{color:#dc2626}
.muted{color:#64748b;margin-top:6px}
</style>

