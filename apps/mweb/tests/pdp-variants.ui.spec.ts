import { test, expect } from '@playwright/test';

const baseURL = process.env.MWEB_ORIGIN || 'http://localhost:3002';
const API_BASE = process.env.API_BASE || 'http://localhost:4000';
let productId = process.env.AYMILI_PRODUCT_ID || '';

async function fetchJson<T>(page: any, url: string): Promise<T> {
  const r = await page.request.get(url, { failOnStatusCode: false });
  if (!r.ok()) throw new Error(`fetch_failed:${r.status()}`);
  return (await r.json()) as T;
}

test('PDP displays colors and size groups', async ({ page }) => {
  if (!productId) {
    // create a product via API if not provided
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const login = await page.request.post(`${API_BASE}/api/admin/auth/login`, { data: { email: adminEmail, password: adminPassword, remember: true } });
    if (!login.ok()) throw new Error('admin_login_failed');
    const created = await page.request.post(`${API_BASE}/api/admin/products`, { data: { name: 'PDP-UI Test', description: 'auto', price: 100, stockQuantity: 1, isActive: true } });
    const j = await created.json();
    productId = j?.product?.id || '';
    if (!productId) throw new Error('product_create_failed');
    // add minimal variants
    await page.request.post(`${API_BASE}/api/admin/products/${productId}/variants`, { data: { variants: [
      { name: 'المقاس بالأحرف: M • اللون: دم الغزال', value: 'المقاس بالأحرف: M • اللون: دم الغزال', stockQuantity: 1, price: 100, size: 'المقاس بالأحرف:M', color: 'دم الغزال', option_values: [{name:'size',value:'المقاس بالأحرف:M'},{name:'color',value:'دم الغزال'}] },
      { name: 'المقاس بالأرقام: 98 • اللون: دم الغزال', value: 'المقاس بالأرقام: 98 • اللون: دم الغزال', stockQuantity: 1, price: 100, size: 'المقاس بالأرقام:98', color: 'دم الغزال', option_values: [{name:'size',value:'المقاس بالأرقام:98'},{name:'color',value:'دم الغزال'}] },
    ] } });
  }
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
