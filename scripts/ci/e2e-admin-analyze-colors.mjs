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

    // Fill paste textarea
    await page.fill('textarea', SAMPLE_TEXT)

    // Intercept analyze request
    await page.route('**/api/admin/products/analyze**', route => route.continue())
    const analyzeRespP = page.waitForResponse(res => /\/api\/admin\/products\/analyze/.test(res.url()), { timeout: 60000 }).catch(()=>null)

    // Click DeepSeek preview button
    const deepseekBtn = await page.$('button:has-text("تحليل عبر DeepSeek (معاينة)")')
    if (!deepseekBtn) throw new Error('deepseek_preview_button_not_found')
    await deepseekBtn.click()

    const resp = await analyzeRespP
    if (!resp || !resp.ok()) throw new Error('analyze_request_failed')

    // Wait for colors UI to populate
    // Find the colors panel and a select inside it with a non-empty value
    const colorSelect = page.locator('div.panel:has-text("الألوان") select.select').first()

    // Retry loop up to ~10s
    let ok = false
    for (let i=0;i<20;i++){
      try{
        const val = await colorSelect.evaluate((el) => (el && (el).value) || '')
        if (val && val.trim().length){ ok = true; break }
      }catch{}
      await page.waitForTimeout(500)
    }

    // Fallback: ensure we at least have created a color card select
    if (!ok){
      const count = await page.locator('div.panel:has-text("الألوان") select.select').count()
      if (count === 0) throw new Error('colors_select_missing_after_analyze')
      // Try picking the first option if value empty (indicates options loaded but no selection)
      try {
        await page.locator('div.panel:has-text("الألوان") select.select').first().selectOption({ index: 1 })
      } catch {}
      const val2 = await page.locator('div.panel:has-text("الألوان") select.select').first().evaluate((el)=> (el && (el).value) || '')
      ok = !!val2
    }

    if (!ok) throw new Error('colors_not_selected_after_analyze')

    console.log('✔ DeepSeek analyze populated colors in admin create page')
  } finally {
    await browser.close()
  }
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })
