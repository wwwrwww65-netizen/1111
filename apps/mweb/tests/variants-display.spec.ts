import { test, expect } from '@playwright/test';

// Basic smoke to ensure PDP renders color and multi size groups as separate button groups
// Assumes dev server serves a product with id 'p1' or replace with a seeded id

test('PDP renders color and size groups as buttons', async ({ page }) => {
  await page.goto('/p?id=p1');
  // Color swatches container
  await expect(page.getByTestId('color-swatch').first()).toBeVisible();
  // Size group buttons
  const sizeButtons = page.getByTestId('size-btn');
  await expect(sizeButtons.first()).toBeVisible();
});
