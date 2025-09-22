<template>
  <div class="disc-row" dir="rtl" role="region" aria-label="عروض وخصومات">
    <div class="cards">
      <div v-for="c in cards" :key="c.title" class="card" tabindex="0">
        <div class="title">{{ c.title }}</div>
        <div class="sub">{{ c.subtitle }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ cards?: Array<{ title: string; subtitle: string }> }>()
const cards = props.cards || [
  { title: '%18', subtitle: 'للطلبات >1800+' },
  { title: '%16', subtitle: 'للطلبات >999+' },
  { title: '%15', subtitle: 'للطلبات >399+' },
]
</script>

<style scoped>
.disc-row{padding:8px 12px}
.cards{display:flex;gap:8px;overflow:auto}
.card{flex:0 0 auto;min-width:120px;background:#fff;border:1px solid var(--muted-2);border-radius:8px;padding:10px}
.card:focus-visible{outline:2px solid var(--primary,#1467ff);outline-offset:2px}
.title{font-weight:800;font-size:18px}
.sub{color:#7a7a7a;font-size:12px}
</style>

