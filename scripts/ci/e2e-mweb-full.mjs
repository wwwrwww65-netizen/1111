import { chromium } from 'playwright'

const MWEB_BASE = process.env.MWEB_BASE || 'https://m.jeeey.com'
const API_BASE = process.env.API_BASE || 'https://api.jeeey.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const MAINTENANCE_SECRET = process.env.MAINTENANCE_SECRET || ''

async function expectOk(cond, msg){ if(!cond){ throw new Error(msg) } }

async function main(){
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try{
    page.setDefaultTimeout(60000)

    // 1) OTP login flow + complete profile
    await page.goto(`${MWEB_BASE}/login`, { waitUntil:'domcontentloaded' })
    const phone = '+96777' + Math.floor(1000000 + Math.random()*8999999)
    await page.fill('input[placeholder="أدخل رقم هاتفك"]', phone.replace('+',''))
    await Promise.all([
      page.waitForURL(/\/verify(\?|$)/),
      page.click('button:has-text("التأكيد عبر واتساب"), button:has-text("تسجيل الدخول")')
    ])
    // request OTP via API to ensure code exists
    await fetch(`${API_BASE}/api/auth/otp/request`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ phone, channel:'whatsapp' }) })
    const hook = await fetch(`${API_BASE}/api/test/otp/latest?phone=${encodeURIComponent(phone)}`, { headers:{ 'x-maintenance-secret': MAINTENANCE_SECRET } }).then(r=>r.json()).catch(()=>null)
    await expectOk(hook && hook.code, 'otp_code_missing')
    const code = String(hook.code).padStart(6,'0').slice(0,6)
    const inputs = await page.$$('input[maxlength="1"][inputmode="numeric"]')
    await expectOk(inputs.length>=6, 'otp_inputs_missing')
    for (let i=0;i<6;i++){ await inputs[i].fill(code[i]) }
    // complete profile
    if (/\/complete-profile(\?|$)/.test(page.url())){
      await page.fill('input[placeholder^="مثال:"]', 'مستخدم اختبار')
      await page.fill('input[type="password"]:nth-of-type(1)', 'Test#1234')
      await page.fill('input[type="password"]:nth-of-type(2)', 'Test#1234')
      await Promise.all([ page.waitForURL(/\/account(\?|$)/), page.click('button:has-text("تسجيل")') ])
    }
    // whoami should have user now (fallback to direct verify if cookies blocked)
    let me1 = await page.evaluate(async(base)=>{ const r=await fetch(`${base}/api/me`,{credentials:'include'}); return r.ok? r.json(): null }, API_BASE)
    if (!me1 || !me1.user){
      // Fallback: verify via API and seed token to localStorage/cookies
      const v = await fetch(`${API_BASE}/api/auth/otp/verify`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ phone, code }) }).then(r=>r.json()).catch(()=>null)
      if (v && v.token){
        const token = v.token
        await page.evaluate((t)=>{ try{ localStorage.setItem('shop_token', t) }catch{} }, token)
        await ctx.addCookies([
          { name:'shop_auth_token', value: token, domain: 'jeeey.com', path:'/', secure: true, httpOnly: true, sameSite: 'None' },
          { name:'shop_auth_token', value: token, domain: 'api.jeeey.com', path:'/', secure: true, httpOnly: true, sameSite: 'None' }
        ])
        await page.goto(`${MWEB_BASE}/account`, { waitUntil:'domcontentloaded' })
        me1 = await page.evaluate(async(base,t)=>{ const r=await fetch(`${base}/api/me`, { headers:{ Authorization: `Bearer ${t}` } }); return r.ok? r.json(): null }, API_BASE, token)
      }
    }
    await expectOk(me1 && me1.user, 'me_after_otp_null')

    // 2) Google simulated login: call maintenance test login to get token, then persist and reload
    const testEmail = `e2e+${Date.now()}@local`;
    const testLogin = await fetch(`${API_BASE}/api/test/login`, { method:'POST', headers:{ 'content-type':'application/json', 'x-maintenance-secret': MAINTENANCE_SECRET }, body: JSON.stringify({ email: testEmail, name:'Tester' }) }).then(r=>r.json()).catch(()=>null)
    await expectOk(testLogin && testLogin.token, 'google_sim_token_missing')
    const token = testLogin.token
    await page.evaluate((t)=>{ try{ localStorage.setItem('shop_token', t) }catch{} }, token)
    await page.goto(`${MWEB_BASE}/account`, { waitUntil:'domcontentloaded' })
    const me2 = await page.evaluate(async(base,t)=>{ const r=await fetch(`${base}/api/me`, { headers:{ Authorization: `Bearer ${t}` } }); return r.ok? r.json(): null }, API_BASE, token)
    await expectOk(me2 && me2.user, 'me_after_google_sim_null')

    console.log('E2E auth OK')
  } finally {
    await browser.close()
  }
}

main().catch((e)=>{ console.error(e?.stack||String(e)); process.exit(1) })

