<template>
  <span v-html="svg" class="icon" aria-hidden="true"></span>
</template>

<script setup lang="ts">
const props = defineProps<{ name: string; size?: number; color?: string }>();
const size = props.size ?? 24;
const color = props.color ?? 'currentColor';
const path = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/>',
  bag: '<path d="M6 8h12l-1.2 12.2A2 2 0 0 1 14.81 22H9.19A2 2 0 0 1 7.2 20.2L6 8Zm3-2a3 3 0 1 1 6 0v2H9V6Z"/>',
  cart: '<path d="M7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 20ZM4 4h2l2.2 10.8A2 2 0 0 0 10.16 16h6.68a2 2 0 0 0 1.96-1.6L20 8H8"/>',
  user: '<path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z"/>',
  search: '<path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/>',
  grid: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
  sparkles: '<path d="M12 2l1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2Zm6 8 1 2.2L21 13l-2 1 .9 2.2L18 15l-1.9 1.2L17 14l-2-1 2-.8 1-2.2Z"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  truck: '<path d="M3 7h11v8H3zM14 9h4l3 3v3h-7z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>',
  discount: '<path d="M9 3h6l6 6v6l-6 6H9l-6-6V9Z"/><path d="M9 9l6 6"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="15" r="1.5"/>',
  gift: '<path d="M20 12v8H4v-8"/><path d="M2 7h20v5H2z"/><path d="M12 7v13"/><path d="M12 7c-3 0-3-3-1.5-3S12 7 12 7Zm0 0c3 0 3-3 1.5-3S12 7 12 7Z"/>',
  shield: '<path d="M12 2l7 3v6c0 5-3 9-7 11-4-2-7-6-7-11V5z"/>'
}[props.name as keyof any] || '';
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>${path}</svg>`;
</script>

<style scoped>
.icon{display:inline-flex;line-height:0}
</style>