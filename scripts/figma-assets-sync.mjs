#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || process.env.FIGMA_FILE_ID || 'rG0wiVHE4IfFHksHtfUPv7';
if (!FIGMA_TOKEN) {
  console.error('FIGMA_TOKEN is required');
  process.exit(1);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${url}`);
  return res.json();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  return Buffer.from(arr);
}

const root = process.cwd();
const nodesPath = path.join(root, 'infra', 'figma', 'nodes.json');
if (!fs.existsSync(nodesPath)) {
  console.error('nodes.json not found; run scripts/figma-extract-nodes.mjs first');
  process.exit(1);
}
const nj = JSON.parse(fs.readFileSync(nodesPath, 'utf8'));
const nodes = nj.nodes || {};

// Collect node ids that have image fills
const ids = new Set();
for (const [id, wrap] of Object.entries(nodes)) {
  const node = wrap?.document;
  if (!node) continue;
  function walk(n) {
    const fills = Array.isArray(n.fills) ? n.fills : [];
    for (const f of fills) if (f.type === 'IMAGE') ids.add(n.id);
    const children = Array.isArray(n.children) ? n.children : [];
    for (const ch of children) walk(ch);
  }
  walk(node);
}
const idList = Array.from(ids);
if (!idList.length) {
  console.log('No image nodes found');
  process.exit(0);
}

// Prefer serving from public so paths are stable and not hashed by bundler
const outDir = path.join(root, 'apps', 'mweb', 'public', 'assets', 'figma');
fs.mkdirSync(outDir, { recursive: true });

function chunk(arr, size) {
  const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out;
}

function safeId(id) {
  // Encode colon and semicolon pairs into double-underscore tokens to keep short yet safe
  return String(id).replace(/:/g, '__').replace(/;/g, '___').replace(/[^A-Za-z0-9_\-]/g, '_');
}

let total = 0;
const manifest = {};
for (const batch of chunk(idList, 100)) {
  try {
    const url = `https://api.figma.com/v1/images/${FIGMA_FILE_KEY}?ids=${encodeURIComponent(batch.join(','))}&format=png&scale=2`;
    const imagesJson = await fetchJson(url);
    const images = imagesJson.images || {};
    for (const [id, imgUrl] of Object.entries(images)) {
      if (!imgUrl) continue;
      const buf = await fetchBuffer(imgUrl);
      const fileSafe = safeId(id);
      const file = path.join(outDir, `${fileSafe}.png`);
      fs.writeFileSync(file, buf);
      manifest[id] = `${fileSafe}.png`;
      total++;
    }
  } catch (e) {
    console.error('Batch failed:', e?.message || e);
  }
}

try {
  const legacyDir = path.join(root, 'apps', 'mweb', 'src', 'assets');
  if (fs.existsSync(legacyDir)) {
    for (const f of fs.readdirSync(legacyDir)) {
      if (!f.endsWith('.png')) continue;
      const srcPath = path.join(legacyDir, f);
      const dstPath = path.join(outDir, f);
      if (!fs.existsSync(dstPath)) fs.copyFileSync(srcPath, dstPath);
    }
  }
} catch {}

// Write manifest for generator lookups
const manifestPath = path.join(root, 'apps', 'mweb', 'public', 'assets', 'figma', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`Downloaded ${total} assets to apps/mweb/public/assets/figma`);