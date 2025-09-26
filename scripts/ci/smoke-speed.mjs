import fetch from 'node-fetch'

const API_BASE = process.env.API_BASE || 'http://localhost:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function login(){
  const r = await fetch(`${API_BASE}/api/admin/auth/login`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember:true }) })
  const j = await r.json()
  if (!r.ok || !j.token) throw new Error(`login_failed: ${j.error||r.status}`)
  return j.token
}

function hrNow(){ const t = process.hrtime(); return t[0]*1000 + t[1]/1e6; }

async function assertUnder(label, fn, maxMs){
  const t0 = hrNow();
  const res = await fn();
  const dt = hrNow() - t0;
  console.log(`${label}: ${dt.toFixed(1)}ms`)
  if (dt > maxMs) throw new Error(`${label}_too_slow: ${dt.toFixed(0)}ms > ${maxMs}ms`)
  return res
}

async function run(){
  const token = await login()
  const H = { 'content-type':'application/json', 'Authorization': `Bearer ${token}` }
  const GET = (u)=> fetch(u, { headers:H })
  const POST = (u,b)=> fetch(u, { method:'POST', headers:H, body: JSON.stringify(b||{}) })
  const DEL = (u)=> fetch(u, { method:'DELETE', headers:H })

  // 1) Products list (suggest=1) should be fast
  await assertUnder('products_list_suggest', async()=>{
    const r = await GET(`${API_BASE}/api/admin/products?suggest=1&limit=12`); if (!r.ok) throw new Error('products_list_failed'); await r.json();
  }, Number(process.env.SPEED_MAX_MS_PRODUCTS||1500))

  // 2) Product create+delete should be fast
  const pid = await assertUnder('product_create', async()=>{
    const r = await POST(`${API_BASE}/api/admin/products`, { name:'SpeedTest', description:'-', price:1, images:[], stockQuantity:0 })
    const j = await r.json(); if (!r.ok) throw new Error(`product_create_failed: ${j.error||r.status}`); return j.product.id
  }, Number(process.env.SPEED_MAX_MS_CREATE||2500))
  await assertUnder('product_delete', async()=>{
    const r = await DEL(`${API_BASE}/api/admin/products/${pid}`)
    if (!r.ok) throw new Error(`product_delete_failed: ${r.status}`)
  }, Number(process.env.SPEED_MAX_MS_DELETE||2500))

  // 3) Category create+delete should be fast and succeed
  const cid = await assertUnder('category_create', async()=>{
    const r = await POST(`${API_BASE}/api/admin/categories`, { name:'CatSpeed', slug:`cat-${Date.now()}` })
    const j = await r.json(); if (!r.ok) throw new Error(`category_create_failed: ${j.error||r.status}`); return j.category?.id || j.id || j.categoryId || j?.category?.id
  }, Number(process.env.SPEED_MAX_MS_CREATE||2500))
  await assertUnder('category_delete', async()=>{
    const r = await DEL(`${API_BASE}/api/admin/categories/${cid}`)
    const j = await r.json().catch(()=>({}));
    if (!r.ok || j?.ok===false) throw new Error(`category_delete_failed: ${j?.code||r.status}`)
  }, Number(process.env.SPEED_MAX_MS_DELETE||2500))

  console.log('speed smoke OK')
}

run().catch((e)=>{ console.error(e); process.exit(1) })

