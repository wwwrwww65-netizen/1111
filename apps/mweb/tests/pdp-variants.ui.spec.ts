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
  // size buttons (numeric 98/99)
  const anyNumeric = page.getByRole('button', { name: /^(98|99)$/ });
  await expect(anyNumeric.first()).toBeVisible({ timeout: 20000 });
});
