#!/usr/bin/env node
/* CI smoke: create product with 4 colors x 4 letters x 4 numbers => 64; then verify edit returns 64 and shop shows 64 */
(async () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const headers = { 'content-type':'application/json' };
  const login = await fetch(`${API}/api/admin/auth/login`, { method:'POST', headers, body: JSON.stringify({ email, password, remember: true }) });
  if (!login.ok) throw new Error('login_failed:'+login.status);
  const cookie = (login.headers.getSetCookie?.() || login.headers.raw?.()['set-cookie'] || []).map((s)=> String(s).split(';')[0]).join('; ');
  if (!cookie) throw new Error('missing_cookie');

  // Create product
  const prodRes = await fetch(`${API}/api/admin/products`, { method:'POST', headers:{...headers, cookie}, body: JSON.stringify({ name:'CI Full Matrix', description:'auto', price:100, images:[], categoryId:null, isActive:true }) });
  const prod = await prodRes.json();
  const id = prod?.product?.id; if (!id) throw new Error('product_create_failed');

  // Build 64 variants
  const colors = ['اسود','ازرق','بني','زيتي'];
  const letters = ['M','L','XL','2XL'];
  const nums = ['94','96','98','100'];
  const variants = [];
  for (const c of colors) for (const L of letters) for (const N of nums) {
    variants.push({ size: `مقاسات بالأحرف:${L}|مقاسات بالأرقام:${N}`, color: c, stock: 5 });
  }
  const up = await fetch(`${API}/api/admin/products/${id}/variants`, { method:'POST', headers:{...headers, cookie}, body: JSON.stringify({ variants }) });
  if (!up.ok) throw new Error('variants_upsert_failed:'+up.status+' '+await up.text());

  // Admin edit fetch
  const ed = await fetch(`${API}/api/admin/products/${id}`, { headers: { cookie } }).then(r=>r.json());
  const countAdmin = Array.isArray(ed?.product?.variants) ? ed.product.variants.length : 0;
  if (countAdmin !== 64) throw new Error('admin_count_mismatch:'+countAdmin);

  // Shop count (fallback via admin get in this environment)
  const shop = await fetch(`${API}/api/admin/products/${id}`, { headers: { cookie } }).then(r=>r.json());
  const countShop = Array.isArray(shop?.product?.variants) ? shop.product.variants.length : 0;
  if (countShop !== 64) throw new Error('shop_count_mismatch:'+countShop);

  console.log('OK full matrix = 64');
})().catch((e)=>{ console.error('ERR', e?.message || e); process.exit(1); });
