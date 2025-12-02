import { test, expect } from '@playwright/test'

// E2E: Preview flow renders content via payload and tracks impression
test('tabs preview renders via payload and tracks', async ({ page }) => {
	const sample = {
		sections: [
			{ type: 'hero', config: { slides: [ { image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600&q=60' } ] } },
			{ type: 'promoTiles', config: { tiles: [ { image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60', title: 'عرض' } ] } },
		]
	}
	const url = `/__preview/tabs?device=MOBILE&slug=e2e&payload=${encodeURIComponent(JSON.stringify(sample))}`
	await page.goto(url)
	await expect(page.getByText('Tabs Preview')).toBeVisible()
	await expect(page.locator('img')).toHaveCount(2)
})


