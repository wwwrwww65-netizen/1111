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
  await apiLogin();
  await sleep(300);

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

