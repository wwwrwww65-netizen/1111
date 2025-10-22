#!/usr/bin/env node
/* Replace all variants for a product atomically via admin API */
(async () => {
  const API = process.env.API_BASE || 'https://api.jeeey.com';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const productId = process.env.PRODUCT_ID || '';
  if (!productId) throw new Error('PRODUCT_ID required');
  const colors = (process.env.COLORS || 'اسود,ازرق,بني,زيتي').split(',').map(s=>s.trim()).filter(Boolean);
  const letters = (process.env.SIZE_LETTERS || 'M,L,XL,2XL').split(',').map(s=>s.trim()).filter(Boolean);
  const nums = (process.env.SIZE_NUMS || '94,96,98,100').split(',').map(s=>s.trim()).filter(Boolean);

  const headers = { 'content-type': 'application/json' };
  const login = await fetch(`${API}/api/admin/auth/login`, { method:'POST', headers, body: JSON.stringify({ email, password, remember: true }) });
  if (!login.ok) throw new Error('login_failed:'+login.status);
  const cookie = (login.headers.getSetCookie?.() || login.headers.raw?.()['set-cookie'] || []).map((s)=> String(s).split(';')[0]).join('; ');
  if (!cookie) throw new Error('missing_cookie');

  const variants = [];
  for (const c of colors) for (const L of letters) for (const N of nums) {
    variants.push({ size: `مقاسات بالأحرف:${L}|مقاسات بالأرقام:${N}`, color: c, stock: 10 });
  }

  // Fallback to bulk upsert endpoint (does not delete existing)
  const rep = await fetch(`${API}/api/admin/products/${encodeURIComponent(productId)}/variants`, { method:'POST', headers: { 'content-type':'application/json', cookie }, body: JSON.stringify({ variants }) });
  if (!rep.ok) throw new Error('upsert_failed:'+rep.status+' '+await rep.text());

  const admin = await fetch(`${API}/api/admin/products/${encodeURIComponent(productId)}`, { headers: { cookie } }).then(r=>r.json());
  const countAdmin = Array.isArray(admin?.product?.variants) ? admin.product.variants.length : Array.isArray(admin?.variants) ? admin.variants.length : 0;
  console.log('admin.variants.count', countAdmin);
  const shop = await fetch(`${API}/api/product/${encodeURIComponent(productId)}/variants`, { headers: { 'cache-control':'no-cache' } }).then(r=>r.json());
  console.log('shop.variants.count', Array.isArray(shop?.items) ? shop.items.length : 0);
  const attrs = await fetch(`${API}/api/product/${encodeURIComponent(productId)}`, { headers: { 'cache-control':'no-cache' } }).then(r=>r.json());
  console.log('shop.attr.colors', JSON.stringify(attrs.colors));
  console.log('shop.attr.sizeGroups', JSON.stringify((attrs.attributes||[]).filter((a)=>a.key==='size')));
})().catch((e)=>{ console.error('ERR', e?.message || e); process.exit(1); });
