/* eslint-disable no-console */
import crypto from 'node:crypto';

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

let cookieJar = '';
function extractAuthCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const match = setCookieHeader.match(/(^|,\s*)auth_token=[^;]+/);
  if (!match) return '';
  return match[0].trim().split(',').pop();
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers||{}), ...(cookieJar? { cookie: cookieJar }: {}) },
    credentials: 'include',
  });
  const sc = res.headers.get('set-cookie');
  if (sc) cookieJar = extractAuthCookie(sc) || cookieJar;
  return res;
}

async function loginOrRegister() {
  try {
    const res = await api('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@example.com', password: 'admin123', remember: true }) });
    if (res.ok) { console.log('✔ Admin login'); return; }
  } catch {}
  const email = `e2e_${Date.now()}@example.com`;
  await api('/api/admin/auth/register', { method: 'POST', body: JSON.stringify({ email, password: 'StrongPassw0rd!', name: 'E2E' }) });
  const res2 = await api('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'StrongPassw0rd!', remember: true }) });
  if (!res2.ok) throw new Error('Login failed');
  console.log('✔ User login');
}

async function ensureOrder() {
  // Create a real order so finance payment can succeed (FK constraints)
  // 1) Ensure there is at least one product
  let productId = '';
  try {
    const r = await api('/api/admin/products?limit=1&suggest=1');
    if (r.ok) {
      const j = await r.json();
      productId = j?.products?.[0]?.id || '';
    }
  } catch {}
  if (!productId) {
    const cr = await api('/api/admin/products', { method: 'POST', body: JSON.stringify({ name: 'E2E Product', price: 10, stockQuantity: 100, isActive: true }) });
    if (!cr.ok) throw new Error('product_create_failed');
    const cj = await cr.json();
    productId = cj?.product?.id;
  }
  // 2) Create order with one line
  const em = `e2e+${Date.now()}@example.com`;
  const or = await api('/api/admin/orders', { method: 'POST', body: JSON.stringify({ customer: { name: 'E2E', email: em, phone: '0000000000' }, address: { street: 'CI Street' }, items: [{ productId, quantity: 1, price: 10 }] }) });
  if (!or.ok) throw new Error(`order_create_failed_${or.status}`);
  const oj = await or.json();
  return oj?.order?.id;
}

async function main() {
  console.log('E2E: auth → logistics legs → drivers ping → finance payments → notifications');
  await loginOrRegister();

  const orderId = await ensureOrder();

  // Create logistics legs
  const legTypes = ['PICKUP', 'INBOUND', 'DELIVERY'];
  let lastLegId = '';
  for (const lt of legTypes) {
    const lr = await api('/api/admin/logistics/legs', { method: 'POST', body: JSON.stringify({ orderId, legType: lt, status: 'SCHEDULED' }) });
    if (!lr.ok) throw new Error(`Leg create failed for ${lt}`);
    const { leg } = await lr.json();
    lastLegId = leg.id;
  }
  console.log('✔ Legs created');

  // Ping driver
  const driverId = crypto.randomUUID();
  const dr = await api('/api/admin/drivers/ping', { method: 'POST', body: JSON.stringify({ driverId, name: 'E2E Driver', lat: 24.7, lng: 46.7, status: 'AVAILABLE' }) });
  if (!dr.ok) throw new Error('Driver ping failed');
  console.log('✔ Driver ping');

  // Advance last leg to COMPLETED
  const us = await api(`/api/admin/logistics/legs/${lastLegId}/status`, { method: 'POST', body: JSON.stringify({ status: 'COMPLETED', driverId }) });
  if (!us.ok) throw new Error('Leg status update failed');
  console.log('✔ Leg completed');

  // Finance payment
  const pay = await api('/api/admin/finance/payments', { method: 'POST', body: JSON.stringify({ orderId, amount: 10.0, method: 'CASH' }) });
  if (!pay.ok) throw new Error('Payment failed');
  console.log('✔ Payment recorded');

  // Notifications manual enqueue
  const notif = await api('/api/admin/notifications/manual', { method: 'POST', body: JSON.stringify({ title: 'E2E', body: 'Flow OK', channel: 'EMAIL' }) });
  if (!notif.ok) throw new Error('Notification enqueue failed');
  console.log('✔ Notification logged');

  // Visibility check
  const vis = await api(`/api/admin/orders/visibility/${orderId}`);
  if (!vis.ok) throw new Error('Visibility check failed');
  console.log('✔ Visibility OK');

  console.log('✔ E2E flow OK');
}

main().catch((err) => { console.error(err); process.exit(1); });

