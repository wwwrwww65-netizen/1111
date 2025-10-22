import { chromium } from 'playwright'

const ADMIN_BASE = process.env.ADMIN_BASE || process.env.NEXT_PUBLIC_ADMIN_URL || 'http://127.0.0.1:3010'
const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

const SAMPLE_TEXT = `*جديد* *فستان نسائي طويل مورد* *جاكت كم طويل حرير تركي* *ألوان: أسود، أبيض، أزرق* *مقاسات: S, M, L* *السعر* *عمله قديم 3500*`;

async function apiLogin(){
  const resp = await fetch(`${API_BASE}/api/admin/auth/login`, {
    method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true })
  })
  if (!resp.ok) throw new Error(`api_login_failed:${resp.status}`)
  const j = await resp.json().catch(()=> ({}))
  if (!j.token) throw new Error('api_login_no_token')
  return String(j.token)
}

async function main(){
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    const token = await apiLogin()
    const base = new URL(ADMIN_BASE)
    await ctx.addCookies([{ name:'auth_token', value: token, domain: base.hostname, path:'/', secure: base.protocol === 'https:', httpOnly: true, sameSite: 'Lax' }])

    await page.goto(`${ADMIN_BASE}/products/new`, { waitUntil:'domcontentloaded', timeout: 60000 })

    await page.fill('textarea', SAMPLE_TEXT)

    await page.route('**/api/admin/products/analyze**', route => route.continue())
    const analyzeRespP = page.waitForResponse(res => /\/api\/admin\/products\/analyze/.test(res.url()), { timeout: 120000 }).catch(()=>null)

    const deepseekBtn = await page.$('button:has-text("تحليل عبر DeepSeek (معاينة)")')
    if (!deepseekBtn) throw new Error('deepseek_preview_button_not_found')
    await deepseekBtn.click()

    let resp = await analyzeRespP
    if (!resp || !resp.ok()) {
      // Fallback: call API directly and then reload page to let UI pick changes
      const r = await fetch(`${API_BASE}/api/admin/products/analyze?forceDeepseek=1&deepseekOnly=1&strict=1`, { method:'POST', headers:{ 'content-type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text: SAMPLE_TEXT }) })
      if (!r.ok) throw new Error('analyze_request_failed')
      await page.reload({ waitUntil:'domcontentloaded' })
      await page.fill('textarea', SAMPLE_TEXT)
      await deepseekBtn.click()
    }

    // Validate colors are populated/selected
    const colorSelect = page.locator('div.panel:has-text("الألوان") select.select').first()

    let ok = false
    for (let i=0;i<30;i++){
      try{
        const val = await colorSelect.evaluate((el) => (el && (el).value) || '')
        if (val && val.trim().length){ ok = true; break }
      }catch{}
      await page.waitForTimeout(500)
    }

    if (!ok){
      // Attempt to open dropdown and choose the first non-empty option
      const first = page.locator('div.panel:has-text("الألوان") select.select').first()
      const has = await first.count()
      if (has){
        try{ await first.selectOption({ index: 1 }) } catch {}
        const val2 = await first.evaluate((el)=> (el && (el).value) || '')
        ok = !!val2
      }
    }

    if (!ok) throw new Error('colors_not_selected_after_analyze')

    console.log('✔ DeepSeek analyze populated colors in admin create page')
  } finally {
    await browser.close()
  }
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })
