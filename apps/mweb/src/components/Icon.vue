<template>
  <span v-html="svg" class="icon" aria-hidden="true"></span>
</template>

<script setup lang="ts">
const props = defineProps<{ name: string; size?: number; color?: string }>();
const size = props.size ?? 22;
const color = props.color ?? 'currentColor';
const path = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/>',
  bag: '<path d="M6 8h12l-1.2 12.2A2 2 0 0 1 14.81 22H9.19A2 2 0 0 1 7.2 20.2L6 8Zm3-2a3 3 0 1 1 6 0v2H9V6Z"/>',
  cart: '<path d="M7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 20ZM4 4h2l2.2 10.8A2 2 0 0 0 10.16 16h6.68a2 2 0 0 0 1.96-1.6L20 8H8"/>',
  user: '<path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z"/>',
  search: '<path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/>',
}[props.name as keyof any] || '';
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>${path}</svg>`;
</script>

<style scoped>
.icon{display:inline-flex;line-height:0}
</style>