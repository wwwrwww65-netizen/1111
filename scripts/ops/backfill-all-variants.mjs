#!/usr/bin/env node
/* Backfill: ensure full variants matrix exists for products */
(async () => {
  const API = process.env.API_BASE || 'https://api.jeeey.com';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const oneId = process.env.PRODUCT_ID || '';
  const throttleMs = parseInt(process.env.THROTTLE_MS || '150', 10);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s || '').trim();
  const normDigits = (s) => String(s || '').replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const looksNumeric = (s) => /^\d{1,3}$/.test(normDigits(norm(s)));

  const headers = { 'content-type': 'application/json' };
  const login = await fetch(`${API}/api/admin/auth/login`, { method: 'POST', headers, body: JSON.stringify({ email, password, remember: true }) });
  if (!login.ok) throw new Error('login_failed:' + login.status);
  const cookie = (login.headers.getSetCookie?.() || login.headers.raw?.()['set-cookie'] || []).map((s) => String(s).split(';')[0]).join('; ');
  if (!cookie) throw new Error('missing_cookie');

  async function getAdminProduct(id) {
    const r = await fetch(`${API}/api/admin/products/${encodeURIComponent(id)}`, { headers: { cookie } });
    if (!r.ok) throw new Error('admin_product_failed:' + r.status);
    const j = await r.json();
    return (j && (j.product || j)) || {};
  }
  async function getShopProduct(id) {
    const r = await fetch(`${API}/api/product/${encodeURIComponent(id)}`, { headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) return {};
    return await r.json();
  }
  function parseVariantMeta(v) {
    let size = norm(v.size);
    let color = norm(v.color);
    const value = norm(v.value);
    const name = norm(v.name);
    const tryJson = (raw) => {
      try {
        if (!raw || !(raw.startsWith('{') || raw.startsWith('['))) return;
        const j = JSON.parse(raw);
        if (!Array.isArray(j)) {
          if (!size) size = norm(j.size);
          if (!color) color = norm(j.color);
        }
      } catch {}
    };
    tryJson(value); tryJson(name);
    const bags = [v.option_values, v.optionValues, v.options, v.attributes];
    for (const arr of bags) {
      if (!Array.isArray(arr)) continue;
      for (const it of arr) {
        const nk = norm(it?.name || it?.key);
        const nv = norm(it?.value || it?.val || it?.label);
        if (/size|مقاس/i.test(nk)) size = size || nv;
        else if (/color|لون/i.test(nk)) color = color || nv;
      }
    }
    return { size, color };
  }

  async function backfillOne(id) {
    const admin = await getAdminProduct(id);
    const existing = Array.isArray(admin.variants) ? admin.variants : [];
    const letters = new Set();
    const numbers = new Set();
    const colors = new Set();
    for (const v of existing) {
      const meta = parseVariantMeta(v);
      if (meta.color) colors.add(meta.color);
      if (meta.size) {
        if (meta.size.includes('|')) {
          for (const part of meta.size.split('|')) {
            const [k, val] = part.split(':', 2);
            const pr = norm(val || k || '');
            if (/بالأرقام/.test(k || '') || looksNumeric(pr)) numbers.add(pr);
            else letters.add(pr);
          }
        } else {
          if (looksNumeric(meta.size)) numbers.add(meta.size); else letters.add(meta.size);
        }
      }
    }
    // Fallback to shop attributes/colors
    if ((!letters.size || !numbers.size || !colors.size)) {
      const shop = await getShopProduct(id);
      const attrs = Array.isArray(shop?.attributes) ? shop.attributes : [];
      for (const a of attrs) {
        if (a.key === 'size') {
          const label = norm(a.label);
          if (/بالأرقام/.test(label)) a.values.forEach((x) => numbers.add(norm(x)));
          else if (/بالأحرف/.test(label)) a.values.forEach((x) => letters.add(norm(x)));
        } else if (a.key === 'color') {
          a.values.forEach((x) => colors.add(norm(x)));
        }
      }
      if (Array.isArray(shop?.colors)) shop.colors.forEach((x) => colors.add(norm(x)));
    }
    const lettersArr = Array.from(letters);
    const numbersArr = Array.from(numbers);
    const colorsArr = Array.from(colors);
    const createList = [];
    // Determine target grid
    if (colorsArr.length && lettersArr.length && numbersArr.length) {
      const existingKeys = new Set();
      for (const v of existing) {
        const { size, color } = parseVariantMeta(v);
        let L = '', N = '';
        if (size && size.includes('|')) {
          for (const part of size.split('|')) { const [k, val] = part.split(':', 2); const pr = norm(val || ''); if (/بالأرقام/.test(k || '') || looksNumeric(pr)) N = pr; else L = pr; }
        } else if (size) {
          if (looksNumeric(size)) N = norm(size); else L = norm(size);
        }
        if (color && L && N) existingKeys.add(`${norm(color)}|${norm(L)}|${norm(N)}`);
      }
      for (const c of colorsArr) for (const L of lettersArr) for (const N of numbersArr) {
        const key = `${norm(c)}|${norm(L)}|${norm(N)}`;
        if (existingKeys.has(key)) continue;
        createList.push({ size: `مقاسات بالأحرف:${L}|مقاسات بالأرقام:${N}`, color: c, stock: 0 });
      }
    }
    if (!createList.length) return { id, added: 0, total: existing.length };
    // Bulk upsert
    const up = await fetch(`${API}/api/admin/products/${encodeURIComponent(id)}/variants`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ variants: createList }) });
    if (!up.ok) throw new Error('upsert_failed:' + up.status);
    await sleep(throttleMs);
    const admin2 = await getAdminProduct(id);
    const total = Array.isArray(admin2.variants) ? admin2.variants.length : 0;
    return { id, added: createList.length, total };
  }

  const results = [];
  if (oneId) {
    results.push(await backfillOne(oneId));
  } else {
    // Iterate over product pages
    let page = 1; const limit = 100; let done = false;
    while (!done) {
      const r = await fetch(`${API}/api/admin/products?page=${page}&limit=${limit}`, { headers: { cookie } });
      if (!r.ok) throw new Error('list_failed:' + r.status);
      const j = await r.json();
      const items = Array.isArray(j?.products) ? j.products : [];
      if (!items.length) break;
      for (const it of items) {
        try { results.push(await backfillOne(it.id)); } catch (e) { console.error('backfill_err', it.id, e?.message || e); }
      }
      const totalPages = j?.pagination?.totalPages || page + 1;
      page += 1; if (page > totalPages) done = true;
    }
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
})();
