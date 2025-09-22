<template>
  <div dir="rtl">
    <HeaderBar />
    <div class="container page">
      <div class="gallery">
        <img :src="img" alt="" />
      </div>
      <h1 class="name">{{ title }}</h1>
      <div class="price-row">
        <span class="original" v-if="original">{{ original }}</span>
        <span class="price">{{ price }}</span>
      </div>
      <div class="chips">
        <button v-for="s in sizes" :key="s" class="chip" :class="{active:size===s}" @click="size=s">{{ s }}</button>
      </div>
      <button class="btn cta" @click="addToCart">أضف للسلة</button>
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useCart } from '@/store/cart'
const route = useRoute()
const id = route.query.id as string || 'p1'
const title = ref('منتج تجريبي')
const price = ref('129 ر.س')
const original = ref('179 ر.س')
const img = ref('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop')
const sizes = ['XS','S','M','L','XL']
const size = ref<string>('M')
const cart = useCart()
function addToCart(){ cart.add({ id, title: title.value, price: Number(price.value.replace(/[^\d.]/g,''))||0, img: img.value }, 1) }
onMounted(async ()=>{
  try{
    const res = await fetch(`https://api.jeeey.com/api/product/${encodeURIComponent(id)}`)
    if(res.ok){
      const d = await res.json()
      title.value = d.name || title.value
      price.value = (d.price||129) + ' ر.س'
      img.value = d.images?.[0] || img.value
      original.value = d.original ? d.original + ' ر.س' : original.value
    }
  }catch{}
})
</script>

<style scoped>
.page{padding-top:68px}
.gallery{border-radius:12px;overflow:hidden;border:1px solid var(--muted-2)}
.gallery img{width:100%;height:360px;object-fit:cover}
.name{font-size:18px;margin:10px 0}
.price-row{display:flex;gap:8px;align-items:center}
.original{text-decoration:line-through;color:#94a3b8}
.price{color:#dc2626;font-weight:800}
.chips{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}
.chip{padding:8px 12px;border:1px solid var(--muted-2);border-radius:999px;background:#fff}
.chip.active{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
.cta{width:100%}
</style>

