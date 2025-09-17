import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: { host: true },
  build: {
    sourcemap: false
  },
  preview: { host: true },
  // Set response headers in preview (dev) only; Nginx will handle prod headers
});

