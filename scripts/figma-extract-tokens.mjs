#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || 'rG0wiVHE4IfFHksHtfUPv7';
if (!FIGMA_TOKEN) {
  console.error('FIGMA_TOKEN is required');
  process.exit(1);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${url}`);
  return res.json();
}

function toCssVarName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$|--+/g, '-');
}

function colorToCss(paint) {
  const c = paint.color || { r:0,g:0,b:0 };
  const a = paint.opacity != null ? paint.opacity : 1;
  const r = Math.round((c.r||0) * 255);
  const g = Math.round((c.g||0) * 255);
  const b = Math.round((c.b||0) * 255);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

(async () => {
  const file = await fetchJson(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`);
  const styles = file.styles || {};
  const styleMap = new Map(Object.entries(styles));

  // Collect paint styles and text styles from document nodes
  const tokens = { color:{}, font:{}, space:{}, radius:{}, shadow:{} };

  function walk(node) {
    if (!node) return;
    // Text style
    if (node.style && node.style.fontFamily) {
      const ff = node.style.fontFamily;
      const fs = node.style.fontSize;
      const lh = node.style.lineHeightPx || node.style.lineHeightPercentFontSize;
      const key = `${ff}-${fs}`;
      tokens.font[key] = { family: ff, size: fs, lineHeight: lh };
    }
    // Fills
    const fills = Array.isArray(node.fills) ? node.fills : [];
    if (fills.length && fills[0].type === 'SOLID') {
      const name = node.name || 'color';
      const varName = toCssVarName(name);
      tokens.color[varName] = colorToCss(fills[0]);
    }
    // Effects -> shadows
    const effects = Array.isArray(node.effects) ? node.effects : [];
    for (const ef of effects) {
      if (ef.type === 'DROP_SHADOW' || ef.type === 'INNER_SHADOW') {
        const n = toCssVarName(`${node.name}-shadow`);
        const rgb = ef.color || { r:0,g:0,b:0,a:0.25 };
        const r = Math.round((rgb.r||0)*255);
        const g = Math.round((rgb.g||0)*255);
        const b = Math.round((rgb.b||0)*255);
        const a = rgb.a != null ? rgb.a : 0.25;
        tokens.shadow[n] = `${ef.offset?.x||0}px ${ef.offset?.y||2}px ${ef.radius||8}px rgba(${r}, ${g}, ${b}, ${a})`;
      }
    }
    // Corner radius
    if (node.cornerRadius != null) {
      const n = toCssVarName(`${node.name}-radius`);
      tokens.radius[n] = `${node.cornerRadius}px`;
    }
    // Padding as spacing hints
    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      const n = toCssVarName(`${node.name}-space`);
      tokens.space[n] = `${node.paddingTop||0}px ${node.paddingRight||0}px ${node.paddingBottom||0}px ${node.paddingLeft||0}px`;
    }
    const children = Array.isArray(node.children) ? node.children : [];
    for (const ch of children) walk(ch);
  }

  walk(file.document);

  // Emit CSS variables
  const lines = [':root{'];
  for (const [k,v] of Object.entries(tokens.color)) lines.push(`  --figma-color-${k}:${v};`);
  for (const [k,v] of Object.entries(tokens.font)) lines.push(`  --figma-font-${toCssVarName(k)}-size:${v.size}px;`);
  for (const [k,v] of Object.entries(tokens.radius)) lines.push(`  --figma-radius-${k}:${v};`);
  for (const [k,v] of Object.entries(tokens.space)) lines.push(`  --figma-space-${k}:${v};`);
  for (const [k,v] of Object.entries(tokens.shadow)) lines.push(`  --figma-shadow-${k}:${v};`);
  lines.push('}');

  const outDir = path.join(process.cwd(), 'apps', 'mweb', 'src');
  fs.writeFileSync(path.join(outDir, 'tokens.css'), lines.join('\n'), 'utf8');
  console.log(`Wrote tokens to apps/mweb/src/tokens.css`);
})();