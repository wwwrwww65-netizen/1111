import { strict as assert } from 'assert'
import fetch from 'node-fetch'

const API_BASE = process.env.API_BASE || 'http://localhost:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function login(){
  const r = await fetch(`${API_BASE}/api/admin/auth/login`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember:true }) })
  const j = await r.json();
  assert.ok(r.ok, `login failed: ${j.error||j.message}`)
  assert.ok(j.token, 'missing token')
  return j.token
}

async function run(){
  const token = await login()
  const H = { 'content-type':'application/json', 'Authorization': `Bearer ${token}` }

  // Create currency
  const c = await fetch(`${API_BASE}/api/admin/currencies`, { method:'POST', headers: H, body: JSON.stringify({ code:'TST', name:'Test', symbol:'T', precision:2, rateToBase:3.5, isActive:true }) })
  const cj = await c.json(); assert.ok(c.ok, `currency create failed: ${cj.error||cj.message}`); const cid = cj.currency.id

  // Create zone
  const z = await fetch(`${API_BASE}/api/admin/shipping/zones`, { method:'POST', headers:H, body: JSON.stringify({ name:'Zone Smoke', countryCodes:'SA,AE', regions:'الرياض, جدة', isActive:true }) })
  const zj = await z.json(); assert.ok(z.ok, `zone create failed: ${zj.error||zj.message}`); const zid = zj.zone.id

  // Create rate
  const r = await fetch(`${API_BASE}/api/admin/shipping/rates`, { method:'POST', headers:H, body: JSON.stringify({ zoneId: zid, baseFee: 10, perKgFee: 2, etaMinHours: 24, etaMaxHours: 72, isActive:true }) })
  const rj = await r.json(); assert.ok(r.ok, `rate create failed: ${rj.error||rj.message}`)

  // Analytics
  const a = await fetch(`${API_BASE}/api/admin/analytics`);
  const aj = await a.json();
  assert.ok((a.ok || a.status===200) && (aj.ok !== false), `analytics failed: ${aj.error||a.status}`)

  // Socket not tested here (needs browser); rely on monitoring page smoke
  console.log('admin-extras smoke OK')
}

run().catch((e)=>{ console.error(e); process.exit(1) })

