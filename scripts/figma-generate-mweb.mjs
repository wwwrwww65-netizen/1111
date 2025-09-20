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

// Optional nodes.json to enable simple Auto Layout rendering
let nodesIndex = new Map();
let assetManifest = {};
try {
  const nodesPath = path.join(root, 'infra', 'figma', 'nodes.json');
  if (fs.existsSync(nodesPath)) {
    const nj = JSON.parse(fs.readFileSync(nodesPath, 'utf8'));
    const nodes = nj.nodes || {};
    for (const [id, wrap] of Object.entries(nodes)) {
      if (wrap && wrap.document) nodesIndex.set(id, wrap.document);
    }
  }
  const manifestPath = path.join(root, 'apps', 'mweb', 'public', 'assets', 'figma', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    assetManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) || {};
  }
} catch {}

function rgbaFromPaint(p) {
  const c = p?.color || { r:0, g:0, b:0 };
  const a = p?.opacity != null ? p.opacity : (p?.color?.a ?? 1);
  const r = Math.round((c.r||0) * 255);
  const g = Math.round((c.g||0) * 255);
  const b = Math.round((c.b||0) * 255);
  return `rgba(${r}, ${g}, ${b}, ${a ?? 1})`;
}

function cssGradientFromPaint(p) {
  if (!p || !Array.isArray(p.gradientStops)) return '';
  const stops = p.gradientStops
    .map((s) => {
      const col = rgbaFromPaint({ color: s.color, opacity: s.color?.a ?? s.opacity ?? 1 });
      const pos = Math.round(((s.position ?? 0) * 100));
      return `${col} ${pos}%`;
    })
    .join(', ');
  // Angle approximation; proper matrix->angle conversion skipped for brevity
  const angle = p.type === 'GRADIENT_RADIAL' ? 'circle at center' : '180deg';
  if (p.type === 'GRADIENT_RADIAL') return `radial-gradient(${angle}, ${stops})`;
  return `linear-gradient(${angle}, ${stops})`;
}

