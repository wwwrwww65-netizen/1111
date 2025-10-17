import { test, expect } from '@playwright/test'

test('home/categories/product basic render', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/m\.jeeey\.com/i)
  await page.goto('/categories')
  await expect(page.getByText('مختارات من أجلك')).toBeVisible()
  await page.goto('/p?id=test')
  await expect(page.getByRole('heading', { name: /منتج/i })).toBeTruthy()
  // Variants basic: swatches and sizes should exist
  await expect(page.locator('[data-testid="color-swatch"]').first()).toBeVisible()
  await expect(page.locator('[data-testid="size-btn"]').first()).toBeVisible()
})

