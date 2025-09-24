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
  ,tag: '<path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82ZM7 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/>'
  ,settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.04 3.3l.06.06A1.65 1.65 0 0 0 8 3.6a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 3.6c.34 0 .67-.11.94-.3l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.19.27-.3.6-.3.94 0 .62.25 1.2.69 1.63.43.44 1.01.69 1.63.69H22a2 2 0 1 1 0 4h-.09c-.61 0-1.2.25-1.63.69-.44.43-.69 1.01-.69 1.63Z"/>'
  ,box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/>'
  ,package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/>'
  ,credit: '<rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><path d="M2 10h20"/>'
  ,camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>'
  ,megaphone: '<path d="M3 11v2a4 4 0 0 0 4 4h1"/><path d="M7 15v4"/><path d="M21 8v8l-10 3V5z"/>'
  ,file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
  ,headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h1"/><path d="M3 19a2 2 0 0 0 2 2h1a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3H5"/>'
  ,pin: '<path d="M12 22s8-4.5 8-12a8 8 0 1 0-16 0c0 7.5 8 12 8 12Z"/><circle cx="12" cy="10" r="3"/>'
  ,undo: '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7"/>'
  ,wallet: '<path d="M2 7h20v10H2z"/><path d="M16 7V5a2 2 0 0 0-2-2H4v4"/><circle cx="18" cy="12" r="1"/>'
  ,star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/>'
  ,ticket: '<path d="M3 9h18v6H3z"/><path d="M21 9a3 3 0 0 1-3-3V6H6v0a3 3 0 0 1-3 3"/>'
  ,qr: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM17 13h4v4h-4zM13 17h4v4h-4z"/>'
  ,chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'
  ,inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 7h14l3 5v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'
  ,"file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>'
  ,"credit-card": '<rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><path d="M2 10h20"/>'
  ,"shopping-cart": '<path d="M7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 20ZM4 4h2l2.2 10.8A2 2 0 0 0 10.16 16h6.68a2 2 0 0 0 1.96-1.6L20 8H8"/>'
}[props.name as keyof any] || '';
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>${path}</svg>`;
</script>

<style scoped>
.icon{display:inline-flex;line-height:0}
</style>