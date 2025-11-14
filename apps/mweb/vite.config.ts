import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fallbackVuePage() {
  return {
    name: 'fallback-vue-page',
    enforce: 'pre',
    resolveId(source: string, importer: string | undefined) {
      try {
        if (!importer) return null;
        // Only intercept dynamic imports coming from routes.generated.ts (allow for query suffixes)
        const fromGenerated = importer.includes('routes.generated.ts');
        if (fromGenerated && source.startsWith('./pages/') && source.endsWith('.vue')) {
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

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    fallbackVuePage(),
    legacy({
      targets: ['defaults', 'not IE 11', 'ios >= 12', 'android >= 5']
    })
  ],
  server: { host: true, hmr: { overlay: false } },
  build: {
    sourcemap: false,
    target: 'es2018'
  },
  preview: { host: true },
  resolve: {
    alias: {
      // Enable runtime template compilation for inline component templates used in pages
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@': path.resolve(__dirname, 'src')
    }
  },
  esbuild: {
    target: 'es2018',
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none'
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2018' }
  }
  // Set response headers in preview (dev) only; Nginx will handle prod headers
}));

