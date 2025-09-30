import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@repo/db';
import { readTokenFromRequest, verifyJwt, signJwt } from '../utils/jwt';
import type { Request } from 'express'

const shop = Router();
// Ensure OTP table exists (idempotent)
async function ensureOtpTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "OtpCode" ('+
      'id TEXT PRIMARY KEY,'+
      'phone TEXT NOT NULL,'+
      'code TEXT NOT NULL,'+
      'channel TEXT NOT NULL,'+
      'expiresAt TIMESTAMP NOT NULL,'+
      'consumed BOOLEAN DEFAULT FALSE,'+
      'createdAt TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "OtpCode_phone_idx" ON "OtpCode"(phone)');
    // Harden schema for legacy deployments where column casing may differ
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "channel" TEXT'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "consumed" BOOLEAN DEFAULT FALSE'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()'); } catch {}
    // Drop NOT NULL to allow flexible inserts, then we backfill
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ALTER COLUMN "expiresAt" DROP NOT NULL'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ALTER COLUMN "expires_at" DROP NOT NULL'); } catch {}
  } catch {}
}

async function insertOtpRow(phone: string, code: string, channel: string, expiresAt: Date): Promise<string> {
  const id = Math.random().toString(36).slice(2);
  try {
    // Introspect table columns
    const cols: any[] = (await db.$queryRawUnsafe(
      "SELECT column_name, is_nullable, data_type, column_default FROM information_schema.columns WHERE table_name='OtpCode' AND table_schema='public'"
    )) as any[];
    const now = new Date();
    const known: Record<string, any> = {
      id,
      phone,
      code,
      channel,
      expiresAt,
      expires_at: expiresAt,
      consumed: false,
      createdAt: now,
      updatedAt: now,
    };
    // Helper for generic defaults
    const defaultFor = (dt: string) => {
      const t = String(dt || '').toLowerCase();
      if (t.includes('timestamp')) return now;
      if (t.includes('boolean')) return false;
      if (t.includes('double') || t.includes('numeric') || t.includes('real')) return 0;
      if (t.includes('integer') || t.includes('smallint') || t.includes('bigint')) return 0;
      return '';
    };
    const insertCols: string[] = [];
    const values: any[] = [];
    // Include all NOT NULL columns without default first, plus our known set
    for (const c of cols) {
      const name = c.column_name as string;
      const isNullable = String(c.is_nullable || '').toUpperCase() === 'YES';
      const hasDefault = c.column_default != null;
      let val: any;
      if (name in known) val = known[name];
      else if (!isNullable && !hasDefault) val = defaultFor(String(c.data_type||''));
      else continue;
      insertCols.push('"' + name + '"');
      values.push(val);
    }
    // Ensure at minimum our essential columns are included
    const essentials = ['id','phone','code','channel'];
    for (const e of essentials) {
      if (!insertCols.includes('"'+e+'"')) { insertCols.push('"'+e+'"'); values.push(known[e]); }
    }
    // Build parameterized insert
    const params = values.map((_, i) => `$${i+1}`).join(',');
    const colsSql = insertCols.join(',');
    const sql = `INSERT INTO "OtpCode" (${colsSql}) VALUES (${params})`;
    await db.$executeRawUnsafe(sql, ...values);
    // Best-effort backfill to both expiry fields
    try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expiresAt"=$2, "updatedAt"=NOW() WHERE id=$1', id, expiresAt); } catch {}
    try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expires_at"=$2, "updatedAt"=NOW() WHERE id=$1', id, expiresAt); } catch {}
    return id;
  } catch (e) {
    // Fallback to minimal insert of known subset
    try {
      await db.$executeRawUnsafe('INSERT INTO "OtpCode" (id, phone, code, channel) VALUES ($1,$2,$3,$4)', id, phone, code, channel);
      try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expiresAt"=$2 WHERE id=$1', id, expiresAt); } catch {}
      try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expires_at"=$2 WHERE id=$1', id, expiresAt); } catch {}
      return id;
    } catch {
      throw e;
    }
  }
}

function generateOtpCode(): string { return String(Math.floor(100000 + Math.random() * 900000)); }

async function getLatestIntegration(provider: string): Promise<any|null> {
  // Prefer DB-configured integration when present and enabled
  try {
    const row = await db.integration.findFirst({ where: { provider }, orderBy: { createdAt: 'desc' } } as any);
    const cfg = row ? ((row as any).config || {}) : null;
    if (cfg && (cfg.enabled === undefined || !!cfg.enabled)) return cfg;
  } catch {}
  // Env-based fallback to guarantee delivery if DB is not populated yet
  try {
    if (provider === 'whatsapp') {
      const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_CLOUD_TOKEN || '';
      const phoneId = process.env.WHATSAPP_PHONE_ID || '';
      const template = process.env.WHATSAPP_TEMPLATE || '';
      const languageCode = process.env.WHATSAPP_LANGUAGE || 'ar';
      const headerType = process.env.WHATSAPP_HEADER_TYPE || 'none';
      const headerParam = process.env.WHATSAPP_HEADER_PARAM || '';
      const buttonSubType = process.env.WHATSAPP_BUTTON_TYPE || '';
      const buttonIndex = process.env.WHATSAPP_BUTTON_INDEX || '0';
      const buttonParam = process.env.WHATSAPP_BUTTON_PARAM || '';
      if (token && phoneId) {
        return { enabled: true, token, phoneId, template, languageCode, headerType, headerParam, buttonSubType, buttonIndex, buttonParam };
      }
    }
    if (provider === 'sms') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
      const authToken = process.env.TWILIO_AUTH_TOKEN || '';
      const sender = process.env.TWILIO_SMS_FROM || '';
      if (accountSid && authToken && sender) {
        return { enabled: true, provider: 'twilio', accountSid, authToken, sender };
      }
      const vonageKey = process.env.VONAGE_API_KEY || process.env.NEXMO_API_KEY || '';
      const vonageSecret = process.env.VONAGE_API_SECRET || process.env.NEXMO_API_SECRET || '';
      const vonageFrom = process.env.VONAGE_FROM || process.env.NEXMO_FROM || '';
      if (vonageKey && vonageSecret && vonageFrom) {
        return { enabled: true, provider: 'nexmo', apiKey: vonageKey, apiSecret: vonageSecret, from: vonageFrom };
      }
    }
  } catch {}
  return null;
}

