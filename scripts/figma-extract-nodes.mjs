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

const root = process.cwd();
const mappingPath = path.join(root, 'infra', 'figma', 'mapping.json');
if (!fs.existsSync(mappingPath)) {
  console.error('mapping.json not found, run scripts/figma-extract.mjs first');
  process.exit(1);
}
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const frames = Array.isArray(mapping.frames) ? mapping.frames : [];
const ids = frames.map(f => f.id);

function chunk(arr, size) {
  const out = []; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i, i+size)); return out;
}

const nodes = {};
for (const batch of chunk(ids, 50)) {
  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${encodeURIComponent(batch.join(','))}`;
  const json = await fetchJson(url);
  Object.assign(nodes, json.nodes || {});
}

const outDir = path.join(root, 'infra', 'figma');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'nodes.json'), JSON.stringify({ nodes }, null, 2), 'utf8');
console.log(`Wrote ${Object.keys(nodes).length} nodes to infra/figma/nodes.json`);

