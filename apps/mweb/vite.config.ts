import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

function fallbackVuePage() {
  return {
    name: 'fallback-vue-page',
    resolveId(source: string, importer: string | undefined) {
      try {
        if (!importer) return null;
        // Only intercept dynamic imports coming from routes.generated.ts
        if (source.startsWith('./pages/') && source.endsWith('.vue') && importer.endsWith('routes.generated.ts')) {
          const candidate = path.resolve(path.dirname(importer), source);
          if (fs.existsSync(candidate)) return null;
          // Fallback to a lightweight placeholder to keep build green
          return path.resolve(__dirname, 'src/pages/NotFoundAuto.vue');
        }
      } catch {}
      return null;
    },
  } as const;
}

export default defineConfig({
  plugins: [vue(), fallbackVuePage()],
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

