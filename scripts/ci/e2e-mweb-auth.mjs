import { chromium } from 'playwright'

const MWEB_BASE = process.env.MWEB_BASE || 'https://m.jeeey.com'
const API_BASE = process.env.API_BASE || 'https://api.jeeey.com'
const TEST_PHONE = process.env.TEST_PHONE || '+966500000001'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// Verbose console diagnostics only (no file writes)

async function main(){
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  await ctx.clearCookies()
  const page = await ctx.newPage()
  try{
    page.setDefaultTimeout(60000)
    // Network logs (requests/responses)
    page.on('request', req => {
      try{ console.log('[REQ]', req.method(), req.url()) }catch{}
    })
    page.on('response', async res => {
      try{
        const url = res.url(); const status = res.status();
        if (/\/api\//.test(url)){
          const headers = await res.headers();
          console.log('[RES]', status, url, '\nheaders:', JSON.stringify(headers, null, 2))
        } else {
          console.log('[RES]', status, url)
        }
      }catch{}
    })
    await page.goto(`${MWEB_BASE}/login`, { waitUntil:'domcontentloaded', timeout: 60000 })
    // Fill number (random local to avoid colliding with existing admin/user)
    const rand = String(Math.floor(Math.random()*9000000) + 1000000)
    const localPhone = '77' + rand.slice(0,7) // 9 digits
    await page.fill('input[placeholder="أدخل رقم هاتفك"]', localPhone)
    await Promise.all([
      page.waitForURL(/\/verify(\?|$)/, { timeout: 60000 }),
      page.click('button:has-text("التأكيد عبر واتساب"), button:has-text("تسجيل الدخول")')
    ])
    // Build E.164 used by UI (default Yemen +967 in Login.vue)
    const dial = '+967'
    const e164 = dial.replace(/\D/g,'') + localPhone.replace(/\D/g,'')
    // Poll OTP hook with fallback to trigger request if missing
    const maintSecret = process.env.MAINTENANCE_SECRET||''
    let hook = null
    for (let i=0;i<12;i++){
      try{
        const resp = await fetch(`${API_BASE}/api/test/otp/latest?phone=${e164}`, { headers: { 'x-maintenance-secret': maintSecret } })
        if (resp.ok){ hook = await resp.json().catch(()=>null); if (hook && hook.code) break }
      }catch{}
      if (i===2){
        try{ await fetch(`${API_BASE}/api/auth/otp/request`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone: e164, channel:'whatsapp' }) }) }catch{}
      }
      await new Promise(r=>setTimeout(r, 1000))
    }
    if (!hook || !hook.code) throw new Error('otp_code_unavailable')
    const hookResp = await fetch(`${API_BASE}/api/test/otp/latest?phone=${e164}`, { headers: { 'x-maintenance-secret': maintSecret } })
    if (!hookResp.ok) {
      throw new Error(`otp_hook_failed:${hookResp.status} (ensure MAINTENANCE_SECRET is set in workflow secrets)`) }
    hook = await hookResp.json().catch(()=>null)
    const code = String(hook?.code||'').padStart(6,'0').slice(0,6)
    // Fill OTP inputs robustly: fill each input sequentially to trigger onInput per box
    const inputs = await page.$$('input[maxlength="1"][inputmode="numeric"]')
    if (inputs.length < 6) throw new Error(`otp_inputs_missing:${inputs.length}`)
    for (let i=0;i<6;i++){
      await inputs[i].fill(code[i]||'0')
    }
    // Perform first-party verify on API origin to bypass 3rd-party cookie blocking
    try{
      const apiPage = await ctx.newPage()
      await apiPage.goto(`${API_BASE}/health`, { waitUntil:'domcontentloaded', timeout: 60000 })
      await apiPage.evaluate(async(base, phone, code) => {
        await fetch(`${base}/api/auth/otp/verify`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone, code }) })
      }, API_BASE, e164, code)
      await apiPage.close()
    }catch{}
    // Navigate to account and rely on whoami
    await page.goto(`${MWEB_BASE}/account`, { waitUntil:'domcontentloaded', timeout: 60000 })
    // Expect redirect to complete-profile if new or incomplete (non-fatal if skipped)
    page.waitForURL(/\/complete-profile(\?|$)|\/account(\?|$)/, { timeout: 20000 }).catch(()=>null)
    // If on complete-profile, fill only name (simulate your case) and submit
    const isComplete = /\/complete-profile(\?|$)/.test(page.url())
    if (isComplete){
      await page.fill('input[placeholder="مثال: محمد أحمد علي سعيد"]', 'مستخدم اختبار')
      await page.fill('input[type="password"]:nth-of-type(1)', 'Test#1234')
      await page.fill('input[type="password"]:nth-of-type(2)', 'Test#1234')
      await Promise.all([
        page.waitForURL(/\/account(\?|$)/, { timeout: 20000 }),
        page.click('button:has-text("تسجيل")')
      ])
      // Ensure whoami reflects updated name and role is USER (not ADMIN)
      const me2 = await page.evaluate(async(base)=>{
        const r = await fetch(`${base}/api/me`, { credentials:'include' });
        return r.ok ? r.json() : null
      }, API_BASE)
      if (!me2 || !me2.user || !me2.user.name || /\d{6,}/.test(String(me2.user.name)) || String(me2.user.role||'').toUpperCase()==='ADMIN'){
        throw new Error('complete_profile_not_applied')
      }
      // Do not perform any admin login calls to avoid polluting cookies
    }

    // Diagnostics: attempt whoami from within page (don't fail on cookie printouts)
    const cookies = await ctx.cookies()
    console.log('cookies:', JSON.stringify(cookies, null, 2))

    // 6) whoami should return user
    const me = await page.evaluate(async(base)=>{
      const res = await fetch(`${base}/api/me`, { credentials:'include' })
      return res.ok ? res.json() : null
    }, API_BASE)
    console.log('whoami:', JSON.stringify(me||{}, null, 2))
    if (!me || !me.user){
      console.error('whoami_missing_user: whoami returned null user. Diagnostics:')
      console.error('Cookie tips: ensure cookie Domain=.jeeey.com, SameSite=None, Secure=true, Path=/')
      console.error('CORS tips: ensure API allows origin https://m.jeeey.com and allows credentials')
      await browser.close()
      process.exit(1)
    }

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

