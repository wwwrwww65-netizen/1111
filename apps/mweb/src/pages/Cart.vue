<template>
  <div>
    <HeaderBar />
    <div class="container">
      <h1 style="margin:12px 0">السلة</h1>
      <div v-if="!items.length" class="card">لا توجد عناصر في السلة</div>
      <div v-else class="space-y-12">
        <div class="grid">
          <div v-for="i in items" :key="i.id" class="card row" style="justify-content:space-between">
            <div class="row" style="gap:10px">
              <img :src="i.img" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px" />
              <div>
                <div style="font-weight:600">{{ i.title }}</div>
                <div class="text-muted">{{ (i.price * i.qty).toFixed(2) }} ر.س</div>
                <div class="qty">
                  <button class="btn btn-outline sm" @click="dec(i.id)">-</button>
                  <input class="input sm" type="number" v-model.number="map[i.id]" @change="apply(i.id)" min="1" />
                  <button class="btn btn-outline sm" @click="inc(i.id)">+</button>
                </div>
              </div>
            </div>
            <button class="btn btn-outline" @click="remove(i.id)">إزالة</button>
          </div>
        </div>
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <div>قسيمة الخصم</div>
            <div class="row" style="gap:8px">
              <input class="input" v-model="coupon" placeholder="ادخل الكوبون" />
              <button class="btn btn-outline" @click="applyCoupon">تطبيق</button>
            </div>
          </div>
          <div v-if="discount>0" class="text-muted">تم تطبيق خصم: -{{ discount.toFixed(2) }} ر.س</div>
        </div>
        <div class="sticky-summary">
          <div class="row" style="justify-content:space-between">
            <div>الإجمالي</div>
            <div style="font-weight:700">{{ (total - discount).toFixed(2) }} ر.س</div>
          </div>
          <a class="btn" href="/checkout" style="width:100%">إتمام الشراء</a>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { storeToRefs } from 'pinia'
import { useCart } from '@/store/cart'
import { computed, reactive, ref } from 'vue'

const cart = useCart()
const { items, total } = storeToRefs(cart)
const remove = (id:string)=> cart.remove(id)
const map = reactive<Record<string, number>>({})
const coupon = ref('')
const discount = ref(0)
function sync(){ items.value.forEach(i=> map[i.id] = i.qty) }
function inc(id:string){ const it = items.value.find(i=>i.id===id); if(it){ it.qty++; map[id]=it.qty } }
function dec(id:string){ const it = items.value.find(i=>i.id===id); if(it && it.qty>1){ it.qty--; map[id]=it.qty } }
function apply(id:string){ const it = items.value.find(i=>i.id===id); if(it){ it.qty = Math.max(1, Number(map[id]||1)) } }
function applyCoupon(){ discount.value = (coupon.value.trim().toUpperCase()==='SAO') ? Math.min(total.value*0.1, 50) : 0 }
sync()
</script>

<style scoped>
.qty{display:flex;gap:6px;align-items:center;margin-top:6px}
.input{padding:10px 12px;border:1px solid var(--muted-2);border-radius:10px}
.sm{padding:6px 10px}
.sticky-summary{position:sticky;bottom:8px;background:#fff;border:1px solid var(--muted-2);border-radius:12px;padding:12px;box-shadow:0 6px 12px rgba(0,0,0,.04)}
</style>