async function getGoogleOAuthConfig(): Promise<{ clientId: string; clientSecret?: string; redirectUri: string } | null> {
  try{
    const row = await db.integration.findFirst({ where: { provider: 'google_oauth' }, orderBy: { createdAt: 'desc' } } as any);
    const cfg: any = row ? ((row as any).config || {}) : {};
    const clientId = cfg.clientId || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = cfg.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
    const publicApi = process.env.PUBLIC_API_BASE || process.env.API_BASE_URL || 'https://api.jeeey.com';
    const redirectUri = cfg.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${publicApi}/api/auth/google/callback`;
    if (!clientId || !redirectUri) return null;
    return { clientId, clientSecret, redirectUri };
  }catch{ return null }
}

async function sendWhatsappOtp(phone: string, text: string): Promise<boolean> {
  const cfg = await getLatestIntegration('whatsapp');
  if (!cfg || cfg.enabled === false) return false; // treat missing enabled as true
  const token = cfg.token; const phoneId = cfg.phoneId; const template = cfg.template; let languageCode = cfg.languageCode || 'ar';
  const headerType = cfg.headerType; const headerParam = cfg.headerParam;
  // Normalize language naming like "arabic" => "ar"
  if (typeof languageCode === 'string'){
    const lc = String(languageCode).toLowerCase();
    if (lc === 'arabic') languageCode = 'ar';
  }
  const buttonSubType = cfg.buttonSubType; const buttonIndex = Number(cfg.buttonIndex||0); const buttonParam = cfg.buttonParam;
  if (!token || !phoneId) return false;
  try {
    const url = `https://graph.facebook.com/v17.0/${encodeURIComponent(String(phoneId))}/messages`;
    const candidates = Array.from(new Set([String(languageCode), 'ar_SA', 'ar', 'en']));
    const e164 = String(phone).startsWith('+') ? String(phone) : `+${String(phone)}`;
    const toVariants = Array.from(new Set([e164]));
    // Try template with multiple languages and component permutations
    if (template) {
      for (const to of toVariants) {
        for (const lang of candidates) {
          // Build component variants to avoid invalid-parameter errors when header/body varies across templates
          const buildHeader = (): any | null => {
            if (!headerType || String(headerType).toLowerCase() === 'none') return null;
            const ht = String(headerType).toLowerCase();
            if (ht === 'text' && headerParam) return { type:'header', parameters:[{ type:'text', text: String(headerParam) }] };
            if ((ht === 'image' || ht === 'video' || ht === 'document') && headerParam){
              const pkey = ht as 'image'|'video'|'document';
              const mediaParam: any = {}; mediaParam[pkey] = { link: String(headerParam) };
              return { type:'header', parameters:[{ type: pkey, ...mediaParam }] };
            }
            return null;
          };
          const headerComp = buildHeader();
          // Prefer sending only the OTP digits to match templates expecting {{1}}
          const digits = (text.match(/\d+/g) || []).join('').slice(0, 12);
          const paramValue = digits.length > 0 ? digits : text;
          const bodyComp = { type:'body', parameters:[{ type:'text', text: paramValue }] } as any;
          const variants: any[] = [];
          // 1) header + body
          if (headerComp) variants.push([headerComp, bodyComp]);
          // 2) body only
          variants.push([bodyComp]);
          // 3) header only (some templates put code in header)
          if (headerComp) variants.push([headerComp]);
          // 4) empty components (for templates without params)
          variants.push([]);

          // Button variants: if integration defines button, use it; otherwise try url and quick_reply automatically
          const buttonCandidates: Array<{ sub_type: 'url'|'quick_reply'|'phone_number'; index: string; param: string }|null> = [];
          if (buttonSubType && (buttonSubType === 'url' || buttonSubType === 'quick_reply' || buttonSubType === 'phone_number')){
            const bp = (typeof buttonParam === 'string' && buttonParam.trim()) ? String(buttonParam) : String(paramValue);
            buttonCandidates.push({ sub_type: buttonSubType, index: String(buttonIndex||0), param: bp });
          }
          // Auto attempts
          buttonCandidates.push({ sub_type: 'url', index: '0', param: String(paramValue) });
          buttonCandidates.push({ sub_type: 'quick_reply', index: '0', param: String(paramValue) });
          // Also try with no button (for templates that don't require buttons)
          buttonCandidates.push(null);

          for (const comps of variants) {
            const payload: any = {
              messaging_product: 'whatsapp',
              to,
              type: 'template',
              template: { name: String(template), language: { code: String(lang), policy: 'deterministic' }, components: comps },
            };
            for (const btn of buttonCandidates) {
              const toSend = JSON.parse(JSON.stringify(payload));
              if (btn) {
                toSend.template.components.push({ type:'button', sub_type: btn.sub_type, index: btn.index, parameters:[{ type: 'text', text: btn.param }] });
              }
              const r = await fetch(url, { method:'POST', headers:{ 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(toSend) });
              const raw = await r.text().catch(()=> '');
              if (r.ok) {
                try {
                  const parsed = raw ? JSON.parse(raw) : null;
                  const msgId = parsed?.messages?.[0]?.id;
                  if (msgId) { console.log('WA template sent', { to, lang, msgId }); return true; }
                } catch {}
                // Treat 200 without messageId as uncertain -> try next variant or fallback
              }
              try { console.error('WA template send failed', lang, to, JSON.stringify(toSend.template.components), raw) } catch {}
            }
          }
        }
      }
    }
    // Fallback to plain text
    for (const to of toVariants) {
      const body = { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } } as any;
      const r = await fetch(url, { method:'POST', headers:{ 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(body) });
      const raw = await r.text().catch(()=> '');
      if (r.ok) { try { const parsed = raw ? JSON.parse(raw) : null; const msgId = parsed?.messages?.[0]?.id; if (msgId) { console.log('WA text sent', { to, msgId }); return true; } } catch {}; }
      try { console.error('WA text send failed', to, raw) } catch {}
    }
    return false;
  } catch { return false; }
}

async function sendSmsOtp(phone: string, text: string): Promise<boolean> {
  const cfg = await getLatestIntegration('sms');
  if (!cfg || !cfg.enabled) return false;
  try {
    const prov = String(cfg.provider||'').toLowerCase();
    const to = phone.startsWith('+') ? phone : `+${phone}`;
    if (prov === 'twilio' && cfg.accountSid && cfg.authToken && cfg.sender){
      const sid = String(cfg.accountSid);
      const token = String(cfg.authToken);
      const from = String(cfg.sender);
      const body = new URLSearchParams({ To: to, From: from, Body: text });
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method:'POST',
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!r.ok) { try { console.error('Twilio send failed', await r.text()); } catch {} }
      return r.ok;
    }
    if (prov === 'vonage' && cfg.accountSid && cfg.authToken && cfg.sender){
      // Using Vonage SMS API (legacy): https://rest.nexmo.com/sms/json
      const params = new URLSearchParams({ api_key: String(cfg.accountSid), api_secret: String(cfg.authToken), to: to.replace('+',''), from: String(cfg.sender), text });
      const r = await fetch('https://rest.nexmo.com/sms/json', { method:'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded' }, body: params });
      if (!r.ok) { try { console.error('Vonage send failed', await r.text()); } catch {} }
      return r.ok;
    }
    console.warn('[SMS OTP] provider not configured with required credentials');
    return false;
  } catch { return false; }
}
// Public consent endpoints
shop.get('/consent/config', async (_req, res) => {
  try{
    const row = await db.setting.findUnique({ where: { key: 'consent_config' } });
    res.json({ ok:true, config: row?.value || { tracking:true, utm:true, personalization:true } });
  }catch(e:any){ res.status(500).json({ ok:false, error: e.message||'consent_get_failed' }); }
});
shop.post('/consent/accept', async (req, res) => {
  try{
    const val = req.body?.accept ?? { tracking:true, utm:true, personalization:true };
    res.cookie('consent', Buffer.from(JSON.stringify(val)).toString('base64'), { httpOnly:false, sameSite:'lax', maxAge: 3600*24*365*1000 });
    res.json({ ok:true });
  }catch(e:any){ res.status(500).json({ ok:false, error: e.message||'consent_accept_failed' }); }
});

// Helpers
function requireAuth(req: any, res: any, next: any) {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const payload = verifyJwt(token);
    (req as any).user = payload;
    return next();
  } catch (e: any) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

// OTP: request code via WhatsApp/SMS
shop.post('/auth/otp/request', async (req: any, res) => {
  try {
    await ensureOtpTable();
    const phone = String(req.body?.phone || '').trim();
    const channel = String(req.body?.channel || 'whatsapp').toLowerCase();
    if (!phone) return res.status(400).json({ ok:false, error:'phone_required' });
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const id = await insertOtpRow(phone, code, channel, expiresAt);
    const text = `رمز التأكيد: ${code}`;
    let sent = false;
    let used: 'whatsapp' | 'sms' | '' = '';
    const normalizeE164 = (p: string): string => {
      const trimmed = String(p).replace(/\s+/g,'');
      if (/^\+\d{6,15}$/.test(trimmed)) return trimmed;
      // Basic heuristic: if starts with 0 and env COUNTRY_CODE set, replace leading 0
      const cc = (process.env.DEFAULT_COUNTRY_CODE || '').replace(/^\+?/,'+');
      if (cc && /^0\d+/.test(trimmed)) return cc + trimmed.replace(/^0/, '');
      if (cc && /^\d{6,}$/.test(trimmed)) return cc + trimmed;
      return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
    };
    const targetPhone = normalizeE164(phone);
    if (channel === 'whatsapp' || channel === 'both') {
      const ok = await sendWhatsappOtp(targetPhone, text);
      if (ok) { sent = true; used = 'whatsapp'; }
    }
    if (!sent && (channel === 'sms' || channel === 'whatsapp' || channel === 'both')) {
      const ok2 = await sendSmsOtp(targetPhone, text);
      if (ok2) { sent = true; used = 'sms'; }
    }
    if (!sent) { console.warn('[OTP] send failed', { phone, channel }); return res.status(502).json({ ok:false, error:'send_failed' }); }
    return res.json({ ok:true, sent:true, channelUsed: used, expiresInSec: 300 });
  } catch (e:any) { return res.status(500).json({ ok:false, error: e.message||'otp_request_failed' }); }
});

// OTP: verify code and issue session
shop.post('/auth/otp/verify', async (req: any, res) => {
  try {
    await ensureOtpTable();
    const phone = String(req.body?.phone || '').trim();
    const code = String(req.body?.code || '').trim();
    if (!phone || !code) return res.status(400).json({ ok:false, error:'phone_code_required' });
    const row: any = ((await db.$queryRawUnsafe('SELECT * FROM "OtpCode" WHERE phone=$1 AND code=$2 AND (consumed=false OR consumed IS NULL) ORDER BY COALESCE("createdAt", NOW()) DESC LIMIT 1', phone, code)) as any[])[0];
    if (!row) return res.status(400).json({ ok:false, error:'invalid_code' });
    const exp = row.expiresAt || row.expiresat || row.expires_at;
    if (!exp || new Date(exp) < new Date()) return res.status(400).json({ ok:false, error:'expired_code' });
    try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET consumed=true WHERE id=$1', row.id); } catch {}
    const normalized = phone.replace(/\s+/g,'');
    const email = `phone+${normalized}@local`;
    const existing = await db.user.findUnique({ where: { email } as any });
    const user = await db.user.upsert({ where: { email }, update: { phone: normalized }, create: { email, name: normalized, phone: normalized, password: '' } } as any);
    const token = signJwt({ userId: user.id, email: user.email, role: (user as any).role || 'USER' });
    const cookieDomain = process.env.COOKIE_DOMAIN || '.jeeey.com';
    const isProd = (process.env.NODE_ENV || 'production') === 'production';
    // Clear any previous cookies (avoid old admin/user token collisions)
    try {
      res.clearCookie('auth_token', { domain: cookieDomain, path: '/' });
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) res.clearCookie('auth_token', { domain: `api.${root}`, path: '/' });
    } catch {}
    // Primary cookie on root/domain (shop-specific name)
    res.cookie('shop_auth_token', token, {
      httpOnly: true,
      domain: cookieDomain,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 3600 * 24 * 30 * 1000,
      path: '/',
    });
    // Also set cookie specifically for api subdomain to avoid mixed old tokens
    try {
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) {
        res.cookie('shop_auth_token', token, {
          httpOnly: true,
          domain: `api.${root}`,
          sameSite: isProd ? 'none' : 'lax',
          secure: isProd,
          maxAge: 3600 * 24 * 30 * 1000,
          path: '/',
        });
      }
    } catch {}
    return res.json({ ok:true, token, newUser: !existing });
  } catch (e:any) { return res.status(500).json({ ok:false, error: e.message||'otp_verify_failed' }); }
});

// Test-only: latest OTP code for a phone (protected by maintenance secret)
shop.get('/test/otp/latest', async (req: any, res) => {
  try {
    const secret = String(req.headers['x-maintenance-secret']||'')
    const expected = process.env.MAINTENANCE_SECRET || ''
    if (!expected || secret !== expected) return res.status(403).json({ error: 'forbidden' })
    const phone = String(req.query?.phone||'').trim()
    if (!phone) return res.status(400).json({ error: 'phone_required' })
    await ensureOtpTable()
    const row: any = ((await db.$queryRawUnsafe('SELECT code, "createdAt" FROM "OtpCode" WHERE phone=$1 ORDER BY COALESCE("createdAt", NOW()) DESC LIMIT 1', phone)) as any[])[0]
    if (!row) return res.status(404).json({ error: 'not_found' })
    return res.json({ code: String(row.code||''), createdAt: row.createdAt })
  } catch (e:any) {
    return res.status(500).json({ error: e.message||'failed' })
  }
})

