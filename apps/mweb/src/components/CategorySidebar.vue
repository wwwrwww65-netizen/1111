<template>
  <aside class="sidebar" dir="rtl" role="navigation" aria-label="قائمة الفئات">
    <button v-for="(c,idx) in items" :key="c" class="row" :class="{active: idx===active}" :aria-current="idx===active? 'true':'false'" @click="active=idx">{{ c }}</button>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ items?: string[] }>()
const items = props.items || ['كل','نساء','أطفال','رجال','مقاسات كبيرة','المنزل','الجمال','الأحذية']
const active = ref(0)
</script>

<style scoped>
.sidebar{width:96px;background:#FAFAFA;padding:8px;border-left:1px solid #F0F0F0;position:sticky;top:120px;align-self:start}
.row{width:100%;height:44px;border-radius:10px;border:0;background:transparent;text-align:start;padding:0 8px;font-weight:600;font-size:14px}
.row.active{background:#F3F3F3;box-shadow:inset 2px 0 0 #27AE60}
</style>

