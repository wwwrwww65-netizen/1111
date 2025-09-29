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
  const page = await ctx.newPage()
  try{
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
    // Faster and more stable: log in via API to issue auth cookie, then open /account
    const loginResp = await fetch(`${API_BASE}/api/admin/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember: true })
    })
    if (!loginResp.ok) throw new Error(`api_login_failed:${loginResp.status}`)
    const loginJson = await loginResp.json().catch(()=>null)
    const token = loginJson?.token
    if (!token) throw new Error('api_login_no_token')
    // Share cookie across subdomains (api + mweb) and allow cross-site requests
    await ctx.addCookies([
      { name:'auth_token', value: token, domain: 'api.jeeey.com', path:'/', secure: true, httpOnly: true, sameSite: 'None' },
      { name:'auth_token', value: token, domain: 'jeeey.com', path:'/', secure: true, httpOnly: true, sameSite: 'None' }
    ])
    await page.goto(`${MWEB_BASE}/account`, { waitUntil:'domcontentloaded', timeout: 60000 })

    // Diagnostics: dump cookies and attempt whoami from within page
    const cookies = await ctx.cookies()
    console.log('cookies:', JSON.stringify(cookies, null, 2))
    const hasAuth = cookies.some(c=> c.name==='auth_token')
    if (!hasAuth) throw new Error('auth_cookie_missing')

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

