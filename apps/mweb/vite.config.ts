import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  server: { host: true },
  build: {
    sourcemap: false
  },
  preview: { host: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  // Set response headers in preview (dev) only; Nginx will handle prod headers
});

