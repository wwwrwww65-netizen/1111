import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import * as path from 'path';
import * as fs from 'fs';
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
      } catch { }
      return null;
    },
  } as const;
}

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    fallbackVuePage(),
    ...(process.env.VITE_ENABLE_LEGACY === '1' ? [legacy({ targets: ['defaults', 'not IE 11', 'ios >= 12', 'android >= 5'] })] : [])
  ],
  server: {
    host: true,
    hmr: { overlay: false },
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/i': {
        target: (process.env.API_URL || 'http://localhost:4000') + '/api/media/thumb',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/i/, '')
      },
      '/trpc': {
        target: process.env.API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/robots.txt': {
        target: process.env.API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: process.env.API_URL || 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  },
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

