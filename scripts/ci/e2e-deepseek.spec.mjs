import { chromium } from 'playwright'

const ADMIN_BASE = process.env.ADMIN_BASE || 'https://admin.jeeey.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// The same sample text used in API smoke, covers price old=3500, general colors, sizes, etc.
const SAMPLE_TEXT = `*جديد* *طقم طقم نسائي قطعتين احلا ماركه راقي* *يتميز ثلاث قطع منفصله* *فستان نسائي طويل مورد كلوش امبريلا* *جاكت كم طويل حرير تركي مزين بي الامام بكرستال فضي وفتحه من الخلف زرار* *حزام خصر منفصل* *شكل جديد ومميز* *5اللوان تحححفه* *تشكيله الترند الجديد* *قماش الجاكت حرير تركي الأصلي قماش الفستان حرير باربي الأصلي* *مقاسات L_Xl يلبس *من وزن 40الى وزن 70* *السعر* *عمله قديم 3500* *عمله جديد 11000* *الكل يعرض متوفر بكميات*`;

async function main(){
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    // Login
    await page.goto(`${ADMIN_BASE}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button:has-text("تسجيل"), button:has-text("Login")')
    await page.waitForURL(/\/dashboard|\/$/,{ timeout: 20000 })

    // Go to new product page
    await page.goto(`${ADMIN_BASE}/products/new`, { waitUntil: 'networkidle' })

    // Paste SAMPLE_TEXT into description/analysis textarea
    const textAreaSel = 'textarea[name="text"], textarea[data-testid="analyze-textarea"], textarea'
    await page.fill(textAreaSel, SAMPLE_TEXT)

    // Click Analyze/Preview button
    const analyzeBtn = await page.$('button:has-text("تحليل / معاينة"), button:has-text("تحليل"), button:has-text("Analyze")')
    if (!analyzeBtn) throw new Error('analyze_button_not_found')
    await analyzeBtn.click()

    // Wait for result to render; look for key fields
    await page.waitForSelector('text=السعر', { timeout: 25000 })
    const content = await page.content()

    // Assertions: price 3500 preferred, digits must be English
    if (!/3500/.test(content)) throw new Error('e2e_price_old_not_applied')
    if (/[\u0660-\u0669\u06F0-\u06F9]/.test(content)) throw new Error('e2e_arabic_digits_detected')

    // If general color phrase exists in input, ensure rendered colors include a general phrase
    const hasGeneral = /(\b\d+\s*ألوان\b|ألوان\s*متعددة|ألوان\s*متنوعة|عدة\s*ألوان)/i.test(SAMPLE_TEXT)
    if (hasGeneral) {
      const ok = /(\b\d+\s*ألوان\b|ألوان\s*متعددة|ألوان\s*متنوعة|عدة\s*ألوان)/i.test(content)
      if (!ok) throw new Error('e2e_general_colors_phrase_not_preserved')
    }
  } finally {
    await browser.close()
  }
}

main().catch((err)=>{ console.error(err?.stack||String(err)); process.exit(1) })