function styleFor(node) {
  const s = [];
  const lm = node.layoutMode;
  if (lm === 'HORIZONTAL' || lm === 'VERTICAL') {
    s.push('display:flex');
    s.push(`flex-direction:${lm === 'HORIZONTAL' ? 'row' : 'column'}`);
    if (typeof node.itemSpacing === 'number') s.push(`gap:${node.itemSpacing}px`);
    const ai = node.counterAxisAlignItems;
    if (ai === 'CENTER') s.push('align-items:center');
    if (ai === 'MAX') s.push('align-items:flex-end');
    if (ai === 'MIN') s.push('align-items:flex-start');
    const ji = node.primaryAxisAlignItems;
    if (ji === 'CENTER') s.push('justify-content:center');
    if (ji === 'MAX') s.push('justify-content:flex-end');
    if (ji === 'SPACE_BETWEEN') s.push('justify-content:space-between');
    if (ji === 'MIN') s.push('justify-content:flex-start');
  }
  // Sizing constraints
  if (node.layoutGrow === 1) s.push('flex:1 1 auto');
  if (node.layoutAlign === 'STRETCH') s.push('align-self:stretch');
  if (node.layoutAlign === 'CENTER') s.push('align-self:center');
  if (node.clipsContent) s.push('overflow:hidden');
  // Absolute positioning
  if (node.absoluteBoundingBox && node.constraints) {
    const c = node.constraints;
    if (c.horizontal === 'LEFT' && c.vertical === 'TOP') {
      const bb = node.absoluteBoundingBox;
      s.push('position:absolute');
      s.push(`left:${Math.round(bb.x)}px`);
      s.push(`top:${Math.round(bb.y)}px`);
      s.push(`width:${Math.round(bb.width)}px`);
      s.push(`height:${Math.round(bb.height)}px`);
    }
  }
  // Size hints from absoluteBoundingBox when present
  if (!s.some(v => v.startsWith('width')) && node.absoluteBoundingBox) {
    s.push(`min-width:${Math.round(node.absoluteBoundingBox.width)}px`);
  }
  if (!s.some(v => v.startsWith('height')) && node.absoluteBoundingBox) {
    s.push(`min-height:${Math.round(node.absoluteBoundingBox.height)}px`);
  }
  // Center constraints -> auto margins
  if (node.constraints) {
    if (node.constraints.horizontal === 'CENTER') {
      s.push('margin-left:auto');
      s.push('margin-right:auto');
    }
    if (node.constraints.vertical === 'CENTER') {
      s.push('margin-top:auto');
      s.push('margin-bottom:auto');
    }
  }
  const pl = node.paddingLeft ?? node.horizontalPadding;
  const pr = node.paddingRight ?? node.horizontalPadding;
  const pt = node.paddingTop ?? node.verticalPadding;
  const pb = node.paddingBottom ?? node.verticalPadding;
  if ([pl, pr, pt, pb].some(v => typeof v === 'number')) {
    s.push(`padding:${pt||0}px ${pr||0}px ${pb||0}px ${pl||0}px`);
  }
  // Corner radii per corner if available
  const tl = node.topLeftRadius ?? node.cornerRadius;
  const tr = node.topRightRadius ?? node.cornerRadius;
  const br = node.bottomRightRadius ?? node.cornerRadius;
  const bl = node.bottomLeftRadius ?? node.cornerRadius;
  const anyCorners = [tl,tr,br,bl].some(v => typeof v === 'number');
  if (anyCorners) s.push(`border-radius:${tl||0}px ${tr||0}px ${br||0}px ${bl||0}px`);
  if (Array.isArray(node.fills) && node.fills.length) {
    const f0 = node.fills[0];
    if (f0.type === 'SOLID') {
      s.push(`background:${rgbaFromPaint(f0)}`);
    } else if (f0.type && String(f0.type).startsWith('GRADIENT')) {
      const grad = cssGradientFromPaint(f0);
      if (grad) s.push(`background-image:${grad}`);
    } else if (f0.type === 'IMAGE') {
      // Use assets saved as <node.id>.png
      const file = assetManifest[node.id] || `${String(node.id).replace(/:/g,'__').replace(/;/g,'___').replace(/[^A-Za-z0-9_\-]/g,'_')}.png`;
      s.push(`background-image:url('/assets/figma/${file}')`);
      s.push('background-size:cover');
      s.push('background-position:center');
      s.push('background-repeat:no-repeat');
    }
  }
  // Borders
  if (Array.isArray(node.strokes) && node.strokes.length) {
    const stroke = node.strokes.find(sx => sx.type === 'SOLID') || node.strokes[0];
    if (stroke) {
      const col = rgbaFromPaint(stroke);
      const w = Math.round(node.strokeWeight || 1);
      s.push(`border:${w}px solid ${col}`);
    }
  }
  // Shadows (effects)
  if (Array.isArray(node.effects) && node.effects.length) {
    const shadows = [];
    for (const ef of node.effects) {
      if (!ef || ef.visible === false) continue;
      if (ef.type === 'DROP_SHADOW' || ef.type === 'INNER_SHADOW') {
        const col = rgbaFromPaint(ef);
        const x = Math.round(ef.offset?.x || 0);
        const y = Math.round(ef.offset?.y || 0);
        const b = Math.round(ef.radius || 0);
        const spr = Math.round(ef.spread || 0);
        const inset = ef.type === 'INNER_SHADOW' ? 'inset ' : '';
        shadows.push(`${inset}${x}px ${y}px ${b}px ${spr}px ${col}`);
      }
    }
    if (shadows.length) s.push(`box-shadow:${shadows.join(',')}`);
  }
  return s.join(';');
}

function typographyFor(node) {
  const t = [];
  const st = node.style || {};
  if (st.fontFamily) t.push(`font-family:'${String(st.fontFamily).replace(/'/g, '')}', Tajawal, system-ui, sans-serif`);
  if (st.fontWeight) t.push(`font-weight:${st.fontWeight}`);
  if (st.fontSize) t.push(`font-size:${Math.round(st.fontSize)}px`);
  if (st.lineHeightPx) t.push(`line-height:${Math.round(st.lineHeightPx)}px`);
  if (st.letterSpacing) t.push(`letter-spacing:${typeof st.letterSpacing === 'number' ? st.letterSpacing + 'px' : st.letterSpacing}`);
  if (node.textAlignHorizontal) {
    const ta = node.textAlignHorizontal.toLowerCase();
    if (ta === 'center' || ta === 'right' || ta === 'left' || ta === 'justified') t.push(`text-align:${ta === 'justified' ? 'justify' : ta}`);
  }
  // Text color from fills
  const fills = Array.isArray(node.fills) ? node.fills : [];
  const solid = fills.find(f => f.type === 'SOLID');
  if (solid) t.push(`color:${rgbaFromPaint(solid)}`);
  return t.join(';');
}

