// vite.config.ts
import { defineConfig } from "file:///C:/Users/lenovo/Desktop/%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA/jeeet/1111/node_modules/.pnpm/vite@5.4.3_terser@5.43.1/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/lenovo/Desktop/%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA/jeeet/1111/node_modules/.pnpm/@vitejs+plugin-vue@5.1.2_vite@5.4.3_vue@3.5.13/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import legacy from "file:///C:/Users/lenovo/Desktop/%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA/jeeet/1111/node_modules/.pnpm/@vitejs+plugin-legacy@5.4.3_terser@5.43.1_vite@5.4.3/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/lenovo/Desktop/%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA/jeeet/1111/apps/mweb/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
function fallbackVuePage() {
  return {
    name: "fallback-vue-page",
    enforce: "pre",
    resolveId(source, importer) {
      try {
        if (!importer) return null;
        const fromGenerated = importer.includes("routes.generated.ts");
        if (fromGenerated && source.startsWith("./pages/") && source.endsWith(".vue")) {
          const candidate = path.resolve(path.dirname(importer), source);
          if (fs.existsSync(candidate)) return null;
          return path.resolve(__dirname, "src/pages/NotFoundAuto.vue");
        }
      } catch {
      }
      return null;
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    fallbackVuePage(),
    ...process.env.VITE_ENABLE_LEGACY === "1" ? [legacy({ targets: ["defaults", "not IE 11", "ios >= 12", "android >= 5"] })] : []
  ],
  server: {
    host: true,
    hmr: { overlay: false },
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:4000",
        changeOrigin: true
      },
      "/uploads": {
        target: process.env.API_URL || "http://localhost:4000",
        changeOrigin: true
      },
      "/i": {
        target: (process.env.API_URL || "http://localhost:4000") + "/api/media/thumb",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/i/, "")
      }
    }
  },
  build: {
    sourcemap: false,
    target: "es2018"
  },
  preview: { host: true },
  resolve: {
    alias: {
      // Enable runtime template compilation for inline component templates used in pages
      "vue": "vue/dist/vue.esm-bundler.js",
      "@": path.resolve(__dirname, "src")
    }
  },
  esbuild: {
    target: "es2018",
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none"
  },
  optimizeDeps: {
    esbuildOptions: { target: "es2018" }
  }
  // Set response headers in preview (dev) only; Nginx will handle prod headers
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsZW5vdm9cXFxcRGVza3RvcFxcXFxcdTA2MkFcdTA2MzVcdTA2MjdcdTA2NDVcdTA2NEFcdTA2NDUgXHUwNjI3XHUwNjQ0XHUwNjM1XHUwNjQxXHUwNjJEXHUwNjI3XHUwNjJBXFxcXGplZWV0XFxcXDExMTFcXFxcYXBwc1xcXFxtd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsZW5vdm9cXFxcRGVza3RvcFxcXFxcdTA2MkFcdTA2MzVcdTA2MjdcdTA2NDVcdTA2NEFcdTA2NDUgXHUwNjI3XHUwNjQ0XHUwNjM1XHUwNjQxXHUwNjJEXHUwNjI3XHUwNjJBXFxcXGplZWV0XFxcXDExMTFcXFxcYXBwc1xcXFxtd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9sZW5vdm8vRGVza3RvcC8lRDglQUElRDglQjUlRDglQTclRDklODUlRDklOEElRDklODUlMjAlRDglQTclRDklODQlRDglQjUlRDklODElRDglQUQlRDglQTclRDglQUEvamVlZXQvMTExMS9hcHBzL213ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBsZWdhY3kgZnJvbSAnQHZpdGVqcy9wbHVnaW4tbGVnYWN5JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcblxuZnVuY3Rpb24gZmFsbGJhY2tWdWVQYWdlKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdmYWxsYmFjay12dWUtcGFnZScsXG4gICAgZW5mb3JjZTogJ3ByZScsXG4gICAgcmVzb2x2ZUlkKHNvdXJjZTogc3RyaW5nLCBpbXBvcnRlcjogc3RyaW5nIHwgdW5kZWZpbmVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWltcG9ydGVyKSByZXR1cm4gbnVsbDtcbiAgICAgICAgLy8gT25seSBpbnRlcmNlcHQgZHluYW1pYyBpbXBvcnRzIGNvbWluZyBmcm9tIHJvdXRlcy5nZW5lcmF0ZWQudHMgKGFsbG93IGZvciBxdWVyeSBzdWZmaXhlcylcbiAgICAgICAgY29uc3QgZnJvbUdlbmVyYXRlZCA9IGltcG9ydGVyLmluY2x1ZGVzKCdyb3V0ZXMuZ2VuZXJhdGVkLnRzJyk7XG4gICAgICAgIGlmIChmcm9tR2VuZXJhdGVkICYmIHNvdXJjZS5zdGFydHNXaXRoKCcuL3BhZ2VzLycpICYmIHNvdXJjZS5lbmRzV2l0aCgnLnZ1ZScpKSB7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShpbXBvcnRlciksIHNvdXJjZSk7XG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY2FuZGlkYXRlKSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgLy8gRmFsbGJhY2sgdG8gYSBsaWdodHdlaWdodCBwbGFjZWhvbGRlciB0byBrZWVwIGJ1aWxkIGdyZWVuXG4gICAgICAgICAgcmV0dXJuIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvcGFnZXMvTm90Rm91bmRBdXRvLnZ1ZScpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHsgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgfSBhcyBjb25zdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIGZhbGxiYWNrVnVlUGFnZSgpLFxuICAgIC4uLihwcm9jZXNzLmVudi5WSVRFX0VOQUJMRV9MRUdBQ1kgPT09ICcxJyA/IFtsZWdhY3koeyB0YXJnZXRzOiBbJ2RlZmF1bHRzJywgJ25vdCBJRSAxMScsICdpb3MgPj0gMTInLCAnYW5kcm9pZCA+PSA1J10gfSldIDogW10pXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsXG4gICAgaG1yOiB7IG92ZXJsYXk6IGZhbHNlIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LkFQSV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAnL3VwbG9hZHMnOiB7XG4gICAgICAgIHRhcmdldDogcHJvY2Vzcy5lbnYuQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo0MDAwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICAgICcvaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAocHJvY2Vzcy5lbnYuQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo0MDAwJykgKyAnL2FwaS9tZWRpYS90aHVtYicsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2kvLCAnJylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICB0YXJnZXQ6ICdlczIwMTgnXG4gIH0sXG4gIHByZXZpZXc6IHsgaG9zdDogdHJ1ZSB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIC8vIEVuYWJsZSBydW50aW1lIHRlbXBsYXRlIGNvbXBpbGF0aW9uIGZvciBpbmxpbmUgY29tcG9uZW50IHRlbXBsYXRlcyB1c2VkIGluIHBhZ2VzXG4gICAgICAndnVlJzogJ3Z1ZS9kaXN0L3Z1ZS5lc20tYnVuZGxlci5qcycsXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKVxuICAgIH1cbiAgfSxcbiAgZXNidWlsZDoge1xuICAgIHRhcmdldDogJ2VzMjAxOCcsXG4gICAgZHJvcDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gWydjb25zb2xlJywgJ2RlYnVnZ2VyJ10gOiBbXSxcbiAgICBsZWdhbENvbW1lbnRzOiAnbm9uZSdcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXNidWlsZE9wdGlvbnM6IHsgdGFyZ2V0OiAnZXMyMDE4JyB9XG4gIH1cbiAgLy8gU2V0IHJlc3BvbnNlIGhlYWRlcnMgaW4gcHJldmlldyAoZGV2KSBvbmx5OyBOZ2lueCB3aWxsIGhhbmRsZSBwcm9kIGhlYWRlcnNcbn0pKTtcblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3YixTQUFTLG9CQUFvQjtBQUNyZCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLFlBQVksVUFBVTtBQUN0QixZQUFZLFFBQVE7QUFDcEIsU0FBUyxxQkFBcUI7QUFMaU4sSUFBTSwyQ0FBMkM7QUFPaFMsSUFBTSxhQUFhLGNBQWMsd0NBQWU7QUFDaEQsSUFBTSxZQUFpQixhQUFRLFVBQVU7QUFFekMsU0FBUyxrQkFBa0I7QUFDekIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsVUFBVSxRQUFnQixVQUE4QjtBQUN0RCxVQUFJO0FBQ0YsWUFBSSxDQUFDLFNBQVUsUUFBTztBQUV0QixjQUFNLGdCQUFnQixTQUFTLFNBQVMscUJBQXFCO0FBQzdELFlBQUksaUJBQWlCLE9BQU8sV0FBVyxVQUFVLEtBQUssT0FBTyxTQUFTLE1BQU0sR0FBRztBQUM3RSxnQkFBTSxZQUFpQixhQUFhLGFBQVEsUUFBUSxHQUFHLE1BQU07QUFDN0QsY0FBTyxjQUFXLFNBQVMsRUFBRyxRQUFPO0FBRXJDLGlCQUFZLGFBQVEsV0FBVyw0QkFBNEI7QUFBQSxRQUM3RDtBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQUU7QUFDVixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osZ0JBQWdCO0FBQUEsSUFDaEIsR0FBSSxRQUFRLElBQUksdUJBQXVCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLFlBQVksYUFBYSxhQUFhLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDaEk7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUssRUFBRSxTQUFTLE1BQU07QUFBQSxJQUN0QixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRLFFBQVEsSUFBSSxXQUFXO0FBQUEsUUFDL0IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixRQUFRLFFBQVEsSUFBSSxXQUFXO0FBQUEsUUFDL0IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxNQUFNO0FBQUEsUUFDSixTQUFTLFFBQVEsSUFBSSxXQUFXLDJCQUEyQjtBQUFBLFFBQzNELGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFFBQVEsRUFBRTtBQUFBLE1BQzVDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTLEVBQUUsTUFBTSxLQUFLO0FBQUEsRUFDdEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCxPQUFPO0FBQUEsTUFDUCxLQUFVLGFBQVEsV0FBVyxLQUFLO0FBQUEsSUFDcEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixNQUFNLFNBQVMsZUFBZSxDQUFDLFdBQVcsVUFBVSxJQUFJLENBQUM7QUFBQSxJQUN6RCxlQUFlO0FBQUEsRUFDakI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQixFQUFFLFFBQVEsU0FBUztBQUFBLEVBQ3JDO0FBQUE7QUFFRixFQUFFOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
