#!/usr/bin/env node
/*
  Admin layout checks (RTL + sidebar right + header placement + top alignment)
*/
import { chromium } from 'playwright';

const adminBase = (process.env.ADMIN_BASE || 'https://admin.jeeey.com').replace(/\/$/, '');
const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
const url = `${adminBase}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
page.setDefaultTimeout(20000);
try {
  const res = await page.goto(url + `?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('body', { timeout: 30000 });
  // Try to find header; if missing, try root and login
  let headerFound = await page.$('header.topbar');
  if (!headerFound) {
    await page.goto(adminBase + `/?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
    headerFound = await page.$('header.topbar');
  }
  if (!headerFound) {
    // Attempt Login then retry (form-based first)
    await page.goto(adminBase + `/login?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    try {
      const email = defaultEmail;
      const pass = defaultPass;

      // Prefer accessible label in Arabic
      let emailInput = await page.$('label:has-text("البريد") input');
      if (!emailInput) {
        // Try common selectors and heuristics
        emailInput = await page.$('input[type="email"], input[name="email"], input[autocomplete="username"], input[placeholder*="البريد"], input[placeholder*="email" i]');
      }
      // Fallback to first text input in form
      if (!emailInput) emailInput = await page.$('form input:not([type="password"]):not([type="checkbox"])');

      const passInput = await page.$('input[type="password"], input[name="password"], input[autocomplete="current-password"], input[autocomplete="new-password"]');

      if (emailInput && passInput) {
        await emailInput.fill(email);
        await passInput.fill(pass);
        const submit = await page.$('button[type="submit"], button:has-text("دخول"), button:has-text("Login")');
        if (submit) {
          await Promise.all([
            submit.click(),
            page.waitForLoadState('networkidle', { timeout: 60000 }).catch(()=>{}),
          ]);
        }
      }
    } catch {}
    // Programmatic login fallback (bypass UI flakiness)
    try {
      await page.goto(adminBase + `/login?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const result = await page.evaluate(async (creds) => {
        try {
          const res = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: creds.email, password: creds.pass, remember: true })
          });
          const j = await res.json().catch(() => null);
          if (!res.ok) return { ok: false, status: res.status, err: j?.error || j?.message || 'login_failed' };
          if (j?.token) {
            const res2 = await fetch('/api/auth/set', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ token: j.token, remember: true })
            });
            return { ok: res2.ok, status: res2.status };
          }
          return { ok: false, status: 200, err: 'no_token' };
        } catch (e) {
          return { ok: false, status: 0, err: String(e) };
        }
      }, { email: defaultEmail, pass: defaultPass });
      // go home after programmatic login
      await page.goto(adminBase + `/?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
    } catch {}
    // After login attempt, try root and check header again
    try {
      await page.goto(adminBase + `/?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
    } catch {}
    headerFound = await page.$('header.topbar');
  }
  if (!headerFound) {
    const html = await page.content();
    throw new Error('topbar missing; status=' + (res && res.status()) + ' bodySnippet=' + html.slice(0, 500));
  }
  // If sidebar missing (e.g., on login), go to root
  let hasSidebar = await page.$('aside.sidebar');
  if (!hasSidebar) {
    await page.goto(`${adminBase}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header.topbar');
    hasSidebar = await page.$('aside.sidebar');
  }

  const data = await page.evaluate(() => {
    function rect(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }
    const dir = document.documentElement.getAttribute('dir') || getComputedStyle(document.documentElement).direction;
    const header = rect('header.topbar');
    const shell = rect('.shell');
    const sidebar = rect('aside.sidebar');
    const content = rect('main.content, .content');
    const brand = rect('.topbar .brand');
    const actions = rect('.topbar .top-actions');
    const search = rect('.topbar .search');
    const headerStyle = (()=>{
      const el = document.querySelector('header.topbar');
      if (!el) return {};
      const cs = getComputedStyle(el);
      return { gridTemplateColumns: cs.gridTemplateColumns, direction: cs.direction };
    })();
    const vw = window.innerWidth;
    return { dir, header, shell, sidebar, content, brand, actions, search, vw, headerStyle };
  });

  const errs = [];
  if (!data.header) errs.push('topbar missing (post-eval)');
  if (!data.sidebar) errs.push('sidebar missing');
  if (!data.content) errs.push('content missing');
  if (errs.length) throw new Error(errs.join('; '));

  // Sidebar on the right
  if (!(data.sidebar.left > data.content.left)) errs.push('sidebar is not to the right of content');
  if (!((data.vw - data.sidebar.right) <= 6)) errs.push('sidebar not aligned to right edge');

  // Header placement: brand right, actions left, search center
  // Header child order checks (tolerant; allow grid-based placement in RTL)
  if (data.brand && !(data.brand.left > data.vw * 0.45)) errs.push('brand not at right side');
  if (data.actions && !(data.actions.left < data.vw * 0.35)) errs.push('actions not at left side');
  if (data.search) {
    const center = (data.search.left + data.search.right) / 2;
    const delta = Math.abs(center - data.vw / 2);
    if (delta > 140) errs.push('search not centered');
  }

  // Top alignment: content and sidebar start just under header
  const threshold = 16;
  if (Math.abs(data.sidebar.top - data.header.bottom) > threshold) errs.push('sidebar not aligned under header');
  if (Math.abs(data.content.top - data.header.bottom) > threshold) errs.push('content not aligned under header');

  if (errs.length) throw new Error('Layout check failed: ' + errs.join(' | '));
  console.log('✅ Admin layout checks passed');
} catch (e) {
  console.error(e?.stack || String(e));
  process.exit(1);
} finally {
  await browser.close();
}
