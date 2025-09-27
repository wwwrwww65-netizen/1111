#!/usr/bin/env node
// Smoke: verify m.jeeey.com login OTP request triggers and redirects to /verify
// Env: OTP_PHONE (optional, default 967777310606), MWEB_URL (default https://m.jeeey.com)

import { chromium } from 'playwright';

const BASE = process.env.MWEB_URL || 'https://m.jeeey.com';
const PHONE = (process.env.OTP_PHONE || '967777310606').replace(/\D/g, '');
const TIMEOUT = 20000;

function ghError(msg){
  console.error(`::error title=OTP Smoke::${msg}`);
}
function ghNotice(msg){
  console.log(`::notice title=OTP Smoke::${msg}`);
}

const sel = {
  phoneInput: 'input[placeholder="أدخل رقم هاتفك"]',
  whatsappBtn: 'button:has-text("التأكيد عبر واتساب"), button:has-text("تسجيل الدخول")',
};

async function run(){
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try{
    ghNotice(`Open ${BASE}/login`);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForSelector(sel.phoneInput, { timeout: TIMEOUT });
    await page.fill(sel.phoneInput, PHONE.replace(/^967/, '')); // rely on auto-prepend dial

    const reqPromise = page.waitForResponse((res)=>{
      const url = res.url();
      return url.includes('/api/auth/otp/request');
    }, { timeout: TIMEOUT }).catch(()=>null);

    await page.click(sel.whatsappBtn, { timeout: TIMEOUT });

    const resp = await reqPromise;
    if (!resp){
      ghError('لم يتم اعتراض طلب /api/auth/otp/request في الوقت المحدد');
      process.exit(1);
    }
    const status = resp.status();
    let bodyText = '';
    try { bodyText = await resp.text(); } catch {}
    ghNotice(`OTP request status: ${status} body: ${bodyText.slice(0,200)}`);
    if (status < 200 || status >= 300){
      ghError(`فشل إرسال OTP. الحالة: ${status}. الرد: ${bodyText}`);
      process.exit(1);
    }

    // Accept either redirect to /verify or presence of notice text
    const navOk = await Promise.race([
      page.waitForURL(/\/verify(\?|$)/, { timeout: TIMEOUT }).then(()=>true).catch(()=>false),
      page.waitForSelector('text=تم إرسال الرمز عبر واتساب', { timeout: TIMEOUT }).then(()=>true).catch(()=>false),
    ]);
    if (!navOk){
      ghError('لم يتم الانتقال إلى صفحة /verify ولم تظهر رسالة النجاح');
      process.exit(1);
    }
    ghNotice('OTP flow passed (request sent and success UI observed)');
    process.exit(0);
  } catch(e){
    ghError(`استثناء أثناء الاختبار: ${e?.message||e}`);
    process.exit(1);
  } finally {
    await page.close().catch(()=>{});
    await ctx.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
}

run();

