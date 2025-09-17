#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mappingPath = path.join(root, 'infra', 'figma', 'mapping.json');
if (!fs.existsSync(mappingPath)) {
  console.error('mapping.json not found at infra/figma/mapping.json');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const entries = Object.entries(data.mapping || {});

const outPages = path.join(root, 'apps', 'mweb', 'src', 'pages');
fs.mkdirSync(outPages, { recursive: true });

const routes = [];
for (const [name, info] of entries) {
  // Build a route for every frame. Heuristic: 'Home' => '/', otherwise kebab-case of name
  let route = info.route;
  if (!route) {
    const n = String(name).trim().toLowerCase();
    if (n === 'home' || n === 'الرئيسية') route = '/';
    else route = '/' + n.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }
  const compName = (info.component || name).replace(/[^A-Za-z0-9_]/g, '');
  const fileName = compName + '.vue';
  const filePath = path.join(outPages, fileName);
  if (!fs.existsSync(filePath)) {
    const tpl = `<template>\n  <div class=\"container\">\n    <div class=\"card\" style=\"margin-top:16px\">\n      <h1 style=\"margin:0 0 8px 0\">${name}</h1>\n      <p>Figma: ${info.figmaPath} (id: ${info.figmaId})</p>\n    </div>\n  </div>\n</template>\n\n<script setup lang=\"ts\">\n</script>\n`;
    fs.writeFileSync(filePath, tpl, 'utf8');
  }
  routes.push({ path: route, component: `() => import('./pages/${fileName}')` });
}

// Always ensure core routes exist
const core = [
  { path: '/', component: "() => import('./pages/Home.vue')" },
  { path: '/products', component: "() => import('./pages/Products.vue')" },
  { path: '/cart', component: "() => import('./pages/Cart.vue')" },
  { path: '/login', component: "() => import('./pages/Login.vue')" },
];

// De-duplicate by path priority: mapping overrides core
const byPath = new Map();
for (const r of core) byPath.set(r.path, r);
for (const r of routes) byPath.set(r.path, r);

const finalRoutes = Array.from(byPath.values());
const genPath = path.join(root, 'apps', 'mweb', 'src', 'routes.generated.ts');
const genBody = finalRoutes
  .map((r) => "  { path: '" + r.path + "', component: " + r.component + " }")
  .join(',\n');
const gen = "// AUTO-GENERATED FROM Figma mapping.json\nexport const routes = [\n" + genBody + "\n];\n";
fs.writeFileSync(genPath, gen, 'utf8');
console.log(`Generated ${finalRoutes.length} routes to apps/mweb/src/routes.generated.ts`);

