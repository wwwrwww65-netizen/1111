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
                <div class="text-muted">{{ i.price }} ر.س × {{ i.qty }}</div>
              </div>
            </div>
            <button class="btn btn-outline" @click="remove(i.id)">إزالة</button>
          </div>
        </div>
        <div class="card row" style="justify-content:space-between">
          <div>الإجمالي</div>
          <div style="font-weight:700">{{ total.toFixed(2) }} ر.س</div>
        </div>
        <button class="btn" style="width:100%">إتمام الشراء</button>
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

const cart = useCart()
const { items, total } = storeToRefs(cart)
const remove = (id:string)=> cart.remove(id)
</script>

