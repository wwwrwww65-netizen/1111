/* eslint-disable */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

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

  // 1) Login
  await page.goto(`${adminBase}/login`, { waitUntil: 'networkidle2' });
  // Type email in first text input
  const inputs = await page.$$('input');
  if (inputs.length === 0) throw new Error('No inputs found on login page');
  await inputs[0].type(email, { delay: 10 });
  // Type password
  const pw = await page.$('input[type="password"]');
  if (!pw) throw new Error('Password input not found');
  await pw.type(password, { delay: 10 });
  // Submit
  const submit = await page.$('button[type="submit"]');
  if (!submit) throw new Error('Submit button not found');
  await submit.click();
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  } catch {}

  // 2) Screenshot dashboard (full) and sidebar
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

