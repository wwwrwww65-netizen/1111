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
  const sizeBtns = page.getByTestId('size-btn');
  await expect(sizeBtns.filter({ hasText: 'M' }).first()).toBeVisible();
  // size buttons (numeric 98/99)
  const num98 = sizeBtns.filter({ hasText: '98' });
  const num99 = sizeBtns.filter({ hasText: '99' });
  const has98 = await num98.first().isVisible().catch(() => false);
  const has99 = await num99.first().isVisible().catch(() => false);
  expect(has98 || has99).toBeTruthy();
});
