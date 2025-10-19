/* eslint-disable no-console */
import assert from 'node:assert/strict'

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:4000'
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

const INPUT_TEXT = `🪩 *فستان Aymili*❤️‍🔥\n\n✒ ~اناقة 🎗 راقية~\n\n😎  لأصحاب الذوووق الرفيع VIP💯\n\n💎 نوعيه القماش/ كتان ناعم راقي قمة الروعة 👌\n\n🎗️يتميز باطلاله مملؤه بالكياته والانوثة🔥كما انه يتميز ب (3قطع) 1-جاكت ميدي باكمام طويله وقصه رقبه مرتفعه على خيوط ترتبط على الرقبه ، 2-فستان ميدي بقصه صدر سنتيان بكسرات افقيه متباعده وتربيله في الظهر ، كلوش فخم طبقتين ،3- وحزام منفصل 🤤\n\n🎨 الوان كحلي دم الغزال❤️‍🔥\n \n📊 المقاسات بالاحرف /   S     M    L    XL \n\nمقاسات بالارقام 99,96\n\n💰 السعر / 6500 ريال فقط 👏👏👏💰`

const COLORS = ['دم الغزال','لحمي']
const SIZE_ALPHA = ['M','L','XL','2XL']
const SIZE_NUM = ['98','99']

async function ensureAdmin(){
  try{
    const secret = process.env.MAINTENANCE_SECRET || ''
    if (!secret) return
    const r = await fetch(`${API_BASE}/api/admin/maintenance/create-admin`, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'x-maintenance-secret': secret },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'CI Admin' })
    })
    // ignore non-200 (may already exist)
    await r.text().catch(()=>{})
  }catch{}
}

async function login(){
  const r = await fetch(`${API_BASE}/api/admin/auth/login`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true }) })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `login_failed: ${j.error||j.message||r.status}`)
  const token = j.token
  assert.ok(token, 'missing_token')
  return token
}

async function createProduct(token){
  const payload = {
    name: 'فستان Aymili',
    description: INPUT_TEXT,
    price: 6500,
    stockQuantity: 10,
    isActive: true
  }
  const r = await fetch(`${API_BASE}/api/admin/products`, { method:'POST', headers:{ 'content-type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `product_create_failed: ${j.error||j.message||r.status}`)
  const id = j?.product?.id
  assert.ok(id, 'product_id_missing')
  // Immediately insert variants to avoid empty items later
  try { await upsertVariants(token, id) } catch {}
  return id
}

async function upsertVariants(token, productId){
  // Build cross-product of 2 size groups + colors
  const variants = []
  for (const c of COLORS){
    for (const sa of SIZE_ALPHA){
      for (const sn of SIZE_NUM){
        variants.push({
          name: `المقاس بالأحرف: ${sa} • المقاس بالأرقام: ${sn} • اللون: ${c}`,
          value: `المقاس بالأحرف: ${sa} • المقاس بالأرقام: ${sn} • اللون: ${c}`,
          stockQuantity: 2,
          price: 6500,
          size: `المقاس بالأحرف:${sa}|المقاس بالأرقام:${sn}`,
          color: c,
          option_values: [
            { name:'size', value:`المقاس بالأحرف:${sa}` },
            { name:'size', value:`المقاس بالأرقام:${sn}` },
            { name:'color', value:c }
          ]
        })
      }
    }
  }
  const r = await fetch(`${API_BASE}/api/admin/products/${productId}/variants`, { method:'POST', headers:{ 'content-type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ variants }) })
  const j = await r.json().catch(()=> ({}))
  assert.ok(r.ok, `variants_upsert_failed: ${j.error||j.message||r.status}`)
}

async function verifyREST(productId){
  const detail = await (await fetch(`${API_BASE}/api/product/${productId}`)).json().catch(()=>null)
  if (!detail) throw new Error('product_detail_failed')
  if (!Array.isArray(detail.attributes)) throw new Error('attributes_missing')
  const colorAttr = detail.attributes.find((a)=> a.key==='color')
  const sizeAttrs = detail.attributes.filter((a)=> a.key==='size')
  if (!colorAttr || colorAttr.values.length < 2) throw new Error('colors_incomplete')
  if (sizeAttrs.length < 2) throw new Error('size_groups_missing')
  const v = await (await fetch(`${API_BASE}/api/product/${productId}/variants`)).json().catch(()=>null)
  if (!v || !Array.isArray(v.items) || v.items.length === 0) throw new Error('variants_missing')
}

async function main(){
  await ensureAdmin()
  const token = await login()
  const id = await createProduct(token)
  // Ensure variants exist via normalized endpoint
  try {
    const v = await fetchJson(`${API_BASE}/api/product/${id}/variants`)
    if (!v || !Array.isArray(v.items) || v.items.length === 0) {
      await upsertVariants(token, id)
    }
  } catch { await upsertVariants(token, id) }
  await verifyREST(id)
  console.log('AYMILI_PRODUCT_ID', id)
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })
