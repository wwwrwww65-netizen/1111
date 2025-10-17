/* eslint-disable no-console */
import assert from 'node:assert/strict'

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

const SAMPLE_TEXT = `*جديد* *فستان نسائي طويل مورد* *جاكت كم طويل حرير تركي* *تشكيله الترند الجديد* *ألوان متعددة* *مقاسات S M L XL* *السعر* *عمله قديم 3500*`;

async function login(){
  const r = await fetch(`${API_BASE}/api/admin/auth/login`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true }) })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `login_failed: ${j.error||j.message||r.status}`)
  const token = j.token
  assert.ok(token, 'missing_token')
  return token
}

async function analyze(token){
  // Prefer rulesStrict to avoid external model dependency
  const r = await fetch(`${API_BASE}/api/admin/products/analyze?rulesStrict=1`, {
    method:'POST', headers:{ 'content-type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text: SAMPLE_TEXT })
  })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `analyze_failed: ${j.error||j.message||r.status}`)
  const a = j.analyzed || {}
  const name = String(a?.name?.value || 'منتج اختبار').slice(0,60)
  const desc = String((a?.description?.value)||'وصف اختبار')
  const sizes = Array.isArray(a?.sizes?.value) && a.sizes.value.length ? a.sizes.value : ['S','M','L']
  const colors = Array.isArray(a?.colors?.value) && a.colors.value.length ? a.colors.value : ['أسود','أبيض']
  return { name, desc, sizes, colors }
}

async function createProduct(token, { name, desc }){
  const r = await fetch(`${API_BASE}/api/admin/products`, { method:'POST', headers:{ 'content-type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, description: desc, price: 99, stockQuantity: 5, isActive: true }) })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `product_create_failed: ${j.error||j.message||r.status}`)
  const id = j?.product?.id
  assert.ok(id, 'product_id_missing')
  return id
}

async function upsertVariants(token, productId, { sizes, colors }){
  const variants = []
  if (sizes.length && colors.length){
    for (const s of sizes) for (const c of colors) variants.push({ name:'متغير', value:`${s} / ${c}`, stockQuantity: 3, size: s, color: c, option_values: [{ name:'size', value: s }, { name:'color', value: c }] })
  } else if (sizes.length) {
    for (const s of sizes) variants.push({ name:'مقاس', value:s, stockQuantity: 3, size: s, option_values: [{ name:'size', value: s }] })
  } else if (colors.length) {
    for (const c of colors) variants.push({ name:'لون', value:c, stockQuantity: 3, color: c, option_values: [{ name:'color', value: c }] })
  }
  if (!variants.length) return false
  const r = await fetch(`${API_BASE}/api/admin/products/${productId}/variants`, { method:'POST', headers:{ 'content-type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ variants }) })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `variants_upsert_failed: ${j.error||j.message||r.status}`)
  return true
}

async function main(){
  const token = await login()
  const parsed = await analyze(token)
  const id = await createProduct(token, parsed)
  await upsertVariants(token, id, parsed).catch((e)=>{ console.warn('warn: variant_upsert_failed', e?.message||String(e)) })
  console.log('PRODUCT_ID', id)
  if (process.env.GITHUB_OUTPUT) {
    try { await Bun.write(process.env.GITHUB_OUTPUT, `MWEB_TEST_PRODUCT_ID=${id}\n`, { append: true }) } catch {}
    try {
      // Fallback append via Node fs if Bun is not present
      const fs = await import('node:fs/promises')
      await fs.appendFile(process.env.GITHUB_OUTPUT, `MWEB_TEST_PRODUCT_ID=${id}\n`).catch(()=>{})
    } catch {}
  }
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })
