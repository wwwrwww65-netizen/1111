import { chromium } from 'playwright'

const ADMIN_BASE = process.env.ADMIN_BASE || 'https://admin.jeeey.com'
const API_BASE = process.env.API_BASE || 'https://api.jeeey.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

const SAMPLE = `طقم ملاعق طعام ستانلس ستيل عالي الجودة مقاوم للصدأ
الألوان: فضي، ذهبي، أسود
المحتويات: 6 ملاعق كبيرة، 6 ملاعق صغيرة
مناسب للمطابخ والمناسبات
السعر للشمال 3500`

async function main(){
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try{
    // Admin API login to get token and set cookie
    const loginResp = await fetch(`${API_BASE}/api/admin/auth/login`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember:true }) })
    if (!loginResp.ok) throw new Error(`api_login_failed:${loginResp.status}`)
    const { token } = await loginResp.json()
    const base = new URL(ADMIN_BASE)
    await ctx.addCookies([{ name:'auth_token', value: token, domain: base.hostname, path:'/', secure: base.protocol==='https:', httpOnly: true, sameSite: 'Lax' }])

    // Go to products/new
    await page.goto(`${ADMIN_BASE}/products/new`, { waitUntil:'domcontentloaded' })
    // Paste text
    await page.fill('textarea[placeholder="الصق مواصفات المنتج (AR/EN)"]', SAMPLE)
    // Click Analyze / Preview
    const analyze = await page.$('button:has-text("تحليل / معاينة")')
    if (!analyze) throw new Error('analyze_button_not_found')
    await analyze.click()
    // Wait for Review panel to appear
    await page.waitForSelector('text=Review', { timeout: 60000 })
    // Click توليد to fill fields
    await page.click('button:has-text("توليد")')
    // Assert fields are filled (name, description) and domain is tableware (not dress)
    const nameVal = await page.inputValue('input:below(:text("اسم المنتج"))')
    if (!nameVal || nameVal.length < 3) throw new Error('name_not_filled')
    if (/فستان/i.test(nameVal)) throw new Error('wrong_domain_name_dress_detected')
    if (!/(ملاعق|أدوات\s*مائدة)/i.test(nameVal)) throw new Error('tableware_cue_missing_in_name')
    const descVal = await page.inputValue('textarea:below(:text("الوصف"))')
    if (!descVal || descVal.length < 10) throw new Error('description_not_filled')
    // Sizes should be empty for tableware
    const sizesInputSel = 'input:below(:text("المقاسات"))'
    const sizesPresent = await page.$(sizesInputSel)
    if (sizesPresent) {
      const sz = await page.inputValue(sizesInputSel).catch(()=> '')
      if (sz && sz.trim().length>0) throw new Error('sizes_should_be_empty_for_tableware')
    }
    // Colors present in variable mode if any
    // Ensure manual fields untouched: SKU stays empty, vendor/category/sale price required not auto-set
    const skuVal = await page.inputValue('input:below(:text("SKU"))').catch(()=> '')
    if (skuVal && skuVal.trim().length>0) throw new Error('sku_should_be_manual')
    // Done
  } finally {
    await browser.close()
  }
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })

