// Force DeepSeek analyze smoke
import fetch from 'node-fetch'

const API = process.env.API_BASE || 'http://localhost:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function main(){
  const loginRes = await fetch(`${API}/api/admin/auth/login`, {
    method: 'POST', headers: { 'content-type':'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true })
  })
  if (!loginRes.ok){ throw new Error(`login_failed_${loginRes.status}`) }
  const loginJson = await loginRes.json().catch(()=> ({}))
  const token = loginJson?.token
  if (!token) throw new Error('no_token')
  const headers = { 'content-type':'application/json', Authorization: `Bearer ${token}` }
  const text = 'طقم نسائي كم كامل صوف السعر للشمال 85 ريال قديم 95، مقاسات L XL.'
  const resp = await fetch(`${API}/api/admin/products/analyze?forceDeepseek=1`, {
    method: 'POST', headers, body: JSON.stringify({ text, images: [] })
  })
  const j = await resp.json().catch(()=> ({}))
  if (!resp.ok){ throw new Error(`analyze_failed_${resp.status}:${JSON.stringify(j)}`) }
  if (!j?.meta?.deepseekAttempted){ throw new Error('deepseek_not_attempted') }
  console.log('DeepSeek forced analyze OK:', j.meta)
}

main().catch((e)=> { console.error(e); process.exit(1); })

