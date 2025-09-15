import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

function nowIso() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function writeFileSafe(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, content);
}

async function savePageArtifacts(page, outDir, name) {
  const html = await page.content();
  await writeFileSafe(path.join(outDir, `${name}.html`), html);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function apiLogin(page, adminBase, apiBase, email, password) {
  const res = await fetch(`${apiBase}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: adminBase },
    body: JSON.stringify({ email, password, remember: true })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Login failed: ${res.status} ${txt}`);
  }
  let cookieHeader = res.headers.get('set-cookie') || '';
  if (!cookieHeader) throw new Error('No Set-Cookie header in login response');
  const m = cookieHeader.match(/auth_token=([^;]+)/);
  if (!m) throw new Error('auth_token cookie not found in Set-Cookie');
  const token = m[1];
  await page.setCookie({
    name: 'auth_token',
    value: token,
    domain: '.jeeey.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });
}

async function uiLogin(page, adminBase, email, password) {
  await page.goto(`${adminBase}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form button[type="submit"]', { timeout: 20000 });
  const emailInput = await page.$('input[type="email"], input[name="email"], input[name="username"], input');
  if (!emailInput) throw new Error('Email input not found');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(email, { delay: 10 });
  const pwInput = await page.$('input[type="password"]');
  if (!pwInput) throw new Error('Password input not found');
  await pwInput.click({ clickCount: 3 });
  await pwInput.type(password, { delay: 10 });
  const submitBtn = await page.$('button[type="submit"], button');
  await submitBtn.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
}

function unique(arr) {
  return Array.from(new Set(arr));
}

async function run() {
  const adminBase = process.env.ADMIN_URL || 'https://admin.jeeey.com';
  const apiBase = process.env.API_URL || 'https://api.jeeey.com';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const stamp = nowIso();
  const outDir = `/tmp/admin-audit/${stamp}`;
  await ensureDir(outDir);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // Global collectors
  let globalConsole = [];
  let globalPageErrors = [];
  let globalFailedReq = [];
  page.on('console', (msg) => { if (msg.type() === 'error') globalConsole.push(msg.text()); });
  page.on('pageerror', (err) => { globalPageErrors.push(String(err)); });
  page.on('requestfailed', (req) => { globalFailedReq.push({ url: req.url(), method: req.method(), error: req.failure()?.errorText || 'unknown' }); });

  // 1) Open login page and save contents
  await page.goto(`${adminBase}/login`, { waitUntil: 'domcontentloaded' });
  await savePageArtifacts(page, outDir, 'login-page');

  // 2) Login (API cookie first, else UI)
  let usedLogin = 'api';
  try {
    await apiLogin(page, adminBase, apiBase, email, password);
    await page.goto(`${adminBase}/`, { waitUntil: 'networkidle2' });
    if (page.url().includes('/login')) {
      usedLogin = 'ui';
      await uiLogin(page, adminBase, email, password);
    }
  } catch {
    usedLogin = 'ui';
    await uiLogin(page, adminBase, email, password);
  }

  // 3) Save dashboard and sidebar
  await page.goto(`${adminBase}/`, { waitUntil: 'networkidle2' });
  await savePageArtifacts(page, outDir, 'dashboard');
  // Try to capture sidebar separately
  try {
    const sidebar = await page.$('.sidebar, aside, nav');
    if (sidebar) await sidebar.screenshot({ path: path.join(outDir, 'sidebar.png') });
  } catch {}

  // 4) Collect links from sidebar and union with a known set
  const extractedLinks = await page.$$eval('a[href^="/"]', (as) => Array.from(new Set(as.map((a) => new URL(a.getAttribute('href'), location.origin).pathname))));
  const known = [
    '/', '/analytics', '/orders', '/products', '/products/new', '/finance/revenues', '/notifications', '/loyalty/points', '/users', '/vendors', '/warehouses', '/settings', '/reviews', '/returns', '/tickets', '/categories', '/inventory', '/media', '/cms', '/backups', '/affiliates/dashboard'
  ];
  const routes = unique([...known, ...extractedLinks]).filter((p) => typeof p === 'string' && p.startsWith('/'));

  // 5) Visit routes, capture HTML/screenshots and errors
  const results = [];
  for (const route of routes) {
    const startErrC = globalConsole.length;
    const startPageErrC = globalPageErrors.length;
    const startReqFailC = globalFailedReq.length;
    let status = 0;
    let ok = false;
    try {
      const resp = await page.goto(`${adminBase}${route}`, { waitUntil: 'domcontentloaded' });
      status = resp ? resp.status() : 0;
      await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
      await savePageArtifacts(page, outDir, `page${route.replace(/\//g, '_') || '_'}`);
      ok = status >= 200 && status < 400;
    } catch (e) {
      ok = false;
    }
    const consoleErrors = globalConsole.slice(startErrC);
    const pageErrors = globalPageErrors.slice(startPageErrC);
    const failedReq = globalFailedReq.slice(startReqFailC);
    results.push({ route, status, ok, consoleErrors, pageErrors, failedRequests: failedReq });
  }

  // 6) Summarize and write report
  const summary = {
    ranAt: new Date().toISOString(),
    adminBase,
    apiBase,
    usedLogin,
    totals: {
      pagesTested: results.length,
      ok: results.filter(r => r.ok).length,
      notOk: results.filter(r => !r.ok).length
    },
    results
  };
  await writeFileSafe(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));
  await writeFileSafe(path.join(outDir, 'report.txt'), renderTextReport(summary));

  await browser.close();
  console.log(`[admin-audit] Completed. Output: ${outDir}`);
  console.log(renderTextReport(summary));
}

function renderTextReport(summary) {
  const lines = [];
  lines.push(`Admin UI audit @ ${summary.ranAt}`);
  lines.push(`Base: ${summary.adminBase} | API: ${summary.apiBase} | login=${summary.usedLogin}`);
  lines.push(`Pages tested: ${summary.totals.pagesTested}, OK: ${summary.totals.ok}, Not OK: ${summary.totals.notOk}`);
  lines.push('--- Details ---');
  for (const r of summary.results) {
    const errCount = (r.consoleErrors?.length || 0) + (r.pageErrors?.length || 0) + (r.failedRequests?.length || 0);
    lines.push(`${r.ok ? 'OK ' : 'ERR'}  ${String(r.status).padEnd(3)}  ${r.route}  (issues: ${errCount})`);
    if (!r.ok || errCount > 0) {
      if (r.consoleErrors?.length) lines.push(`  console: ${r.consoleErrors.slice(0, 3).join(' | ')}`);
      if (r.pageErrors?.length) lines.push(`  pageerr: ${r.pageErrors.slice(0, 3).join(' | ')}`);
      if (r.failedRequests?.length) lines.push(`  failed: ${r.failedRequests.slice(0, 3).map(f => `${f.method} ${f.url} -> ${f.error}`).join(' | ')}`);
    }
  }
  return lines.join('\n');
}

run().catch((err) => {
  console.error('[admin-audit] error:', err && err.stack || err);
  process.exit(1);
});