// Session info (optional auth)
// Notification preferences
shop.get('/me/preferences', requireAuth, async (req: any, res) => {
  try{
    const userId = req.user.userId;
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "UserPreferences" ("userId" TEXT PRIMARY KEY, email BOOLEAN, sms BOOLEAN, whatsapp BOOLEAN, webpush BOOLEAN, "updatedAt" TIMESTAMP DEFAULT NOW())');
    const row: any = ((await db.$queryRawUnsafe('SELECT * FROM "UserPreferences" WHERE "userId"=$1', userId)) as any[])[0] || { email:true, sms:false, whatsapp:false, webpush:true };
    res.json({ preferences: { email: !!row.email, sms: !!row.sms, whatsapp: !!row.whatsapp, webpush: !!row.webpush } });
  }catch{ res.status(500).json({ error:'failed' }) }
});
shop.put('/me/preferences', requireAuth, async (req: any, res) => {
  try{
    const userId = req.user.userId; const { email=true, sms=false, whatsapp=false, webpush=true } = req.body || {};
    const exists: any = ((await db.$queryRawUnsafe('SELECT 1 FROM "UserPreferences" WHERE "userId"=$1', userId)) as any[])[0];
    if (exists) await db.$executeRawUnsafe('UPDATE "UserPreferences" SET email=$1,sms=$2,whatsapp=$3,webpush=$4,"updatedAt"=NOW() WHERE "userId"=$5', !!email, !!sms, !!whatsapp, !!webpush, userId)
    else await db.$executeRawUnsafe('INSERT INTO "UserPreferences" ("userId",email,sms,whatsapp,webpush) VALUES ($1,$2,$3,$4,$5)', userId, !!email, !!sms, !!whatsapp, !!webpush)
    res.json({ ok:true })
  }catch{ res.status(500).json({ error:'failed' }) }
});
shop.get('/me', async (req: any, res) => {
  try {
    // Maintenance override: allow passing token via query when secret is provided (for E2E/live diagnostics)
    const maint = String(req.headers['x-maintenance-secret']||'');
    const forceToken = (maint && maint === (process.env.MAINTENANCE_SECRET||'')) ? (String((req.query?.t as string)||'').trim() || null) : null;
    // Try multiple token sources in a robust order: forced query token, Authorization header, then cookies
    const candidates: string[] = [];
    if (forceToken) candidates.push(forceToken);
    try {
      const header = (req?.headers?.authorization as string|undefined) || '';
      if (header.startsWith('Bearer ')) candidates.push(header.slice(7));
    } catch {}
    try {
      const shopCookie = req?.cookies?.shop_auth_token as string|undefined;
      if (shopCookie) candidates.push(shopCookie);
    } catch {}
    try {
      const adminCookie = req?.cookies?.auth_token as string|undefined;
      if (adminCookie) candidates.push(adminCookie);
    } catch {}
    let payload: any = null;
    for (const t of candidates) {
      try { payload = verifyJwt(t); break; } catch { continue; }
    }
    if (!payload) return res.json({ user: null });
    let user = await db.user.findUnique({ where: { id: payload.userId }, select: { id:true, email:true, name:true, role:true } });
    if (!user && payload.email && String(payload.role||'USER').toUpperCase() === 'USER') {
      // Fallback: create or link by email to avoid guest state when token is valid but user record missing
      const emailNorm = String(payload.email).toLowerCase();
      const exists = await db.user.findFirst({ where: { email: { equals: emailNorm, mode: 'insensitive' } } as any, select: { id:true, email:true, name:true, role:true } });
      if (exists) user = exists;
      else {
        try {
          const created = await db.user.create({ data: { email: emailNorm, name: emailNorm.split('@')[0] || 'User', password: '' } });
          user = { id: created.id, email: created.email, name: created.name, role: (created as any).role || 'USER' } as any;
        } catch {}
      }
    }
    return res.json({ user: user || null });
  } catch {
    return res.json({ user: null });
  }
});

// Test helper: login via email (maintenance-protected) to simulate Google/OTP flow end state
shop.post('/test/login', async (req: any, res) => {
  try{
    const secret = String(req.headers['x-maintenance-secret']||'');
    if (!secret || secret !== (process.env.MAINTENANCE_SECRET||'')) return res.status(403).json({ error:'forbidden' });
    const email = String(req.body?.email||'').trim().toLowerCase();
    if (!email) return res.status(400).json({ error:'email_required' });
    const name = (req.body?.name && String(req.body.name).trim()) || (email.split('@')[0]||'User');
    const user = await db.user.upsert({ where: { email }, update: { name }, create: { email, name, password: '' } } as any);
    const token = signJwt({ userId: user.id, email: user.email, role: (user as any).role || 'USER' });
    res.json({ ok:true, token });
  }catch(e:any){ return res.status(500).json({ error: e.message||'test_login_failed' }); }
});

// Test helper: verify token and return user (maintenance-protected)
shop.post('/test/me', async (req: any, res) => {
  try{
    const secret = String(req.headers['x-maintenance-secret']||'');
    if (!secret || secret !== (process.env.MAINTENANCE_SECRET||'')) return res.status(403).json({ error:'forbidden' });
    const token = String(req.body?.token||'').trim();
    if (!token) return res.status(400).json({ error:'token_required' });
    const payload = verifyJwt(token);
    const user = await db.user.findUnique({ where: { id: payload.userId }, select: { id:true, email:true, name:true, role:true } });
    return res.json({ user: user || null, payload });
  }catch(e:any){ return res.status(500).json({ error: e.message||'test_me_failed' }); }
});

// Authenticated: complete profile (name/password)
shop.post('/me/complete', requireAuth, async (req: any, res) => {
  try{
    const userId = req.user.userId;
    const { fullName, password, confirm } = req.body || {};
    const name = String(fullName||'').trim();
    const passRaw = String(password||'');
    const conf = String(confirm||'');
    if (!name) return res.status(400).json({ ok:false, error:'invalid_name' });
    const updateData: any = { name };
    if (passRaw) {
      if (passRaw.length < 6 || passRaw !== conf) return res.status(400).json({ ok:false, error:'invalid_password' });
      try{
        const bcrypt = require('bcryptjs');
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(passRaw, salt);
        updateData.password = hash;
      }catch{
        updateData.password = passRaw;
      }
    }
    await db.user.update({ where: { id: userId }, data: updateData } as any);
    return res.json({ ok:true });
  }catch(e:any){ return res.status(500).json({ ok:false, error: e.message||'complete_failed' }); }
});

// Public: products list (basic)
shop.get('/products', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit||20)));
    const sort = String(req.query.sort||'new');
    const orderBy: any = sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };
    const items = await db.product.findMany({
      select: { id: true, name: true, price: true, images: true },
      orderBy,
      take: limit,
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

// Public: product detail
shop.get('/product/:id', async (req, res) => {
  try {
    const p = await db.product.findUnique({
      where: { id: String(req.params.id) },
      include: { category: { select: { id: true, name: true } }, reviews: true },
    });
    if (!p) return res.status(404).json({ error: 'not_found' });
    res.json(p);
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Categories list
shop.get('/categories', async (_req, res) => {
  try {
    const categories = await db.category.findMany({
      select: { id: true, name: true, image: true, slug: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 100,
    });
    res.json({ categories });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Catalog by category slug or id
shop.get('/catalog/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const cat = await db.category.findFirst({ where: { OR: [{ slug }, { id: slug }] }, select: { id: true } });
    if (!cat) return res.json({ items: [] });
    const limit = Math.min(100, Math.max(1, Number(req.query.limit||24)));
    const sort = String(req.query.sort||'reco');
    const orderBy: any = sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };
    const items = await db.product.findMany({ where: { categoryId: cat.id }, select: { id:true, name:true, price:true, images:true }, orderBy, take: limit });
    res.json({ items });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Public: tracking keys for client injection (merged from latest integrations)
shop.get('/tracking/keys', async (_req, res) => {
  try {
    const latest = await db.integration.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    const merged: Record<string, string> = {};
    for (const it of latest) {
      const cfg: any = (it as any).config || {};
      for (const [k, v] of Object.entries(cfg)) {
        if (typeof v === 'string' && !(k in merged)) merged[k] = v as string;
      }
    }
    res.json({ keys: merged });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'tracking_keys_failed' });
  }
});

// Google OAuth login
shop.get('/auth/google/login', async (req, res) => {
  try{
    const cfg = await getGoogleOAuthConfig();
    if (!cfg) return res.status(400).json({ error:'google_not_configured' });
    const { clientId, redirectUri } = cfg;
    const state = Buffer.from(JSON.stringify({ next: String(req.query.next||'/account') })).toString('base64url');
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    return res.redirect(authUrl);
  }catch(e:any){ return res.status(500).json({ error: e.message||'google_login_failed' }) }
});

shop.get('/auth/google/callback', async (req, res) => {
  try{
    const cfg = await getGoogleOAuthConfig();
    if (!cfg) return res.status(400).json({ error:'google_not_configured' });
    const { clientId, clientSecret, redirectUri } = cfg;
    const code = String(req.query.code||'');
    const stateRaw = String(req.query.state||'');
    const state = (()=>{ try{ return JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')) }catch{ return { next:'/account' } } })();
    const ru = String(req.query.ru||'');
    if (!code) return res.status(400).json({ error:'missing_code' });
    const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId });
    if (clientSecret) body.set('client_secret', clientSecret);
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{ 'content-type':'application/x-www-form-urlencoded' }, body });
    const tok = await tokenRes.json().catch(()=>({}));
    const idToken = tok.id_token as string|undefined;
    if (!idToken) return res.status(400).json({ error:'invalid_token' });
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload: any = ticket.getPayload() || {};
    const email = String(payload.email||'').toLowerCase();
    const name = String(payload.name||'') || String(payload.given_name||'') || 'User';
    if (!email) return res.status(400).json({ error:'email_required' });
    const existing = await db.user.findUnique({ where: { email } as any });
    const user = await db.user.upsert({ where: { email }, update: { name }, create: { email, name, phone: '', password: '' } } as any);
    const token = signJwt({ userId: user.id, email: user.email, role: (user as any).role || 'USER' });
    const cookieDomain = process.env.COOKIE_DOMAIN || '.jeeey.com';
    const isProd = (process.env.NODE_ENV || 'production') === 'production';
    // Write domain cookie
    try { res.cookie('shop_auth_token', token, { httpOnly:true, domain: cookieDomain, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 3600*24*30*1000, path:'/' }); } catch {}
    // Also write api subdomain cookie to ensure /api/me sees it when third-party blocked
    try{
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) {
        res.cookie('shop_auth_token', token, { httpOnly:true, domain: `api.${root}`, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 3600*24*30*1000, path:'/' });
      }
    }catch{}
    // Host-only fallback for strict environments
    try { res.cookie('shop_auth_token', token, { httpOnly:true, sameSite: 'lax', secure: isProd, maxAge: 3600*24*30*1000, path:'/' }); } catch {}
    // Persist token for SPA fallback (localStorage) via URL param
    // Dynamic mweb base inferred from referer if present
    let mwebBase = process.env.MWEB_BASE_URL || '';
    try { if (!mwebBase && req.headers.referer) { const u = new URL(String(req.headers.referer)); mwebBase = `${u.protocol}//${u.host.replace('api.','m.')}`; } } catch {}
    if (!mwebBase) mwebBase = 'https://m.jeeey.com';
    const next = String(state?.next||'/account');
    let dest = ru ? `${ru}` : `${mwebBase}${next.startsWith('/')?next:'/'+next}`;
    // Append token for client-side fallback (SPA will store in localStorage)
    try{
      const u = new URL(dest);
      u.searchParams.set('t', token);
      dest = u.toString();
    }catch{}
    return res.redirect(dest);
  }catch(e:any){ return res.status(500).json({ error: e.message||'google_callback_failed' }) }
});

// Cart endpoints (auth-required)
shop.get('/cart', requireAuth, async (req: any, res) => {
  const userId = req.user.userId;
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } } },
  });
  const subtotal = (cart?.items ?? []).reduce((s, it) => s + it.quantity * (it.product?.price || 0), 0);
  res.json({ cart, subtotal });
});

shop.post('/cart/add', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    let cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) cart = await db.cart.create({ data: { userId } });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + Number(quantity || 1) } });
    else await db.cartItem.create({ data: { cartId: cart.id, productId, quantity: Number(quantity || 1) } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/update', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body || {};
    if (!productId || typeof quantity !== 'number') return res.status(400).json({ error: 'invalid' });
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return res.json({ success: true });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (!existing) return res.json({ success: true });
    if (quantity <= 0) await db.cartItem.delete({ where: { id: existing.id } });
    else await db.cartItem.update({ where: { id: existing.id }, data: { quantity } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/remove', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return res.json({ success: true });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) await db.cartItem.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/clear', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const cart = await db.cart.findUnique({ where: { userId } });
    if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Orders
shop.get('/orders/me', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const orders = await db.order.findMany({
      where: { userId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true } } } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((o) => ({ id: o.id, status: (o.status || 'PENDING').toLowerCase(), total: Number(o.total || 0), date: o.createdAt })));
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/orders', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId, ref } = req.body || {};
    const cart = await db.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    const total = cart.items.reduce((s, it) => s + it.quantity * Number(it.product?.price || 0), 0);
    const order = await db.order.create({
      data: {
        userId,
        status: 'PENDING',
        total,
        shippingAddressId: shippingAddressId || null,
        items: { create: cart.items.map((ci) => ({ productId: ci.productId, quantity: ci.quantity, price: Number(ci.product?.price || 0) })) },
      },
      include: { items: true },
    });
    // Affiliate ledger (create table if needed)
    if (ref) {
      try {
        await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AffiliateLedger" (id TEXT PRIMARY KEY, ref TEXT, "orderId" TEXT, amount DOUBLE PRECISION, commission DOUBLE PRECISION, status TEXT, "createdAt" TIMESTAMP DEFAULT NOW())');
        const id = Math.random().toString(36).slice(2);
        const commission = Number((total * 0.05).toFixed(2));
        await db.$executeRawUnsafe('INSERT INTO "AffiliateLedger" (id, ref, "orderId", amount, commission, status) VALUES ($1,$2,$3,$4,$5,$6)', id, String(ref), order.id, Number(total), commission, 'PENDING');
      } catch {}
    }
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ order });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Order detail
shop.get('/orders/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const id = String(req.params.id);
    const order = await db.order.findFirst({
      where: { id, userId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } }, payment: true, shippingAddress: true },
    });
    if (!order) return res.status(404).json({ error: 'not_found' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Pay order (mock finalize)
shop.post('/orders/:id/pay', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const id = String(req.params.id);
    const method = String(req.body?.method || 'CASH_ON_DELIVERY');
    const order = await db.order.findFirst({ where: { id, userId }, include: { payment: true } });
    if (!order) return res.status(404).json({ error: 'not_found' });
    // Upsert payment
    const amount = Number(order.total || 0);
    if (order.payment) {
      await db.payment.update({ where: { orderId: order.id }, data: { status: 'COMPLETED', method } as any });
    } else {
      await db.payment.create({ data: { orderId: order.id, amount, currency: 'SAR', method: method as any, status: 'COMPLETED' } as any });
    }
    await db.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    // Loyalty: accrue points (1 point لكل 10 SAR)
    try {
      await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "PointLedger" (id TEXT PRIMARY KEY, "userId" TEXT NOT NULL, points INTEGER NOT NULL, reason TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
      const idp = Math.random().toString(36).slice(2);
      const pts = Math.floor(Number(amount) / 10);
      if (pts > 0) await db.$executeRawUnsafe('INSERT INTO "PointLedger" (id, "userId", points, reason) VALUES ($1,$2,$3,$4)', idp, userId, pts, 'ORDER_PAID');
    } catch {}
    // Affiliate: approve commission
    try {
      await db.$executeRawUnsafe('UPDATE "AffiliateLedger" SET status=\'APPROVED\' WHERE "orderId"=$1 AND status=\'PENDING\'', order.id);
    } catch {}
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Addresses (single-address per user schema)
shop.get('/addresses', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const a = await db.address.findUnique({ where: { userId } });
    res.json(a ? [a] : []);
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/addresses', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    // Map incoming fields to schema
    const { country, province, city, street, details, postalCode } = req.body || {};
    const payload = {
      country: String(country || 'SA'),
      state: String(province || ''),
      city: String(city || ''),
      postalCode: String(postalCode || ''),
      street: String(street || '') + (details ? ` - ${String(details)}` : ''),
      isDefault: true,
    };
    const exists = await db.address.findUnique({ where: { userId } });
    const addr = exists
      ? await db.address.update({ where: { userId }, data: payload })
      : await db.address.create({ data: { ...payload, userId } });
    res.json({ address: addr });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.delete('/addresses/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const exists = await db.address.findUnique({ where: { userId } });
    if (exists) await db.address.delete({ where: { userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Wishlist
shop.get('/wishlist', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const items = await db.wishlistItem.findMany({ where: { userId }, include: { product: { select: { id: true, name: true, price: true, images: true } } } });
    res.json(items.map(w => ({ id: w.productId, title: w.product?.name || '', price: Number(w.product?.price || 0), img: w.product?.images?.[0] })));
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/wishlist/toggle', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const exists = await db.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
    if (exists) {
      await db.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
      return res.json({ removed: true });
    } else {
      await db.wishlistItem.create({ data: { userId, productId } });
      return res.json({ added: true });
    }
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

export default shop;

// Payments session (Stripe/HyperPay via integrations)
shop.post('/payments/session', requireAuth, async (req: any, res) => {
  try{
    const { amount, currency='SAR', method='CARD', returnUrl, cancelUrl, ref } = req.body || {}
    const integrations = await db.integration.findMany({ orderBy: { createdAt: 'desc' } })
    const cfg = integrations.reduce((acc:any,it:any)=>Object.assign(acc,it.config||{}),{})
    if (cfg.provider === 'stripe' && cfg.secretKey){
      const body = new URLSearchParams({
        'success_url': String(returnUrl||''),
        'cancel_url': String(cancelUrl||''),
        'mode': 'payment',
        'line_items[0][price_data][currency]': String(currency).toLowerCase(),
        'line_items[0][price_data][product_data][name]': 'Order',
        'line_items[0][price_data][unit_amount]': String(Math.round(Number(amount||0)*100)),
        'line_items[0][quantity]': '1',
        'metadata[ref]': String(ref||'')
      })
      const sr = await fetch('https://api.stripe.com/v1/checkout/sessions', { method:'POST', headers:{ 'Authorization': `Bearer ${cfg.secretKey}`, 'Content-Type':'application/x-www-form-urlencoded' }, body })
      const sj = await sr.json()
      if (sj && sj.url) return res.json({ redirectUrl: sj.url })
      return res.status(400).json({ error:'stripe_session_failed', details:sj })
    }
    // HyperPay placeholder
    if (cfg.provider === 'hyperpay' && cfg.accessToken){
      // Return a hosted payment page URL placeholder; real integration requires prepare checkoutId then redirect
      const url = String(returnUrl||'/pay/success')
      return res.json({ redirectUrl: url })
    }
    return res.status(400).json({ error:'no_provider' })
  }catch(e:any){ res.status(500).json({ error: e.message||'failed' }) }
})

// Stripe webhook (signature validation omitted for brevity)
shop.post('/webhooks/stripe', async (req: Request, res) => {
  try{
    const event: any = req.body
    if (event?.type === 'checkout.session.completed'){
      const session = event.data?.object
      // Mark order paid if metadata carries order id (optional); otherwise no-op
      // Implement custom mapping as needed
    }
    res.json({ received:true })
  }catch{ res.status(200).end() }
})

// Coupons apply with rules
shop.post('/coupons/apply', requireAuth, async (req:any, res) => {
  try{
    const { code } = req.body || {}
    if (!code) return res.status(400).json({ error:'code_required' })
    const c = await db.coupon.findUnique({ where: { code: String(code) } })
    if (!c) return res.status(404).json({ error:'not_found' })
    const now = Date.now()
    if (c.validFrom && new Date(c.validFrom).getTime() > now) return res.status(400).json({ error:'not_started' })
    if (c.validUntil && new Date(c.validUntil).getTime() < now) return res.status(400).json({ error:'expired' })
    const rules: any = (c as any).rules || {}
    if (rules.enabled === false) return res.status(400).json({ error:'disabled' })
    // TODO: enforce includes/excludes by cart content (requires join); allow pass-through for now
    res.json({ ok: true, coupon: { code: c.code, type: c.discountType, value: c.discountValue } })
  }catch(e:any){ res.status(500).json({ error:e.message||'failed' }) }
})

// Shipping quote (simple placeholder; replace with provider call if enabled)
shop.get('/shipping/quote', async (req, res) => {
  try{
    const method = String(req.query.method||'std')
    const base = method==='fast' ? 30 : 18
    res.json({ price: base })
  }catch{ res.status(500).json({ error:'failed' }) }
})

// Search suggestions
shop.get('/search/suggest', async (req, res)=>{
  try{
    const q = String(req.query.q||'').trim()
    if (!q) return res.json({ items: [] })
    const rows = await db.product.findMany({ where: { name: { contains: q, mode:'insensitive' } }, select: { name:true }, take: 10 })
    res.json({ items: rows.map(r=>r.name) })
  }catch{ res.status(500).json({ items: [] }) }
})

