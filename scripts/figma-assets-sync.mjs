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
// Request image URLs
const imagesJson = await fetchJson(`https://api.figma.com/v1/images/${FIGMA_FILE_KEY}?ids=${encodeURIComponent(idList.join(','))}&format=png&scale=2`);
const images = imagesJson.images || {};

const outDir = path.join(root, 'apps', 'mweb', 'src', 'assets');
fs.mkdirSync(outDir, { recursive: true });

for (const [id, url] of Object.entries(images)) {
  if (!url) continue;
  const buf = await fetchBuffer(url);
  const file = path.join(outDir, `${id}.png`);
  fs.writeFileSync(file, buf);
}

console.log(`Downloaded ${Object.keys(images).length} assets to apps/mweb/src/assets`);