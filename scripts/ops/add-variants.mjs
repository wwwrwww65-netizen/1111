#!/usr/bin/env node
/*
  One-off: create variants matrix for a product via Admin API
  Usage:
    PRODUCT_ID=cm... COLORS="وردي,دم الغزال,بنفسجي,اسود" node scripts/ops/add-variants.mjs
*/
(async () => {
  const API = process.env.API_BASE || 'https://api.jeeey.com';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const productId = process.env.PRODUCT_ID || 'cmgyffwdk001sevqbcjt5mar8';
  const colors = (process.env.COLORS || 'وردي,دم الغزال,بنفسجي,اسود').split(',').map(s=>s.trim()).filter(Boolean);
  const sizeNums = (process.env.SIZE_NUMS || '96,94,100,98').split(',').map(s=>s.trim()).filter(Boolean);
  const sizeLetters = (process.env.SIZE_LETTERS || 'XL,2XL,3XL,4XL').split(',').map(s=>s.trim()).filter(Boolean);

  function pickCookie(setCookie) {
    if (!Array.isArray(setCookie)) return '';
    return setCookie.map((s) => String(s).split(';')[0]).join('; ');
  }

  function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

  const headers = { 'content-type': 'application/json' };
  const login = await fetch(`${API}/api/admin/auth/login`, { method:'POST', headers, body: JSON.stringify({ email, password, remember: true }) });
  if (!login.ok) {
    const t = await login.text().catch(()=> '');
    throw new Error(`admin_login_failed:${login.status} ${t.slice(0,200)}`);
  }
  const cookie = pickCookie(login.headers.getSetCookie?.() || login.headers.raw?.()['set-cookie'] || []);
  if (!cookie) throw new Error('missing_cookie');

  // Fetch product to base price
  const pj = await fetch(`${API}/api/product/${encodeURIComponent(productId)}`, { headers: { 'cache-control': 'no-cache' } }).then(r=>r.json()).catch(()=>null);
  const basePrice = pj && typeof pj.price === 'number' ? pj.price : undefined;

  const variants = [];
  for (const c of colors) for (const ln of sizeLetters) for (const nn of sizeNums) {
    const name = `مقاسات بالأحرف: ${ln} • مقاسات بالأرقام: ${nn} • اللون: ${c}`;
    variants.push({
      name,
      value: name,
      price: basePrice,
      stockQuantity: 10,
      size: `مقاسات بالأحرف:${ln}|مقاسات بالأرقام:${nn}`,
      color: c,
      option_values: [
        { name: 'size', value: `مقاسات بالأحرف:${ln}` },
        { name: 'size', value: `مقاسات بالأرقام:${nn}` },
        { name: 'color', value: c },
      ],
    });
  }

  // Upsert in chunks to avoid payload too large
  const chunkSize = 64; // single shot is fine for 64, but keep generic
  for (let i=0;i<variants.length;i+=chunkSize) {
    const chunk = variants.slice(i, i+chunkSize);
    const res = await fetch(`${API}/api/admin/products/${encodeURIComponent(productId)}/variants`, {
      method:'POST',
      headers: { 'content-type':'application/json', 'cookie': cookie },
      body: JSON.stringify({ variants: chunk }),
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`variants_upsert_failed:${res.status} ${txt.slice(0,200)}`);
    await sleep(200);
  }

  // Verify
  const p2 = await fetch(`${API}/api/product/${encodeURIComponent(productId)}`, { headers: { 'cache-control': 'no-cache' } }).then(r=>r.json());
  const v2 = await fetch(`${API}/api/product/${encodeURIComponent(productId)}/variants`, { headers: { 'cache-control': 'no-cache' } }).then(r=>r.json());
  const groups = (p2.attributes||[]).filter(a=> a.key==='size').map(g=> ({ label:g.label, values:g.values }));
  console.log('ATTR_GROUPS', JSON.stringify(groups));
  console.log('COLORS', JSON.stringify(p2.colors));
  console.log('VARIANTS_LEN', Array.isArray(v2.items)? v2.items.length : 0);
})().catch((e)=>{ console.error('ERR', e?.message || e); process.exit(1); });
