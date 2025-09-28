/* eslint-disable no-console */
const API = process.env.API_BASE || 'http://localhost:4000';
let cookie = '';

async function call(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
      ...(cookie ? { cookie } : {}),
    },
    credentials: 'include',
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const m = setCookie.match(/auth_token=[^;]+/);
    if (m) cookie = m[0];
  }
  return res;
}

async function ensureColumns() {
  // Public health endpoint ensures Category columns idempotently
  await call('/api/admin/categories/health');
}

async function login() {
  const res = await call('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123', remember: true }),
  });
  if (!res.ok) throw new Error(`login_failed_${res.status}`);
}

async function createAndVerifyCategory() {
  const name = `SmokeCat_${Date.now()}`;
  const res = await call('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name, slug: name.toLowerCase(), description: '' }) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`create_failed_${res.status}:${t}`);
  }
  const { category } = await res.json();
  if (!category?.id) throw new Error('no_category_id');
  console.log(`CREATED ${category.id}`);

  const list = await call(`/api/admin/categories?search=${encodeURIComponent(name)}`);
  if (!list.ok) throw new Error(`list_failed_${list.status}`);
  const js = await list.json();
  const found = Array.isArray(js.categories) && js.categories.some((c) => c.id === category.id);
  if (!found) throw new Error('created_not_listed');
  console.log('VERIFIED');
}

async function main() {
  await ensureColumns();
  await login();
  await createAndVerifyCategory();
  console.log('OK');
}

main().catch((e) => { console.error(e); process.exit(1); });

