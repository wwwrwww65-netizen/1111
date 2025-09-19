#!/usr/bin/env node
// Minimal headless check for client-side errors in admin HTML
import fetch from 'node-fetch';

async function main() {
  const url = `http://localhost:${process.env.PORT || '3001'}/`;
  const res = await fetch(url);
  const html = await res.text();
  // Look for Next.js generic client error banner
  const bad = /Application error: a client-side exception has occurred/i.test(html) || /__NEXT_DATA__/.test(html) && /"err"\s*:\s*\{/.test(html);
  if (bad) {
    console.error('[admin-console-smoke] Detected client-side exception banner on /');
    process.exit(1);
  }
  console.log('[admin-console-smoke] OK');
}

main().catch((e)=>{ console.error('[admin-console-smoke] Failed', e); process.exit(1); });