function nodeToVue(node, depth = 0) {
  if (!node || depth > 4) return '';
  const style = styleFor(node);
  const children = Array.isArray(node.children) ? node.children : [];
  // If this is a text node, render with typography styles
  if (node.type === 'TEXT') {
    const text = node.characters || '';
    const typo = typographyFor(node);
    return `<div style="${style};${typo}">${String(text)}</div>`;
  }
  if (!children.length) {
    const text = node.characters || node.name || '';
    return `<div style="${style}">${text ? String(text).slice(0,120) : ''}</div>`;
  }
  const inner = children.slice(0, 50).map(ch => nodeToVue(ch, depth + 1)).join('\n      ');
  return `<div style="${style}">\n      ${inner}\n    </div>`;
}

const routes = [];
// Naive component detection: group frames by normalized name prefix
function normalizeCompName(n){
  return String(n||'').toLowerCase().replace(/\d+$/,'').replace(/\s+/g,'-');
}
const nameGroups = new Map();
for (const [name, info] of entries) {
  const key = normalizeCompName(name);
  const arr = nameGroups.get(key) || [];
  arr.push([name, info]);
  nameGroups.set(key, arr);
}

for (const group of nameGroups.values()) {
  for (const [name, info] of group) {
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
  let body = '';
  const rich = nodesIndex.get(info.figmaId);
  if (rich) {
    const rendered = nodeToVue(rich);
    body = `<template>\n  <div class=\"container\" style=\"max-width:430px;margin:0 auto;min-height:100vh\">\n    ${rendered}\n  </div>\n</template>\n\n<script setup lang=\"ts\">\n</script>\n`;
  } else {
    body = `<template>\n  <div class=\"container\" style=\"max-width:430px;margin:0 auto;min-height:100vh\">\n    <div class=\"card\" style=\"margin-top:16px\">\n      <h1 style=\"margin:0 0 8px 0\">${name}</h1>\n      <p>Figma: ${info.figmaPath} (id: ${info.figmaId})</p>\n    </div>\n  </div>\n</template>\n\n<script setup lang=\"ts\">\n</script>\n`;
  }
  fs.writeFileSync(filePath, body, 'utf8');
    routes.push({ path: route, component: `() => import('./pages/${fileName}')` });
  }
}

// Always ensure core routes exist
const core = [
  { path: '/', component: "() => import('./pages/Home.vue')" },
  { path: '/products', component: "() => import('./pages/Products.vue')" },
  { path: '/cart', component: "() => import('./pages/Cart.vue')" },
  { path: '/login', component: "() => import('./pages/Login.vue')" },
];

// De-duplicate by path priority: core overrides mapping for '/'
const byPath = new Map();
for (const r of core) byPath.set(r.path, r);
for (const r of routes) {
  if (r.path === '/') continue; // keep handcrafted Home.vue for root
  byPath.set(r.path, r);
}

const finalRoutes = Array.from(byPath.values());
const genPath = path.join(root, 'apps', 'mweb', 'src', 'routes.generated.ts');
const genBody = finalRoutes
  .map((r) => "  { path: '" + r.path + "', component: " + r.component + " }")
  .join(',\n');
let homePath = '/';
const hasRoot = finalRoutes.some(r => r.path === '/');
if (!hasRoot) {
  const homeCandidate = finalRoutes.find(r => /(^|\/)home(\/|$)/i.test(r.path))
    || finalRoutes.find(r => r.path.includes('الرئيسية'))
    || finalRoutes[0];
  if (homeCandidate) homePath = homeCandidate.path;
}
const gen = "// AUTO-GENERATED FROM Figma mapping.json\n"
  + "export const routes = [\n" + genBody + "\n];\n"
  + "export const homePath = '" + homePath + "';\n";
fs.writeFileSync(genPath, gen, 'utf8');
console.log(`Generated ${finalRoutes.length} routes to apps/mweb/src/routes.generated.ts`);

