#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || 'rG0wiVHE4IfFHksHtfUPv7';
if (!FIGMA_TOKEN) {
  console.error('FIGMA_TOKEN is required');
  process.exit(1);
}

async function fetchFile(key) {
  const res = await fetch(`https://api.figma.com/v1/files/${key}`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN },
  });
  if (!res.ok) throw new Error(`Figma API error: ${res.status}`);
  return res.json();
}

function collectFrames(node, acc = [], prefix = []) {
  if (!node) return acc;
  const name = node.name || '';
  const pathNames = [...prefix, name].filter(Boolean);
  if (node.type === 'FRAME') {
    acc.push({ id: node.id, name, path: pathNames.join(' / ') });
  }
  const children = node.children || [];
  for (const child of children) collectFrames(child, acc, pathNames);
  return acc;
}

function buildMapping(frames) {
  const mapping = {};
  for (const fr of frames) {
    // Heuristic: map frames under a page/group named "ui" to components/routes
    const key = fr.path.toLowerCase();
    let route = null;
    if (key.includes('/ ui /') || key.startsWith('ui /') || key.endsWith('/ ui')) {
      const slug = fr.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
      route = `/${slug}`;
    }
    mapping[fr.name] = {
      figmaId: fr.id,
      figmaPath: fr.path,
      route,
      component: fr.name.replace(/\s+/g, ''),
    };
  }
  return mapping;
}

(async () => {
  const json = await fetchFile(FIGMA_FILE_KEY);
  const frames = collectFrames(json.document, []);
  const mapping = buildMapping(frames);
  const outDir = path.join(process.cwd(), 'infra', 'figma');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'mapping.json'), JSON.stringify({ frames, mapping }, null, 2), 'utf8');
  console.log(`Wrote ${frames.length} frames to infra/figma/mapping.json`);
})();

