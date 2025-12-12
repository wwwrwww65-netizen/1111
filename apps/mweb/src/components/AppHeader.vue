<template>
<header class="app-header" :class="{ solid: scrolled || alwaysSolid }" role="banner" aria-label="App header">
    <div class="inner" dir="rtl">
      <div class="right">
        <button class="icon" aria-label="سلة التسوق" id="cart-target"><Icon name="cart" /><span v-if="count>0" class="badge" :aria-label="`عدد العناصر: ${count}`">{{ count }}</span></button>
        <a class="icon" href="/wishlist" aria-label="المفضلة"><Icon name="heart" /></a>
        <a class="icon" href="/search" aria-label="بحث"><Icon name="search" /></a>
      </div>
      <div class="brand" aria-label="jeeey">
        <img v-if="logo" :src="logo" alt="jeeey" style="height:32px;object-fit:contain;" />
        <template v-else>jeeey</template>
      </div>
      <div class="left">
        <a class="icon" href="/orders" aria-label="الطلبات/الرسائل"><Icon name="bell" /><span class="dot" aria-hidden="true"></span></a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import Icon from '@/components/Icon.vue'
import { useCart } from '@/store/cart'
const props = defineProps<{ alwaysSolid?: boolean; solid?: boolean }>()
const alwaysSolid = (props.alwaysSolid === true) || (props.solid === true)
const scrolled = ref(false)
const logo = ref('')

function onScroll(){ scrolled.value = window.scrollY > 60 }
onMounted(()=>{ 
  onScroll(); 
  window.addEventListener('scroll', onScroll, { passive:true })
  fetch('https://api.jeeey.com/api/seo/meta?slug=/')
    .then(r=>r.json())
    .then(d=>{ if(d.siteLogo) logo.value=d.siteLogo })
    .catch(()=>{})
})
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
const cart = useCart();
const { count } = storeToRefs(cart)
</script>

<style scoped>
.app-header{position:fixed;inset:0 0 auto 0;height:64px;z-index:1000;background:transparent;transition:background .2s,height .2s}
.app-header.solid{background:var(--surface,#fff);box-shadow:0 2px 8px rgba(0,0,0,.06);height:52px}
.inner{display:flex;align-items:center;justify-content:space-between;height:100%;padding:0 8px}
.brand{font-weight:800;letter-spacing:.5px}
.icon{position:relative;display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:transparent;border:0;color:inherit}
.icon:focus-visible{outline:2px solid var(--primary,#0B5FFF)}
.badge{position:absolute;inset:6px auto auto 6px;background:#111;color:#fff;border-radius:999px;padding:0 6px;font-size:11px;line-height:18px;min-width:18px;text-align:center}
.dot{position:absolute;top:8px;left:10px;width:8px;height:8px;border-radius:999px;background:#ff3b30}
</style>

