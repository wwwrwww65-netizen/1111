import { chromium } from 'playwright'

const MWEB_BASE = process.env.MWEB_BASE || 'https://m.jeeey.com'
const API_BASE = process.env.API_BASE || 'https://api.jeeey.com'
const TEST_PHONE = process.env.TEST_PHONE || '+966500000001'

async function main(){
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try{
    // 1) Navigate to Verify directly with auto=1 to trigger OTP request
    const url = new URL('/verify', MWEB_BASE)
    url.searchParams.set('auto','1')
    url.searchParams.set('dial', '+966')
    url.searchParams.set('phone', TEST_PHONE)
    url.searchParams.set('ch','whatsapp')
    url.searchParams.set('return','/account')
    await page.goto(url.toString(), { waitUntil:'networkidle' })

    // 2) Stub: Fetch the OTP code from API test hook if available, otherwise use 000000
    let code = '000000'
    try{
      const hook = await fetch(`${API_BASE}/api/test/otp/latest?phone=${encodeURIComponent(TEST_PHONE)}`).then(r=>r.ok?r.json():null).catch(()=>null)
      if (hook && hook.code) code = String(hook.code).padStart(6,'0').slice(0,6)
    }catch{}

    // 3) Fill OTP inputs
    for (let i=0;i<6;i++){
      await page.fill(`input:nth-of-type(${i+1})`, code[i])
    }

    // 4) Click confirm
    await Promise.all([
      page.waitForResponse(r=>/\/api\/auth\/otp\/verify/.test(r.url()), { timeout: 20000 }),
      page.click('button:has-text("تأكيد الرمز")')
    ])

    // 5) Should redirect to /account and cookie should exist
    await page.waitForURL(/\/account(\?|$)/, { timeout: 20000 })
    const cookies = await ctx.cookies()
    const hasAuth = cookies.some(c=> c.name==='auth_token')
    if (!hasAuth) throw new Error('auth_cookie_missing')

    // 6) whoami should return user
    const me = await page.evaluate(async(base)=>{
      const res = await fetch(`${base}/api/me`, { credentials:'include' })
      return res.ok ? res.json() : null
    }, API_BASE)
    if (!me || !me.user) throw new Error('whoami_missing_user')

    // 7) UI should show username somewhere (fallback to phone/email)
    const html = await page.content()
    if (!/(اسم المستخدم|jeeey|\+966|account|JEEEY)/i.test(html)) {
      // Not a strict failure, but signal warning
      console.warn('warning_username_not_visible')
    }
  } finally {
    await browser.close()
  }
}

main().catch((err)=>{ console.error(err?.stack||String(err)); process.exit(1) })

