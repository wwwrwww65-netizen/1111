import { test, expect, request } from '@playwright/test'

const API_BASE = process.env.API_BASE || 'http://localhost:4000'

test('admin publish flow produces visible tab in mweb', async ({ page, request: ctx }) => {
	// Create a fresh isolated request with cookie-based admin auth
	const api = await request.newContext({ baseURL: API_BASE, extraHTTPHeaders: { Cookie: 'auth_token=dev' } })

	const slug = 'e2e-pw-tab'
	// 1) Create Tab Page
	const createRes = await api.post('/api/admin/tabs/pages', {
		data: { slug, label: 'E2E Tab', device: 'MOBILE' }
	})
	expect(createRes.ok()).toBeTruthy()
	const { page: created } = await createRes.json() as any
	expect(created?.id).toBeTruthy()

	// 2) Create Version
	const content = { sections: [ { type:'promoTiles', config: { tiles:[ { image:'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60', title:'E2E Tile' } ] } } ] }
	const vRes = await api.post(`/api/admin/tabs/pages/${created.id}/versions`, { data: { title:'v1', notes:'e2e', content } })
	expect(vRes.ok()).toBeTruthy()
	const v = await vRes.json() as any
	expect(v?.version?.version || v?.version).toBeTruthy()

	// 3) Publish
	const pubRes = await api.post(`/api/admin/tabs/pages/${created.id}/publish`, { data: { version: 1 } })
	expect(pubRes.ok()).toBeTruthy()

	// 4) Visit mweb runtime page and assert content
	await page.goto(`/tabs/${slug}`)
	await expect(page.getByText('E2E Tile')).toBeVisible()
})


