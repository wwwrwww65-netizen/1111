<template>
  <select class="input small" v-model="cur" @change="onChange">
    <option value="SAR">ر.س</option>
    <option value="USD">$</option>
  </select>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { setCurrency } from '@/lib/currency'
const cur = ref('SAR')
function onChange(){ setCurrency(cur.value as any) }
</script>

