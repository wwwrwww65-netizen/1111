// Quick smoke test for /api/admin/products/analyze
import assert from 'node:assert/strict'
import fetch from 'node-fetch'

const API = process.env.API_BASE || 'http://localhost:4000'
const text = `*جديد* *طقم طقم نسائي قطعتين احلا ماركه راقي* *يتميز ثلاث قطع منفصله* *فستان نسائي طويل مورد كلوش امبريلا* *جاكت كم طويل حرير تركي مزين بي الامام بكرستال فضي وفتحه من الخلف زرار* *حزام خصر منفصل* *شكل جديد ومميز* *5اللوان تحححفه* *تشكيله الترند الجديد* *قماش الجاكت حرير تركي الأصلي قماش الفستان حرير باربي الأصلي* *مقاسات L_Xl يلبس *من وزن 40الى وزن 70* *السعر* *عمله قديم 3500* *عمله جديد 11000* *الكل يعرض متوفر بكميات*`;

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
assert.ok(/طقم|فستان|جاكيت|جاكت|فنيلة|فنيله|فنائل/.test(String(a.name.value)), 'name should contain a known type')
assert.ok(String(a.name.value).length <= 60, 'name length should be <= 60')
assert.ok(a?.description?.value, 'description missing')
// sizes should be in sizes field, not description
assert.ok(!( /40\s*[–-]?\s*60|40\s*إلى\s*60/.test(a.description.value) ), 'sizes should not be in description')
console.log('price_low debug:', a?.price_range?.value?.low)
assert.ok(
  a?.price_range?.value?.low !== undefined && Number.isFinite(Number(a.price_range.value.low)) && Number(a.price_range.value.low) === 3500,
  'price low should prefer old price 3500'
)

console.log('analyze smoke OK:', {
  name: a.name.value,
  low: a.price_range.value.low,
  colors: (a.colors?.value||[]).slice(0,3)
})
