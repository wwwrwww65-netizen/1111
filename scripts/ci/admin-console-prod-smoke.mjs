#!/usr/bin/env node
import fetch from 'node-fetch';

const DEFAULT_ATTEMPTS = Number(process.env.SMOKE_ATTEMPTS||5);
const DEFAULT_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS||20000);
async function fetchWithRetry(url, opts = {}, attempts = DEFAULT_ATTEMPTS, baseDelayMs = 700) {
  let err;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), DEFAULT_TIMEOUT_MS);
      const started = Date.now();
      let res;
      try {
        res = await fetch(url, { ...opts, signal: ctl.signal });
      } finally {
        clearTimeout(t);
      }
      if (!res) throw new Error('no_response');
      return res;
    } catch (e) {
      err = e;
      const delay = baseDelayMs * Math.pow(2, i);
      // Log transient failures for debugging
      try { console.warn(`[smoke-retry] ${url} attempt ${i+1}/${attempts} failed: ${e?.name||e} → retrying in ${delay}ms`); } catch {}
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, i)));
    }
  }
  throw err;
}

async function check(url, expect = 200) {
  const res = await fetchWithRetry(url, { redirect: 'manual' });
  const code = res.status;
  if (![200,201,202,204,301,302,307,308].includes(code)) throw new Error(`Bad status ${code} for ${url}`);
  const html = await res.text();
  const bad = /Application error: a client-side exception has occurred/i.test(html) || (/__NEXT_DATA__/.test(html) && /"err"\s*:\s*\{/.test(html));
  if (bad) throw new Error(`Client error banner on ${url}`);
  return code;
}

async function login(apiBase, email, password) {
  const res = await fetchWithRetry(`${apiBase}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, remember: true }),
    redirect: 'manual',
  });
  if (res.status !== 200) throw new Error(`Login failed ${res.status}`);
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

async function main() {
  const admin = process.env.ADMIN_URL || 'https://admin.jeeey.com';
  const api = process.env.API_URL || 'https://api.jeeey.com';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await check(`${admin}/login`);
  const cookie = await login(api, email, password);
  const headers = cookie ? { Cookie: cookie } : {};

  const pages = ['/', '/orders', '/products', '/users', '/vendors', '/settings'];
  for (const p of pages) {
    const res = await fetchWithRetry(`${admin}${p}`, { headers, redirect: 'manual' });
    const code = res.status;
    if (![200,301,302,307,308].includes(code)) throw new Error(`Bad status ${code} for ${p}`);
    const html = await res.text();
    const bad = /Application error: a client-side exception has occurred/i.test(html) || (/__NEXT_DATA__/.test(html) && /"err"\s*:\s*\{/.test(html));
    if (bad) throw new Error(`Client error banner on ${p}`);
  }
  console.log('[admin-console-prod-smoke] OK');
}

main().catch((e)=>{ console.error('[admin-console-prod-smoke] Failed', e); process.exit(1); });

