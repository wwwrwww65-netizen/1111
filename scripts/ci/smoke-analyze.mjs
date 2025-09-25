// Quick smoke test for /api/admin/products/analyze
import assert from 'node:assert/strict'
import fetch from 'node-fetch'

const API = process.env.API_BASE || 'http://localhost:4000'
const text = `🤩جديديناءغيرر🔥🔥🔥\n\nدلع واناقة💃🏼\n\nفنائل  نسائي يتميز ب:\n\nتشكيله جديده 🥰\n     زرارات انيقه \n✨قماش صوف  🤤\n      كم كامل\n✨2الوان   \n\n✨خارجي \n\n✨المقاسات. \nمن وزن40 حتى وزن 60\n\n💱السعرللشمال 850/فقط🤑🤑\n💱السعر عمله جنوبي3000 /فقط🤑🤑\n\nمتوووفر بكمية كبيرة`;

// Login to get token (JSON login)
const loginRes = await fetch(`${API}/api/admin/auth/login`, {
  method: 'POST', headers: { 'content-type':'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123', remember: true })
})
if (!loginRes.ok) throw new Error(`login_failed: ${loginRes.status}`)
const loginJson = await loginRes.json().catch(()=> ({}))
const token = loginJson?.token || ''
const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

const r = await fetch(`${API}/api/admin/products/analyze`, {
  method: 'POST', headers: { 'content-type':'application/json', ...authHeader }, body: JSON.stringify({ text })
})
if (!r.ok) throw new Error(`analyze_failed: ${r.status}`)
const j = await r.json()
const a = j?.analyzed || {}

assert.ok(a?.name?.value, 'name missing')
assert.ok(/فنيلة|فنيله|فنائل/.test(String(a.name.value)), 'name should contain فنيلة')
assert.ok(String(a.name.value).length <= 60, 'name length should be <= 60')
assert.ok(a?.description?.value, 'description missing')
assert.ok(/40\s*[–-]?\s*60|40\s*إلى\s*60/.test(a.description.value) || (a?.sizes?.value||[]).some(s=> /فري\s*سايز\s*\(40[–-]60\s*كجم\)/.test(s)), 'sizes info missing')
assert.ok(
  a?.price_range?.value?.low !== undefined && Number.isFinite(Number(a.price_range.value.low)),
  'price low missing'
)

console.log('analyze smoke OK:', {
  name: a.name.value,
  low: a.price_range.value.low,
  colors: (a.colors?.value||[]).slice(0,3)
})
