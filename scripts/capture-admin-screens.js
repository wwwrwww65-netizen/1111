/* eslint-disable */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { setTimeout: sleep } = require('node:timers/promises');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function run() {
  const baseOut = '/tmp/admin-snap/screenshots';
  await ensureDir(baseOut);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const adminBase = 'https://admin.jeeey.com';
  const email = 'admin@example.com';
  const password = 'admin123';

  // 1) Programmatic login: call API and set auth_token cookie explicitly
  async function apiLogin() {
    const res = await fetch('https://api.jeeey.com/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'origin': adminBase },
      body: JSON.stringify({ email, password, remember: true }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Login failed: ${res.status} ${txt}`);
    }
    let setCookies = [];
    if (typeof res.headers.getSetCookie === 'function') {
      setCookies = res.headers.getSetCookie();
    } else {
      const v = res.headers.get('set-cookie');
      if (v) setCookies = Array.isArray(v) ? v : [v];
    }
    const cookieStr = setCookies.find((c) => c && c.startsWith('auth_token='));
    if (!cookieStr) throw new Error('auth_token cookie not found in Set-Cookie');
    const m = cookieStr.match(/^auth_token=([^;]+)/);
    if (!m) throw new Error('Cannot parse auth_token value');
    const token = m[1];
    await page.setCookie({
      name: 'auth_token',
      value: token,
      domain: '.jeeey.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });
  }
  async function uiLogin() {
    await page.goto(`${adminBase}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form button[type="submit"]', { timeout: 15000 });
    const inputs = await page.$$('input');
    if (inputs.length === 0) throw new Error('No inputs found on login page');
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(email, { delay: 10 });
    const pw = await page.$('input[type="password"]');
    if (!pw) throw new Error('Password input not found');
    await pw.click({ clickCount: 3 });
    await pw.type(password, { delay: 10 });
    const submit = await page.$('button[type="submit"]');
    await submit.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  }

  // Try cookie login first; if still on login, fallback to UI login
  try { await apiLogin(); } catch {}
  await page.goto(`${adminBase}/`, { waitUntil: 'networkidle2' });
  if (page.url().includes('/login')) {
    await uiLogin();
  }

  // 2) Screenshot dashboard (full) and sidebar
  await page.goto(`${adminBase}/`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(baseOut, 'dashboard-full.png'), fullPage: true });
  const sidebar = await page.$('.sidebar');
  if (sidebar) {
    await sidebar.screenshot({ path: path.join(baseOut, 'sidebar.png') });
  }

  // 3) Finance revenues
  await page.goto(`${adminBase}/finance/revenues`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(baseOut, 'finance-revenues.png'), fullPage: true });

  // 4) Notifications
  await page.goto(`${adminBase}/notifications`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(baseOut, 'notifications.png'), fullPage: true });

  // 5) Loyalty points
  await page.goto(`${adminBase}/loyalty/points`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(baseOut, 'loyalty-points.png'), fullPage: true });

  await browser.close();
  console.log(`[screenshots] saved to ${baseOut}`);
}

run().catch((err) => {
  console.error('[screenshots] error:', err && err.stack || err);
  process.exit(1);
});

