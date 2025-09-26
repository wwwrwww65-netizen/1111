const API_LOCAL = 'http://127.0.0.1:4000'
const API_PUBLIC = 'https://api.jeeey.com'

async function json(url, init){
  const r = await fetch(url, init)
  const t = await r.text()
  let j = null
  try { j = t ? JSON.parse(t) : null } catch {}
  return { ok: r.ok, status: r.status, json: j }
}

async function login(){
  const body = { email: process.env.ADMIN_EMAIL || 'admin@example.com', password: process.env.ADMIN_PASSWORD || 'admin123', remember: true }
  let r = await json(`${API_LOCAL}/api/admin/auth/login`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) })
  if (!r.ok || !r.json?.token) {
    r = await json(`${API_PUBLIC}/api/admin/auth/login`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) })
  }
  if (!r.ok || !r.json?.token) throw new Error(`login_failed: ${r.status}`)
  return r.json.token
}

async function run(){
  const token = await login()
  const H = { 'content-type':'application/json', Authorization: `Bearer ${token}` }
  const stamp = Date.now()
  // create 3 categories
  const ids = []
  for (let i=0;i<3;i++){
    let r = await json(`${API_LOCAL}/api/admin/categories`, { method:'POST', headers:H, body: JSON.stringify({ name:`SmokeCat ${stamp}-${i}`, slug:`smoke-${stamp}-${i}` }) })
    if (!r.ok) r = await json(`${API_PUBLIC}/api/admin/categories`, { method:'POST', headers:H, body: JSON.stringify({ name:`SmokeCat ${stamp}-${i}`, slug:`smoke-${stamp}-${i}` }) })
    if (!r.ok) throw new Error(`create_failed_${i}: ${r.status}`)
    const id = r.json?.category?.id || r.json?.id
    if (!id) throw new Error('create_missing_id')
    ids.push(id)
  }
  // bulk delete
  let r = await json(`${API_LOCAL}/api/admin/categories/bulk-delete`, { method:'POST', headers:H, body: JSON.stringify({ ids }) })
  if (!r.ok) r = await json(`${API_PUBLIC}/api/admin/categories/bulk-delete`, { method:'POST', headers:H, body: JSON.stringify({ ids }) })
  if (!r.ok) throw new Error(`bulk_delete_failed: ${r.status}`)
  const del = Number(r.json?.deleted||0)
  if (del < ids.length) throw new Error(`deleted_count_mismatch: got ${del}, want ${ids.length}`)
  // verify gone (by ids)
  let verify = await json(`${API_LOCAL}/api/admin/categories?search=${encodeURIComponent(String(stamp))}`, { headers:H })
  if (!verify.ok) verify = await json(`${API_PUBLIC}/api/admin/categories?search=SmokeCat%20${stamp}`, { headers:H })
  const found = (verify.json?.categories||[]).filter(x=> ids.includes(x.id)).length
  if (found>0) throw new Error(`still_found_after_delete: ${found}`)
  console.log('category delete smoke OK')
}

run().catch((e)=>{ console.error(e); process.exit(1) })

