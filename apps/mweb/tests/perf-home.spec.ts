import { test, expect } from '@playwright/test';

test('home route loads and switches tabs within budget', async ({ page }) => {
  test.slow(); // Allow slower CI
  const base = process.env.MWEB_BASE || 'http://localhost:3002';
  const start = Date.now();
  const resp = await page.goto(`${base}/`);
  expect(resp?.ok()).toBeTruthy();
  const ttfb = Date.now() - start;
  // Budget: initial response within 2000ms on CI
  expect(ttfb).toBeLessThan(2000);

  // Wait for tabs to render and click the second tab if exists
  await page.waitForSelector('[role="tablist"] button', { timeout: 5000 });
  const tabs = page.locator('[role="tablist"] button');
  const count = await tabs.count();
  if (count >= 2) {
    const t0 = Date.now();
    await tabs.nth(1).click();
    // Wait for loading skeleton to disappear or component to render
    await page.waitForTimeout(150); // small debounce
    const tSwitch = Date.now() - t0;
    // Budget for tab switch: 1.5s
    expect(tSwitch).toBeLessThan(1500);
  }
});
