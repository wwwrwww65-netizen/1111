<template></template>

<script setup lang="ts">
import { ref } from 'vue'
const key = 'consent_v1'
const show = ref(false)
function accept(){ try{ localStorage.setItem(key,'yes') }catch{}; show.value=false }
function decline(){ try{ localStorage.setItem(key,'no') }catch{}; show.value=false }
</script>

<style scoped>
/* consent banner temporarily disabled */
</style>

