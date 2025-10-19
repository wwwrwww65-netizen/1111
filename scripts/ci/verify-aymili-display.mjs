/* eslint-disable no-console */
// Verify display via REST and minimal headless render of mweb PDP
import assert from 'node:assert/strict'

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:4000'
const MWEB_ORIGIN = process.env.MWEB_ORIGIN || 'http://127.0.0.1:3002'

async function wait(ms){ return new Promise(r=> setTimeout(r, ms)) }

async function fetchJson(url){ const r = await fetch(url); const j = await r.json().catch(()=>null); if (!r.ok) throw new Error(`fetch_failed:${r.status}`); return j }

async function verifyRest(productId){
  const d = await fetchJson(`${API_BASE}/api/product/${productId}`)
  assert.ok(Array.isArray(d.attributes), 'attributes_missing')
  const color = d.attributes.find(a=> a.key==='color'); assert.ok(color && color.values.length>=2, 'colors_missing')
  const sizes = d.attributes.filter(a=> a.key==='size'); assert.ok(sizes.length>=2, 'size_groups_missing')
}

async function verifyMweb(productId){
  // spin up mweb preview if not reachable
  let needStart = false
  try { const r = await fetch(`${MWEB_ORIGIN}/index.html`, { method:'HEAD' }); needStart = !r.ok } catch { needStart = true }
  let proc
  if (needStart){
    const { spawn } = await import('node:child_process')
    proc = spawn('pnpm', ['-C','apps/mweb','preview'], { stdio:'inherit' })
    await wait(1500)
  }
  try {
    const url = `${MWEB_ORIGIN}/#/p?id=${encodeURIComponent(productId)}`
    const html = await (await fetch(url)).text()
    // Basic checks: presence of color swatches, size buttons labels
    assert.ok(/data-testid="color-swatch"/.test(html), 'mweb_color_swatch_missing')
    assert.ok(/data-size="M"/.test(html) || />M<\/button>/.test(html), 'mweb_size_alpha_missing')
    assert.ok(/98/.test(html) || /99/.test(html), 'mweb_size_numeric_missing')
  } finally {
    try { if (proc) proc.kill() } catch {}
  }
}

async function main(){
  const id = process.env.AYMILI_PRODUCT_ID || process.env.MWEB_TEST_PRODUCT_ID
  assert.ok(id, 'missing_product_id')
  await verifyRest(id)
  await verifyMweb(id)
  console.log('DISPLAY_OK', id)
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })
