// vite.config.ts
import { defineConfig } from "file:///C:/Users/lenovo/Desktop/%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA/jeeet/1111/node_modules/.pnpm/vite@5.4.3/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/lenovo/Desktop/%D8%AA%D8%B5%D8%A7%D9%85%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA/jeeet/1111/node_modules/.pnpm/@vitejs+plugin-vue@5.1.2_vite@5.4.3_vue@3.5.13/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import fs from "fs";
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
var vite_config_default = defineConfig({
  plugins: [vue(), fallbackVuePage()],
  server: { host: true },
  build: {
    sourcemap: false
  },
  preview: { host: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
  // Set response headers in preview (dev) only; Nginx will handle prod headers
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsZW5vdm9cXFxcRGVza3RvcFxcXFxcdTA2MkFcdTA2MzVcdTA2MjdcdTA2NDVcdTA2NEFcdTA2NDUgXHUwNjI3XHUwNjQ0XHUwNjM1XHUwNjQxXHUwNjJEXHUwNjI3XHUwNjJBXFxcXGplZWV0XFxcXDExMTFcXFxcYXBwc1xcXFxtd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsZW5vdm9cXFxcRGVza3RvcFxcXFxcdTA2MkFcdTA2MzVcdTA2MjdcdTA2NDVcdTA2NEFcdTA2NDUgXHUwNjI3XHUwNjQ0XHUwNjM1XHUwNjQxXHUwNjJEXHUwNjI3XHUwNjJBXFxcXGplZWV0XFxcXDExMTFcXFxcYXBwc1xcXFxtd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9sZW5vdm8vRGVza3RvcC8lRDglQUElRDglQjUlRDglQTclRDklODUlRDklOEElRDklODUlMjAlRDglQTclRDklODQlRDglQjUlRDklODElRDglQUQlRDglQTclRDglQUEvamVlZXQvMTExMS9hcHBzL213ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XHJcblxyXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xyXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XHJcblxyXG5mdW5jdGlvbiBmYWxsYmFja1Z1ZVBhZ2UoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICdmYWxsYmFjay12dWUtcGFnZScsXHJcbiAgICBlbmZvcmNlOiAncHJlJyxcclxuICAgIHJlc29sdmVJZChzb3VyY2U6IHN0cmluZywgaW1wb3J0ZXI6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmICghaW1wb3J0ZXIpIHJldHVybiBudWxsO1xyXG4gICAgICAgIC8vIE9ubHkgaW50ZXJjZXB0IGR5bmFtaWMgaW1wb3J0cyBjb21pbmcgZnJvbSByb3V0ZXMuZ2VuZXJhdGVkLnRzIChhbGxvdyBmb3IgcXVlcnkgc3VmZml4ZXMpXHJcbiAgICAgICAgY29uc3QgZnJvbUdlbmVyYXRlZCA9IGltcG9ydGVyLmluY2x1ZGVzKCdyb3V0ZXMuZ2VuZXJhdGVkLnRzJyk7XHJcbiAgICAgICAgaWYgKGZyb21HZW5lcmF0ZWQgJiYgc291cmNlLnN0YXJ0c1dpdGgoJy4vcGFnZXMvJykgJiYgc291cmNlLmVuZHNXaXRoKCcudnVlJykpIHtcclxuICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoaW1wb3J0ZXIpLCBzb3VyY2UpO1xyXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY2FuZGlkYXRlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAvLyBGYWxsYmFjayB0byBhIGxpZ2h0d2VpZ2h0IHBsYWNlaG9sZGVyIHRvIGtlZXAgYnVpbGQgZ3JlZW5cclxuICAgICAgICAgIHJldHVybiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3BhZ2VzL05vdEZvdW5kQXV0by52dWUnKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2gge31cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9LFxyXG4gIH0gYXMgY29uc3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3Z1ZSgpLCBmYWxsYmFja1Z1ZVBhZ2UoKV0sXHJcbiAgc2VydmVyOiB7IGhvc3Q6IHRydWUgfSxcclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiBmYWxzZVxyXG4gIH0sXHJcbiAgcHJldmlldzogeyBob3N0OiB0cnVlIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJylcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIFNldCByZXNwb25zZSBoZWFkZXJzIGluIHByZXZpZXcgKGRldikgb25seTsgTmdpbnggd2lsbCBoYW5kbGUgcHJvZCBoZWFkZXJzXHJcbn0pO1xyXG5cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3YixTQUFTLG9CQUFvQjtBQUNyZCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUNmLFNBQVMscUJBQXFCO0FBSmlOLElBQU0sMkNBQTJDO0FBTWhTLElBQU0sYUFBYSxjQUFjLHdDQUFlO0FBQ2hELElBQU0sWUFBWSxLQUFLLFFBQVEsVUFBVTtBQUV6QyxTQUFTLGtCQUFrQjtBQUN6QixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsSUFDVCxVQUFVLFFBQWdCLFVBQThCO0FBQ3RELFVBQUk7QUFDRixZQUFJLENBQUMsU0FBVSxRQUFPO0FBRXRCLGNBQU0sZ0JBQWdCLFNBQVMsU0FBUyxxQkFBcUI7QUFDN0QsWUFBSSxpQkFBaUIsT0FBTyxXQUFXLFVBQVUsS0FBSyxPQUFPLFNBQVMsTUFBTSxHQUFHO0FBQzdFLGdCQUFNLFlBQVksS0FBSyxRQUFRLEtBQUssUUFBUSxRQUFRLEdBQUcsTUFBTTtBQUM3RCxjQUFJLEdBQUcsV0FBVyxTQUFTLEVBQUcsUUFBTztBQUVyQyxpQkFBTyxLQUFLLFFBQVEsV0FBVyw0QkFBNEI7QUFBQSxRQUM3RDtBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQUM7QUFDVCxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7QUFBQSxFQUNsQyxRQUFRLEVBQUUsTUFBTSxLQUFLO0FBQUEsRUFDckIsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLFNBQVMsRUFBRSxNQUFNLEtBQUs7QUFBQSxFQUN0QixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLEtBQUs7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQTtBQUVGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
