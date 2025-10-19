import { test, expect } from '@playwright/test';

const baseURL = process.env.MWEB_ORIGIN || 'http://localhost:3002';
const productId = process.env.AYMILI_PRODUCT_ID || '';

test('PDP displays colors and size groups', async ({ page }) => {
  expect(productId).not.toBe('');
  await page.goto(`${baseURL}/p?id=${encodeURIComponent(productId)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  // color swatches
  await expect(page.getByTestId('color-swatch').first()).toBeVisible({ timeout: 20000 });
  // size buttons (alpha)
  await expect(page.getByRole('button', { name: 'M' }).first()).toBeVisible({ timeout: 20000 });
  // size buttons (numeric) - accept any 2-3 digit button (Latin or Arabic-Indic)
  const buttons = await page.getByRole('button').all();
  let foundNumeric = false;
  for (const b of buttons) {
    const txt = (await b.textContent() || '').trim();
    const norm = txt.replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660));
    if (/^\d{2,3}$/.test(norm)) { foundNumeric = true; break; }
  }
  expect(foundNumeric).toBeTruthy();
});
