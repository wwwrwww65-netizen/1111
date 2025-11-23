import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@repo/db';
import type { Prisma } from '@prisma/client';
import { readTokenFromRequest, verifyJwt, signJwt } from '../utils/jwt';
import type { Request } from 'express';
import type { Response } from 'express';
import { normalizeCategoriesPageConfig } from '../validators/categories-page';
import path from 'path';
import fs from 'fs';

const shop = Router();

// -------- Auth: logout (shop scope) --------
// Provide REST logout for mweb to clear auth cookies reliably
function clearShopCookies(res: Response): void {
  const isProd = (process.env.NODE_ENV || 'production') === 'production';
  const base: any = { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' };
  const names = ['shop_auth_token', 'auth_token'];
  // Host-only clears
  for (const name of names) {
    try { res.clearCookie(name, base); } catch { }
  }
  // Domain clears for apex (e.g., .jeeey.com) when configured/known
  let domain = process.env.COOKIE_DOMAIN as string | undefined;
  if (!domain && process.env.NODE_ENV === 'production') {
    domain = '.jeeey.com';
  }
  if (domain) {
    for (const name of names) {
      try { res.clearCookie(name, { ...base, domain }); } catch { }
    }
    // Also clear api subdomain variant for stricter browsers
    try {
      const root = domain.startsWith('.') ? domain.slice(1) : domain;
      if (root) {
        for (const name of names) {
          try { res.clearCookie(name, { ...base, domain: `api.${root}` }); } catch { }
        }
      }
    } catch { }
  }
}
// -------- Auth: me (shop scope) --------
shop.get('/auth/me', async (req: any, res) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ error: 'invalid_token' });

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'user_not_found' });
    return res.json(user);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'auth_me_failed' });
  }
});

// -------- Auth: Wishlist (shop scope) --------
shop.get('/auth/wishlist', async (req: any, res) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ error: 'invalid_token' });

    const items = await db.$queryRawUnsafe(
      `SELECT p.id, p.name as title, p.price, p.images, p.image 
       FROM "Wishlist" w
       JOIN "Product" p ON w."productId" = p.id
       WHERE w."userId" = $1
       ORDER BY w."createdAt" DESC`,
      payload.userId
    );

    // Normalize images for frontend
    const formatted = (items as any[]).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      img: (Array.isArray(p.images) && p.images[0]) ? p.images[0] : (p.image || '')
    }));

    return res.json(formatted);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'wishlist_list_failed' });
  }
});

// -------- Auth: Coupons (shop scope) --------
shop.get('/auth/coupons', async (req: any, res) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ error: 'invalid_token' });

    const now = new Date();
    // Fetch active and valid coupons
    const coupons = await db.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });

    // Check usage
    const userUsage = await db.couponUsage.findMany({
      where: { userId: payload.userId },
      select: { couponId: true },
    });
    const usedIds = new Set(userUsage.map(u => u.couponId));

    const available = coupons.filter(c => {
      if (usedIds.has(c.id)) return false;
      if (c.maxUses != null && c.currentUses >= c.maxUses) return false;
      return true;
    });

    return res.json(available);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'coupons_list_failed' });
  }
});

shop.post('/auth/wishlist/toggle', async (req: any, res) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ error: 'invalid_token' });

    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'missing_product_id' });

    const exists: any[] = await db.$queryRawUnsafe(
      `SELECT 1 FROM "Wishlist" WHERE "userId" = $1 AND "productId" = $2`,
      payload.userId, productId
    );

    if (exists.length > 0) {
      await db.$executeRawUnsafe(
        `DELETE FROM "Wishlist" WHERE "userId" = $1 AND "productId" = $2`,
        payload.userId, productId
      );
      return res.json({ added: false });
    } else {
      await db.$executeRawUnsafe(
        `INSERT INTO "Wishlist" ("userId", "productId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        payload.userId, productId
      );
      return res.json({ added: true });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'wishlist_toggle_failed' });
  }
});

shop.post('/auth/logout', async (_req: any, res) => {
  try {
    clearShopCookies(res as unknown as Response);
  } catch { }
  return res.json({ success: true });
});

// -------------------- Public caching helpers (API output) --------------------
const PUBLIC_SW_MAX_AGE = Number(process.env.PUBLIC_SW_MAX_AGE || 30);
const PUBLIC_SW_SWR = Number(process.env.PUBLIC_SW_SWR || 120);
function setPublicCache(res: any, maxAge = PUBLIC_SW_MAX_AGE, swr = PUBLIC_SW_SWR): void {
  try { res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${swr}`); } catch { }
}
// Lightweight ETag helper for public GET responses
function __etagFor(payload: any): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const raw = JSON.stringify(payload);
    const h = crypto.createHash('sha1').update(raw).digest('hex');
    return `W/"${h}"`;
  } catch { return ''; }
}
function __maybe304(req: any, res: any, payload: any): boolean {
  try {
    const tag = __etagFor(payload);
    if (tag) {
      const inm = String(req.headers['if-none-match'] || '');
      if (inm && inm === tag) { res.status(304).end(); return true; }
      res.set('ETag', tag);
    }
  } catch { }
  return false;
}
// Cached aggregates to avoid heavy queries on hot paths
type RankEntry = { rank: number; qty: number };
let topSalesCache: { ts: number; map: Map<string, RankEntry> } | null = null;
const CATEGORY_RANK_TTL_MS = 300_000; // 5 minutes
const categoryRanksCache: Map<string, { ts: number; rows: Array<{ pid: string; qty: number }> }> = new Map();

// ===================== Variant normalization helpers =====================
function normToken(s: string): string { return String(s || '').trim().toLowerCase() }
function normalizeDigits(input: string): string {
  // Convert Arabic-Indic digits to ASCII to improve numeric matching
  return String(input || '').replace(/[\u0660-\u0669]/g, (d) => String((d as any).charCodeAt(0) - 0x0660));
}
const COLOR_WORDS = new Set<string>([
  'احمر', 'أحمر', 'احمَر', 'أحمَر', 'red', 'ازرق', 'أزرق', 'azraq', 'blue', 'اخضر', 'أخضر', 'green', 'اصفر', 'أصفر', 'yellow', 'وردي', 'زهري', 'pink', 'اسود', 'أسود', 'black', 'ابيض', 'أبيض', 'white', 'بنفسجي', 'violet', 'purple', 'برتقالي', 'orange', 'بني', 'brown', 'رمادي', 'gray', 'grey', 'سماوي', 'turquoise', 'تركوازي', 'تركواز', 'بيج', 'beige', 'كحلي', 'navy', 'ذهبي', 'gold', 'فضي', 'silver',
  // Common Arabic commercial color phrases/synonyms
  'دم الغزال', 'لحمي', 'خمري', 'عنابي', 'طوبي'
]);
function isColorWord(s: string): boolean {
  const t = normToken(s);
  if (!t) return false;
  if (COLOR_WORDS.has(t)) return true;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return true;
  if (/^[\p{L}\s]{2,}$/u.test(s) && /ي$/.test(s)) return true; // Arabic adjective ending heuristic
  return false;
}
function looksSizeToken(s: string): boolean {
  const t = normToken(normalizeDigits(s));
  if (!t) return false;
  if (/^(xxs|xs|s|m|l|xl|xxl|xxxl|xxxxl|xxxxxxl)$/i.test(t)) return true;
  // Numeric multiplier sizes like 2XL, 3XL, 4XL ...
  if (/^\d{1,2}xl$/i.test(t)) return true;
  if (/^(\d{2}|\d{1,3})$/.test(t)) return true;
  if (/^(صغير|وسط|متوسط|كبير|كبير جدا|فري|واحد|حر|طفل|للرضع|للنساء|للرجال|واسع|ضيّق)$/.test(t)) return true;
  return false;
}
function splitTokens(s: string): string[] {
  // Split on commas (EN/AR), whitespace, slashes, dashes, pipes, bullets, and colons
  return String(s || '').split(/[\s,،\/\-\|·•:]+/).map(x => x.trim()).filter(Boolean);
}

function extractOptions(rec: any): { sizes: string[]; colors: string[] } {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  const visit = (name: string, value: string) => {
    const n = normToken(name);
    const raw = String(value || '').trim();
    // Split pipes into multiple candidates when present (e.g., "M|مقاسات بالأرقام")
    const candidates = raw.includes('|') ? raw.split('|').map(s => s.trim()).filter(Boolean) : [raw];
    for (const v0 of candidates) {
      const v = String(v0 || '').trim();
      if (!v) continue;
      if (/size|مقاس/i.test(n)) {
        if (!isColorWord(v) && looksSizeToken(v)) sizes.add(v);
        continue;
      }
      if (/color|لون/i.test(n)) {
        if (isColorWord(v)) colors.add(v);
        continue;
      }
      // Heuristics
      if (looksSizeToken(v) && !isColorWord(v)) sizes.add(v);
      else if (isColorWord(v)) colors.add(v);
    }
  };
  const arrays: any[] = [];
  try { if (Array.isArray(rec?.option_values)) arrays.push(rec.option_values); } catch { }
  try { if (Array.isArray(rec?.optionValues)) arrays.push(rec.optionValues); } catch { }
  try { if (Array.isArray(rec?.options)) arrays.push(rec.options); } catch { }
  try { if (Array.isArray(rec?.attributes)) arrays.push(rec.attributes); } catch { }
  for (const arr of arrays) {
    for (const it of (arr || [])) {
      if (it && (it.name != null || it.key != null)) visit(String(it.name || it.key || ''), String(it.value || it.val || it.label || ''));
    }
  }
  const tryParseJSON = (raw: string) => {
    try {
      const j = JSON.parse(raw);
      if (Array.isArray(j)) {
        for (const it of j) {
          if (typeof it === 'string') visit('auto', it);
          else if (it && (it.name != null || it.key != null)) visit(String(it.name || it.key || ''), String(it.value || it.val || it.label || ''));
        }
      } else if (j && typeof j === 'object') {
        for (const [k, v] of Object.entries(j)) visit(String(k), String(v as any));
      }
    } catch { }
  };
  if (typeof rec?.value === 'string' && (rec.value.startsWith('{') || rec.value.startsWith('['))) tryParseJSON(rec.value);
  if (typeof rec?.name === 'string' && (rec.name.startsWith('{') || rec.name.startsWith('['))) tryParseJSON(rec.name);
  return { sizes: Array.from(sizes), colors: Array.from(colors) };
}

// Derive structured attributes from a variant record
function extractAttributeGroups(rec: any): { sizeGroups: Map<string, Set<string>>; colors: Set<string> } {
  const sizeGroups = new Map<string, Set<string>>();
  const colors = new Set<string>();
  const norm = (s: string) => String(s || '').trim();
  const pushSize = (label: string, only: string) => {
    const key = norm(label);
    const val = norm(only);
    if (!val) return;
    if (!looksSizeToken(val)) return;
    if (!sizeGroups.has(key)) sizeGroups.set(key, new Set());
    sizeGroups.get(key)!.add(val);
  };
  const visit = (name: string, value: string) => {
    const n = norm(name).toLowerCase();
    const vRaw = norm(value);
    if (!vRaw) return;
    if (/color|لون/i.test(n)) { colors.add(vRaw); return; }
    if (/size|مقاس/i.test(n)) {
      // Support multi-part expressions like "مقاسات بالأحرف:M|مقاسات بالأرقام:96" or "M|مقاسات بالأرقام"
      const parts = vRaw.includes('|') ? vRaw.split('|').map(s => s.trim()).filter(Boolean) : [vRaw];
      for (const part of parts) {
        if (!part) continue;
        if (part.includes(':')) {
          const [label, only] = part.split(':', 2) as [string, string];
          pushSize(label, only);
        } else {
          // No explicit label: keep under generic label; will be reclassified later
          pushSize('المقاس', part);
        }
      }
      return;
    }
  };
  const arrays: any[] = [];
  try { if (Array.isArray(rec?.option_values)) arrays.push(rec.option_values); } catch { }
  try { if (Array.isArray(rec?.optionValues)) arrays.push(rec.optionValues); } catch { }
  try { if (Array.isArray(rec?.options)) arrays.push(rec.options); } catch { }
  try { if (Array.isArray(rec?.attributes)) arrays.push(rec.attributes); } catch { }
  for (const arr of arrays) {
    for (const it of (arr || [])) {
      if (it && (it.name != null || it.key != null)) visit(String(it.name || it.key || ''), String(it.value || it.val || it.label || ''));
    }
  }
  const tryParseJSON = (raw: string) => {
    try {
      const j = JSON.parse(raw);
      if (Array.isArray(j)) {
        for (const it of j as any[]) {
          if (typeof it === 'string') visit('size', it);
          else if (it && (it.name != null || it.key != null)) visit(String(it.name || it.key || ''), String(it.value || it.val || it.label || ''));
        }
      } else if (j && typeof j === 'object') {
        const ov = (j as any).option_values;
        if (Array.isArray(ov)) {
          for (const it of ov) { if (it && (it.name != null || it.key != null)) visit(String(it.name || it.key || ''), String(it.value || it.val || it.label || '')); }
        } else {
          for (const [k, v] of Object.entries(j)) visit(String(k), String(v as any));
        }
      }
    } catch { }
  };
  if (typeof rec?.value === 'string') tryParseJSON(rec.value);
  if (typeof rec?.name === 'string') tryParseJSON(rec.name);
  // Heuristic fallback from tokens
  const tokens = splitTokens(`${norm(rec?.name)} ${norm(rec?.value)}`);
  for (const t of tokens) { if (looksSizeToken(t) && !isColorWord(t)) { if (!sizeGroups.has('المقاس')) sizeGroups.set('المقاس', new Set()); sizeGroups.get('المقاس')!.add(t); } }
  for (const t of tokens) { if (isColorWord(t)) colors.add(t); }
  // Normalize groups: split generic 'المقاس' into letters/numbers if specific groups exist or derive them
  const lettersLabel = 'مقاسات بالأحرف';
  const numbersLabel = 'مقاسات بالأرقام';
  const hasLetters = Array.from(sizeGroups.keys()).some(k => k.includes('بالأحرف'));
  const hasNumbers = Array.from(sizeGroups.keys()).some(k => k.includes('بالأرقام'));
  if (sizeGroups.has('المقاس')) {
    const vals = Array.from(sizeGroups.get('المقاس') || []);
    for (const v of vals) {
      if (/^\d{1,3}$/.test(normalizeDigits(v))) {
        const key = numbersLabel; if (!sizeGroups.has(key)) sizeGroups.set(key, new Set()); sizeGroups.get(key)!.add(v);
      } else {
        const key = lettersLabel; if (!sizeGroups.has(key)) sizeGroups.set(key, new Set()); sizeGroups.get(key)!.add(v);
      }
    }
    sizeGroups.delete('المقاس');
  }
  // Deduplicate and sanitize any stray "M|..." artifacts (keep the size-looking token only)
  for (const [k, set] of Array.from(sizeGroups.entries())) {
    const cleaned = new Set<string>();
    for (const v of set) {
      const cands = v.includes('|') ? v.split('|').map(s => s.trim()) : [v];
      let chosen = cands.find(x => looksSizeToken(x));
      if (!chosen) chosen = v;
      cleaned.add(chosen);
    }
    sizeGroups.set(k, cleaned);
  }
  return { sizeGroups, colors };
}
// Reverse geocoding proxy (Nominatim) to avoid browser CORS
shop.get('/reverse-geocode', async (req: any, res) => {
  try {
    const lat = parseFloat(String(req.query.lat || ''));
    const lng = parseFloat(String(req.query.lng || ''));
    if (!isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ error: 'invalid_coordinates' });
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=ar&addressdetails=1`;
    const ua = process.env.NOMINATIM_UA || 'jeeey-local-dev/1.0 (+contact@jeeey.com)';
    const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept': 'application/json' } });
    if (!r.ok) {
      return res.status(r.status).json({ error: 'reverse_failed' });
    }
    const j = await r.json();
    return res.json(j);
  } catch (e: any) {
    return res.status(500).json({ error: 'reverse_exception', message: e?.message || 'failed' });
  }
});

// Lightweight on-the-fly thumbnailer for uploaded media (safe path-only)
shop.get('/media/thumb', async (req, res) => {
  try {
    const srcRaw = String(req.query.src || '').trim();
    const w = Math.max(64, Math.min(1200, Number(req.query.w || 512)));
    const q = Math.max(40, Math.min(85, Number(req.query.q || 60)));
    const fm = String(req.query.fm || 'webp').toLowerCase();
    if (!srcRaw) return res.status(400).send('src required');
    // Allow only uploads under our API domain or local /uploads path
    const apiHost = (process.env.PUBLIC_API_BASE || process.env.API_BASE_URL || 'https://api.jeeey.com').replace(/\/+$/, '');
    let localRel = '';
    if (srcRaw.startsWith('/uploads/')) localRel = srcRaw;
    else if (srcRaw.startsWith(`${apiHost}/uploads/`)) localRel = srcRaw.slice(apiHost.length);
    else return res.status(400).send('invalid src');
    const abs = path.resolve(process.cwd(), '.' + localRel);
    // Ensure within uploads directory
    const uploadsRoot = path.resolve(process.cwd(), './uploads');
    if (!abs.startsWith(uploadsRoot)) return res.status(403).send('forbidden');
    if (!fs.existsSync(abs)) return res.status(404).send('not_found');
    // Cache headers
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    // Try sharp; fallback to streaming original
    let sharpMod: any = null;
    try { sharpMod = require('sharp'); } catch { }
    if (!sharpMod) {
      const stream = fs.createReadStream(abs);
      stream.on('error', () => res.status(500).end('stream_error'));
      return stream.pipe(res);
    }
    const ext = (path.extname(abs).toLowerCase() || '').replace('.jpeg', '.jpg');
    const sharp = sharpMod(fs.readFileSync(abs));
    // Encode based on requested format (default webp)
    let out: Buffer;
    if (fm === 'avif') {
      out = await sharp.resize({ width: w, withoutEnlargement: true }).avif({ quality: q }).toBuffer();
      res.type('image/avif').send(out);
    } else {
      out = await sharp.resize({ width: w, withoutEnlargement: true }).webp({ quality: q }).toBuffer();
      res.type('image/webp').send(out);
    }
  } catch (e: any) {
    try { res.status(500).send(e?.message || 'thumb_failed') } catch { }
  }
});

// =============== Tabs (published) public endpoints ===============
// List published tabs for device (default: MOBILE)
shop.get('/tabs/list', async (_req: any, res) => {
  try {
    setPublicCache(res, 60, 300);
    const device = String(_req.query.device || 'MOBILE').toUpperCase();
    const rows = await db.tabPage.findMany({
      where: { status: 'PUBLISHED', device: device as any },
      orderBy: { updatedAt: 'desc' },
      select: { slug: true, label: true }
    } as any);
    return res.json({ tabs: rows });
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'tabs_list_failed' }); }
});

// List published Categories tabs only (content.type === 'categories-v1')
shop.get('/tabs/categories/list', async (req: any, res) => {
  try {
    setPublicCache(res, 60, 300);
    const device = String(req.query.device || 'MOBILE').toUpperCase();
    const pages: Array<any> = await db.tabPage.findMany({
      where: { status: 'PUBLISHED', device: device as any },
      orderBy: { updatedAt: 'desc' },
      select: { slug: true, label: true, currentVersionId: true }
    } as any);
    const versionIds = pages.map((p: any) => p.currentVersionId).filter(Boolean);
    if (!versionIds.length) return res.json({ tabs: [] });
    const versions: Array<any> = await db.tabPageVersion.findMany({
      where: { id: { in: versionIds } },
      select: { id: true, content: true }
    } as any);
    const byId = new Map<string, any>(versions.map((v: any) => [v.id, v]));
    const tabs = pages
      .filter((p: any) => p.currentVersionId && byId.get(p.currentVersionId)?.content?.type === 'categories-v1')
      .map((p: any) => ({ slug: p.slug, label: p.label }));
    {
      const payload = { tabs };
      if (__maybe304(req, res, payload)) return;
      return res.json(payload);
    }
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'tabs_categories_list_failed' }); }
});

// Get published tab content by slug
shop.get('/tabs/:slug', async (req: any, res) => {
  try {
    setPublicCache(res, 60, 300);
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'invalid_slug' });
    const page: any = await db.tabPage.findUnique({ where: { slug }, select: { id: true, status: true, currentVersionId: true } } as any);
    if (!page || page.status !== 'PUBLISHED' || !page.currentVersionId) return res.status(404).json({ error: 'not_found' });
    const version: any = await db.tabPageVersion.findUnique({ where: { id: page.currentVersionId }, select: { content: true } } as any);
    {
      const payload = { slug, content: version?.content || { sections: [] } };
      if (__maybe304(req, res, payload)) return;
      return res.json(payload);
    }
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'tabs_get_failed' }); }
});

// Track impressions/clicks for a tab page by slug (best-effort; day-bucketed)
shop.post('/tabs/track', async (req: any, res) => {
  try {
    const { slug, type } = req.body || {};
    if (!slug || !['impression', 'click'].includes(String(type))) return res.status(400).json({ ok: false });
    const p: any = await db.tabPage.findUnique({ where: { slug }, select: { id: true } } as any);
    if (!p) return res.json({ ok: true });
    const day = new Date(); day.setUTCHours(0, 0, 0, 0);
    const existing: any = await db.tabPageStat.findUnique({ where: { tabPageId_date: { tabPageId: p.id, date: day } } } as any).catch(() => null);
    if (!existing) {
      await db.tabPageStat.create({ data: { tabPageId: p.id, date: day, impressions: type === 'impression' ? 1 : 0, clicks: type === 'click' ? 1 : 0 } } as any);
    } else {
      await db.tabPageStat.update({ where: { tabPageId_date: { tabPageId: p.id, date: day } }, data: { impressions: existing.impressions + (type === 'impression' ? 1 : 0), clicks: existing.clicks + (type === 'click' ? 1 : 0) } } as any);
    }
    return res.json({ ok: true });
  } catch { return res.json({ ok: true }); }
});

// Geo helpers
async function ensureCountry(code?: string | null, name?: string | null) {
  const codeNorm = (code || '').trim().toUpperCase() || null;
  const nameNorm = (name || '').trim();
  let country: any = null;
  try {
    if (codeNorm) country = await db.country.findFirst({ where: { code: codeNorm } });
    if (!country && nameNorm) country = await db.country.findFirst({ where: { name: nameNorm } });
  } catch { }
  if (!country) {
    country = await db.country.create({ data: { code: codeNorm, name: nameNorm || (codeNorm || 'YE') } });
  } else if (!country.code && codeNorm) {
    try { country = await db.country.update({ where: { id: country.id }, data: { code: codeNorm } }); } catch { }
  }
  return country;
}

// List governorates for a country (admin-managed): use City names as provinces; no static fallback
shop.get('/geo/governorates', async (req: any, res) => {
  try {
    const countryQ = String(req.query.country || 'YE').trim().toUpperCase();
    // Resolve country by code or name (ar/en)
    let country: any = null;
    try {
      country = await db.country.findFirst({
        where: {
          OR: [
            { code: countryQ },
            { name: { contains: countryQ, mode: 'insensitive' } },
            { name: { contains: 'اليمن', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch { }
    const whereCity: any = country ? { countryId: country.id } : {};
    const list = await db.city.findMany({
      where: whereCity,
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, createdAt: true }
    });
    // Deduplicate by name; preserve first inserted
    const seen = new Set<string>();
    const items = [] as Array<{ id: string; name: string }>;
    for (const c of list) {
      const n = String(c?.name || '').trim();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      items.push({ id: String(c.id), name: n });
    }
    return res.json({ items });
  } catch (e: any) {
    return res.status(500).json({ items: [], error: e?.message || 'geo_governorates_failed' });
  }
});
// Public: PDP Meta by product (badges, fit score/text, best-seller rank, model, shipping destination override)
shop.get('/product/:id/meta', async (req: any, res) => {
  try {
    const id = String(req.params.id);
    const key = `pdp_meta:${id}`;
    let meta: any = null;
    try {
      const row: any = await db.setting.findUnique({ where: { key } } as any);
      meta = row ? row.value : null;
    } catch { }
    // Compute Jeeey Club banner based on global settings and product targeting
    let clubBanner: any = null;
    let bestRank: number | null = null;
    try {
      const clubKey = 'club:banner:settings';
      const srow: any = await db.setting.findUnique({ where: { key: clubKey } } as any).catch(() => null);
      const settings = srow?.value || null;
      if (settings && settings.enabled) {
        // Fetch minimal product fields for targeting and price computation
        const p: any = await db.product.findUnique({ where: { id }, select: { id: true, price: true, categoryId: true, vendorId: true, brand: true } } as any).catch(() => null);
        if (p) {
          // Best-seller rank within category (last 90 days, delivered/paid/shipped)
          try {
            if (p.categoryId) {
              const top: Array<{ productId: string; qty: number }> = await (db as any).$queryRawUnsafe(
                `select oi."productId" as "productId", sum(oi.quantity)::int as qty
                 from "OrderItem" oi
                 join "Order" o on o.id = oi."orderId"
                 join "Product" pr on pr.id = oi."productId"
                 where pr."categoryId" = $1
                   and oi."createdAt" > now() - interval '90 days'
                   and o.status in ('PAID','SHIPPED','DELIVERED')
                 group by oi."productId"
                 order by qty desc
                 limit 50`, p.categoryId);
              const idx = Array.isArray(top) ? top.findIndex((r: any) => String(r.productId) === String(p.id)) : -1;
              bestRank = (idx >= 0) ? (idx + 1) : null;
            }
          } catch { }
          const target = settings.targeting || {};
          const inList = (arr: any, val: any): boolean => Array.isArray(arr) && arr.map(String).includes(String(val));
          const includeOk = (
            (!target.products?.include?.length || inList(target.products.include, p.id)) &&
            (!target.categories?.include?.length || inList(target.categories.include, p.categoryId)) &&
            (!target.vendors?.include?.length || (p.vendorId ? inList(target.vendors.include, p.vendorId) : false)) &&
            (!target.brands?.include?.length || (p.brand ? inList(target.brands.include, p.brand) : false))
          );
          const excludeHit = (
            (target.products?.exclude?.length && inList(target.products.exclude, p.id)) ||
            (target.categories?.exclude?.length && inList(target.categories.exclude, p.categoryId)) ||
            (target.vendors?.exclude?.length && (p.vendorId ? inList(target.vendors.exclude, p.vendorId) : false)) ||
            (target.brands?.exclude?.length && (p.brand ? inList(target.brands.exclude, p.brand) : false))
          );
          if (includeOk && !excludeHit) {
            const discountType = settings.discountType === 'fixed' ? 'fixed' : 'percent';
            const discountValue = Number(settings.discountValue || 0);
            const price = Number(p.price || 0);
            const amount = Math.max(0, discountType === 'percent' ? Number((price * discountValue) / 100) : Math.min(discountValue, price));
            const rounded = Math.round(amount * 100) / 100;
            const textTemplate = String(settings.textTemplate || 'وفر بخصم {{amount}} ر.س بعد الانضمام');
            const text = textTemplate.replace(/\{\{\s*amount\s*\}\}/g, String(rounded));
            clubBanner = {
              enabled: true,
              amount: rounded,
              discountType,
              discountValue,
              text,
              joinUrl: settings.joinUrl || '/register?club=1',
              style: settings.style || { theme: 'orange', rounded: true },
              placement: settings.placement || { pdp: { enabled: true, position: 'price_below' } },
            };
          }
        }
      }
    } catch { }
    // Occasion Strip: read settings and decide eligibility
    let occasionStrip: any = null;
    // PDP Policies (cod/returns/secure)
    let pdpPolicies: any = null;
    try {
      const row = await db.setting.findUnique({ where: { key: 'occasion:strip:settings' } } as any);
      const s: any = (row?.value as any) || {};
      if (s?.enabled && s?.placement?.pdp?.enabled !== false) {
        // schedule window
        const now = Date.now();
        const fromOk = !s?.schedule?.from || (new Date(s.schedule.from).getTime() <= now);
        const toOk = !s?.schedule?.to || (new Date(s.schedule.to).getTime() >= now);
        // basic targeting by ids/names (best-effort)
        function inList(v: any, list: any[]): boolean { return Array.isArray(list) && list.some(x => String(x) == String(v)) }
        const pid = id;
        const t = s?.targeting || {};
        let cid: any = undefined, vid: any = undefined, brand: any = undefined;
        try {
          const pmini: any = await db.product.findUnique({ where: { id }, select: { categoryId: true, vendorId: true, brand: true } } as any);
          cid = pmini?.categoryId; vid = pmini?.vendorId; brand = pmini?.brand;
        } catch { }
        const includeOk = (
          (!t.products?.include?.length || inList(pid, t.products.include)) &&
          (!t.categories?.include?.length || inList(cid, t.categories.include)) &&
          (!t.vendors?.include?.length || inList(vid, t.vendors.include)) &&
          (!t.brands?.include?.length || inList(brand, t.brands.include))
        );
        const excludeOk = (
          (!t.products?.exclude?.length || !inList(pid, t.products.exclude)) &&
          (!t.categories?.exclude?.length || !inList(cid, t.categories.exclude)) &&
          (!t.vendors?.exclude?.length || !inList(vid, t.vendors.exclude)) &&
          (!t.brands?.exclude?.length || !inList(brand, t.brands.exclude))
        );
        const targetOk = includeOk && excludeOk;
        if (fromOk && toOk && targetOk) {
          occasionStrip = {
            enabled: true,
            title: s.title || 'مناسبة المطلة',
            subtitle: s.subtitle || '',
            kpiText: s.kpiText || '',
            cta: s.cta || { label: '', url: '' },
            theme: s.theme || { gradientFrom: '#fdf2f8', gradientTo: '#fffbeb', borderColor: '#fbcfe8' },
            placement: s.placement || { pdp: { enabled: true, position: 'products_top' } }
          };
        }
      }
    } catch { /* ignore */ }
    // Load PDP policies settings once and pass through if targeted/applyAll and any policy is enabled
    try {
      const prow = await db.setting.findUnique({ where: { key: 'policies:pdp:settings' } } as any);
      const s: any = (prow?.value as any) || null;
      if (s) {
        const anyPolicyEnabled = !!(s?.cod?.enabled || s?.returns?.enabled || s?.secure?.enabled);
        if (anyPolicyEnabled) {
          const now = Date.now();
          const fromOk = !s?.schedule?.from || (new Date(s.schedule.from).getTime() <= now);
          const toOk = !s?.schedule?.to || (new Date(s.schedule.to).getTime() >= now);
          const t = s?.targeting || {};
          function inList(v: any, list: any[]): boolean { return Array.isArray(list) && list.some(x => String(x) == String(v)) }
          let cid: any, vid: any, brand: any; try { const pmini: any = await db.product.findUnique({ where: { id }, select: { categoryId: true, vendorId: true, brand: true } } as any); cid = pmini?.categoryId; vid = pmini?.vendorId; brand = pmini?.brand; } catch { }
          const includeOk = (
            (!t.products?.include?.length || inList(id, t.products.include)) &&
            (!t.categories?.include?.length || inList(cid, t.categories.include)) &&
            (!t.vendors?.include?.length || inList(vid, t.vendors.include)) &&
            (!t.brands?.include?.length || inList(brand, t.brands.include))
          );
          const excludeOk = (
            (!t.products?.exclude?.length || !inList(id, t.products.exclude)) &&
            (!t.categories?.exclude?.length || !inList(cid, t.categories.exclude)) &&
            (!t.vendors?.exclude?.length || !inList(vid, t.vendors.exclude)) &&
            (!t.brands?.exclude?.length || !inList(brand, t.brands.exclude))
          );
          const eligible = !!(s?.applyAll) || (includeOk && excludeOk);
          if (fromOk && toOk && eligible) {
            pdpPolicies = {
              cod: s.cod || { enabled: false },
              returns: s.returns || { enabled: false },
              secure: s.secure || { enabled: false },
            }
          }
        }
      }
    } catch { }
    // Merge meta first, then overlay computed fields so they are not overridden by undefined in stored meta
    const out = Object.assign(
      { badges: [], fitPercent: null, fitText: null, model: null, shippingDestinationOverride: null, sellerBlurb: null },
      meta || {},
      {
        bestRank: bestRank,
        occasionStrip: occasionStrip,
        policies: (pdpPolicies != null ? pdpPolicies : ((meta as any)?.policies ?? null)),
        clubBanner
      }
    );
    return res.json({ productId: id, meta: out });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'pdp_meta_failed' });
  }
});

// Public: Seller summary for a product
shop.get('/product/:id/seller', async (req: any, res) => {
  try {
    const id = String(req.params.id);
    const p = await db.product.findUnique({ where: { id }, select: { vendor: { select: { id: true, name: true, storeName: true, storeNumber: true, updatedAt: true } } } } as any);
    const v = (p as any)?.vendor || null;
    if (!v) return res.json({ vendor: null });
    // Merge public-facing vendor meta if present
    try {
      const key = `vendor:meta:${v.id}`;
      const row = await db.setting.findUnique({ where: { key } } as any);
      const meta = row?.value || {};
      return res.json({ vendor: { ...v, meta } });
    } catch { return res.json({ vendor: v }); }
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'seller_failed' }) }
});

// User fit profile (height/weight/width) for size recommendations (auth required)
shop.get('/me/fit-profile', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "UserFitProfile" ("userId" TEXT PRIMARY KEY, "heightCm" DOUBLE PRECISION NULL, "weightKg" DOUBLE PRECISION NULL, "widthCm" DOUBLE PRECISION NULL, "updatedAt" TIMESTAMP DEFAULT NOW())');
    const row: any = ((await db.$queryRawUnsafe('SELECT * FROM "UserFitProfile" WHERE "userId"=$1', userId)) as any[])[0] || null;
    return res.json({ profile: row ? { heightCm: row.heightCm ?? null, weightKg: row.weightKg ?? null, widthCm: row.widthCm ?? null, updatedAt: row.updatedAt } : { heightCm: null, weightKg: null, widthCm: null } });
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'fit_profile_failed' }); }
});

shop.post('/me/fit-profile', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { heightCm, weightKg, widthCm } = req.body || {};
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "UserFitProfile" ("userId" TEXT PRIMARY KEY, "heightCm" DOUBLE PRECISION NULL, "weightKg" DOUBLE PRECISION NULL, "widthCm" DOUBLE PRECISION NULL, "updatedAt" TIMESTAMP DEFAULT NOW())');
    const exists: any = ((await db.$queryRawUnsafe('SELECT 1 FROM "UserFitProfile" WHERE "userId"=$1', userId)) as any[])[0];
    const h = (heightCm != null && !Number.isNaN(Number(heightCm))) ? Number(heightCm) : null;
    const w = (weightKg != null && !Number.isNaN(Number(weightKg))) ? Number(weightKg) : null;
    const wd = (widthCm != null && !Number.isNaN(Number(widthCm))) ? Number(widthCm) : null;
    if (exists) await db.$executeRawUnsafe('UPDATE "UserFitProfile" SET "heightCm"=$1, "weightKg"=$2, "widthCm"=$3, "updatedAt"=NOW() WHERE "userId"=$4', h, w, wd, userId);
    else await db.$executeRawUnsafe('INSERT INTO "UserFitProfile" ("userId","heightCm","weightKg","widthCm") VALUES ($1,$2,$3,$4)', userId, h, w, wd);
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'fit_profile_save_failed' }); }
});

// List cities by governorate or whole country
shop.get('/geo/cities', async (req: any, res) => {
  try {
    const countryCode = String(req.query.country || 'YE').toUpperCase();
    const governorate = String(req.query.governorate || '').trim();
    const country = await ensureCountry(countryCode, countryCode);
    const where: any = { countryId: country.id };
    if (governorate) where.region = governorate;
    const list = await db.city.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true } });
    return res.json({ items: list });
  } catch (e: any) {
    return res.status(500).json({ items: [], error: e?.message || 'failed' });
  }
});

// List areas for a city
shop.get('/geo/areas', async (req: any, res) => {
  try {
    const cityId = String(req.query.cityId || '').trim();
    const cityName = String(req.query.city || '').trim();
    const governorate = String(req.query.governorate || '').trim();
    const countryCode = String(req.query.country || 'YE').toUpperCase();
    let city: any = null;
    if (cityId) {
      city = await db.city.findUnique({ where: { id: cityId } });
    } else if (cityName) {
      const country = await ensureCountry(countryCode, countryCode);
      const where: any = { countryId: country.id, name: cityName };
      if (governorate) where.region = governorate;
      city = await db.city.findFirst({ where });
    }
    if (!city) return res.json({ items: [] });
    const areas = await db.area.findMany({ where: { cityId: city.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } });
    return res.json({ items: areas });
  } catch (e: any) {
    return res.status(500).json({ items: [], error: e?.message || 'failed' });
  }
});
// Ensure (upsert) geo entries from reverse geocoding or user input
shop.post('/geo/ensure', async (req: any, res) => {
  try {
    const countryCode = String(req.body?.countryCode || req.body?.country || 'YE').toUpperCase();
    const countryName = String(req.body?.countryName || req.body?.country || 'اليمن');
    const governorate = String(req.body?.governorate || '').trim();
    const cityName = String(req.body?.city || '').trim();
    const areaName = String(req.body?.area || '').trim();
    const country = await ensureCountry(countryCode, countryName || countryCode);
    let city = null as any;
    if (cityName) {
      city = await db.city.findFirst({ where: { countryId: country.id, name: cityName } });
      if (!city) {
        city = await db.city.create({ data: { countryId: country.id, name: cityName, region: governorate || null } });
      } else if (governorate && !city.region) {
        try { city = await db.city.update({ where: { id: city.id }, data: { region: governorate } }); } catch { }
      }
    }
    let area = null as any;
    if (city && areaName) {
      area = await db.area.findFirst({ where: { cityId: city.id, name: areaName } });
      if (!area) area = await db.area.create({ data: { cityId: city.id, name: areaName } });
    }
    return res.json({ ok: true, country: { id: country.id, code: country.code, name: country.name }, city: city ? { id: city.id, name: city.name, region: city.region } : null, area: area ? { id: area.id, name: area.name } : null });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'failed' });
  }
});
// WhatsApp Webhook Verification (GET)
shop.get('/webhooks/whatsapp', (req: any, res) => {
  try {
    const mode = String(req.query['hub.mode'] || '');
    const token = String(req.query['hub.verify_token'] || '');
    const challenge = String(req.query['hub.challenge'] || '');
    const expected = process.env.WHATSAPP_VERIFY_TOKEN || '';
    if (mode === 'subscribe' && token && expected && token === expected) {
      return res.status(200).send(challenge || 'OK');
    }
    return res.status(403).json({ ok: false });
  } catch { return res.status(403).json({ ok: false }) }
});
// Ensure OTP table exists (idempotent)
async function ensureOtpTable(): Promise<void> {
  try {
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "OtpCode" (' +
      'id TEXT PRIMARY KEY,' +
      'phone TEXT NOT NULL,' +
      'code TEXT NOT NULL,' +
      'channel TEXT NOT NULL,' +
      'expiresAt TIMESTAMP NOT NULL,' +
      'consumed BOOLEAN DEFAULT FALSE,' +
      'createdAt TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "OtpCode_phone_idx" ON "OtpCode"(phone)');
    // Harden schema for legacy deployments where column casing may differ
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "channel" TEXT'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "consumed" BOOLEAN DEFAULT FALSE'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()'); } catch { }
    // Drop NOT NULL to allow flexible inserts, then we backfill
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ALTER COLUMN "expiresAt" DROP NOT NULL'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "OtpCode" ALTER COLUMN "expires_at" DROP NOT NULL'); } catch { }
  } catch { }
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
      else if (!isNullable && !hasDefault) val = defaultFor(String(c.data_type || ''));
      else continue;
      insertCols.push('"' + name + '"');
      values.push(val);
    }
    // Ensure at minimum our essential columns are included
    const essentials = ['id', 'phone', 'code', 'channel'];
    for (const e of essentials) {
      if (!insertCols.includes('"' + e + '"')) { insertCols.push('"' + e + '"'); values.push(known[e]); }
    }
    // Build parameterized insert
    const params = values.map((_, i) => `$${i + 1}`).join(',');
    const colsSql = insertCols.join(',');
    const sql = `INSERT INTO "OtpCode" (${colsSql}) VALUES (${params})`;
    await db.$executeRawUnsafe(sql, ...values);
    // Best-effort backfill to both expiry fields
    try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expiresAt"=$2, "updatedAt"=NOW() WHERE id=$1', id, expiresAt); } catch { }
    try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expires_at"=$2, "updatedAt"=NOW() WHERE id=$1', id, expiresAt); } catch { }
    return id;
  } catch (e) {
    // Fallback to minimal insert of known subset
    try {
      await db.$executeRawUnsafe('INSERT INTO "OtpCode" (id, phone, code, channel) VALUES ($1,$2,$3,$4)', id, phone, code, channel);
      try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expiresAt"=$2 WHERE id=$1', id, expiresAt); } catch { }
      try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET "expires_at"=$2 WHERE id=$1', id, expiresAt); } catch { }
      return id;
    } catch {
      throw e;
    }
  }
}

function generateOtpCode(): string { return String(Math.floor(100000 + Math.random() * 900000)); }

async function getLatestIntegration(provider: string): Promise<any | null> {
  // Prefer DB-configured integration when present and enabled
  try {
    const row = await db.integration.findFirst({ where: { provider }, orderBy: { createdAt: 'desc' } } as any);
    const cfg = row ? ((row as any).config || {}) : null;
    if (cfg && (cfg.enabled === undefined || !!cfg.enabled)) return cfg;
  } catch { }
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
  } catch { }
  return null;
}

async function getGoogleOAuthConfig(): Promise<{ clientId: string; clientSecret?: string; redirectUri: string } | null> {
  try {
    const row = await db.integration.findFirst({ where: { provider: 'google_oauth' }, orderBy: { createdAt: 'desc' } } as any);
    const cfg: any = row ? ((row as any).config || {}) : {};
    const clientId = cfg.clientId || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = cfg.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
    const publicApi = process.env.PUBLIC_API_BASE || process.env.API_BASE_URL || 'https://api.jeeey.com';
    const redirectUri = cfg.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${publicApi}/api/auth/google/callback`;
    if (!clientId || !redirectUri) return null;
    return { clientId, clientSecret, redirectUri };
  } catch { return null }
}

async function getFacebookOAuthConfig(): Promise<{ appId: string; appSecret?: string; redirectUri: string } | null> {
  try {
    const row = await db.integration.findFirst({ where: { provider: 'facebook_oauth' }, orderBy: { createdAt: 'desc' } } as any);
    const cfg: any = row ? ((row as any).config || {}) : {};
    const appId = cfg.appId || process.env.FACEBOOK_APP_ID || process.env.META_APP_ID || '';
    const appSecret = cfg.appSecret || process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET || '';
    const publicApi = process.env.PUBLIC_API_BASE || process.env.API_BASE_URL || 'https://api.jeeey.com';
    const redirectUri = cfg.redirectUri || process.env.FACEBOOK_REDIRECT_URI || `${publicApi}/api/auth/facebook/callback`;
    if (!appId || !redirectUri) return null;
    return { appId, appSecret, redirectUri };
  } catch { return null }
}
async function sendWhatsappOtp(phone: string, text: string): Promise<boolean> {
  const cfg = await getLatestIntegration('whatsapp');
  if (!cfg || cfg.enabled === false) return false; // treat missing enabled as true
  const token = cfg.token; const phoneId = cfg.phoneId; let template = cfg.template || 'otp_login_code'; let languageCode = cfg.languageCode || 'ar';
  const headerType = cfg.headerType; const headerParam = cfg.headerParam;
  // Normalize language naming like "arabic" => "ar"
  if (typeof languageCode === 'string') {
    const lc = String(languageCode).toLowerCase();
    if (lc === 'arabic') languageCode = 'ar';
  }
  const buttonSubType = cfg.buttonSubType; const buttonIndex = Number(cfg.buttonIndex || 0); const buttonParam = cfg.buttonParam;
  if (!token || !phoneId) return false;
  try {
    const url = `https://graph.facebook.com/v15.0/${encodeURIComponent(String(phoneId))}/messages`;
    const candidates = Array.from(new Set([String(languageCode), 'ar_SA', 'ar', 'en']));
    // WhatsApp Cloud expects international number without '+' (MSISDN)
    const msisdn = String(phone).replace(/[^0-9]/g, '').replace(/^0+/, '');
    const toVariants = Array.from(new Set([msisdn]));
    // Optional: pre-check contact deliverability
    try {
      const contactUrl = `https://graph.facebook.com/v17.0/${encodeURIComponent(String(phoneId))}/contacts`;
      const body = { blocking: 'wait', contacts: [msisdn], force_check: true } as any;
      const rc = await fetch(contactUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });
      const rawc = await rc.text().catch(() => ''); let jc: any = null; try { jc = rawc ? JSON.parse(rawc) : null } catch { }
      const contact = jc?.contacts?.[0] || null;
      const status = String(contact?.status || '').toLowerCase();
      try { await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status, meta) VALUES ($1,$2,$3,$4,$5,$6,$7)', Math.random().toString(36).slice(2), 'whatsapp', msisdn, 'contact_check', '', (status === 'valid' ? 'SENT' : 'FAILED'), JSON.stringify({ response: jc || rawc })) } catch { }
      if (status && status !== 'valid') {
        // Do not attempt WA template when the number is not reachable; allow SMS fallback
        return false;
      }
    } catch { }
    // Try template with exact introspection from WABA if available
    // Read wabaId from integration/env for introspection
    const wabaId = cfg.wabaId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    let introspectedComponents: any[] | null = null;
    if (wabaId && template) {
      try {
        const q = `https://graph.facebook.com/v15.0/${encodeURIComponent(String(wabaId))}/message_templates?name=${encodeURIComponent(String(template))}`;
        const meta = await fetch(q, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => null) as any;
        // Prefer Arabic if present, else first
        const tpl = Array.isArray(meta?.data) ? (meta.data.find((d: any) => String(d?.language || '').toLowerCase().startsWith('ar')) || meta.data[0]) : null;
        introspectedComponents = Array.isArray(tpl?.components) ? tpl.components : null;
      } catch { }
    }
    // Try template with multiple languages and component permutations
    let lastErrorRaw: string | null = null;
    if (template) {
      for (const to of toVariants) {
        for (const lang of candidates) {
          // Build component variants to avoid invalid-parameter errors when header/body varies across templates
          const buildHeader = (): any | null => {
            if (!headerType || String(headerType).toLowerCase() === 'none') return null;
            const ht = String(headerType).toLowerCase();
            if (ht === 'text' && headerParam) return { type: 'header', parameters: [{ type: 'text', text: String(headerParam) }] };
            if ((ht === 'image' || ht === 'video' || ht === 'document') && headerParam) {
              const pkey = ht as 'image' | 'video' | 'document';
              const mediaParam: any = {}; mediaParam[pkey] = { link: String(headerParam) };
              return { type: 'header', parameters: [{ type: pkey, ...mediaParam }] };
            }
            return null;
          };
          const headerComp = buildHeader();
          // Prefer sending only the OTP digits to match templates expecting {{1}}
          const digits = (text.match(/\d+/g) || []).join('').slice(0, 12);
          const paramValue = digits.length > 0 ? digits : text;
          const bodyComp = { type: 'body', parameters: [{ type: 'text', text: paramValue }] } as any;
          let variants: any[] = [];
          if (Array.isArray(introspectedComponents) && introspectedComponents.length) {
            // Build exact components order based on introspected template
            const comps: any[] = [];
            for (const c of introspectedComponents) {
              const t = String(c?.type || '').toLowerCase();
              if (t === 'header') {
                if (c.format === 'TEXT') comps.push({ type: 'header', parameters: [{ type: 'text', text: paramValue }] });
                else comps.push({ type: 'header' });
              } else if (t === 'body') {
                const varCount = Number(c.example?.body_text?.[0]?.length || (c.text?.match(/{{\d+}}/g) || []).length || 1);
                const plist = Array.from({ length: Math.max(1, varCount) }).map((_, i) => ({ type: 'text', text: String(i === 0 ? paramValue : paramValue) }));
                comps.push({ type: 'body', parameters: plist });
              } else if (t === 'button') {
                const sub = String(c.sub_type || '').toLowerCase();
                if (sub === 'url') comps.push({ type: 'button', sub_type: 'url', index: String(c.index || '0'), parameters: [{ type: 'text', text: String(paramValue).slice(0, 15) }] });
                else if (sub === 'quick_reply') comps.push({ type: 'button', sub_type: 'quick_reply', index: String(c.index || '0') });
                else if (sub === 'phone_number') comps.push({ type: 'button', sub_type: 'phone_number', index: String(c.index || '0'), parameters: [{ type: 'text', text: String(paramValue).slice(0, 128) }] });
              }
            }
            variants = [comps];
          } else {
            // Fallback permutations when introspection unavailable
            variants = [];
            if (headerComp) variants.push([headerComp, bodyComp]);
            variants.push([bodyComp]);
            if (headerComp) variants.push([headerComp]);
            variants.push([]);
          }

          // Button variants: if integration defines button, use it; otherwise try url and quick_reply automatically
          const buttonCandidates: Array<{ sub_type: 'url' | 'quick_reply' | 'phone_number'; index: string; param?: string } | null> = [];
          if (buttonSubType && (buttonSubType === 'url' || buttonSubType === 'quick_reply' || buttonSubType === 'phone_number')) {
            let bp = (typeof buttonParam === 'string' && buttonParam.trim()) ? String(buttonParam) : String(paramValue);
            if (buttonSubType === 'url') bp = String(bp).slice(0, 15);
            buttonCandidates.push({ sub_type: buttonSubType, index: String(buttonIndex || 0), param: buttonSubType === 'quick_reply' ? undefined : bp });
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
                if (btn.sub_type === 'quick_reply') {
                  toSend.template.components.push({ type: 'button', sub_type: btn.sub_type, index: btn.index });
                } else if (btn.sub_type === 'url' || btn.sub_type === 'phone_number') {
                  const ptxt = String(btn.param || '').slice(0, btn.sub_type === 'url' ? 15 : 128);
                  toSend.template.components.push({ type: 'button', sub_type: btn.sub_type, index: btn.index, parameters: [{ type: 'text', text: ptxt }] });
                }
              }
              const r = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(toSend) });
              const raw = await r.text().catch(() => '');
              if (r.ok) {
                try {
                  const parsed = raw ? JSON.parse(raw) : null;
                  const msgId = parsed?.messages?.[0]?.id;
                  if (msgId) {
                    try { await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status, "messageId", meta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', Math.random().toString(36).slice(2), 'whatsapp', to, template || '', text, 'SENT', msgId, JSON.stringify({ lang, components: toSend.template.components })) } catch { }
                    console.log('WA template sent', { to, lang, msgId });
                    return true;
                  }
                } catch { }
                // Treat 200 without messageId as uncertain -> try next variant or fallback
              }
              try { console.error('WA template send failed', lang, to, JSON.stringify(toSend.template.components), raw) } catch { }
              lastErrorRaw = raw || lastErrorRaw;
            }
          }
        }
      }
    }
    // Fallback to plain text only if WA_OTP_STRICT != 1
    if (String(process.env.WA_OTP_STRICT || '').trim() !== '1') {
      for (const to of toVariants) {
        const body = { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } } as any;
        const r = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });
        const raw = await r.text().catch(() => '');
        if (r.ok) {
          try {
            const parsed = raw ? JSON.parse(raw) : null; const msgId = parsed?.messages?.[0]?.id;
            if (msgId) {
              try { await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status, "messageId", meta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', Math.random().toString(36).slice(2), 'whatsapp', to, 'text', text, 'SENT', msgId, JSON.stringify({})) } catch { }
              console.log('WA text sent', { to, msgId });
              return true;
            }
          } catch { }
        }
        try { console.error('WA text send failed', to, raw) } catch { }
        lastErrorRaw = raw || lastErrorRaw;
      }
    }
    // Log final failure for observability
    try {
      const to = toVariants[0] || phone;
      await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status, "messageId", meta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', Math.random().toString(36).slice(2), 'whatsapp', to, template || 'otp', text, 'FAILED', '', JSON.stringify({ error: (lastErrorRaw || '').slice(0, 500) }));
    } catch { }
    return false;
  } catch { return false; }
}

// WhatsApp Cloud inbound webhook: delivery/read statuses
shop.post('/webhooks/whatsapp', async (req: any, res) => {
  try {
    const body = req.body || {};
    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const ch of changes) {
        const value = (ch || {}).value || {};
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const st of statuses) {
          const messageId = String(st.id || '');
          const status = String(st.status || '').toUpperCase();
          const error = st.errors ? JSON.stringify(st.errors).slice(0, 500) : null;
          if (messageId) {
            try { await db.$executeRawUnsafe('UPDATE "NotificationLog" SET status=$2, error=$3, "updatedAt"=NOW() WHERE "messageId"=$1', messageId, status, error); } catch { }
          }
        }
      }
    }
    return res.json({ ok: true });
  } catch (e: any) { return res.status(200).json({ ok: false, error: e.message || 'ignored' }); }
});

async function sendSmsOtp(phone: string, text: string): Promise<boolean> {
  const cfg = await getLatestIntegration('sms');
  if (!cfg || !cfg.enabled) return false;
  try {
    const prov = String(cfg.provider || '').toLowerCase();
    const to = phone.startsWith('+') ? phone : `+${phone}`;
    if (prov === 'twilio' && cfg.accountSid && cfg.authToken && cfg.sender) {
      const sid = String(cfg.accountSid);
      const token = String(cfg.authToken);
      const from = String(cfg.sender);
      const body = new URLSearchParams({ To: to, From: from, Body: text });
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!r.ok) { try { console.error('Twilio send failed', await r.text()); } catch { } }
      return r.ok;
    }
    if (prov === 'vonage' && cfg.accountSid && cfg.authToken && cfg.sender) {
      // Using Vonage SMS API (legacy): https://rest.nexmo.com/sms/json
      const params = new URLSearchParams({ api_key: String(cfg.accountSid), api_secret: String(cfg.authToken), to: to.replace('+', ''), from: String(cfg.sender), text });
      const r = await fetch('https://rest.nexmo.com/sms/json', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
      if (!r.ok) { try { console.error('Vonage send failed', await r.text()); } catch { } }
      return r.ok;
    }
    console.warn('[SMS OTP] provider not configured with required credentials');
    return false;
  } catch { return false; }
}
// Public consent endpoints
shop.get('/consent/config', async (_req, res) => {
  try {
    const row = await db.setting.findUnique({ where: { key: 'consent_config' } });
    res.json({ ok: true, config: row?.value || { tracking: true, utm: true, personalization: true } });
  } catch (e: any) { res.status(500).json({ ok: false, error: e.message || 'consent_get_failed' }); }
});
shop.post('/consent/accept', async (req, res) => {
  try {
    const val = req.body?.accept ?? { tracking: true, utm: true, personalization: true };
    res.cookie('consent', Buffer.from(JSON.stringify(val)).toString('base64'), { httpOnly: false, sameSite: 'lax', maxAge: 3600 * 24 * 365 * 1000 });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ ok: false, error: e.message || 'consent_accept_failed' }); }
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
    if (!phone) return res.status(400).json({ ok: false, error: 'phone_required' });
    // Prevent any caching by proxies/SW
    try { res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate'); } catch { }
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const id = await insertOtpRow(phone, code, channel, expiresAt);
    const text = `رمز التأكيد: ${code}`;
    let sent = false;
    let used: 'whatsapp' | 'sms' | '' = '';
    const normalizeE164 = (p: string): string => {
      const raw = String(p).trim();
      if (/^\+\d{6,15}$/.test(raw)) return raw;
      const digits = raw.replace(/\D/g, '');
      const ccRaw = (process.env.DEFAULT_COUNTRY_CODE || '').replace(/[^\d+]/g, '');
      const cc = ccRaw || '+967';
      const ccNoPlus = cc.replace(/^\+/, '');
      if (digits.length >= 6) {
        // If already starts with country code digits, just prefix '+'
        if (ccNoPlus && digits.startsWith(ccNoPlus)) return `+${digits}`;
        // Drop leading zeros then prefix CC
        const noZero = digits.replace(/^0+/, '');
        return `+${ccNoPlus}${noZero}`;
      }
      return raw.startsWith('+') ? raw : (digits ? `+${digits}` : raw);
    };
    const targetPhone = normalizeE164(phone);
    if (channel === 'whatsapp' || channel === 'both') {
      const ok = await sendWhatsappOtp(targetPhone, text);
      if (ok) {
        sent = true; used = 'whatsapp';
        // Optionally send SMS alongside WhatsApp to guarantee delivery
        if (String(process.env.OTP_SMS_WITH_WA || '').trim() === '1') {
          try { await sendSmsOtp(targetPhone, text); } catch { }
        }
      }
    }
    if (!sent && (channel === 'sms' || channel === 'whatsapp' || channel === 'both')) {
      const ok2 = await sendSmsOtp(targetPhone, text);
      if (ok2) { sent = true; used = 'sms'; }
    }
    if (!sent) {
      console.warn('[OTP] send failed', { phone, channel });
      try { await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status, meta) VALUES ($1,$2,$3,$4,$5,$6,$7)', Math.random().toString(36).slice(2), 'otp', phone, 'otp_request', text, 'FAILED', JSON.stringify({ channel })) } catch { }
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }
    try { await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status, meta) VALUES ($1,$2,$3,$4,$5,$6,$7)', Math.random().toString(36).slice(2), 'otp', phone, 'otp_request', text, 'SENT', JSON.stringify({ channel: used })) } catch { }
    return res.json({ ok: true, sent: true, channelUsed: used, expiresInSec: 300 });
  } catch (e: any) { return res.status(500).json({ ok: false, error: e.message || 'otp_request_failed' }); }
});

// OTP: verify code and issue session
shop.post('/auth/otp/verify', async (req: any, res) => {
  try {
    await ensureOtpTable();
    const phone = String(req.body?.phone || '').trim();
    const code = String(req.body?.code || '').trim();
    if (!phone || !code) return res.status(400).json({ ok: false, error: 'phone_code_required' });
    const row: any = ((await db.$queryRawUnsafe('SELECT * FROM "OtpCode" WHERE phone=$1 AND code=$2 AND (consumed=false OR consumed IS NULL) ORDER BY COALESCE("createdAt", NOW()) DESC LIMIT 1', phone, code)) as any[])[0];
    if (!row) return res.status(400).json({ ok: false, error: 'invalid_code' });
    const exp = row.expiresAt || row.expiresat || row.expires_at;
    if (!exp || new Date(exp) < new Date()) return res.status(400).json({ ok: false, error: 'expired_code' });
    try { await db.$executeRawUnsafe('UPDATE "OtpCode" SET consumed=true WHERE id=$1', row.id); } catch { }
    const normalized = phone.replace(/\s+/g, '');
    // Legacy internal email (preserve historical pattern)
    const emailLegacy = `phone+${normalized}@local`;
    // Resolve existing user by legacy, then by phone
    let user = await db.user.findUnique({ where: { email: emailLegacy } } as any);
    if (!user && normalized) user = await db.user.findFirst({ where: { phone: normalized } } as any);
    let existed = !!user;
    if (!user) {
      // Create new user with legacy email to keep internal format unchanged
      user = await db.user.create({ data: { email: emailLegacy, name: normalized, phone: normalized, password: '' } } as any);
      existed = false;
    } else {
      // Ensure phone is stored; do NOT migrate email away from legacy
      try { await db.user.update({ where: { id: user.id }, data: { phone: normalized } } as any); } catch { }
    }
    // Sign token without requiring email; include phone for client awareness
    const token = signJwt({ userId: user.id, phone: normalized, role: (user as any).role || 'USER' });
    const cookieDomain = process.env.COOKIE_DOMAIN || '.jeeey.com';
    const isProd = (process.env.NODE_ENV || 'production') === 'production';
    const host = String(req.headers?.host || '').toLowerCase();
    const isLocalHost = host.includes('localhost') || host.startsWith('127.0.0.1') || host.startsWith('10.') || host.startsWith('192.168.');
    // Clear any previous cookies (avoid old admin/user token collisions)
    try {
      res.clearCookie('auth_token', { domain: cookieDomain, path: '/' });
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) res.clearCookie('auth_token', { domain: `api.${root}`, path: '/' });
    } catch { }
    // Primary cookie on root/domain (shop-specific name)
    try {
      res.cookie('shop_auth_token', token, {
        httpOnly: true,
        domain: isLocalHost ? undefined : cookieDomain,
        sameSite: isProd && !isLocalHost ? 'none' : 'lax',
        secure: isProd && !isLocalHost,
        maxAge: 3600 * 24 * 30 * 1000,
        path: '/',
      } as any);
    } catch { }
    // Also set cookie specifically for api subdomain to avoid mixed old tokens
    try {
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root && !isLocalHost) {
        res.cookie('shop_auth_token', token, {
          httpOnly: true,
          domain: `api.${root}`,
          sameSite: isProd ? 'none' : 'lax',
          secure: isProd,
          maxAge: 3600 * 24 * 30 * 1000,
          path: '/',
        });
      }
    } catch { }
    // Loyalty: award registration + referral (sign-up) points when new account
    try {
      const isNew = !existed;
      if (isNew) {
        const trig = await loadTriggers();
        const regPts = Math.trunc(Number(trig?.registration?.points || 0));
        if (regPts > 0) { await db.pointsLedger.create({ data: { userId: user.id, points: regPts, status: 'CONFIRMED' as any, trigger: 'registration', reason: 'REGISTRATION' } as any }); }
        // Referral sign-up: referrer/referred
        const ref = String(req.body?.ref || req.query?.ref || '').toUpperCase();
        if (ref) {
          try {
            const row: any[] = await db.$queryRawUnsafe('SELECT "userId" FROM "Affiliate" WHERE code=$1 LIMIT 1', ref) as any[];
            const refUserId = String(row?.[0]?.userId || '');
            if (refUserId && refUserId !== user.id) {
              const conf: any = trig?.referral || {};
              const referrerPts = Math.trunc(Number(conf?.signUp?.referrer || 0));
              const referredPts = Math.trunc(Number(conf?.signUp?.referred || 0));
              if (referrerPts > 0) await db.pointsLedger.create({ data: { userId: refUserId, points: referrerPts, status: 'CONFIRMED' as any, trigger: 'ref_signup', reason: 'REFERRAL_SIGNUP', meta: { referred: user.id } } as any });
              if (referredPts > 0) await db.pointsLedger.create({ data: { userId: user.id, points: referredPts, status: 'CONFIRMED' as any, trigger: 'ref_signup', reason: 'REFERRED_SIGNUP', meta: { referrer: refUserId } } as any });
            }
          }
          catch { }
        }
      }
    } catch { }
    try { await mergeGuestIntoUserIfPresent(req, res, String(user.id)); } catch { }
    return res.json({ ok: true, token, newUser: !existed });
  } catch (e: any) { return res.status(500).json({ ok: false, error: e.message || 'otp_verify_failed' }); }
});

// Test-only: latest OTP code for a phone (protected by maintenance secret)
shop.get('/test/otp/latest', async (req: any, res) => {
  try {
    const secret = String(req.headers['x-maintenance-secret'] || '')
    const expected = process.env.MAINTENANCE_SECRET || ''
    if (!expected || secret !== expected) return res.status(403).json({ error: 'forbidden' })
    const phone = String(req.query?.phone || '').trim()
    if (!phone) return res.status(400).json({ error: 'phone_required' })
    await ensureOtpTable()
    const row: any = ((await db.$queryRawUnsafe('SELECT code, "createdAt" FROM "OtpCode" WHERE phone=$1 ORDER BY COALESCE("createdAt", NOW()) DESC LIMIT 1', phone)) as any[])[0]
    if (!row) return res.status(404).json({ error: 'not_found' })
    return res.json({ code: String(row.code || ''), createdAt: row.createdAt })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'failed' })
  }
})

// Set default address
shop.post('/addresses/default', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id_required' })
    await db.$executeRawUnsafe('UPDATE "AddressBook" SET "isDefault"=FALSE WHERE "userId"=$1', userId)
    await db.$executeRawUnsafe('UPDATE "AddressBook" SET "isDefault"=TRUE, "updatedAt"=NOW() WHERE id=$1 AND "userId"=$2', String(id), userId)
    return res.json({ ok: true })
  } catch { return res.status(500).json({ error: 'failed' }) }
})

// Diagnostics: latest send logs for a phone (protected by maintenance secret)
shop.get('/auth/otp/send-log', async (req: any, res) => {
  try {
    const secret = String(req.headers['x-maintenance-secret'] || '')
    const expected = process.env.MAINTENANCE_SECRET || ''
    if (!expected || secret !== expected) return res.status(403).json({ error: 'forbidden' })
    const phone = String(req.query?.phone || '').trim()
    if (!phone) return res.status(400).json({ error: 'phone_required' })
    const p0 = phone.replace(/\s+/g, '')
    const digits = p0.replace(/[^0-9]/g, '')
    const pPlus = digits ? ('+' + digits) : p0
    const rows: any[] = (await db.$queryRawUnsafe('SELECT "createdAt", channel, target, title, status, "messageId", error, meta FROM "NotificationLog" WHERE target=$1 OR target=$2 OR target=$3 ORDER BY "createdAt" DESC LIMIT 10', p0, digits, pPlus)) as any[]
    return res.json({ logs: rows })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'failed' })
  }
})
// Session info (optional auth)
// Notification preferences
shop.get('/me/preferences', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "UserPreferences" ("userId" TEXT PRIMARY KEY, email BOOLEAN, sms BOOLEAN, whatsapp BOOLEAN, webpush BOOLEAN, "updatedAt" TIMESTAMP DEFAULT NOW())');
    const row: any = ((await db.$queryRawUnsafe('SELECT * FROM "UserPreferences" WHERE "userId"=$1', userId)) as any[])[0] || { email: true, sms: false, whatsapp: false, webpush: true };
    res.json({ preferences: { email: !!row.email, sms: !!row.sms, whatsapp: !!row.whatsapp, webpush: !!row.webpush } });
  } catch { res.status(500).json({ error: 'failed' }) }
});
shop.put('/me/preferences', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId; const { email = true, sms = false, whatsapp = false, webpush = true } = req.body || {};
    const exists: any = ((await db.$queryRawUnsafe('SELECT 1 FROM "UserPreferences" WHERE "userId"=$1', userId)) as any[])[0];
    if (exists) await db.$executeRawUnsafe('UPDATE "UserPreferences" SET email=$1,sms=$2,whatsapp=$3,webpush=$4,"updatedAt"=NOW() WHERE "userId"=$5', !!email, !!sms, !!whatsapp, !!webpush, userId)
    else await db.$executeRawUnsafe('INSERT INTO "UserPreferences" ("userId",email,sms,whatsapp,webpush) VALUES ($1,$2,$3,$4,$5)', userId, !!email, !!sms, !!whatsapp, !!webpush)
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'failed' }) }
});
shop.get('/me', async (req: any, res) => {
  try {
    // Maintenance override: allow passing token via query when secret is provided (for E2E/live diagnostics)
    const maint = String(req.headers['x-maintenance-secret'] || '');
    const qToken = String((req.query?.t as string) || '').trim() || null;
    const forceToken = (maint && maint === (process.env.MAINTENANCE_SECRET || '')) ? (qToken) : null;
    // Try multiple token sources in a robust order: forced query token (maintenance), public query token (from callback), Authorization header, then cookies
    const candidates: string[] = [];
    if (forceToken) candidates.push(forceToken);
    if (qToken) candidates.push(qToken);
    try {
      const header = (req?.headers?.authorization as string | undefined) || '';
      if (header.startsWith('Bearer ')) candidates.push(header.slice(7));
    } catch { }
    try {
      const shopCookie = req?.cookies?.shop_auth_token as string | undefined;
      if (shopCookie) candidates.push(shopCookie);
    } catch { }
    try {
      const adminCookie = req?.cookies?.auth_token as string | undefined;
      if (adminCookie) candidates.push(adminCookie);
    } catch { }
    let payload: any = null;
    for (const t of candidates) {
      try { payload = verifyJwt(t); break; } catch { continue; }
    }
    if (!payload) {
      // Fallback: decode any candidate token (header/cookie/query) to avoid UX loop if secrets rotated
      try {
        const jwt = require('jsonwebtoken');
        for (const t of candidates) {
          if (!t) continue;
          const dec: any = jwt.decode(t) || null;
          if (dec && (dec.userId || dec.email)) { payload = dec; break; }
        }
      } catch { }
      if (!payload) return res.json({ user: null });
    }
    let user = await db.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, name: true, role: true } });
    if (!user && payload.email && String(payload.role || 'USER').toUpperCase() === 'USER') {
      // Fallback: create or link by email to avoid guest state when token is valid but user record missing
      const emailNorm = String(payload.email).toLowerCase();
      const exists = await db.user.findFirst({ where: { email: { equals: emailNorm, mode: 'insensitive' } } as any, select: { id: true, email: true, name: true, role: true } });
      if (exists) user = exists;
      else {
        try {
          const created = await db.user.create({ data: { email: emailNorm, name: emailNorm.split('@')[0] || 'User', password: '' } });
          user = { id: created.id, email: created.email, name: created.name, role: (created as any).role || 'USER' } as any;
        } catch { }
      }
    }
    return res.json({ user: user || null });
  } catch {
    return res.json({ user: null });
  }
});

// Test helper: login via email (maintenance-protected) to simulate Google/OTP flow end state
shop.post('/test/login', async (req: any, res) => {
  try {
    const secret = String(req.headers['x-maintenance-secret'] || '');
    if (!secret || secret !== (process.env.MAINTENANCE_SECRET || '')) return res.status(403).json({ error: 'forbidden' });
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email_required' });
    const name = (req.body?.name && String(req.body.name).trim()) || (email.split('@')[0] || 'User');
    const user = await db.user.upsert({ where: { email }, update: { name }, create: { email, name, password: '' } } as any);
    const token = signJwt({ userId: user.id, email: user.email, role: (user as any).role || 'USER' });
    res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name, role: (user as any).role || 'USER' } });
  } catch (e: any) { return res.status(500).json({ error: e.message || 'test_login_failed' }); }
});

// Test helper: verify token and return user (maintenance-protected)
shop.post('/test/me', async (req: any, res) => {
  try {
    const secret = String(req.headers['x-maintenance-secret'] || '');
    if (!secret || secret !== (process.env.MAINTENANCE_SECRET || '')) return res.status(403).json({ error: 'forbidden' });
    const token = String(req.body?.token || '').trim();
    if (!token) return res.status(400).json({ error: 'token_required' });
    let payload: any = null;
    try { payload = verifyJwt(token); } catch { }
    if (!payload) {
      try {
        // Maintenance-only fallback: decode without verifying signature to diagnose env/secret mismatches
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const jwt = require('jsonwebtoken');
        const dec: any = jwt.decode(token) || null;
        if (dec && dec.userId) payload = dec;
      } catch { }
    }
    if (!payload) return res.status(401).json({ error: 'invalid_token' });
    const user = await db.user.findUnique({ where: { id: String(payload.userId) }, select: { id: true, email: true, name: true, role: true } });
    return res.json({ user: user || null, payload: { userId: payload.userId, email: payload.email, role: payload.role } });
  } catch (e: any) { return res.status(500).json({ error: e.message || 'test_me_failed' }); }
});

// Authenticated: complete profile (name/password) — lenient header decode fallback to avoid UX loop after OTP
shop.post('/me/complete', async (req: any, res) => {
  try {
    // Prefer header token; if verification fails, decode payload as fallback
    let userId: string | null = null;
    try {
      const t = readTokenFromRequest(req);
      if (!t) return res.status(401).json({ error: 'unauthorized' });
      const p = verifyJwt(t); userId = p.userId;
    } catch {
      try {
        const header = (req?.headers?.authorization as string | undefined) || ''
        if (header.startsWith('Bearer ')) {
          const jwt = require('jsonwebtoken'); const dec: any = jwt.decode(header.slice(7));
          if (dec && dec.userId) userId = String(dec.userId);
        }
      } catch { }
    }
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const { fullName, password, confirm } = req.body || {};
    const name = String(fullName || '').trim();
    const passRaw = String(password || '');
    const conf = String(confirm || '');
    if (!name) return res.status(400).json({ ok: false, error: 'invalid_name' });
    const updateData: any = { name };
    if (passRaw) {
      if (passRaw.length < 6 || passRaw !== conf) return res.status(400).json({ ok: false, error: 'invalid_password' });
      try {
        const bcrypt = require('bcryptjs');
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(passRaw, salt);
        updateData.password = hash;
      } catch {
        updateData.password = passRaw;
      }
    }
    await db.user.update({ where: { id: userId }, data: updateData } as any);
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ ok: false, error: e.message || 'complete_failed' }); }
});

// Public: products list (basic)
shop.get('/products', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = Math.max(0, Number(req.query.offset || 0));
    const sort = String(req.query.sort || 'new');
    const q = String(req.query.q || '').trim();
    const orderBy: any = sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };

    setPublicCache(res, 5, 60);

    const idsParam = String(req.query.ids || '').trim();
    const ids = idsParam ? idsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const excludeParam = String(req.query.excludeIds || '').trim();
    const excludeIds = excludeParam ? excludeParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const catParam = String(req.query.categoryIds || '').trim();
    const categoryIds = catParam ? catParam.split(',').map(s => s.trim()).filter(Boolean) : [];

    let items: Array<{ id: string; name: string; price: number; images: string[] }> = [];

    if (ids.length) {
      // Explicit ids preserve order
      const rows = await db.product.findMany({
        where: { isActive: true, id: { in: ids } },
        select: { id: true, name: true, price: true, images: true },
      });
      const byId = new Map<string, any>(rows.map(r => [String(r.id), r]));
      items = ids.map(id => byId.get(id)).filter(Boolean) as any[];
      if (excludeIds.length) items = items.filter(it => !excludeIds.includes(String((it as any).id)));
      items = items.slice(0, limit);
    } else {
      // Search & Filter
      const where: any = { isActive: true };

      if (excludeIds.length) where.id = { notIn: excludeIds };

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } }
        ];
      }

      if (categoryIds.length) {
        // Try with categoryLinks first (robust against schema differences)
        try {
          const catCondition = {
            OR: [
              { categoryId: { in: categoryIds } },
              { categoryLinks: { some: { categoryId: { in: categoryIds } } } as any }
            ]
          };

          // If we have 'q', we must AND the category condition with the search condition
          const finalWhere = q ? { AND: [where, catCondition] } : { ...where, ...catCondition };

          items = await db.product.findMany({
            where: finalWhere,
            select: { id: true, name: true, price: true, images: true },
            orderBy,
            skip: offset,
            take: limit,
          }) as any;
        } catch {
          // Fallback: simple categoryId
          const fallbackWhere = { ...where, categoryId: { in: categoryIds } };
          items = await db.product.findMany({
            where: fallbackWhere,
            select: { id: true, name: true, price: true, images: true },
            orderBy,
            skip: offset,
            take: limit,
          }) as any;
        }
      } else {
        // No category filter
        items = await db.product.findMany({
          where,
          select: { id: true, name: true, price: true, images: true },
          orderBy,
          skip: offset,
          take: limit,
        }) as any;
      }
    }

    // annotate global top-sellers rank and sold counts
    try {
      const now = Date.now();
      if (!topSalesCache || (now - topSalesCache.ts) > CATEGORY_RANK_TTL_MS) {
        const ranks: any[] = await db.$queryRawUnsafe(`
        SELECT oi."productId" as pid, SUM(oi.quantity) as qty
        FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId"
        WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
        GROUP BY 1 ORDER BY qty DESC LIMIT 200
      `);
        const rankMap = new Map<string, { rank: number; qty: number }>();
        let r = 1; for (const row of ranks) { rankMap.set(String(row.pid), { rank: r, qty: Number(row.qty || 0) }); r++; }
        topSalesCache = { ts: now, map: rankMap };
      }
      const rankMap = topSalesCache.map;
      (items as any[]).forEach((it: any) => { const m = rankMap.get(String(it.id)); if (m) { it.bestRank = m.rank; it.soldPlus = `${m.qty}`; } });
    } catch { }
    {
      const payload = { items };
      if (__maybe304(req, res, payload)) return;
      res.json(payload);
    }
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

// Public: product detail
shop.get('/product/:id', async (req, res) => {
  try {
    setPublicCache(res, 10, 60);
    const p = await db.product.findUnique({
      where: { id: String(req.params.id) },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: true,
        variants: true,
      },
    });
    if (!p || (p as any).isActive === false) return res.status(404).json({ error: 'not_found' });
    // compute best seller rank within category
    try {
      if (p.categoryId) {
        const now = Date.now();
        let rows: any[] | undefined;
        const cached = categoryRanksCache.get(String(p.categoryId));
        if (cached && (now - cached.ts) <= CATEGORY_RANK_TTL_MS) {
          rows = cached.rows;
        } else {
          rows = await db.$queryRawUnsafe(`
          SELECT oi."productId" as pid, SUM(oi.quantity) as qty
          FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" JOIN "Product" pr ON pr.id=oi."productId"
          WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND pr."categoryId"=$1
          GROUP BY 1 ORDER BY qty DESC LIMIT 100
        `, p.categoryId);
          categoryRanksCache.set(String(p.categoryId), { ts: now, rows: rows as any[] });
        }
        let rank = 1; let found: { rank: number; qty: number } | null = null;
        for (const row of (rows || [])) { if (String(row.pid) === p.id) { found = { rank, qty: Number(row.qty || 0) }; break; } rank++; }
        (p as any).bestRank = found?.rank; (p as any).bestRankCategory = p.category?.name || '';
        (p as any).soldPlus = found ? String(found.qty) : undefined;
      }
    } catch { }
    // Load color galleries (ProductColor + ProductColorImage)
    let colorGalleries: Array<{ name: string; primaryImageUrl?: string | null; isPrimary: boolean; order: number; images: string[] }> = [];
    try {
      const colors: Array<{ id: string; name: string; primaryImageUrl: string | null; isPrimary: boolean; order: number }> = await db.productColor.findMany({
        where: { productId: p.id },
        orderBy: [{ order: 'asc' }]
      } as any);
      const galleries: Array<{ name: string; primaryImageUrl?: string | null; isPrimary: boolean; order: number; images: string[] }> = [];
      for (const c of (colors || [])) {
        let imgs: Array<{ url: string; order: number }> = [];
        try { imgs = await db.productColorImage.findMany({ where: { productColorId: c.id }, orderBy: { order: 'asc' } } as any) } catch { }
        galleries.push({ name: c.name, primaryImageUrl: c.primaryImageUrl, isPrimary: !!c.isPrimary, order: Number(c.order || 0), images: (imgs || []).map(x => x.url).filter(Boolean) });
      }
      colorGalleries = galleries;
    } catch { }
    // Derive colors/sizes arrays from variants
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const sizeGroupMap = new Map<string, Set<string>>();
    for (const v of (p.variants as any[] || [])) {
      const name = String((v as any).name || '');
      const value = String((v as any).value || '');
      const tokens = splitTokens(`${name} ${value}`);
      for (const t of tokens) {
        if (looksSizeToken(t)) sizes.add(t);
        else if (isColorWord(t)) colors.add(t);
      }
      // Keyword hints
      if (/size|مقاس/i.test(name) && looksSizeToken(value)) sizes.add(value);
      if (/color|لون/i.test(name) && isColorWord(value)) colors.add(value);
      // option_values extraction if present
      const opt = extractOptions(v);
      opt.sizes.forEach(s => sizes.add(s));
      opt.colors.forEach(c => colors.add(c));
      // Structured attributes
      const grp = extractAttributeGroups(v);
      for (const [label, set] of grp.sizeGroups.entries()) {
        if (!sizeGroupMap.has(label)) sizeGroupMap.set(label, new Set());
        const dst = sizeGroupMap.get(label)!; for (const val of set) dst.add(val);
      }
      for (const c of grp.colors) colors.add(c);
    }
    // Fallback: if sizes are still empty, derive from variant value/name when they look like sizes
    if (sizes.size === 0 && Array.isArray(p.variants) && (p.variants as any[]).length) {
      for (const v of (p.variants as any[])) {
        const raw = String((v as any).value || (v as any).name || '').trim();
        if (raw && looksSizeToken(raw) && !isColorWord(raw)) sizes.add(raw);
      }
    }
    // Build normalized attributes array (letters vs numbers when appropriate)
    const attributes: Array<{ key: string; label: string; values: string[] }> = [];
    const lettersLabel = 'مقاسات بالأحرف';
    const numbersLabel = 'مقاسات بالأرقام';
    const byLabel: Record<string, Set<string>> = {};
    for (const [label, set] of sizeGroupMap.entries()) {
      const target = label.includes('بالأحرف') ? lettersLabel : label.includes('بالأرقام') ? numbersLabel : label;
      if (!byLabel[target]) byLabel[target] = new Set<string>();
      for (const v of set) {
        // sanitize stray pipes
        const cands = String(v || '').split('|').map(s => s.trim()).filter(Boolean);
        const pick = cands.find(x => looksSizeToken(x)) || v;
        byLabel[target].add(pick);
      }
    }
    // If generic label exists, split into letters/numbers
    if (byLabel['المقاس']) {
      const generic = Array.from(byLabel['المقاس']);
      delete byLabel['المقاس'];
      for (const v of generic) {
        if (/^\d{1,3}$/.test(normalizeDigits(v))) {
          if (!byLabel[numbersLabel]) byLabel[numbersLabel] = new Set<string>();
          byLabel[numbersLabel].add(v);
        } else {
          if (!byLabel[lettersLabel]) byLabel[lettersLabel] = new Set<string>();
          byLabel[lettersLabel].add(v);
        }
      }
    }
    for (const [label, set] of Object.entries(byLabel)) {
      attributes.push({ key: 'size', label, values: Array.from(set) });
    }
    if (colors.size) attributes.push({ key: 'color', label: 'اللون', values: Array.from(colors) });
    const out: any = Object.assign({}, p, {
      colors: Array.from(colors),
      sizes: Array.from(sizes),
      attributes,
      colorGalleries,
    });
    {
      const payload = out;
      if (__maybe304(req, res, payload)) return;
      res.json(payload);
    }
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// ===================== Loyalty (helpers) =====================
type PurchaseTriggerConfig = {
  pointsPerCurrency?: number;
  confirmOn?: 'placed' | 'paid' | 'shipped' | 'delivered';
}
type ConditionsConfig = {
  minCartValue?: number;
  include?: { products?: string[]; categories?: string[]; vendors?: string[] };
  exclude?: { products?: string[]; categories?: string[]; vendors?: string[] };
}
type TriggersConfig = {
  enabled?: boolean;
  purchase?: PurchaseTriggerConfig;
  registration?: { points?: number };
  dailyCheckIn?: { points?: number };
  referral?: any;
  review?: any;
  share?: any;
  caps?: { perOrderMax?: number; perDay?: number; perMonth?: number; totalMax?: number; minPerOp?: number; maxPerOp?: number };
  conditions?: ConditionsConfig;
  confirmDelays?: { purchase?: 'paid' | 'shipped' | 'delivered' | 'placed' };
}

async function loadTriggers(): Promise<TriggersConfig> {
  try {
    const t = await db.setting.findUnique({ where: { key: 'points:triggers' } });
    return ((t?.value as any) || {}) as TriggersConfig;
  } catch { return {}; }
}

async function loadPointValue(): Promise<number> {
  try {
    const s = await db.setting.findUnique({ where: { key: 'points:settings' } });
    return Number(((s?.value as any)?.pointValue) || 0.01);
  } catch { return 0.01; }
}

type Campaign = { id: string; multiplier: number; startsAt?: string; endsAt?: string; enabled?: boolean; conditions?: any };
async function loadActiveCampaigns(): Promise<Campaign[]> {
  try {
    // @ts-ignore
    const rows: any[] = await db.$queryRawUnsafe('SELECT id, multiplier, "startsAt", "endsAt", enabled, conditions FROM "PointsCampaign" WHERE enabled = TRUE AND ("startsAt" IS NULL OR "startsAt" <= NOW()) AND ("endsAt" IS NULL OR "endsAt" >= NOW()) ORDER BY "updatedAt" DESC LIMIT 50');
    return (rows || []).map(r => ({ id: String(r.id), multiplier: Number(r.multiplier || 1), startsAt: r.startsAt, endsAt: r.endsAt, enabled: true, conditions: r.conditions || null }));
  } catch { return []; }
}

function entityMatches(item: any, cond: any): boolean {
  if (!cond) return true;
  const prodId = String(item?.product?.id || item?.productId || item?.id || '');
  const catId = String(item?.product?.categoryId || item?.categoryId || '');
  const venId = String(item?.product?.vendorId || item?.vendorId || '');
  const inList = (arr?: any[], id?: string) => Array.isArray(arr) && id ? (arr as any[]).map(String).includes(String(id)) : false;
  if (cond.include) {
    const anyInclude = ['products', 'categories', 'vendors'].some(k => Array.isArray((cond.include as any)[k]));
    if (anyInclude) {
      let ok = false;
      if (inList((cond.include as any).products, prodId)) ok = true;
      if (inList((cond.include as any).categories, catId)) ok = true;
      if (inList((cond.include as any).vendors, venId)) ok = true;
      if (!ok) return false;
    }
  }
  if (cond.exclude) {
    if (inList((cond.exclude as any).products, prodId)) return false;
    if (inList((cond.exclude as any).categories, catId)) return false;
    if (inList((cond.exclude as any).vendors, venId)) return false;
  }
  return true;
}

async function getUserPointsSince(userId: string, since: Date): Promise<number> {
  try {
    const agg: any = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any, createdAt: { gte: since as any } } });
    return Number(agg?._sum?.points || 0);
  } catch { return 0; }
}

async function applyCaps(userId: string, proposedPoints: number, triggers: TriggersConfig): Promise<number> {
  const caps = triggers?.caps || {} as any;
  let pts = Math.max(0, Math.trunc(proposedPoints));
  if (caps.maxPerOp && caps.maxPerOp > 0) pts = Math.min(pts, Math.trunc(caps.maxPerOp));
  if (caps.minPerOp && caps.minPerOp > 0) pts = Math.max(pts, Math.trunc(caps.minPerOp));
  if (caps.perOrderMax && caps.perOrderMax > 0) pts = Math.min(pts, Math.trunc(caps.perOrderMax));
  const now = new Date();
  if (caps.perDay && caps.perDay > 0) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const soFar = await getUserPointsSince(userId, start);
    pts = Math.max(0, Math.min(pts, Math.trunc(caps.perDay - Math.max(0, soFar))));
  }
  if (caps.perMonth && caps.perMonth > 0) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const soFar = await getUserPointsSince(userId, start);
    pts = Math.max(0, Math.min(pts, Math.trunc(caps.perMonth - Math.max(0, soFar))));
  }
  if (caps.totalMax && caps.totalMax > 0) {
    try {
      const agg: any = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } });
      const soFar = Number(agg?._sum?.points || 0);
      pts = Math.max(0, Math.min(pts, Math.trunc(caps.totalMax - Math.max(0, soFar))));
    } catch { }
  }
  return Math.max(0, Math.trunc(pts));
}

async function computeCartPoints(userId: string, cartItems: any[], subtotal: number): Promise<{ points: number; confirmOn: 'placed' | 'paid' | 'shipped' | 'delivered' }> {
  const triggers = await loadTriggers();
  const purchase = (triggers?.purchase || {}) as PurchaseTriggerConfig;
  const conditions = (triggers?.conditions || {}) as ConditionsConfig;
  const confirmOn = (triggers?.confirmDelays?.purchase || purchase?.confirmOn || 'paid') as any;
  if (typeof (conditions as any).minCartValue === 'number' && subtotal < Number((conditions as any).minCartValue)) {
    return { points: 0, confirmOn };
  }
  const pointValue = await loadPointValue();
  const campaigns = await loadActiveCampaigns();
  let totalPts = 0;
  for (const it of (cartItems || [])) {
    if (!entityMatches(it, conditions)) continue;
    const p = it.product || {};
    if (p.excludeFromPoints) continue;
    const qty = Math.max(1, Number(it.quantity || 1));
    const price = Number(p.price || 0);
    const baseFixed = Number(p.pointsFixed || 0);
    const basePercent = Number(p.pointsPercent || 0);
    let itemPts = 0;
    if (baseFixed > 0) itemPts += baseFixed * qty;
    if (basePercent > 0) {
      const money = price * qty * basePercent;
      const ptsApprox = Math.floor(money / Math.max(0.0001, pointValue));
      itemPts += ptsApprox;
    }
    if (itemPts === 0) {
      const ppc = Number(purchase.pointsPerCurrency || 0);
      if (ppc > 0) itemPts += Math.floor(price * qty * ppc);
      else itemPts += Math.floor((price * qty) / 10);
    }
    const mults: number[] = [];
    if (p.loyaltyMultiplier) mults.push(Number(p.loyaltyMultiplier));
    if (p.category?.loyaltyMultiplier) mults.push(Number(p.category.loyaltyMultiplier));
    if (p.vendor?.loyaltyMultiplier) mults.push(Number(p.vendor.loyaltyMultiplier));
    for (const c of campaigns) {
      try { if (entityMatches(it, (c as any).conditions)) mults.push(Number(c.multiplier || 1)); } catch { }
    }
    const multiplier = mults.length ? mults.reduce((a, b) => a * b, 1) : 1;
    itemPts = Math.floor(itemPts * Math.max(0, multiplier));
    totalPts += Math.max(0, itemPts);
  }
  totalPts = await applyCaps(userId, totalPts, triggers);
  return { points: Math.max(0, Math.trunc(totalPts)), confirmOn };
}
// Public: product variants (normalized)
shop.get('/product/:id/variants', async (req, res) => {
  try {
    const id = String(req.params.id)
    const p = await db.product.findUnique({ where: { id }, select: { id: true, images: true } })
    if (!p) return res.status(404).json({ error: 'not_found' })
    const rows = await db.productVariant.findMany({
      where: { productId: id },
      select: { id: true, name: true, value: true, price: true, stockQuantity: true, sku: true },
      orderBy: { createdAt: 'asc' }
    } as any)
    // Fallback: if no variants found, try to derive from historical schema by splitting Product.tags like size/color pairs (best-effort)
    let itemsBase = rows || []
    if (!itemsBase.length) {
      try {
        const pFull = await db.product.findUnique({ where: { id }, select: { tags: true, price: true } })
        const tags = (pFull?.tags || []).map((t: any) => String(t || ''))
        const sizes = Array.from(new Set(tags.filter(t => /^(?:size:|مقاس:)/i.test(t)).map(t => t.split(':').slice(1).join(':').trim()).filter(Boolean)))
        const colors = Array.from(new Set(tags.filter(t => /^(?:color:|لون:)/i.test(t)).map(t => t.split(':').slice(1).join(':').trim()).filter(Boolean)))
        const gen: any[] = []
        for (const s of (sizes.length ? sizes : [''])) for (const c of (colors.length ? colors : [''])) {
          const name = [s ? `المقاس: ${s}` : '', c ? `اللون: ${c}` : ''].filter(Boolean).join(' • ')
          gen.push({ id: `${id}:${s}:${c}`, name, value: name, price: pFull?.price || 0, stockQuantity: 0, sku: null })
        }
        itemsBase = gen
      } catch { }
    }
    const items = (itemsBase || []).map((v: any) => {
      // Build attributes_map using structured groups first
      const attrs = extractAttributeGroups(v)
      const attributes_map: Record<string, string> = {}
      for (const [label, set] of attrs.sizeGroups.entries()) {
        const slug = 'size_' + String(label || '').trim().toLowerCase().replace(/\s+/g, '_')
        const first = Array.from(set)[0]
        if (first) attributes_map[slug] = first
      }
      if (attrs.colors.size) { attributes_map['color'] = Array.from(attrs.colors)[0] }
      // Fallbacks from extractOptions/tokens to ensure minimal map
      if (!attributes_map['color'] || Object.keys(attributes_map).length === 0) {
        const opt = extractOptions(v)
        if (opt.colors[0] && !attributes_map['color']) attributes_map['color'] = opt.colors[0]
        if (opt.sizes[0] && !Object.keys(attributes_map).some(k => k.startsWith('size_'))) attributes_map['size'] = opt.sizes[0]
        if (!Object.keys(attributes_map).some(k => k.startsWith('size_'))) {
          const name = String(v.name || ''); const value = String(v.value || '');
          const tokens = splitTokens(`${name} ${value}`)
          const tokenSize = tokens.find(t => looksSizeToken(t) && !isColorWord(t))
          if (tokenSize) attributes_map['size'] = tokenSize
          const tokenColor = tokens.find(t => isColorWord(t))
          if (tokenColor && !attributes_map['color']) attributes_map['color'] = tokenColor
        }
      }
      // Image fallback: pick first product image whose filename contains color token if any; else undefined
      let image: string | undefined
      try {
        const col = String(attributes_map['color'] || '').toLowerCase()
        if (col && Array.isArray(p.images)) {
          image = (p.images as string[]).find(u => (u.split('/').pop() || '').toLowerCase().includes(col))
        }
      } catch { }
      // Back-compat aliases for clients expecting color/size fields
      const color = attributes_map['color'] || undefined
      let size: string | undefined
      if (attributes_map['size']) size = attributes_map['size']
      else {
        const sk = Object.keys(attributes_map).find(k => k.startsWith('size_'))
        if (sk) size = attributes_map[sk]
      }
      return {
        id: v.id,
        product_id: id,
        sku: v.sku || undefined,
        price: typeof v.price === 'number' ? v.price : undefined,
        stock: Number.isFinite(v.stockQuantity as any) ? Number(v.stockQuantity) : 0,
        image,
        attributes_map,
        // aliases
        color,
        size
      }
    })
    return res.json({ items })
  } catch (e) {
    return res.status(500).json({ error: 'variants_failed' })
  }
});

// Public: product reviews (REST helper for mweb)
shop.get('/reviews', async (req, res) => {
  try {
    const productId = String(req.query.productId || '').trim();
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    if (!productId) return res.json({ items: [] });
    const rows = await db.review.findMany({
      where: { productId, isApproved: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const items = rows.map((r: any) => ({
      id: r.id,
      userName: r.user?.name || 'ضيف',
      rating: Number(r.rating || 0),
      text: String(r.comment || ''),
      date: (r.createdAt ? new Date(r.createdAt) : new Date()).toISOString(),
      images: [] as string[],
      size: '',
      color: '',
      helpful: 0,
    }));
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'reviews_failed' });
  }
});
// Public: recommendations (recent)
shop.get('/recommendations/recent', async (_req, res) => {
  try {
    const items = await db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, images: true, brand: true },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    });
    // annotate sold counts and rank (global)
    try {
      const ranks: any[] = await db.$queryRawUnsafe(`
        SELECT oi."productId" as pid, SUM(oi.quantity) as qty
        FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId"
        WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
        GROUP BY 1 ORDER BY qty DESC LIMIT 200
      `);
      const rankMap = new Map<string, { rank: number; qty: number }>(); let r = 1;
      for (const row of ranks) { rankMap.set(String(row.pid), { rank: r, qty: Number(row.qty || 0) }); r++; }
      (items as any[]).forEach((it: any) => { const m = rankMap.get(String(it.id)); if (m) { it.bestRank = m.rank; it.soldCount = m.qty; } });
    } catch { }
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: 'recommend_recent_failed' });
  }
});

// Public: recommendations (similar by category)
shop.get('/recommendations/similar/:productId', async (req, res) => {
  try {
    const productId = String(req.params.productId);
    const p = await db.product.findUnique({ where: { id: productId }, select: { id: true, categoryId: true } });
    if (!p) return res.status(404).json({ error: 'not_found' });
    const items = await db.product.findMany({
      where: { categoryId: p.categoryId, isActive: true, NOT: { id: productId } },
      select: { id: true, name: true, price: true, images: true, brand: true },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    });
    try {
      const rows: any[] = await db.$queryRawUnsafe(`
        SELECT oi."productId" as pid, SUM(oi.quantity) as qty
        FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" JOIN "Product" pr ON pr.id=oi."productId"
        WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND pr."categoryId"=$1
        GROUP BY 1 ORDER BY qty DESC LIMIT 200
      `, p.categoryId);
      const rankMap = new Map<string, { rank: number; qty: number }>(); let r = 1;
      for (const row of rows) { rankMap.set(String(row.pid), { rank: r, qty: Number(row.qty || 0) }); r++; }
      (items as any[]).forEach((it: any) => { const m = rankMap.get(String(it.id)); if (m) { it.bestRank = m.rank; it.soldCount = m.qty; } });
    } catch { }
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: 'recommend_similar_failed' });
  }
});

// Public: CMS page by slug (published only)
shop.get('/cms/page/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug);
    // Prefer published page when field exists; fallback to any matching slug
    let page = await (db as any).cMSPage.findFirst({ where: { slug, published: true } });
    if (!page) page = await (db as any).cMSPage.findFirst({ where: { slug } });
    if (!page) {
      // Fallback: return a generic default for size-guide:* slugs to avoid noisy 404s on mweb
      if (slug.startsWith('size-guide:')) {
        const brandOrCat = slug.split(':')[1] || 'default'
        const content = `<h3>مرجع المقاس (${brandOrCat})</h3><p>XS (EU 34) • S (EU 36) • M (EU 38) • L (EU 40) • XL (EU 42)</p>`
        return res.json({ page: { slug, title: 'مرجع المقاس', content, published: true } })
      }
      return res.status(404).json({ error: 'not_found' });
    }
    return res.json({ page: { slug: page.slug, title: page.title, content: page.content, published: !!page.published } });
  } catch {
    return res.status(500).json({ error: 'cms_page_failed' });
  }
});

// (duplicate endpoint removed) — unified earlier /tabs/:slug implementation is used

// Categories list
shop.get('/categories', async (req, res) => {
  try {
    setPublicCache(res, 60, 300);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const search = String(req.query.search || '').trim();

    // Use robust raw SQL that tolerates missing columns in legacy DBs
    const params: any[] = [];
    let whereParts: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereParts.push(`name ILIKE $${params.length}`);
    }

    // Handle parentId filter
    if (req.query.parentId !== undefined) {
      const pid = String(req.query.parentId).trim();
      if (pid === 'null' || pid === '') {
        whereParts.push(`"parentId" IS NULL`);
      } else {
        params.push(pid);
        whereParts.push(`"parentId" = $${params.length}`);
      }
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    params.push(limit);
    const rows: any[] = await db.$queryRawUnsafe(
      `SELECT id,
              name,
              CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND lower(c.table_name)='category' AND lower(c.column_name)='slug'
              ) THEN slug ELSE NULL END AS slug,
              CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND lower(c.table_name)='category' AND lower(c.column_name)='parentid'
              ) THEN "parentId" ELSE NULL END AS "parentId",
              CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND lower(c.table_name)='category' AND lower(c.column_name)='image'
              ) THEN image ELSE NULL END AS image,
              CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND lower(c.table_name)='category' AND lower(c.column_name)='description'
              ) THEN description ELSE NULL END AS description,
              CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND lower(c.table_name)='category' AND lower(c.column_name)='seotitle'
              ) THEN "seoTitle" ELSE NULL END AS "seoTitle",
              CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND lower(c.table_name)='category' AND lower(c.column_name)='seodescription'
              ) THEN "seoDescription" ELSE NULL END AS "seoDescription"
       FROM "Category"
       ${where}
       ORDER BY "createdAt" DESC
       LIMIT $${params.length}`,
      ...params
    );
    {
      const payload = { categories: rows };
      if (__maybe304(req, res, payload)) return;
      return res.json(payload);
    }
  } catch (error: any) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Unable to transform response from server' });
  }
});

// Categories page (published config)
shop.get('/categories/page', async (req, res) => {
  try {
    const site = String(req.query.site || 'mweb');
    const key = `categoriesPage:${site}:live`;
    const s = await db.setting.findUnique({ where: { key } });
    const rawConfig = s?.value ?? null;
    if (rawConfig == null) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json({ site, config: null });
    }
    const { config, error } = normalizeCategoriesPageConfig(rawConfig);
    if (!config && error) {
      console.warn('categories_page_live_invalid_config', { site, error });
    }
    const payload = config ?? rawConfig;
    res.set('Cache-Control', 'public, max-age=60');
    return res.json({ site, config: payload });
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'categories_page_failed' }); }
});

// Promotions: return matching active popup campaigns with AB variant selection and basic targeting
shop.get('/popups', async (req: any, res) => {
  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const ua = String(req.headers['user-agent'] || '');
    const q = req.query || {};
    const path = String(q.path || req.originalUrl || '/');
    const ref = String(q.ref || req.get('referer') || '');
    const lang = String(q.lang || '');
    const device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';
    // derive site (web/mweb) from query or referer host
    let site = String(q.site || '');
    if (!site) {
      try { const h = new URL(ref).host; site = h.startsWith('m.') ? 'mweb' : 'web'; } catch { site = 'web'; }
    }

    // Preview override (force specific campaign id) — ignore status/schedule/targeting in preview
    const previewId = String(q.previewCampaignId || '').trim();
    if (previewId) {
      try {
        const c: any = await db.campaign.findUnique({ where: { id: previewId } } as any);
        if (c) {
          // AB selection for preview keeps bucketing behavior
          let anonId = String(req.cookies?.anon_id || '');
          if (!anonId) { try { anonId = require('crypto').randomUUID(); res.cookie('anon_id', anonId, { httpOnly: false, sameSite: 'lax', maxAge: 365 * 24 * 3600 * 1000 }); } catch { } }
          function pickVariantPrev(c2: any): { key: 'A' | 'B'; payload: any } {
            const weights = (c2.abWeights || {}) as any; const wA = Number(weights?.A || 100); const wB = Number(weights?.B || 0);
            const total = Math.max(0, wA) + Math.max(0, wB) || 100;
            const h = require('crypto').createHash('sha1').update(String(anonId || '') + String(c2.id)).digest('hex');
            const n = parseInt(h.slice(0, 8), 16) % total;
            const chosen = n < Math.max(0, wA) ? 'A' : 'B';
            const payload = chosen === 'A' ? (c2.variantA || null) : (c2.variantB || null);
            if (!payload) return { key: 'A', payload: c2.variantA || null };
            return { key: chosen as 'A' | 'B', payload };
          }
          const sel = pickVariantPrev(c);
          res.set('Cache-Control', 'no-store');
          return res.json({ items: [{ id: c.id, name: c.name, priority: c.priority, status: c.status, variantKey: sel.key, variant: sel.payload, rewardId: c.rewardId || null, schedule: c.schedule, targeting: c.targeting, freq: c.frequency, now: nowIso }], preview: true });
        }
      } catch { }
      // fall-through: if not found, continue with normal flow
    }

    // Fetch all LIVE campaigns ordered by priority
    const rows: any[] = await db.campaign.findMany({ where: { status: 'LIVE' as any }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] } as any);
    if (!rows || !rows.length) { res.set('Cache-Control', 'public, max-age=15'); return res.json({ items: [] }); }

    // Ensure anonymous id for AB bucketing / frequency if needed
    let anonId = String(req.cookies?.anon_id || '');
    if (!anonId) { try { anonId = require('crypto').randomUUID(); res.cookie('anon_id', anonId, { httpOnly: false, sameSite: 'lax', maxAge: 365 * 24 * 3600 * 1000 }); } catch { } }
    function pickVariant(c: any): { key: 'A' | 'B'; payload: any } {
      const weights = (c.abWeights || {}) as any; const wA = Number(weights?.A || 100); const wB = Number(weights?.B || 0);
      const total = Math.max(0, wA) + Math.max(0, wB) || 100;
      // stable bucket by anonId hash
      const h = require('crypto').createHash('sha1').update(String(anonId || '') + String(c.id)).digest('hex');
      const n = parseInt(h.slice(0, 8), 16) % total;
      const chosen = n < Math.max(0, wA) ? 'A' : 'B';
      const payload = chosen === 'A' ? (c.variantA || null) : (c.variantB || null);
      // fallback to A if B missing
      if (!payload) return { key: 'A', payload: c.variantA || null };
      return { key: chosen as 'A' | 'B', payload };
    }
    function matchesSchedule(c: any): boolean {
      try {
        const sch = c.schedule || {}; const start = sch.start ? new Date(sch.start) : null; const end = sch.end ? new Date(sch.end) : null;
        if (start && now.getTime() < start.getTime()) return false;
        if (end && now.getTime() > end.getTime()) return false;
        return true;
      } catch { return true }
    }
    function matchesTargeting(c: any): boolean {
      try {
        const t = c.targeting || {};
        // audience: all|guest|logged_in (JWT cookie heuristic)
        const aud = String(t.audience || 'all');
        const jwt = (req?.cookies?.shop_auth_token as string | undefined) || '';
        const isLoggedIn = !!jwt;
        if (aud === 'guest' && isLoggedIn) return false;
        if (aud === 'logged_in' && !isLoggedIn) return false;
        // devices
        const devices: string[] = Array.isArray(t.devices) ? t.devices : [];
        if (devices.length && !devices.includes(device)) return false;
        // languages/locales
        const langs: string[] = Array.isArray(t.languages) ? t.languages : [];
        if (langs.length && lang && !langs.includes(lang)) return false;
        // path include/exclude
        const includes: string[] = Array.isArray(t.includePaths) ? t.includePaths : [];
        const excludes: string[] = Array.isArray(t.excludePaths) ? t.excludePaths : [];
        if (includes.length && !includes.some((p) => path.startsWith(p))) return false;
        if (excludes.length && excludes.some((p) => path.startsWith(p))) return false;
        // site targeting
        const sites: string[] = Array.isArray(t.sites) ? t.sites : [];
        if (sites.length && !sites.includes(site)) return false;
        // source/referrer
        const sources: string[] = Array.isArray(t.sources) ? t.sources : [];
        if (sources.length && ref) {
          const ok = sources.some((s) => ref.includes(s));
          if (!ok) return false;
        }
        return true;
      } catch { return true }
    }

    // (Preview already handled above)

    const items: any[] = [];
    for (const c of rows) {
      if (!matchesSchedule(c)) continue;
      if (!matchesTargeting(c)) continue;
      const sel = pickVariant(c);
      items.push({ id: c.id, name: c.name, priority: c.priority, status: c.status, variantKey: sel.key, variant: sel.payload, rewardId: c.rewardId || null, schedule: c.schedule, targeting: c.targeting, freq: c.frequency, now: nowIso });
      // cap items to reasonable count
      if (items.length >= 5) break;
    }
    res.set('Cache-Control', 'public, max-age=15');
    return res.json({ items });
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'popups_failed' }); }
});

// Public: fetch coupon details by codes (comma-separated) for popup rendering
shop.get('/coupons/by-codes', async (req: any, res) => {
  try {
    const raw = String(req.query?.codes || '').trim();
    if (!raw) return res.json({ coupons: [] });
    const codes = Array.from(new Set(raw.split(',').map((s: string) => s.trim()).filter(Boolean)));
    if (!codes.length) return res.json({ coupons: [] });
    const rows: any[] = await db.coupon.findMany({ where: { code: { in: codes } } } as any);
    const mapped = rows.map(r => ({
      code: r.code,
      title: r.code, // placeholder; UI may override with marketing title if present elsewhere
      discount: r.discountType === 'PERCENTAGE' ? r.discountValue : undefined,
      percent: r.discountType === 'PERCENTAGE' ? r.discountValue : undefined,
      minOrderAmount: r.minOrderAmount || null,
      validUntil: r.validUntil || null,
      status: r.isActive ? 'unused' : 'expired',
      categories: ['discount', 'unused'],
      conditions: []
    }));
    res.set('Cache-Control', 'public, max-age=30');
    return res.json({ coupons: mapped });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'coupons_lookup_failed' });
  }
});

// Public: Trending search terms (Global or by Category)
shop.get('/search/trending', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const categoryId = String(req.query.categoryId || '').trim();

    // Build SQL conditions
    let categoryCondition = '';
    const params: any[] = [];

    if (categoryId) {
      params.push(categoryId);
      categoryCondition = `AND properties->>'categoryId' = $${params.length}`;
    }

    params.push(limit);
    const limitParamIndex = params.length;

    // Aggregate search events
    // We look for events named 'search' and extract the 'query' property
    const rows: any[] = await db.$queryRawUnsafe(`
      SELECT properties->>'query' as term, COUNT(*) as count
      FROM "Event"
      WHERE name = 'search'
        AND properties->>'query' IS NOT NULL
        AND length(properties->>'query') > 1
        ${categoryCondition}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT $${limitParamIndex}
    `, ...params);

    const terms = rows.map(r => r.term).filter(Boolean);

    // Cache for a short period as this is analytics heavy
    setPublicCache(res, 60, 300);

    return res.json({ terms });
  } catch (e) {
    console.error('Trending search failed:', e);
    return res.status(500).json({ error: 'trending_failed', terms: [] });
  }
});

// Promotions analytics events (impression, view, click, close, etc.)
shop.post('/promotions/events', async (req: any, res) => {
  try {
    const body = req.body || {};
    const { campaignId, variantKey, type, meta } = body;
    if (!campaignId || !type) return res.status(400).json({ error: 'missing_fields' });
    // identify user if present (best-effort)
    let userId: string | undefined;
    try {
      const header = (req?.headers?.authorization as string | undefined) || '';
      let tokenAuth = '';
      if (header.startsWith('Bearer ')) tokenAuth = header.slice(7);
      const cookieTok = (req?.cookies?.shop_auth_token as string | undefined) || '';
      const jwt = require('jsonwebtoken');
      for (const t of [tokenAuth, cookieTok]) { if (!t) continue; try { const pay: any = jwt.verify(t, process.env.JWT_SECRET || ''); if (pay?.userId) { userId = String(pay.userId); break; } } catch { } }
    } catch { }
    // Insert minimally with raw SQL to tolerate older schemas
    const rnd = (() => { try { return require("crypto").randomUUID() } catch { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) } })()
    const name = 'promo_' + String(type);
    const props = JSON.stringify({ campaignId, variantKey, meta: meta || {} });
    await (db as any).$executeRawUnsafe(
      `INSERT INTO "Event" ("id","name","properties","createdAt") VALUES ($1,$2,$3::jsonb,now())`,
      rnd, name, props
    );
    res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'promo_event_failed' }); }
});
// General analytics events ingestion (public)
shop.post('/events', async (req: any, res) => {
  try {
    const b = req.body || {};
    const now = new Date();
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name_required' });
    // read anonymization setting (defaults false per request) - allow env override ANALYTICS_IP_ANONYMIZE=true
    let anonymize = false;
    try {
      const s = await db.setting.findUnique({ where: { key: 'analytics.ipAnonymize' } });
      anonymize = s ? !!(s.value as any) : false;
      const envOverride = String(process.env.ANALYTICS_IP_ANONYMIZE || '').trim().toLowerCase();
      if (envOverride === 'true' || envOverride === '1' || envOverride === 'yes') anonymize = true;
    } catch { }
    function pickPublicIp(xff: string | undefined, fallback: string | undefined): string {
      const list = (xff || '').split(',').map(s => String(s || '').trim()).filter(Boolean);
      const isPrivate = (ip: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|::1|fc00:|fe80:)/.test(ip);
      for (const ip of list) { if (!isPrivate(ip)) return ip; }
      return fallback || list[0] || '';
    }
    const ip = pickPublicIp((req.headers['x-forwarded-for'] as any)?.toString(), (req.ip as any) || (req.socket?.remoteAddress as any));
    const crypto = require('crypto');
    const ipHash = ip ? (anonymize ? crypto.createHash('sha256').update(String(process.env.IP_HASH_SALT || '') + ip).digest('hex').slice(0, 32) : ip) : null;
    // identify shop user if cookie/jwt present
    const header = (req?.headers?.authorization as string | undefined) || '';
    let tokenAuth = '';
    if (header.startsWith('Bearer ')) tokenAuth = header.slice(7);
    // Accept multiple possible cookie names for JWT to improve compatibility
    const allCookies = (req?.cookies || {}) as Record<string, string>;
    const candidateCookieNames = ['shop_auth_token', 'auth_token', 'token', 'jwt', 'access_token'];
    let cookieTok = '';
    for (const k of candidateCookieNames) {
      const v = (allCookies as any)[k];
      if (typeof v === 'string' && v) { cookieTok = v; break; }
    }
    const jwt = require('jsonwebtoken');
    let userId: string | undefined;
    for (const t of [tokenAuth, cookieTok]) { if (!t) continue; try { const pay: any = jwt.verify(t, process.env.JWT_SECRET || ''); if (pay?.userId) { userId = String(pay.userId); break; } } catch { } }

    // parse user agent (best-effort)
    const ua = (req.headers['user-agent'] as string || '');
    function parseUa(s: string) {
      const low = s.toLowerCase();
      const isMobile = /android|iphone|ipad|mobile/.test(low);
      const deviceType = isMobile ? 'mobile' : 'desktop';
      let os = /android/.test(low) ? 'Android' : /iphone|ipad|ios/.test(low) ? 'iOS' : /windows/.test(low) ? 'Windows' : /mac os x|macintosh/.test(low) ? 'macOS' : /linux/.test(low) ? 'Linux' : '';
      let browser = /chrome\//.test(low) ? 'Chrome' : /safari\//.test(low) && !/chrome\//.test(low) ? 'Safari' : /firefox\//.test(low) ? 'Firefox' : /edg\//.test(low) ? 'Edge' : '';
      let brand = '';
      if (/samsung|sm-/.test(low)) brand = 'Samsung';
      else if (/iphone|ipad|macintosh|apple/.test(low)) brand = 'Apple';
      else if (/huawei|honor/.test(low)) brand = 'Huawei';
      else if (/xiaomi|mi\s|redmi/.test(low)) brand = 'Xiaomi';
      else if (/oppo/.test(low)) brand = 'OPPO';
      else if (/vivo/.test(low)) brand = 'vivo';
      return { deviceType, os, browser, brand };
    }
    const uaInfo = parseUa(ua);
    const payload: any = {
      userId: userId || null,
      anonymousId: b.anonymousId ? String(b.anonymousId) : null,
      sessionId: b.sessionId ? String(b.sessionId) : null,
      name,
      pageUrl: b.pageUrl ? String(b.pageUrl) : null,
      referrer: b.referrer ? String(b.referrer) : null,
      productId: b.productId ? String(b.productId) : null,
      orderId: b.orderId ? String(b.orderId) : null,
      device: b.device ? String(b.device) : (req.headers['x-device'] as string || uaInfo.deviceType || null),
      os: b.os ? String(b.os) : (uaInfo.os || null),
      browser: b.browser ? String(b.browser) : (uaInfo.browser || null),
      country: b.country ? String(b.country) : (req.headers['cf-ipcountry'] as string || req.headers['x-vercel-ip-country'] as string || req.headers['x-geo-country'] as string || null),
      city: b.city ? String(b.city) : (req.headers['cf-ipcity'] as string || req.headers['x-vercel-ip-city'] as string || req.headers['x-geo-city'] as string || null),
      ipHash,
      utmSource: b.utmSource ? String(b.utmSource) : (b.utm_source ? String(b.utm_source) : null),
      utmMedium: b.utmMedium ? String(b.utmMedium) : (b.utm_medium ? String(b.utm_medium) : null),
      utmCampaign: b.utmCampaign ? String(b.utmCampaign) : (b.utm_campaign ? String(b.utm_campaign) : null),
      utmContent: b.utmContent ? String(b.utmContent) : (b.utm_content ? String(b.utm_content) : null),
      utmTerm: b.utmTerm ? String(b.utmTerm) : (b.utm_term ? String(b.utm_term) : null),
      channel: b.channel ? String(b.channel) : null,
      properties: { ...(b.properties || {}), uaBrand: uaInfo.brand || undefined },
      createdAt: now,
    };

    // Ensure sessionId (fallback synthetic if missing) لتجنّب دمج الجلسات باسم guest
    if (!payload.sessionId) {
      try {
        const crypto = require('crypto');
        const uaSig = `${uaInfo.deviceType || ''}|${uaInfo.os || ''}|${uaInfo.browser || ''}`;
        const bucket = String(new Date(now.toISOString().slice(0, 13) + ':00:00')).slice(0, 13); // ساعة
        const raw = `${payload.userId || ''}|${payload.anonymousId || ''}|${ipHash || ''}|${uaSig}|${bucket}`;
        payload.sessionId = 'sid_' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
      } catch { payload.sessionId = 'sid_' + Math.random().toString(36).slice(2, 10); }
    }

    // Best-effort IP → Geo enrichment if country/city missing and not anonymized
    try {
      if (!anonymize && ip && (!payload.country || !payload.city)) {
        const key = `__geo_cache__`;
        (global as any)[key] = (global as any)[key] || new Map();
        const cache = (global as any)[key] as Map<string, { country?: string; city?: string; at: number }>;
        let entry = cache.get(ip);
        const nowMs = Date.now();
        if (!entry || (nowMs - entry.at) > 24 * 3600 * 1000) {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 800);
          try {
            const resp = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: ctrl.signal } as any);
            if (resp.ok) {
              const j = await resp.json();
              entry = { country: j?.country || j?.country_code || undefined, city: j?.city || undefined, at: nowMs };
              cache.set(ip, entry);
            }
          } catch { } finally { clearTimeout(t); }
        }
        if (entry) {
          if (!payload.country && entry.country) payload.country = entry.country;
          if (!payload.city && entry.city) payload.city = entry.city;
        }
      }
    } catch { }

    // Upsert/update visitor session (best-effort)
    try {
      if (payload.sessionId) {
        await db.visitorSession.upsert({
          where: { id: String(payload.sessionId) },
          update: { userId: payload.userId || undefined, lastSeenAt: now, device: payload.device || undefined, os: payload.os || undefined, browser: payload.browser || undefined, country: payload.country || undefined, city: payload.city || undefined, ipHash: payload.ipHash || undefined },
          create: { id: String(payload.sessionId), userId: payload.userId || undefined, anonymousId: payload.anonymousId || undefined, device: payload.device || undefined, os: payload.os || undefined, browser: payload.browser || undefined, country: payload.country || undefined, city: payload.city || undefined, ipHash: payload.ipHash || undefined, firstSeenAt: now, lastSeenAt: now },
        } as any);
      }
    } catch { }

    // Persist analytics event with robust, self-healing fallback (schema-safe)
    try {
      await db.event.create({ data: payload } as any);
      return res.json({ ok: true });
    } catch (e: any) {
      // If schema mismatch (e.g., old DB missing columns), upgrade table in-place, then retry
      try {
        const ddl: string[] = [
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "anonymousId" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sessionId" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "pageUrl" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "referrer" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "productId" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "orderId" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "device" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "os" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "browser" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "country" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "city" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "ipHash" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmSource" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmContent" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "channel" TEXT`,
          `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "properties" JSONB DEFAULT '{}'::jsonb`
        ];
        for (const sql of ddl) { try { await (db as any).$executeRawUnsafe(sql) } catch { } }
        // Ensure VisitorSession table exists for upsert code above
        try {
          await (db as any).$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "VisitorSession"(
              id TEXT PRIMARY KEY,
              "userId" TEXT,
              "anonymousId" TEXT,
              device TEXT,
              os TEXT,
              browser TEXT,
              country TEXT,
              city TEXT,
              "ipHash" TEXT,
              "firstSeenAt" TIMESTAMPTZ DEFAULT now(),
              "lastSeenAt"  TIMESTAMPTZ DEFAULT now()
            )`);
          await (db as any).$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorSession_lastSeenAt_idx" ON "VisitorSession"("lastSeenAt")`);
        } catch { }
        // Last resort: raw INSERT مع id مُولّد لتفادي NOT NULL على id في جداول قديمة
        try {
          const rnd = (() => { try { return require("crypto").randomUUID() } catch { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) } })()
          const name = String(payload.name || 'event').slice(0, 64);
          const pageUrl = payload.pageUrl ? String(payload.pageUrl) : null;
          const referrer = payload.referrer ? String(payload.referrer) : null;
          const props = JSON.stringify(payload.properties || {});
          await (db as any).$executeRawUnsafe(
            `INSERT INTO "Event" ("id","name","properties","pageUrl","referrer","createdAt") VALUES ($1, $2, $3::jsonb, $4, $5, now())`,
            rnd, name, props, pageUrl, referrer
          );
          return res.json({ ok: true, downgraded: true });
        } catch (e3: any) {
          return res.status(500).json({ error: e3?.message || e?.message || 'event_ingest_failed' });
        }
      } catch (e2: any) {
        return res.status(500).json({ error: e2?.message || e?.message || 'event_ingest_failed' });
      }
    }
  } catch (e: any) { return res.status(500).json({ error: e?.message || 'event_ingest_failed' }); }
});

// Link current user to an anonymous/session id (shop scope)
shop.post('/analytics/link', async (req: any, res) => {
  try {
    // Identify logged-in user from any accepted token (Authorization, shop cookie, or admin cookie)
    let userId: string | undefined;
    try {
      const t = readTokenFromRequest(req);
      if (t) {
        const p = verifyJwt(String(t));
        if (p && p.userId) userId = String(p.userId);
      }
    } catch { }
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { sessionId, anonymousId } = req.body || {};
    if (!sessionId && !anonymousId) return res.status(400).json({ ok: false, error: 'missing_session_or_anonymous' });

    // Update VisitorSession (ensure row exists and assign user)
    let sessionsUpdated = 0;
    if (sessionId) {
      // Upsert to guarantee presence even if no events ingested yet
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO "VisitorSession"(id,"userId","firstSeenAt","lastSeenAt") VALUES($1,$2,NOW(),NOW())
           ON CONFLICT(id) DO UPDATE SET "userId"=EXCLUDED."userId","lastSeenAt"=NOW()`,
          String(sessionId), String(userId)
        );
        sessionsUpdated += 1;
      } catch { }
    }
    if (anonymousId) {
      const r = await db.$executeRawUnsafe(`UPDATE "VisitorSession" SET "userId" = $1 WHERE "anonymousId" = $2`, String(userId), String(anonymousId));
      sessionsUpdated += Number(r) || 0;
    }
    // Update Event.userId for related events
    if (sessionId) {
      await db.$executeRawUnsafe(`UPDATE "Event" SET "userId" = $1 WHERE COALESCE("sessionId", properties->>'sessionId') = $2 AND ("userId" IS NULL OR "userId" <> $1)`, String(userId), String(sessionId));
    }
    if (anonymousId) {
      // session-bound
      const sids: any[] = await db.$queryRawUnsafe(`SELECT id FROM "VisitorSession" WHERE "anonymousId" = $1`, String(anonymousId));
      const sidArr = (sids || []).map((r: any) => String(r.id));
      if (sidArr.length) {
        await db.$executeRawUnsafe(`UPDATE "Event" SET "userId" = $1 WHERE COALESCE("sessionId", properties->>'sessionId') = ANY($2) AND ("userId" IS NULL OR "userId" <> $1)`, String(userId), sidArr);
      }
      // direct anonymous
      await db.$executeRawUnsafe(`UPDATE "Event" SET "userId" = $1 WHERE COALESCE("anonymousId", properties->>'anonymousId') = $2 AND ("userId" IS NULL OR "userId" <> $1)`, String(userId), String(anonymousId));
    }
    // Merge guest cart (by session header/cookies) into user cart to keep continuity
    try {
      // Construct a faux request carrying same headers to reuse getOrCreateGuestCartId
      const proxyReq: any = { headers: req.headers, cookies: req.cookies };
      const proxyRes: any = { setHeader: () => { } };
      const { cartId: guestCartId } = await getOrCreateGuestCartId(proxyReq, proxyRes);
      const rows: any[] = await db.$queryRawUnsafe('SELECT "productId","quantity" FROM "GuestCartItem" WHERE "cartId"=$1', guestCartId);
      if (rows && rows.length) {
        let cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
        if (!cart) cart = await db.cart.create({ data: { userId } });
        const agg = new Map<string, number>();
        for (const r of rows) { const pid = String(r.productId); const q = Math.max(1, Number(r.quantity || 1)); agg.set(pid, (agg.get(pid) || 0) + q); }
        for (const [pid, qty] of agg.entries()) {
          try {
            const existing = await db.cartItem.findFirst({ where: { cartId: cart.id, productId: pid }, select: { id: true, quantity: true } });
            if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty } });
            else await db.cartItem.create({ data: { cartId: cart.id, productId: pid, quantity: qty } });
          } catch { }
        }
        // Reflect recent activity on the user's cart
        try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
        try { await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1', guestCartId) } catch { }
        try { await db.$executeRawUnsafe('DELETE FROM "GuestCart" WHERE id=$1', guestCartId) } catch { }
      }
    } catch { }

    return res.json({ ok: true, sessionsUpdated });
  } catch (e: any) { return res.status(500).json({ ok: false, error: e?.message || 'link_failed' }); }
});

// Public: read recent events for a given sessionId/userId (limited, for diagnostics)
shop.get('/events', async (req: any, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const sessionId = (req.query.sessionId as string | undefined) || undefined;
    const userId = (req.query.userId as string | undefined) || undefined;
    const conds: string[] = []; const args: any[] = []; let idx = 1;
    if (sessionId) { conds.push(`COALESCE("sessionId", properties->>'sessionId') = $${idx++}`); args.push(String(sessionId)); }
    if (userId) { conds.push(`COALESCE("userId", properties->>'userId') = $${idx++}`); args.push(String(userId)); }
    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    args.push(limit);
    const rows: any[] = await db.$queryRawUnsafe(`
      SELECT id, "createdAt", name,
             COALESCE("sessionId", properties->>'sessionId') AS "sessionId",
             COALESCE("userId", properties->>'userId')     AS "userId",
             COALESCE("pageUrl", properties->>'pageUrl')   AS "pageUrl",
             COALESCE("referrer", properties->>'referrer') AS "referrer",
             device, os, browser, country, city
      FROM "Event"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT $${idx}
    `, ...args);
    // mask potential PII in public response (no properties dump)
    return res.json({ ok: true, events: rows });
  } catch (e: any) { return res.status(500).json({ ok: false, error: e?.message || 'events_list_failed' }); }
});
// Promotions claim (shop user)
shop.post('/promotions/claim/start', async (req: any, res) => {
  try {
    const campaignId = String(req.body?.campaignId || ''); if (!campaignId) return res.status(400).json({ error: 'missing_campaign' });
    const expMs = 10 * 60 * 1000; const token = require('crypto').randomUUID();
    const c = await db.claim.create({ data: { campaignId, token, status: 'initiated', expiresAt: new Date(Date.now() + expMs) } as any });
    res.json({ token: c.token, exp: c.expiresAt });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'claim_start_failed' }); }
});
shop.post('/promotions/claim/complete', async (req: any, res) => {
  try {
    // Identify user using shared token reader (supports WebView)
    const { readTokenFromRequest, verifyJwt } = await import('../utils/jwt');
    const tok = readTokenFromRequest(req);
    if (!tok) return res.status(401).json({ error: 'unauthorized' });
    let payload: any;
    try { payload = verifyJwt(tok); } catch { return res.status(401).json({ error: 'unauthorized' }); }
    const userId = String(payload.userId);
    const token = String(req.body?.token || ''); if (!token) return res.status(400).json({ error: 'missing_token' });
    const cl = await db.claim.findUnique({ where: { token } } as any);
    if (!cl) return res.status(404).json({ error: 'not_found' });
    if (new Date(cl.expiresAt).getTime() < Date.now()) return res.status(410).json({ error: 'expired' });
    if (cl.status === 'completed') return res.json({ ok: true, already: true });
    const camp = await db.campaign.findUnique({ where: { id: cl.campaignId } } as any);
    if (!camp) return res.status(404).json({ error: 'campaign_not_found' });
    const rewardId = (camp as any).rewardId as string | undefined;
    if (rewardId) {
      const exists = await db.userReward.findFirst({ where: { userId, rewardId, campaignId: camp.id } } as any);
      if (!exists) { await db.userReward.create({ data: { userId, rewardId, campaignId: camp.id, status: 'granted' } } as any); }
    }
    await db.claim.update({ where: { token }, data: { status: 'completed', userId } } as any);
    res.json({ ok: true, granted: !!rewardId });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'claim_complete_failed' }); }
});

// Public: list public/active coupons (no auth required)
shop.get('/coupons/public', async (_req: any, res) => {
  try {
    const now = new Date();
    const rows: any[] = await db.coupon.findMany({
      where: {
        isActive: true as any,
        validFrom: { lte: now } as any,
        validUntil: { gte: now } as any,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200
    } as any);

    // Only expose global/sitewide coupons
    const codes = rows.map((c: any) => String(c.code || '')).filter(Boolean);
    const settings = await Promise.all(codes.map(async (code: string) => {
      const row = await db.setting.findUnique({ where: { key: `coupon_rules:${code.toUpperCase()}` } } as any);
      return [code.toUpperCase(), (row?.value as any) || null] as const;
    }));
    const rulesByCode = new Map<string, any>(settings);

    const items = rows
      .filter((c: any) => {
        const rule = rulesByCode.get(String(c.code || '').toUpperCase());
        const kind = rule?.kind ? String(rule.kind).toLowerCase() : 'sitewide';
        const includes = Array.isArray(rule?.includes) ? rule.includes : Array.isArray(rule?.rules?.includes) ? rule.rules.includes : [];
        const isGlobal = kind === 'sitewide' || !(Array.isArray(includes) && includes.length > 0);
        // Normalize audience synonyms (supports Arabic labels)
        const audRaw = (rule?.audience?.target ?? rule?.audience ?? '');
        const aud = String(audRaw || '').toLowerCase().trim();
        const audNorm =
          (!aud || aud === '') ? '' :
            (aud === 'all' || aud === 'everyone' || aud === '*' || aud.includes('الجميع') ? 'all' :
              (aud === 'users' || aud === 'registered' || aud === 'existing' || aud.includes('مسجل') ? 'users' :
                (aud === 'new' || aud === 'new_user' || aud === 'new_users' || aud === 'first' || aud === 'first_order' || aud.includes('الجدد') || aud.includes('الجديدة') ? 'new' : aud)));
        // On public endpoint expose only 'all' (everyone) or unspecified; hide users/new targeted coupons
        const allowedAudience = (audNorm === '' || audNorm === 'all');
        // Respect optional rules enable/schedule if set
        const now = new Date();
        const fromOk = !rule?.schedule?.from || new Date(rule.schedule.from) <= now;
        const toOk = !rule?.schedule?.to || new Date(rule.schedule.to) >= now;
        const enabledOk = rule?.enabled !== false;
        return isGlobal && allowedAudience && enabledOk && fromOk && toOk;
      })
      .map((c: any) => ({
        id: c.id, code: c.code, title: c.title || c.code,
        discountType: c.discountType, discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount || 0, validUntil: c.validUntil || null
      }));
    // Return both legacy "items" and "coupons" for compatibility with various mweb pages
    res.json({ ok: true, items, coupons: items });
  } catch { res.json({ ok: true, items: [] }) }
});

// Auth: coupons owned by current user (granted)
shop.get('/me/coupons', async (req: any, res) => {
  try {
    // Identify shop user using shared token reader (supports WebView headers/cookies)
    const { readTokenFromRequest, verifyJwt } = await import('../utils/jwt');
    const tok = readTokenFromRequest(req);
    if (!tok) return res.status(401).json({ error: 'unauthorized' });
    let payload: any;
    try { payload = verifyJwt(tok); } catch { return res.status(401).json({ error: 'unauthorized' }); }
    const userId = String(payload.userId);

    const rows: any[] = await db.userReward.findMany({
      where: { userId, status: 'granted' as any },
      include: { reward: true }
    } as any);
    const items = rows.map((r: any) => ({
      id: r.id, code: r.reward?.code || r.rewardId, title: r.reward?.title || r.reward?.code || 'كوبون',
      discountType: r.reward?.config?.discountType || r.reward?.type || 'COUPON',
      discountValue: r.reward?.config?.discountValue || r.reward?.config?.amount || 0,
      minOrderAmount: r.reward?.config?.min || r.reward?.config?.minOrderAmount || 0,
      validUntil: r.reward?.validUntil || null, grantedAt: r.createdAt
    }));

    // Also include active/global coupons from Prisma applying isActive/date/global filters
    const now = new Date();
    // Determine audience segment: new user vs existing
    let isNewUser = false;
    let userCreatedAt: Date | null = null;
    try {
      const u = await db.user.findUnique({ where: { id: userId }, select: { createdAt: true } } as any);
      const createdAt = u?.createdAt ? new Date(u.createdAt) : null;
      userCreatedAt = createdAt;
      const ageMs = createdAt ? (now.getTime() - createdAt.getTime()) : Number.MAX_SAFE_INTEGER;
      const NEW_WINDOW_DAYS = Number(process.env.COUPON_NEW_USER_WINDOW_DAYS || 30);
      const withinWindow = ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const orderCount = await db.order.count({ where: { userId } } as any);
      isNewUser = withinWindow || (Number(orderCount || 0) === 0);
    } catch { }
    const activeCoupons: any[] = await db.coupon.findMany({
      where: {
        isActive: true as any,
        validFrom: { lte: now } as any,
        validUntil: { gte: now } as any,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    } as any);

    // Filter out coupons already used by this user
    const used = await db.couponUsage.findMany({ where: { userId }, select: { couponId: true } } as any);
    const usedIds = new Set<string>((used || []).map((u: any) => String(u.couponId)));

    // Load advanced rules to keep only global/sitewide coupons
    const codes = activeCoupons.map((c: any) => String(c.code || '')).filter(Boolean);
    const settings = await Promise.all(codes.map(async (code: string) => {
      const row = await db.setting.findUnique({ where: { key: `coupon_rules:${code.toUpperCase()}` } } as any);
      return [code.toUpperCase(), (row?.value as any) || null] as const;
    }));
    const rulesByCode = new Map<string, any>(settings);

    let coupons = activeCoupons
      .filter((c: any) => !usedIds.has(String(c.id)))
      .filter((c: any) => {
        const rule = rulesByCode.get(String(c.code || '').toUpperCase());
        // Normalize audience synonyms (supports Arabic labels)
        const audRaw = (rule?.audience?.target ?? rule?.audience ?? '');
        const aud = String(audRaw || '').toLowerCase().trim();
        const audNorm =
          (!aud || aud === '') ? '' :
            (aud === 'all' || aud === 'everyone' || aud === '*' || aud.includes('الجميع') ? 'all' :
              (aud === 'users' || aud === 'registered' || aud === 'existing' || aud.includes('مسجل') ? 'users' :
                (aud === 'new' || aud === 'new_users' || aud === 'first' || aud === 'first_order' || aud.includes('الجدد') || aud.includes('الجديدة') ? 'new' : aud)));
        // Respect audience rules for authenticated users based on segment
        const isNewAudience = (audNorm === 'new');
        const isExistingAudience = (audNorm === 'users') || (audNorm === 'existing');
        let allowedAudience =
          audNorm === '' || audNorm === 'all' ||
          (isNewAudience ? isNewUser : false) ||
          (isExistingAudience ? !isNewUser : false) ||
          (audNorm === 'users'); // generic 'users' allowed for all signed-in
        // Enforce "registered" audience: only users registered on/before coupon creation
        if (allowedAudience && audNorm === 'users' && userCreatedAt && c?.createdAt) {
          try {
            const cuCreatedAt = new Date(c.createdAt);
            if (userCreatedAt.getTime() > cuCreatedAt.getTime()) allowedAudience = false;
          } catch { }
        }
        // Respect optional rules enable/schedule if set
        const now = new Date();
        const fromOk = !rule?.schedule?.from || new Date(rule.schedule.from) <= now;
        const toOk = !rule?.schedule?.to || new Date(rule.schedule.to) >= now;
        const enabledOk = rule?.enabled !== false;
        // Do NOT filter out token-targeted coupons here; show them to user and let PDP/cart apply eligibility rules
        return allowedAudience && enabledOk && fromOk && toOk;
      })
      .map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title || c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount || 0,
        validUntil: c.validUntil || null
      }));
    // Prioritize new-user coupons for new users
    try {
      if (isNewUser) {
        const score = (cc: any) => {
          const rule = rulesByCode.get(String(cc.code || '').toUpperCase());
          const aud = String((rule?.audience?.target ?? rule?.audience ?? '') || '').toLowerCase();
          const isNew = aud === 'new' || aud === 'new_users' || aud === 'first' || aud === 'first_order';
          return isNew ? 0 : 1;
        };
        coupons = coupons.sort((a: any, b: any) => score(a) - score(b));
      }
    } catch { }

    res.json({ ok: true, items, coupons });
  } catch { res.status(401).json({ error: 'unauthorized' }) }
});

// Pricing: compute effective totals with active user rewards (MVP: single coupon)
shop.post('/pricing/effective', async (req: any, res) => {
  try {
    const items: Array<{ id: string; qty: number }> = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.json({ subtotal: 0, discount: 0, total: 0 });
    const ids = Array.from(new Set(items.map(i => String(i.id || '').trim()).filter(Boolean)));
    const prods = await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true } });
    const priceMap = new Map<string, number>(); for (const p of prods) priceMap.set(p.id, Number(p.price || 0));
    const subtotal = items.reduce((s, it) => s + (priceMap.get(it.id) || 0) * Math.max(1, Number(it.qty || 1)), 0);
    // Identify user similar to /me
    const header = (req?.headers?.authorization as string | undefined) || '';
    let tokenAuth = '';
    if (header.startsWith('Bearer ')) tokenAuth = header.slice(7);
    const cookieTok = (req?.cookies?.shop_auth_token as string | undefined) || '';
    const jwt = require('jsonwebtoken');
    let userId: string | undefined;
    for (const t of [tokenAuth, cookieTok]) { if (!t) continue; try { const pay: any = jwt.verify(t, process.env.JWT_SECRET || ''); if (pay?.userId) { userId = String(pay.userId); break; } } catch { } }
    let discount = 0;
    if (userId) {
      // Load granted rewards for user
      const urs = await db.userReward.findMany({ where: { userId, status: 'granted' as any }, include: { reward: true } } as any);
      // MVP: apply first COUPON type
      const rw = urs.find(u => (u as any).reward?.type === 'COUPON');
      if (rw && (rw as any).reward?.config) {
        const cfg = (rw as any).reward.config || {};
        const percent = Number(cfg.percent || cfg.discountPercent || 0);
        const amount = Number(cfg.amount || cfg.discountAmount || 0);
        if (percent > 0) discount = Math.max(discount, Math.min(subtotal, (subtotal * percent) / 100));
        else if (amount > 0) discount = Math.max(discount, Math.min(subtotal, amount));
      }
    }
    const total = Math.max(0, subtotal - discount);
    res.json({ subtotal, discount, total });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'pricing_failed' }); }
});

// Catalog by category slug or id
shop.get('/catalog/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const cat = await db.category.findFirst({ where: { OR: [{ slug }, { id: slug }] }, select: { id: true } });
    if (!cat) return res.json({ items: [] });
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 24)));
    const sort = String(req.query.sort || 'reco');
    const orderBy: any = sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };
    const q = String(req.query.q || '').trim();
    const brand = String(req.query.brand || '').trim();
    const min = req.query.min != null ? Number(req.query.min) : null;
    const max = req.query.max != null ? Number(req.query.max) : null;
    function parseCsv(name: string): string[] { const v = String((req.query as any)[name] || '').trim(); if (!v) return []; return v.split(',').map(s => s.trim()).filter(Boolean) }
    const sizes = parseCsv('sizes');
    const colors = parseCsv('colors');
    const materials = parseCsv('materials');
    const styles = parseCsv('styles');
    const tagsAny = [...sizes, ...colors, ...materials, ...styles];
    // Resolve descendant categories (include all children recursively) so parent category lists include products under subcategories
    let catIds: string[] = [String(cat.id)];
    try {
      const rows: any[] = await db.$queryRawUnsafe(`
        WITH RECURSIVE c AS (
          SELECT id FROM "Category" WHERE id=$1
          UNION ALL
          SELECT ch.id FROM "Category" ch JOIN c ON ch."parentId" = c.id
        )
        SELECT id FROM c
      `, String(cat.id));
      const ids = Array.isArray(rows) ? rows.map((r: any) => String(r.id)) : [];
      if (ids.length) catIds = Array.from(new Set(ids));
    } catch {
      // Fallback: best-effort fetch of first-level children only
      try {
        const kids: any[] = await db.category.findMany({ where: { parentId: String(cat.id) }, select: { id: true } } as any);
        const ids = kids.map(k => String(k.id));
        catIds = Array.from(new Set([String(cat.id), ...ids]));
      } catch { }
    }
    // Include products whose primary category OR additional link table is within the set of category + descendants
    const andConds: any[] = [
      { isActive: true },
      { OR: [{ categoryId: { in: catIds } }, { categoryLinks: { some: { categoryId: { in: catIds } } } }] }
    ];
    if (q) andConds.push({ name: { contains: q, mode: 'insensitive' } });
    if (brand) andConds.push({ brand: { contains: brand, mode: 'insensitive' } as any });
    if (min != null || max != null) andConds.push({ price: { gte: (min != null && isFinite(min)) ? Number(min) : undefined, lte: (max != null && isFinite(max)) ? Number(max) : undefined } as any });
    if (tagsAny.length) andConds.push({ tags: { hasSome: tagsAny } as any });
    const where: any = { AND: andConds } as any;
    const items: any[] = await db.product.findMany({ where, select: { id: true, name: true, price: true, images: true, brand: true, tags: true }, orderBy, take: limit });
    // annotate category best sellers rank and sold counts
    try {
      const rows: any[] = await db.$queryRawUnsafe(`
        SELECT oi."productId" as pid, SUM(oi.quantity) as qty
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id=oi."orderId"
        JOIN "Product" p ON p.id=oi."productId"
        WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
          AND (
            p."categoryId" = ANY($1::text[])
            OR EXISTS (SELECT 1 FROM "ProductCategory" pc WHERE pc."productId"=p.id AND pc."categoryId" = ANY($1::text[]))
          )
        GROUP BY 1 ORDER BY qty DESC LIMIT 200
      `, catIds);
      const rankMap = new Map<string, { rank: number; qty: number }>(); let r = 1;
      for (const row of rows) { rankMap.set(String(row.pid), { rank: r, qty: Number(row.qty || 0) }); r++; }
      for (const it of items) { const m = rankMap.get(String(it.id)); if (m) { (it as any).bestRank = m.rank; (it as any).bestRankCategory = 'الفئة'; (it as any).soldPlus = `${m.qty}`; } }
    } catch { }
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});
// Public: tracking keys for client injection (merged from latest integrations)
shop.get('/tracking/keys', async (_req, res) => {
  try {
    const merged: Record<string, string> = {};
    // 1) Pull from integrations table (generic key/value)
    try {
      const latest = await db.integration.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
      for (const it of latest) {
        const cfg: any = (it as any).config || {};
        for (const [k, v] of Object.entries(cfg)) {
          if (typeof v === 'string') {
            const sv = (v as string).trim();
            if (sv && !(k in merged)) merged[k] = sv;
          }
        }
      }
    } catch { }
    // 2) Pull from admin settings used لميتا (لوحة التحكم)
    try {
      // اقرأ كل مفاتيح الإعدادات الخاصة بميتا لأي نطاق (mweb/web/دومين)
      const settings = await db.setting.findMany({ where: { key: { startsWith: 'integrations:meta:settings' } } } as any);
      const pick = (src: any, srcKey: string, outKey: string) => {
        const val = src && typeof src[srcKey] === 'string' ? String(src[srcKey]) : '';
        if (val && !(outKey in merged)) merged[outKey] = val;
      };
      for (const row of settings) {
        const v: any = (row as any).value || {};
        pick(v, 'pixelId', 'FB_PIXEL_ID');
        pick(v, 'googleTagManagerId', 'GOOGLE_TAG_MANAGER_ID');
        pick(v, 'gaMeasurementId', 'GA_MEASUREMENT_ID');
        pick(v, 'tiktokPixelId', 'TIKTOK_PIXEL_ID');
        pick(v, 'conversionsToken', 'FB_CAPI_TOKEN');
        pick(v, 'testEventCode', 'FB_TEST_EVENT_CODE');
      }
    } catch { }
    // 3) Environment fallbacks for critical keys (ensure production works even if admin misconfigured)
    try {
      const put = (k: string, v?: string) => { if (v && v.trim() && !(k in merged)) merged[k] = v.trim() };
      put('FB_PIXEL_ID', process.env.FB_PIXEL_ID);
      put('FB_CAPI_TOKEN', process.env.FB_CAPI_TOKEN);
      put('FB_TEST_EVENT_CODE', process.env.FB_TEST_EVENT_CODE);
      put('GA_MEASUREMENT_ID', process.env.GA_MEASUREMENT_ID);
      put('GOOGLE_TAG_MANAGER_ID', process.env.GOOGLE_TAG_MANAGER_ID);
      put('TIKTOK_PIXEL_ID', process.env.TIKTOK_PIXEL_ID);
      put('SENTRY_DSN', process.env.SENTRY_DSN);
    } catch { }
    res.json({ keys: merged });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'tracking_keys_failed' });
  }
});

// Unified Meta Conversions API endpoint for client events (deduplicated with event_id)
shop.post('/events/track', async (req: any, res) => {
  try {
    // In-memory error-rate monitor for this endpoint
    ; (global as any).__track_metrics__ = (global as any).__track_metrics__ || { window: [] as Array<{ t: number; ok: boolean }>, lastAlert: 0 }
    const met = (global as any).__track_metrics__
    const name = String(req.body?.event_name || '').trim();
    if (!name) return res.status(400).json({ error: 'event_name_required' });
    const event_id = typeof req.body?.event_id === 'string' ? String(req.body.event_id) : undefined;
    const event_time = Number(req.body?.event_time || 0) || Math.floor(Date.now() / 1000);
    const custom = (req.body?.custom_data && typeof req.body.custom_data === 'object') ? req.body.custom_data : {};
    // User data enrichment
    let em: string | undefined; let ph: string | undefined;
    try {
      const uid = (req as any).user?.userId as string | undefined;
      if (uid) {
        const u = await db.user.findUnique({ where: { id: uid }, select: { email: true, phone: true } });
        if (u?.email) { const { hashEmail } = await import('../services/fb'); em = hashEmail(u.email) }
        if (u?.phone) { try { const digits = String(u.phone).replace(/\\D/g, ''); ph = require('crypto').createHash('sha256').update(digits).digest('hex') } catch { } }
      }
    } catch { }
    // If client passed raw email/phone, hash them
    try { const raw = String(req.body?.email || '').trim().toLowerCase(); if (raw && !em) { const { hashEmail } = await import('../services/fb'); em = hashEmail(raw) } } catch { }
    try { const raw = String(req.body?.phone || '').replace(/\\D/g, ''); if (raw && !ph) { ph = require('crypto').createHash('sha256').update(raw).digest('hex') } } catch { }
    // fbp/fbc cookies
    let fbp: string | undefined; let fbc: string | undefined;
    try {
      const raw = String(req.headers.cookie || '');
      const m1 = /(?:^|; )_fbp=([^;]+)/.exec(raw); if (m1) fbp = decodeURIComponent(m1[1]);
      const m2 = /(?:^|; )_fbc=([^;]+)/.exec(raw); if (m2) fbc = decodeURIComponent(m2[1]);
    } catch { }
    // Client info
    let client_ip_address: string | undefined; let client_user_agent: string | undefined;
    try { client_user_agent = String(req.headers['user-agent'] || '') } catch { }
    try {
      const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      client_ip_address = xf || (req.ip as any) || undefined;
    } catch { }
    const { fbSendEvents } = await import('../services/fb');
    const ev = {
      event_name: name,
      event_id,
      event_time,
      user_data: { em, ph, fbp, fbc, client_ip_address, client_user_agent },
      custom_data: custom,
      action_source: 'website',
      event_source_url: String(req.headers.referer || '')
    };
    const r = await fbSendEvents([ev as any]);
    try {
      const now = Date.now()
      met.window.push({ t: now, ok: r.ok })
      const cutoff = now - 5 * 60 * 1000
      met.window = met.window.filter((e: any) => e.t >= cutoff)
      const total = met.window.length
      const failures = met.window.filter((e: any) => !e.ok).length
      const rate = total > 0 ? (failures / total) : 0
      const threshold = Number(process.env.TRACK_ALERT_ERROR_RATE || 0.4)
      const minEvents = Number(process.env.TRACK_ALERT_MIN_EVENTS || 30)
      if (total >= minEvents && rate >= threshold && (now - met.lastAlert > 5 * 60 * 1000)) {
        met.lastAlert = now
        console.warn(`[TRACK ALERT] /events/track high error rate ${(rate * 100).toFixed(1)}% over ${total} events in 5m`)
        const hook = process.env.ALERT_WEBHOOK_URL
        if (hook) { try { await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: `TRACK ALERT: ${(rate * 100).toFixed(1)}% errors (${failures}/${total})` }) }) } catch { } }
      }
    } catch { }
    return res.json({ ok: r.ok, status: r.status });
  } catch { return res.status(500).json({ error: 'track_failed' }) }
});

// Google OAuth login
shop.get('/auth/google/login', async (req, res) => {
  try {
    const cfg = await getGoogleOAuthConfig();
    if (!cfg) return res.status(400).json({ error: 'google_not_configured' });
    const { clientId, redirectUri } = cfg;
    const state = Buffer.from(JSON.stringify({ next: String(req.query.next || '/account') })).toString('base64url');
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    return res.redirect(authUrl);
  } catch (e: any) { return res.status(500).json({ error: e.message || 'google_login_failed' }) }
});

shop.get('/auth/google/callback', async (req, res) => {
  try {
    const cfg = await getGoogleOAuthConfig();
    if (!cfg) return res.status(400).json({ error: 'google_not_configured' });
    const { clientId, clientSecret, redirectUri } = cfg;
    const code = String(req.query.code || '');
    const stateRaw = String(req.query.state || '');
    const state = (() => { try { return JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')) } catch { return { next: '/account' } } })();
    const ru = String(req.query.ru || '');
    if (!code) return res.status(400).json({ error: 'missing_code' });
    const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId });
    if (clientSecret) body.set('client_secret', clientSecret);
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    const tok = await tokenRes.json().catch(() => ({}));
    const idToken = tok.id_token as string | undefined;
    if (!idToken) return res.status(400).json({ error: 'invalid_token' });
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload: any = ticket.getPayload() || {};
    const email = String(payload.email || '').toLowerCase();
    const name = String(payload.name || '') || String(payload.given_name || '') || 'User';
    if (!email) return res.status(400).json({ error: 'email_required' });
    const existing = await db.user.findUnique({ where: { email } as any });
    const user = await db.user.upsert({ where: { email }, update: { name }, create: { email, name, phone: '', password: '' } } as any);
    const token = signJwt({ userId: user.id, email: user.email, role: (user as any).role || 'USER' });
    const cookieDomain = process.env.COOKIE_DOMAIN || '.jeeey.com';
    const isProd = (process.env.NODE_ENV || 'production') === 'production';
    // Write domain cookie
    try { res.cookie('shop_auth_token', token, { httpOnly: true, domain: cookieDomain, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 3600 * 24 * 30 * 1000, path: '/' }); } catch { }
    // Also write api subdomain cookie to ensure /api/me sees it when third-party blocked
    try {
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) {
        res.cookie('shop_auth_token', token, { httpOnly: true, domain: `api.${root}`, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 3600 * 24 * 30 * 1000, path: '/' });
      }
    } catch { }
    // Host-only fallback for strict environments
    try { res.cookie('shop_auth_token', token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 3600 * 24 * 30 * 1000, path: '/' }); } catch { }
    // Persist token for SPA fallback (localStorage) via URL param
    // Dynamic mweb base inferred from referer if present
    let mwebBase = process.env.MWEB_BASE_URL || '';
    try { if (!mwebBase && req.headers.referer) { const u = new URL(String(req.headers.referer)); mwebBase = `${u.protocol}//${u.host.replace('api.', 'm.')}`; } } catch { }
    if (!mwebBase) mwebBase = 'https://m.jeeey.com';
    const next = String(state?.next || '/account');
    let dest = ru ? `${ru}` : `${mwebBase}${next.startsWith('/') ? next : '/' + next}`;
    // Append token for client-side fallback (SPA will store in localStorage)
    try {
      const u = new URL(dest);
      u.searchParams.set('t', token);
      dest = u.toString();
    } catch { }
    return res.redirect(dest);
  } catch (e: any) { return res.status(500).json({ error: e.message || 'google_callback_failed' }) }
});

// Facebook OAuth login (Meta)
shop.get('/auth/facebook/login', async (req, res) => {
  try {
    const cfg = await getFacebookOAuthConfig();
    if (!cfg) return res.status(400).json({ error: 'facebook_not_configured' });
    const { appId, redirectUri } = cfg;
    const state = Buffer.from(JSON.stringify({ next: String(req.query.next || '/account') })).toString('base64url');
    const scope = encodeURIComponent('public_profile,email');
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?response_type=code&client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
    return res.redirect(authUrl);
  } catch (e: any) { return res.status(500).json({ error: e.message || 'facebook_login_failed' }) }
});

shop.get('/auth/facebook/callback', async (req, res) => {
  try {
    const cfg = await getFacebookOAuthConfig();
    if (!cfg) return res.status(400).json({ error: 'facebook_not_configured' });
    const { appId, appSecret, redirectUri } = cfg;
    const code = String(req.query.code || '');
    const stateRaw = String(req.query.state || '');
    const state = (() => { try { return JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')) } catch { return { next: '/account' } } })();
    if (!code) return res.status(400).json({ error: 'missing_code' });
    // Exchange code for access token
    const tokUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(appSecret || '')}&code=${encodeURIComponent(code)}`;
    const tokenRes = await fetch(tokUrl, { method: 'GET' });
    const tok = await tokenRes.json().catch(() => ({}));
    const accessToken = tok.access_token as string | undefined;
    if (!accessToken) return res.status(400).json({ error: 'invalid_token' });
    // Load user profile
    const meUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    const meRes = await fetch(meUrl, { method: 'GET' });
    const me: any = await meRes.json().catch(() => ({}));
    const email = String(me?.email || '').toLowerCase();
    const name = String(me?.name || '') || 'User';
    if (!email) return res.status(400).json({ error: 'email_required_from_facebook' });
    const user = await db.user.upsert({ where: { email }, update: { name }, create: { email, name, phone: '', password: '' } } as any);
    const token = signJwt({ userId: user.id, email: user.email, role: (user as any).role || 'USER' });
    const cookieDomain = process.env.COOKIE_DOMAIN || '.jeeey.com';
    const isProd = (process.env.NODE_ENV || 'production') === 'production';
    try { res.cookie('shop_auth_token', token, { httpOnly: true, domain: cookieDomain, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 3600 * 24 * 30 * 1000, path: '/' }); } catch { }
    try {
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) {
        res.cookie('shop_auth_token', token, { httpOnly: true, domain: `api.${root}`, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 3600 * 24 * 30 * 1000, path: '/' });
      }
    } catch { }
    try { res.cookie('shop_auth_token', token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 3600 * 24 * 30 * 1000, path: '/' }); } catch { }
    // Redirect back to mweb with SPA fallback token param
    let mwebBase = process.env.MWEB_BASE_URL || '';
    try { if (!mwebBase && req.headers.referer) { const u = new URL(String(req.headers.referer)); mwebBase = `${u.protocol}//${u.host.replace('api.', 'm.')}`; } } catch { }
    if (!mwebBase) mwebBase = 'https://m.jeeey.com';
    const next = String(state?.next || '/account');
    let dest = `${mwebBase}${next.startsWith('/') ? next : '/' + next}`;
    try { const u = new URL(dest); u.searchParams.set('t', token); dest = u.toString(); } catch { }
    return res.redirect(dest);
  } catch (e: any) { return res.status(500).json({ error: e.message || 'facebook_callback_failed' }) }
});

// Cart endpoints (auth-required variants under /cart/auth to avoid shadowing public guest endpoints)
shop.get('/cart/auth', requireAuth, async (req: any, res) => {
  const userId = req.user.userId;
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } } },
  });
  const subtotal = (cart?.items ?? []).reduce((s, it) => s + it.quantity * (it.product?.price || 0), 0);
  res.json({ cart, subtotal });
});

shop.post('/cart/auth/add', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    // Merge any existing guest cart into the authenticated user's cart
    await mergeGuestIntoUserIfPresent(req, res, userId);
    const { productId, quantity = 1, attributes } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    let cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) cart = await db.cart.create({ data: { userId } });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + Number(quantity || 1) } });
    else await db.cartItem.create({ data: { cartId: cart.id, productId, quantity: Number(quantity || 1), attributes: attributes ? (attributes as any) : undefined } });
    // Fire FB CAPI AddToCart (best-effort) with dedupe + client hints
    try {
      const { fbSendEvents, hashEmail } = await import('../services/fb');
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
      const prod = await db.product.findUnique({ where: { id: productId }, select: { price: true } });
      // Extract fbp/fbc from cookies if present for better match
      let fbp: string | undefined; let fbc: string | undefined; let client_ip_address: string | undefined; let client_user_agent: string | undefined;
      try {
        const raw = String(req.headers.cookie || '');
        const m1 = /(?:^|; )_fbp=([^;]+)/.exec(raw); if (m1) fbp = decodeURIComponent(m1[1]);
        const m2 = /(?:^|; )_fbc=([^;]+)/.exec(raw); if (m2) fbc = decodeURIComponent(m2[1]);
      } catch { }
      try { client_user_agent = String(req.headers['user-agent'] || '') } catch { }
      try { const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); client_ip_address = xf || (req.ip as any) || undefined } catch { }
      const evId = `AddToCart_${String(productId)}_${Math.floor(Date.now() / 1000)}`
      await fbSendEvents([
        {
          event_name: 'AddToCart',
          event_id: evId,
          user_data: { em: hashEmail(user?.email), fbp, fbc, client_ip_address, client_user_agent },
          custom_data: { value: Number(prod?.price || 0), currency: 'YER', contents: [{ id: productId, quantity: Number(quantity || 1) }], content_type: 'product' },
          action_source: 'website',
          event_source_url: String(req.headers.referer || '')
        },
      ]);
    } catch { }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/auth/update', requireAuth, async (req: any, res) => {
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

shop.post('/cart/auth/remove', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId, attributes } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return res.json({ success: true });
    // Prefer attribute-exact delete; fallback to delete all rows for productId if nothing matched
    try {
      if (attributes) {
        const r: any = await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId), attributes: { equals: attributes as any } } } as any);
        if (!r || Number(r.count || 0) === 0) {
          await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } });
        }
      } else {
        await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } });
      }
    } catch {
      // Fallback hard delete by productId
      try { await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } }); } catch { }
    }
    try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/auth/clear', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const cart = await db.cart.findUnique({ where: { userId } });
    if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Addresses delete (single-address schema): soft-delete by removing row
shop.post('/addresses/delete', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.body || {}
    if (id) {
      try { await db.$executeRawUnsafe('DELETE FROM "AddressBook" WHERE id=$1 AND "userId"=$2', String(id), userId) } catch { }
    } else {
      await db.address.delete({ where: { userId } }).catch(() => { })
      try { await db.$executeRawUnsafe('DELETE FROM "AddressBook" WHERE "userId"=$1', userId) } catch { }
    }
    return res.json({ ok: true })
  } catch { return res.status(500).json({ error: 'failed' }) }
})

// Orders
// Effective pricing for selected cart items (public; no auth required)
shop.post('/pricing/effective', async (req: any, res) => {
  try {
    const items: Array<{ id: string; qty: number }> = Array.isArray(req.body?.items)
      ? req.body.items.map((x: any) => ({ id: String(x.id), qty: Number(x.qty || 1) }))
      : [];
    if (!items.length) return res.json({ total: 0, discount: 0 });
    const ids = Array.from(new Set(items.map(i => i.id)));
    const prods = await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true } });
    const priceById = new Map(prods.map(p => [String(p.id), Number(p.price || 0)]));
    const subtotal = items.reduce((s, it) => s + (priceById.get(it.id) || 0) * Math.max(1, it.qty), 0);
    // Simple placeholder promotions hook: currently zero
    const discount = 0;
    return res.json({ total: subtotal - discount, discount });
  } catch { return res.status(500).json({ error: 'effective_failed' }); }
});

// Rewards settings (public read)
shop.get('/policies/rewards/settings', async (_req, res) => {
  try { return res.json({ enabled: false }); } catch { return res.json({ enabled: false }); }
});
shop.get('/orders/me', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const orders = await db.order.findMany({
      where: { userId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true } } } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((o) => ({ id: o.id, code: (o as any).code || undefined, status: (o.status || 'PENDING').toLowerCase(), total: Number(o.total || 0), date: o.createdAt })));
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});
shop.post('/orders', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId, ref, shippingPrice, discount, selectedUids, selectedIds, paymentMethod, shippingMethodId, walletUse, pointsUse } = req.body || {};
    const linesInput: Array<{ productId: string; quantity: number; meta?: { uid?: string; color?: string; size?: string; attributes?: any } }> | null = Array.isArray((req.body || {}).lines) ? (req.body as any).lines : null
    // Build include dynamically to avoid querying missing columns on legacy DBs
    const hasCatLoyalty: boolean = (() => { return false; })();
    let _hasCatLoyalty = hasCatLoyalty;
    try {
      const chk: Array<{ exists: boolean } & Record<string, unknown>> = await db.$queryRawUnsafe(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'Category' AND column_name = 'loyaltyMultiplier'
         ) AS exists`
      );
      _hasCatLoyalty = !!(chk && chk[0] && (chk[0] as any).exists);
    } catch { }
    const productInclude = _hasCatLoyalty
      ? { include: { category: { select: { loyaltyMultiplier: true } }, vendor: { select: { loyaltyMultiplier: true } } } }
      : { include: { vendor: { select: { loyaltyMultiplier: true } } } };
    const cart = await db.cart.findUnique({ where: { userId }, include: { items: { include: { product: productInclude } } } });
    if (!linesInput && (!cart || cart.items.length === 0)) return res.status(400).json({ error: 'Cart is empty' });
    const selectedProductIds = Array.isArray(selectedIds) && selectedIds.length ? new Set(selectedIds.map(String)) : null;
    const selectedUidsList: string[] = Array.isArray(selectedUids) && selectedUids.length ? selectedUids.map(String) : [];
    const selectedCartUids = selectedUidsList.length ? new Set(selectedUidsList) : null;
    // Derive productIds from UIDs like productId|color|size
    const selectedFromUids = selectedCartUids ? new Set(Array.from(selectedCartUids).map(u => String(u).split('|')[0])) : null;
    const unionSelectedPids: Set<string> | null = (() => {
      const s = new Set<string>();
      if (selectedProductIds) selectedProductIds.forEach(x => s.add(String(x)));
      if (selectedFromUids) selectedFromUids.forEach(x => s.add(String(x)));
      return s.size ? s : null;
    })();
    // Prefer explicit lines from client when provided to avoid variant-level ambiguity
    let cartItems: Array<{ productId: string; quantity: number; product?: any; id?: string }> = []
    if (linesInput && linesInput.length) {
      const pids = Array.from(new Set(linesInput.map(l => String(l.productId)).filter(Boolean)))
      const prods = pids.length ? await db.product.findMany({ where: { id: { in: pids } } }) : []
      const byId = new Map<string, any>()
      for (const p of prods) { byId.set(String((p as any).id), p) }
      for (const l of linesInput) {
        const pid = String(l.productId)
        const qty = Math.max(1, Number(l.quantity || 1))
        cartItems.push({ productId: pid, quantity: qty, product: byId.get(pid) })
      }
    } else if (cart) {
      cartItems = (unionSelectedPids
        ? cart.items.filter(ci => unionSelectedPids.has(String(ci.productId)))
        : cart.items) as any
      // إذا تم تمرير اختيار (selectedIds أو selectedUids) ولم ينتج أي عناصر، لا نستعمل أي fallback حتى لا نكرر أو نمزج عناصر قديمة
      if ((selectedProductIds || selectedFromUids) && (!cartItems.length)) {
        return res.status(400).json({ error: 'No items selected' });
      }
    }
    // Build variant meta map from selectedUids (best-effort): pid -> { color, size, uid, attributes }
    const variantMetaByPid: Record<string, { color?: string; size?: string; uid?: string; attributes?: any }> = {}
    const variantMetaByUid: Record<string, { color?: string; size?: string; uid?: string; attributes?: any }> = {}
    const metaQueueByPid: Record<string, Array<{ uid?: string; meta: { color?: string; size?: string; uid?: string; attributes?: any } }>> = {}
    try {
      // Prefer meta from explicit lines when provided
      if (linesInput && linesInput.length) {
        for (const l of linesInput) {
          const pid = String(l.productId || '')
          if (!pid) continue
          const meta = { color: l.meta?.color, size: l.meta?.size, uid: l.meta?.uid, attributes: l.meta?.attributes }
          variantMetaByUid[String(l.meta?.uid || '')] = meta
          if (!variantMetaByPid[pid]) variantMetaByPid[pid] = meta
          metaQueueByPid[pid] = metaQueueByPid[pid] || []
          metaQueueByPid[pid].push({ uid: l.meta?.uid, meta })
        }
      } else if (selectedUidsList.length) {
        for (const u of selectedUidsList) {
          const parts = String(u).split('|')
          const pid = parts[0]
          const segs = parts.slice(1)
          let color: string | undefined = undefined
          let sizeUnlabeled: string | undefined = undefined
          const attributes: Record<string, string> = {}
          let unlabeledSeen = 0
          for (const seg of segs) {
            if (!seg) continue
            const idx = seg.indexOf(':')
            if (idx > -1) {
              const rawKey = seg.slice(0, idx).trim()
              const rawVal = seg.slice(idx + 1).trim()
              const keyNorm = rawKey
                .replace(/^اللون$/i, 'color')
                .replace(/^لون$/i, 'color')
                .replace(/^مقاسات?\s*بالأحرف$/i, 'size_letters')
                .replace(/^مقاسات?\s*بالارقام$/i, 'size_numbers')
                .replace(/^مقاسات?\s*بالأرقام$/i, 'size_numbers')
                .replace(/^size$/i, 'size')
              attributes[keyNorm || rawKey] = rawVal
            } else {
              // Segment without explicit key: first -> color, second -> size
              if (unlabeledSeen === 0 && !color) { color = seg; unlabeledSeen++ }
              else if (unlabeledSeen === 1 && !sizeUnlabeled) { sizeUnlabeled = seg; unlabeledSeen++ }
            }
          }
          // Derive a concise size label for quick display (combine if both exist)
          const sizeLabel = [attributes['size_letters'], attributes['size_numbers'], attributes['size'], sizeUnlabeled]
            .filter(Boolean)
            .join(' / ') || undefined
          if (pid) {
            const meta = { color, size: sizeLabel, uid: u, attributes }
            variantMetaByUid[u] = meta
            if (!variantMetaByPid[pid]) variantMetaByPid[pid] = meta
            metaQueueByPid[pid] = metaQueueByPid[pid] || []
            metaQueueByPid[pid].push({ uid: u, meta })
          }
        }
        // Enrich attributes.image from ProductColor galleries when color present
        try {
          const pids = Array.from(new Set(selectedUidsList.map(u => String(u).split('|')[0]))).filter(Boolean)
          if (pids.length) {
            const colors = await db.productColor.findMany({ where: { productId: { in: pids } }, select: { productId: true, name: true, primaryImageUrl: true } })
            const norm = (s: string): string => {
              const t = String(s || '').toLowerCase().trim()
                .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
                .replace(/[أإآ]/g, 'ا')
                .replace(/ة/g, 'ه')
                .replace(/ى/g, 'ي')
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9\u0600-\u06FF]/g, '');
              return t;
            };
            const makeKey = (pid: string, name: string) => `${pid}|${norm(String(name || ''))}`
            const imgByKey = new Map<string, string>()
            for (const c of colors) {
              const pid = String((c as any).productId)
              const nm = String((c as any).name || '')
              const img = (c as any).primaryImageUrl || ''
              if (!nm || !img) continue
              imgByKey.set(makeKey(pid, nm), String(img))
            }
            for (const pid of Object.keys(metaQueueByPid)) {
              for (const entry of metaQueueByPid[pid]) {
                const m = entry.meta
                const color = m.color || (m.attributes && (m.attributes as any).color)
                if (!color) continue
                const key = makeKey(String(pid), String(color))
                const found = imgByKey.get(key)
                if (found) {
                  m.attributes = m.attributes || {}
                  if (!m.attributes.image) m.attributes.image = found
                }
              }
            }
          }
        } catch { }
      }
    } catch { }
    const subtotal = cartItems.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.product?.price || 0), 0);
    const ship = Number(shippingPrice || 0);
    const disc = Number(discount || 0);
    // Apply wallet/points usage (server-side validation)
    let walletApplied = 0; let pointsApplied = 0; let pointsAppliedAmount = 0;
    // Load settings
    let pointValue = 0.01; try { const s = await db.setting.findUnique({ where: { key: 'points:settings' } }); pointValue = Number(((s?.value as any)?.pointValue) || 0.01) } catch { }
    // Wallet
    try {
      const bal = await db.walletLedger.aggregate({ _sum: { amount: true }, where: { userId, status: 'CONFIRMED' as any } }) as any;
      const balance = Number(bal?._sum?.amount || 0);
      const reqAmt = Math.max(0, Number(walletUse || 0));
      walletApplied = Math.min(reqAmt, Math.max(0, balance));
    } catch { }
    // Points (pointsUse interpreted as points count)
    try {
      const bal = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } }) as any;
      const pbal = Number(bal?._sum?.points || 0);
      const reqPts = Math.max(0, Math.floor(Number(pointsUse || 0)));
      pointsApplied = Math.min(reqPts, Math.max(0, pbal));
      pointsAppliedAmount = Math.max(0, Math.round((pointsApplied * pointValue) * 100) / 100);
    } catch { }
    const total = Math.max(0, subtotal + ship - disc - walletApplied - pointsAppliedAmount);
    // Validate shipping address against Address table only; fall back to null
    let shippingAddressIdResolved: string | null = null
    try {
      const sid = shippingAddressId ? String(shippingAddressId) : ''
      if (sid) {
        const addrRow = await db.address.findUnique({ where: { id: sid } })
        if (addrRow) shippingAddressIdResolved = addrRow.id
      }
    } catch { }

    // Ensure sequential code
    let nextSeq = 1; const PREFIX = '013';
    try {
      await db.$executeRawUnsafe('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS code TEXT UNIQUE');
      const cur = await db.setting.findUnique({ where: { key: 'order_seq' } });
      nextSeq = Number(((cur as any)?.value?.last) || 0) + 1;
      await db.setting.upsert({ where: { key: 'order_seq' }, update: { value: { last: nextSeq } }, create: { key: 'order_seq', value: { last: nextSeq } } });
    } catch { }
    const generatedCode = `${PREFIX}${nextSeq}`;
    const order = await db.order.create({
      data: {
        userId,
        status: 'PENDING',
        total,
        shippingAddressId: shippingAddressIdResolved,
        discountAmount: disc,
        items: { create: cartItems.map((ci) => ({ productId: ci.productId, quantity: ci.quantity, price: Number(ci.product?.price || 0) })) },
      },
      include: { items: true },
    });
    try { await db.$executeRawUnsafe('UPDATE "Order" SET code=$1 WHERE id=$2', generatedCode, order.id); (order as any).code = generatedCode } catch { }
    // Spawn initial shipment legs at creation to populate pickup waiting tab (one per vendor)
    try {
      const itemsFull = await db.orderItem.findMany({ where: { orderId: order.id as any }, include: { product: { select: { vendorId: true } } } });
      const vendorToItems = new Map<string, typeof itemsFull>();
      for (const it of itemsFull) {
        const vid = (it as any).product?.vendorId || 'NOVENDOR';
        if (!vendorToItems.has(vid)) vendorToItems.set(vid, [] as any);
        (vendorToItems.get(vid) as any).push(it);
      }
      for (const [vendorId] of vendorToItems) {
        const poId = `${vendorId}:${order.id}`;
        await db.shipmentLeg.create({ data: { orderId: order.id as any, poId, legType: 'PICKUP' as any, status: 'SCHEDULED' as any } as any }).catch(() => { });
      }
      await db.shipmentLeg.create({ data: { orderId: order.id as any, legType: 'PROCESSING' as any, status: 'SCHEDULED' as any } as any }).catch(() => { });
      await db.shipmentLeg.create({ data: { orderId: order.id as any, legType: 'DELIVERY' as any, status: 'SCHEDULED' as any } as any }).catch(() => { });
    } catch { }
    // Fire FB CAPI OrderCreated (intent for COD and funnel step)
    try {
      const { fbSendEvents, hashEmail } = await import('../services/fb');
      const u = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
      let fbp: string | undefined; let fbc: string | undefined;
      try { const raw = String(req.headers.cookie || ''); const m1 = /(?:^|; )_fbp=([^;]+)/.exec(raw); if (m1) fbp = decodeURIComponent(m1[1]); const m2 = /(?:^|; )_fbc=([^;]+)/.exec(raw); if (m2) fbc = decodeURIComponent(m2[1]); } catch { }
      const contents = cartItems.map(ci => ({ id: String(ci.productId), quantity: Number(ci.quantity || 1), item_price: Number(ci.product?.price || 0) }))
      const evId = `OrderCreated_${order.id}_${Math.floor(Date.now() / 1000)}`
      await fbSendEvents([{ event_name: 'OrderCreated', event_id: evId, user_data: { em: hashEmail(u?.email), fbp, fbc }, custom_data: { value: Number(order.total || 0), currency: 'YER', content_ids: contents.map(c => c.id), content_type: 'product_group', contents, order_id: String(order.id), num_items: contents.length, payment_method: String(paymentMethod || ''), shipping: Number(ship || 0) }, action_source: 'website', event_source_url: String(req.headers.referer || '') }])
    } catch { }
    // Persist per-line variant meta without schema migration (side table)
    try {
      await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "OrderItemMeta" (id TEXT PRIMARY KEY, "orderId" TEXT, "orderItemId" TEXT, "productId" TEXT, color TEXT, size TEXT, uid TEXT, attributes JSONB, "createdAt" TIMESTAMP DEFAULT NOW())')
      // Ensure columns exist if table was created previously without them
      try { await db.$executeRawUnsafe('ALTER TABLE "OrderItemMeta" ADD COLUMN IF NOT EXISTS "orderItemId" TEXT'); } catch { }
      try { await db.$executeRawUnsafe('ALTER TABLE "OrderItemMeta" ADD COLUMN IF NOT EXISTS attributes JSONB'); } catch { }
      for (const it of order.items) {
        const pid = String(it.productId)
        let entry = (metaQueueByPid[pid] && metaQueueByPid[pid].length) ? metaQueueByPid[pid].shift()! : undefined
        let meta = entry?.meta || variantMetaByPid[pid]
        if (!meta) continue
        const idm = Math.random().toString(36).slice(2)
        await db.$executeRawUnsafe('INSERT INTO "OrderItemMeta" (id, "orderId", "orderItemId", "productId", color, size, uid, attributes) VALUES ($1,$2,$3,$4,$5,$6,$7,CAST($8 AS JSONB))', idm, order.id, String(it.id), String(it.productId), meta.color || null, meta.size || null, (entry?.uid || meta.uid || null), meta.attributes ? JSON.stringify(meta.attributes) : null)
      }
    } catch { }
    // Persist chosen payment/shipping method when available (tolerant if columns missing)
    try {
      if (paymentMethod) {
        await db.$executeRawUnsafe('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethodId" TEXT');
        await db.$executeRawUnsafe('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT');
        await db.$executeRawUnsafe('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingAmount" DOUBLE PRECISION');
        await db.$executeRawUnsafe('UPDATE "Order" SET "paymentMethod"=$1, "shippingMethodId"=$2, "shippingAmount"=$3 WHERE id=$4', String(paymentMethod), shippingMethodId ? String(shippingMethodId) : null, ship, order.id);
      }
    } catch { }
    // For COD orders: keep status as PENDING (review) until approval/payment
    // Affiliate ledger (create table if needed)
    if (ref) {
      try {
        await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AffiliateLedger" (id TEXT PRIMARY KEY, ref TEXT, "orderId" TEXT, amount DOUBLE PRECISION, commission DOUBLE PRECISION, status TEXT, "createdAt" TIMESTAMP DEFAULT NOW())');
        const id = Math.random().toString(36).slice(2);
        const commission = Number((total * 0.05).toFixed(2));
        await db.$executeRawUnsafe('INSERT INTO "AffiliateLedger" (id, ref, "orderId", amount, commission, status) VALUES ($1,$2,$3,$4,$5,$6)', id, String(ref), order.id, Number(total), commission, 'PENDING');
      } catch { }
    }
    try {
      if (linesInput && linesInput.length) {
        const pids = Array.from(new Set(linesInput.map(l => String(l.productId)).filter(Boolean)))
        const cartRow = await db.cart.findUnique({ where: { userId }, select: { id: true } })
        if (cartRow && pids.length) { await db.cartItem.deleteMany({ where: { cartId: cartRow.id, productId: { in: pids } } }) }
      } else {
        const delIds = (cartItems as any[]).map((ci: any) => ci?.id).filter((x: any) => !!x)
        if (delIds.length) await db.cartItem.deleteMany({ where: { id: { in: delIds } } });
      }
    } catch { }
    // Record wallet/points redemptions against this order
    try { if (walletApplied > 0) await db.walletLedger.create({ data: { userId, amount: -Math.abs(walletApplied), status: 'CONFIRMED' as any, orderId: order.id as any, reason: 'ORDER_REDEEM' } as any }) } catch { }
    try { if (pointsApplied > 0) await db.pointsLedger.create({ data: { userId, points: -Math.abs(pointsApplied), status: 'CONFIRMED' as any, orderId: order.id as any, reason: 'ORDER_REDEEM' } as any }) } catch { }
    // Loyalty: compute points based on product/category/vendor and campaigns
    try {
      const { points: computedPts, confirmOn } = await computeCartPoints(userId, cartItems, subtotal)
      if (computedPts > 0) {
        const status = (confirmOn === 'placed') ? 'CONFIRMED' : 'PENDING'
        await db.pointsLedger.create({ data: { userId, points: computedPts, status: status as any, trigger: 'order_placed', orderId: order.id as any, reason: 'ORDER_PLACED' } as any })
      }
    } catch { }
    // Referral: pending points for referrer if code provided and configured
    try {
      const cfg = await db.setting.findUnique({ where: { key: 'points:triggers' } });
      const conf: any = (cfg?.value as any) || {};
      if (ref && conf?.referral?.purchase) {
        const aff = await db.$queryRawUnsafe('SELECT "userId" FROM "Affiliate" WHERE code=$1 LIMIT 1', String(ref).toUpperCase()) as any[];
        const refUserId = String(aff?.[0]?.userId || '');
        if (refUserId && refUserId !== userId) {
          const percent = Number(conf.referral.purchase.referrerPercent || 0);
          const minSubtotal = Number(conf.referral.purchase.minSubtotal || 0);
          const base = subtotal >= minSubtotal ? subtotal : 0;
          const pts = Math.floor((base * percent) / Math.max(0.0001, pointValue * 100)); // convert money->points approx
          if (pts > 0) await db.pointsLedger.create({ data: { userId: refUserId, points: pts, status: 'PENDING' as any, trigger: 'ref_purchase', orderId: order.id as any, reason: 'REFERRAL_PURCHASE' } as any });
          // Fixed points for share→purchase, if configured
          const shareBonus = Math.trunc(Number(conf?.share?.withPurchase || 0));
          if (shareBonus > 0) {
            await db.pointsLedger.create({ data: { userId: refUserId, points: shareBonus, status: 'PENDING' as any, trigger: 'share_purchase', orderId: order.id as any, reason: 'SHARE_PURCHASE' } as any });
          }
        }
      }
    } catch { }
    res.json({ order });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// ===== Cart APIs (support both logged-in users and guests with a cookie-bound session) =====
function parseCookies(req: any): Record<string, string> {
  const raw = String(req.headers?.cookie || '');
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.split('=');
    if (!k) continue;
    const key = k.trim();
    const val = rest.join('=');
    if (!key) continue;
    out[key] = decodeURIComponent((val || '').trim());
  }
  return out;
}
async function getOrCreateGuestCartId(req: any, res: any): Promise<{ sessionId: string; cartId: string }> {
  const cookies = parseCookies(req);
  // Prefer explicit session header (aligns with analytics sid_v1) then existing cookies
  let sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
  if (!sid) {
    sid = (require('crypto').randomUUID as () => string)();
    try {
      // Write both names for backward compatibility; primary is guest_session
      res.setHeader('Set-Cookie', [
        `guest_session=${encodeURIComponent(sid)}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`,
        `guest_sid=${encodeURIComponent(sid)}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`
      ]);
    } catch { }
  } else {
    // Ensure cookies reflect provided header for later requests/merges
    try {
      const raw = String(req.headers?.cookie || '');
      const has1 = /(?:^|; )guest_session=/.test(raw);
      const has2 = /(?:^|; )guest_sid=/.test(raw);
      const set: string[] = [];
      if (!has1) set.push(`guest_session=${encodeURIComponent(sid)}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`);
      if (!has2) set.push(`guest_sid=${encodeURIComponent(sid)}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`);
      if (set.length) res.setHeader('Set-Cookie', set);
    } catch { }
  }
  // Ensure DB row exists (use Prisma to respect NOT NULL/defaults)
  const ua = String((req.headers['user-agent'] as string | undefined) || '');
  const ip = String((req.headers['x-forwarded-for'] as string | undefined) || (req.socket && (req.socket as any).remoteAddress) || '');
  let cart = await db.guestCart.findUnique({ where: { sessionId: sid } } as any);
  if (!cart) {
    try {
      cart = await db.guestCart.create({ data: { sessionId: sid, userAgent: ua || null, ip: ip || null } } as any);
    } catch {
      // Race or constraint: fallback to re-read
      cart = await db.guestCart.findUnique({ where: { sessionId: sid } } as any) as any;
    }
  }
  const cartId = String(cart?.id || '');
  return { sessionId: sid, cartId };
}

// Merge guest cart into the authenticated user's cart if a guest session exists
async function mergeGuestIntoUserIfPresent(req: any, res: any, userId: string): Promise<void> {
  try {
    const cookies = parseCookies(req);
    const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
    if (!sid) return;
    const guest: any = await db.guestCart.findUnique({
      where: { sessionId: sid },
      include: { items: true }
    } as any);
    if (!guest || !guest.items || guest.items.length === 0) return;
    const ucart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {} } as any);
    const cartId = ucart.id;
    for (const it of guest.items) {
      const pid = String(it.productId);
      const existing = await db.cartItem.findFirst({ where: { cartId, productId: pid }, select: { id: true, quantity: true } });
      if (existing) {
        await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + Number(it.quantity || 1) } });
      } else {
        await db.cartItem.create({ data: { cartId, productId: pid, quantity: Number(it.quantity || 1), attributes: (it as any).attributes || undefined } });
      }
    }
    await db.guestCartItem.deleteMany({ where: { cartId: guest.id } } as any);
    try { await db.guestCart.delete({ where: { id: guest.id } } as any); } catch { }
    try { await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any); } catch { }
  } catch { }
}

shop.get('/cart', async (req: any, res) => {
  try {
    let userId = (req as any)?.user?.userId;
    // Favor authenticated user's cart if token exists (cookie or Authorization)
    if (!userId) {
      try {
        const t = readTokenFromRequest(req);
        if (t) {
          const p = verifyJwt(String(t));
          if (p && p.userId) userId = String(p.userId);
        }
      } catch { }
    }
    if (userId) {
      // Merge any existing guest cart (by header/cookie session) into user cart on first fetch after login
      try { await mergeGuestIntoUserIfPresent(req, res, String(userId)); } catch { }
      const cart = await db.cart.findUnique({ where: { userId }, include: { items: true } });
      if (!cart) return res.json({ cart: { items: [] } });
      const productIds = Array.from(new Set(cart.items.map((it: any) => it.productId)));
      const prods = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, price: true, images: true } });
      const byId = new Map(prods.map((p: any) => [String(p.id), p]));
      const items = cart.items.map((ci: any) => ({ productId: ci.productId, quantity: ci.quantity, attributes: (ci as any).attributes || null, product: byId.get(String(ci.productId)) || { id: ci.productId, name: ci.productId, price: 0, images: [] } }));
      return res.json({ cart: { items } });
    }
    // Guest
    const { cartId } = await getOrCreateGuestCartId(req, res);
    const rows: any[] = await db.$queryRawUnsafe('SELECT "productId", "quantity" FROM "GuestCartItem" WHERE "cartId"=$1', cartId);
    const productIds = Array.from(new Set((rows || []).map(r => String(r.productId))));
    const prods = productIds.length ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, price: true, images: true } }) : [];
    const byId = new Map(prods.map((p: any) => [String(p.id), p]));
    // Re-read with Prisma to include attributes for each line
    let gitems: any[] = [];
    try { gitems = await db.guestCartItem.findMany({ where: { cartId }, select: { productId: true, quantity: true, attributes: true } } as any); } catch { }
    const items = (gitems.length ? gitems : rows || []).map((r: any) => ({ productId: String(r.productId), quantity: Number(r.quantity || 0), attributes: (r as any).attributes || null, product: byId.get(String(r.productId)) || { id: r.productId, name: r.productId, price: 0, images: [] } }));
    return res.json({ cart: { items } });
  } catch { return res.json({ cart: { items: [] } }); }
});

shop.post('/cart/merge', async (req: any, res) => {
  try {
    const userId = (req as any)?.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const items: Array<{ productId: string; quantity: number }> = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.json({ ok: true });
    // Ensure cart exists
    let cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) cart = await db.cart.create({ data: { userId } });
    const cartId = cart.id;
    // Aggregate quantities per product
    const agg = new Map<string, number>();
    for (const it of items) {
      const pid = String(it.productId);
      const q = Math.max(1, Number(it.quantity || 1));
      agg.set(pid, (agg.get(pid) || 0) + q);
    }
    // Also merge any existing guest cart by session cookie if present
    try {
      const { cartId: guestCartId } = await getOrCreateGuestCartId(req, res);
      const rows: any[] = await db.$queryRawUnsafe('SELECT "productId", "quantity" FROM "GuestCartItem" WHERE "cartId"=$1', guestCartId);
      for (const r of (rows || [])) {
        const pid = String(r.productId);
        const q = Math.max(1, Number(r.quantity || 1));
        agg.set(pid, (agg.get(pid) || 0) + q);
      }
      // Clear guest cart after merging
      try { await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1', guestCartId); } catch { }
      try { await db.$executeRawUnsafe('DELETE FROM "GuestCart" WHERE id=$1', guestCartId); } catch { }
    } catch { }
    for (const [pid, qty] of agg.entries()) {
      // Upsert by unique (cartId, productId) if exists; else create
      try {
        const existing = await db.cartItem.findFirst({ where: { cartId, productId: pid }, select: { id: true, quantity: true } });
        if (existing) {
          await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty } });
        } else {
          await db.cartItem.create({ data: { cartId, productId: pid, quantity: qty } });
        }
      } catch { }
    }
    // Ensure the parent cart reflects recent activity
    try { await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any); } catch { }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'merge_failed' }); }
});
shop.post('/cart/add', async (req: any, res) => {
  try {
    const { productId, quantity, attributes } = req.body || {};
    const qty = Math.max(1, Number(quantity || 1));
    if (!productId) return res.status(400).json({ error: 'productId_required' });
    // Resolve userId from middleware or Authorization/cookie token
    let userId: string | undefined = (req as any)?.user?.userId;
    if (!userId) {
      try {
        const t = readTokenFromRequest(req);
        if (t) {
          const p = verifyJwt(String(t));
          if (p && p.userId) userId = String(p.userId);
        }
      } catch { }
    }
    if (userId) {
      const cart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {} } as any);
      const ex = await db.cartItem.findFirst({ where: { cartId: cart.id, productId: String(productId) } });
      if (ex) await db.cartItem.update({ where: { id: ex.id }, data: { quantity: ex.quantity + qty } });
      else await db.cartItem.create({ data: { cartId: cart.id, productId: String(productId), quantity: qty, attributes: attributes ? (attributes as any) : undefined } });
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
      return res.json({ ok: true });
    }
    // Validate product exists and is active to avoid FK/hidden items
    try {
      const p = await db.product.findFirst({ where: { id: String(productId), isActive: true }, select: { id: true } } as any);
      if (!p) return res.status(404).json({ error: 'product_not_found_or_inactive' });
    } catch {
      return res.status(500).json({ error: 'product_lookup_failed' });
    }
    const { cartId } = await getOrCreateGuestCartId(req, res);
    // Use Prisma instead of raw SQL to avoid schema drift issues
    const existing = await db.guestCartItem.findFirst({ where: { cartId, productId: String(productId) }, select: { id: true, quantity: true } } as any);
    if (existing) {
      await db.guestCartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty, ...(attributes ? { attributes: attributes as any } : {}) } } as any);
    } else {
      await db.guestCartItem.create({ data: { cartId, productId: String(productId), quantity: qty, attributes: attributes ? (attributes as any) : undefined } } as any);
    }
    try { await db.guestCart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any) } catch { }
    // Fire FB CAPI AddToCart for guest using fbp/fbc only
    try {
      const { fbSendEvents } = await import('../services/fb');
      let fbp: string | undefined; let fbc: string | undefined;
      try {
        const raw = String(req.headers.cookie || '');
        const m1 = /(?:^|; )_fbp=([^;]+)/.exec(raw); if (m1) fbp = decodeURIComponent(m1[1]);
        const m2 = /(?:^|; )_fbc=([^;]+)/.exec(raw); if (m2) fbc = decodeURIComponent(m2[1]);
      } catch { }
      await fbSendEvents([{ event_name: 'AddToCart', user_data: { fbp, fbc }, custom_data: { value: 0, currency: 'YER', contents: [{ id: String(productId), quantity: qty }], content_type: 'product' }, action_source: 'website' }])
    } catch { }
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ error: 'add_failed', message: e?.message || '' }); }
});

shop.post('/cart/update', async (req: any, res) => {
  try {
    const { productId, quantity, attributes } = req.body || {};
    const qty = Math.max(0, Number(quantity || 0));
    if (!productId) return res.status(400).json({ error: 'productId required' });
    // Resolve userId from middleware or token
    let userId: string | undefined = (req as any)?.user?.userId;
    if (!userId) {
      try {
        const t = readTokenFromRequest(req);
        if (t) {
          const p = verifyJwt(String(t));
          if (p && p.userId) userId = String(p.userId);
        }
      } catch { }
    }
    if (userId) {
      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return res.json({ ok: true });
      const ex = await db.cartItem.findFirst({ where: { cartId: cart.id, productId: String(productId) } });
      if (!ex) return res.json({ ok: true });
      if (qty <= 0) await db.cartItem.delete({ where: { id: ex.id } });
      else await db.cartItem.update({ where: { id: ex.id }, data: { quantity: qty, ...(attributes ? { attributes: attributes as any } : {}) } });
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
      return res.json({ ok: true });
    }
    // Do NOT create a new guest cart for update; only operate on existing session cart
    const cookies = parseCookies(req);
    const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
    const g = sid ? await db.guestCart.findUnique({ where: { sessionId: sid }, select: { id: true } } as any) : null;
    if (!g) return res.json({ ok: true });
    const cartId = g.id;
    const existing = await db.guestCartItem.findFirst({ where: { cartId, productId: String(productId) }, select: { id: true, quantity: true } } as any);
    if (qty === 0) { if (existing) await db.guestCartItem.delete({ where: { id: existing.id } } as any); }
    else {
      if (existing) await db.guestCartItem.update({ where: { id: existing.id }, data: { quantity: qty, ...(attributes ? { attributes: attributes as any } : {}) } } as any);
      else await db.guestCartItem.create({ data: { cartId, productId: String(productId), quantity: qty, attributes: attributes ? (attributes as any) : undefined } } as any);
    }
    try { await db.guestCart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any) } catch { }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'update_failed' }); }
});

shop.post('/cart/remove', async (req: any, res) => {
  try {
    // Resolve userId from middleware or token
    let userId: string | undefined = (req as any)?.user?.userId;
    if (!userId) {
      try {
        const t = readTokenFromRequest(req);
        if (t) {
          const p = verifyJwt(String(t));
          if (p && p.userId) userId = String(p.userId);
        }
      } catch { }
    }
    const { productId, attributes } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId_required' });
    if (userId) {
      const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
      if (!cart) return res.json({ ok: true });
      // Prefer attribute-exact delete; fallback to delete all rows for productId if nothing matched
      try {
        if (attributes) {
          const r: any = await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId), attributes: { equals: attributes as any } } } as any);
          if (!r || Number(r.count || 0) === 0) {
            await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } });
          }
        } else {
          await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } });
        }
      } catch {
        // Fallback hard delete by productId
        try { await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } }); } catch { }
      }
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
    } else {
      // Do NOT create a new guest cart for remove; only operate on existing session cart
      const cookies = parseCookies(req);
      const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
      const g = sid ? await db.guestCart.findUnique({ where: { sessionId: sid }, select: { id: true } } as any) : null;
      if (g) {
        try {
          if (attributes) {
            const affected: any = await db.$executeRawUnsafe(
              'DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2 AND COALESCE("attributes"::jsonb, \'null\') = $3::jsonb',
              g.id, String(productId), JSON.stringify(attributes)
            );
            if (!affected || Number(affected) === 0) {
              await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2', g.id, String(productId));
            }
          } else {
            await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2', g.id, String(productId));
          }
        } catch {
          // Last resort: delete by productId
          try { await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2', g.id, String(productId)); } catch { }
        }
        try { await db.guestCart.update({ where: { id: g.id }, data: { updatedAt: new Date() } } as any) } catch { }
      }
    }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'remove_failed' }); }
});
shop.post('/cart/clear', async (req: any, res) => {
  try {
    const userId = (req as any)?.user?.userId;
    if (userId) {
      const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
      if (!cart) return res.json({ ok: true });
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
    } else {
      const { cartId } = await getOrCreateGuestCartId(req, res);
      await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1', cartId);
      try { await db.guestCart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any) } catch { }
    }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'clear_failed' }); }
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
    // Attach variant meta for each line from OrderItemMeta
    try {
      const metas: any[] = await db.$queryRawUnsafe('SELECT "orderItemId", color, size, uid, attributes FROM "OrderItemMeta" WHERE "orderId"=$1', id) as any[]
      const byItem = new Map<string, any>()
      for (const m of metas) {
        let attrs: any = (m as any).attributes
        try { if (typeof attrs === 'string') attrs = JSON.parse(attrs) } catch { }
        const obj: any = {
          color: (m as any).color || undefined,
          size: (m as any).size || undefined,
          uid: (m as any).uid || undefined,
          attributes: attrs || undefined,
        }
        byItem.set(String((m as any).orderItemId || ''), obj)
      }
      for (const it of (order.items || [])) {
        const m = byItem.get(String(it.id))
        if (!m) continue
        const attrs = (m.attributes || {}) as any
        if (m.color && !attrs.color) attrs.color = m.color
        if (!attrs.size) {
          const composite = m.size || [attrs.size_letters, attrs.size_numbers].filter(Boolean).join(' / ')
          if (composite) attrs.size = composite
        }
        ; (it as any).attributes = attrs
      }
    } catch { }
    // Ensure code is present and return a plain object including it
    let codeVal: string | undefined = undefined
    try {
      const row: any[] = await db.$queryRaw`SELECT code FROM "Order" WHERE id=${id}` as any[];
      if (row && row[0] && row[0].code) { codeVal = String(row[0].code) }
    } catch { }
    // Attach addressBook snapshot if exists
    try {
      if (!order.shippingAddressId) {
        const rows: any[] = await db.$queryRawUnsafe('SELECT id, "fullName", phone, "altPhone", country, state, city, street, details, "postalCode", "isDefault" FROM "AddressBook" WHERE "userId"=$1 ORDER BY "isDefault" DESC, "updatedAt" DESC LIMIT 1', userId) as any[]
        if (rows && rows[0]) (order as any).address = rows[0]
      }
    } catch { }
    // Attach payment/shipping method columns if present in DB and include shipping amount
    try {
      const rows: any[] = await db.$queryRaw`SELECT "paymentMethod", "shippingMethodId", "shippingAmount" FROM "Order" WHERE id=${id}` as any[];
      if (rows && rows[0]) {
        (order as any).paymentMethod = rows[0].paymentMethod || null;
        (order as any).shippingMethodId = rows[0].shippingMethodId || null;
        (order as any).shippingAmount = Number(rows[0].shippingAmount || 0);
      }
    } catch { }
    // Attach purchase event_id if present (for dedupe with Pixel)
    let purchaseEventId: string | null = null
    try {
      const row = await db.setting.findUnique({ where: { key: `order:${id}:purchase_event_id` } } as any)
      if (row && (row as any).value) purchaseEventId = String((row as any).value)
    } catch { }
    const plain = { ...order, ...(codeVal ? { code: codeVal } : {}), eventIds: { purchase: purchaseEventId } }
    res.json(plain);
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
    const order = await db.order.findFirst({ where: { id, userId }, include: { payment: true, items: true } });
    if (!order) return res.status(404).json({ error: 'not_found' });
    // Upsert payment
    const amount = Number(order.total || 0);
    if (order.payment) {
      await db.payment.update({ where: { orderId: order.id }, data: { status: 'COMPLETED', method } as any });
    } else {
      await db.payment.create({ data: { orderId: order.id, amount, currency: 'SAR', method: method as any, status: 'COMPLETED' } as any });
    }
    await db.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    // Prepare unified event_id for dedupe
    const evId = `Purchase_${order.id}_${Math.floor(Date.now() / 1000)}`
    // Fire FB CAPI Purchase (best-effort) with fbp/fbc from cookies
    try {
      const { fbSendEvents, hashEmail } = await import('../services/fb');
      const u = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
      let fbp: string | undefined; let fbc: string | undefined;
      try { const raw = String(req.headers.cookie || ''); const m1 = /(?:^|; )_fbp=([^;]+)/.exec(raw); if (m1) fbp = decodeURIComponent(m1[1]); const m2 = /(?:^|; )_fbc=([^;]+)/.exec(raw); if (m2) fbc = decodeURIComponent(m2[1]); } catch { }
      const contents = (order.items || []).map((it: any) => ({ id: String(it.productId), quantity: Number(it.quantity || 1), item_price: Number(it.price || 0) }))
      let client_ip_address: string | undefined; let client_user_agent: string | undefined;
      try { client_user_agent = String(req.headers['user-agent'] || '') } catch { }
      try { const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); client_ip_address = xf || (req.ip as any) || undefined } catch { }
      let shippingAmount: number | undefined
      try {
        const rows: any[] = await db.$queryRaw`SELECT "shippingAmount" FROM "Order" WHERE id=${id}` as any[]
        if (rows && rows[0]) shippingAmount = Number(rows[0].shippingAmount || 0)
      } catch { }
      await fbSendEvents([{ event_name: 'Purchase', event_id: evId, user_data: { em: hashEmail(u?.email), fbp, fbc, client_ip_address, client_user_agent }, custom_data: { value: Number(order.total || 0), currency: 'YER', num_items: Array.isArray(order.items) ? order.items.length : undefined, content_ids: contents.map(c => c.id), content_type: 'product_group', contents, order_id: String(order.id), payment_method: String(method || ''), shipping: shippingAmount }, action_source: 'website', event_source_url: String(req.headers.referer || '') }])
      // Persist event_id for client dedupe
      try {
        await db.setting.upsert({ where: { key: `order:${order.id}:purchase_event_id` }, update: { value: evId }, create: { key: `order:${order.id}:purchase_event_id`, value: evId } } as any)
      } catch { }
    } catch { }
    // Spawn shipment legs upon payment (approval)
    try {
      const items = await db.orderItem.findMany({ where: { orderId: order.id as any }, include: { product: { select: { vendorId: true } } } });
      const vendorToItems = new Map<string, typeof items>();
      for (const it of items) {
        const vid = (it as any).product?.vendorId || 'NOVENDOR';
        if (!vendorToItems.has(vid)) vendorToItems.set(vid, [] as any);
        (vendorToItems.get(vid) as any).push(it);
      }
      for (const [vendorId] of vendorToItems) {
        const poId = `${vendorId}:${order.id}`;
        await db.shipmentLeg.create({ data: { orderId: order.id as any, poId, legType: 'PICKUP' as any, status: 'SCHEDULED' as any } as any }).catch(() => { });
      }
      await db.shipmentLeg.create({ data: { orderId: order.id as any, legType: 'PROCESSING' as any, status: 'SCHEDULED' as any } as any }).catch(() => { });
      await db.shipmentLeg.create({ data: { orderId: order.id as any, legType: 'DELIVERY' as any, status: 'SCHEDULED' as any } as any }).catch(() => { });
    } catch { }
    // Loyalty: confirm or create points according to confirmOn
    try {
      const triggers = await loadTriggers();
      const confirmOn = (triggers?.confirmDelays?.purchase || triggers?.purchase?.confirmOn || 'paid');
      if (confirmOn === 'paid') {
        const pending = await db.pointsLedger.findFirst({ where: { userId, orderId: order.id as any, status: 'PENDING' as any }, orderBy: { createdAt: 'desc' } })
        if (pending) await db.pointsLedger.update({ where: { id: pending.id }, data: { status: 'CONFIRMED' as any, updatedAt: new Date() as any, reason: 'ORDER_PAID' } })
        else {
          // Compute points now (fallback) if none was created at placement
          const items = await db.orderItem.findMany({ where: { orderId: order.id as any }, include: { product: { include: { category: true, vendor: true } } } })
          const subtotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 1), 0)
          const { points } = await computeCartPoints(userId, items.map(it => ({ product: it.product, quantity: it.quantity })), subtotal)
          if (points > 0) await db.pointsLedger.create({ data: { userId, points, status: 'CONFIRMED' as any, trigger: 'order_paid', orderId: order.id as any, reason: 'ORDER_PAID' } as any })
        }
      }
    } catch { }
    // Referral/Share: confirm pending points
    try {
      const pend = await db.pointsLedger.findMany({ where: { orderId: order.id as any, trigger: { in: ['ref_purchase', 'share_purchase'] } as any, status: 'PENDING' as any } })
      for (const p of pend) { await db.pointsLedger.update({ where: { id: p.id }, data: { status: 'CONFIRMED' as any } }) }
    } catch { }
    // Affiliate: approve commission
    try {
      await db.$executeRawUnsafe('UPDATE "AffiliateLedger" SET status=\'APPROVED\' WHERE "orderId"=$1 AND status=\'PENDING\'', order.id);
    } catch { }
    res.json({ success: true, order_id: order.id, event_id: evId });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Addresses (single-address per user schema)
shop.get('/addresses', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    let rows: any[] = []
    try { rows = await db.$queryRawUnsafe('SELECT id, "fullName", phone, "altPhone", country, state, city, street, details, "postalCode", lat, lng, "isDefault", "createdAt", "updatedAt" FROM "AddressBook" WHERE "userId"=$1 ORDER BY "isDefault" DESC, "updatedAt" DESC', userId) as any[] } catch { }
    if (!rows || !rows.length) {
      try {
        const a = await db.address.findUnique({ where: { userId } })
        if (a) rows = [{ id: a.id, fullName: null, phone: null, altPhone: null, country: a.country, state: a.state, city: a.city, street: a.street, details: '', postalCode: a.postalCode, isDefault: true, createdAt: a.createdAt, updatedAt: a.updatedAt }]
      } catch { }
    }
    return res.json(rows)
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Geo: governorates (regions) by country code, derived from City table
shop.get('/geo/governorates', async (req, res) => {
  try {
    const code = String(req.query.country || 'YE').toUpperCase();
    // Resolve country by code (fallback to any if missing)
    let country: any = null;
    try { country = await db.country.findFirst({ where: { OR: [{ code }, { name: code }] } }); } catch { }
    const where: any = country ? { countryId: country.id } : {};
    const cities = await db.city.findMany({ where, select: { id: true, name: true, region: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
    // Map displayName -> first-seen createdAt and a representative cityId; preserve first input order
    const map = new Map<string, { id?: string; name: string; firstAt: number }>();
    const put = (name: string, id?: string, createdAt?: Date) => {
      const key = String(name || '').trim(); if (!key) return;
      if (!map.has(key)) map.set(key, { id, name: key, firstAt: createdAt ? new Date(createdAt).getTime() : Date.now() });
    }
    for (const c of (cities || [])) {
      const r = String((c as any).region || '').trim();
      const n = String((c as any).name || '').trim();
      if (r) put(r, (c as any).id, (c as any).createdAt);
      if (n) put(n, (c as any).id, (c as any).createdAt);
    }
    const items = Array.from(map.values()).sort((a, b) => a.firstAt - b.firstAt).map(({ firstAt, ...rest }) => rest);
    res.json({ items });
  } catch { res.status(500).json({ error: 'failed' }); }
});

// Geo: cities by governorate name (matches City.region when available; falls back to City.name filter)
shop.get('/geo/cities', async (req, res) => {
  try {
    const code = String(req.query.country || 'YE').toUpperCase();
    const governorate = String(req.query.governorate || '').trim();
    if (!governorate) return res.json({ items: [] });
    let country: any = null;
    try { country = await db.country.findFirst({ where: { OR: [{ code }, { name: code }] } }); } catch { }
    const whereBase: any = country ? { countryId: country.id } : {};
    // Try matching by region first
    let rows = await db.city.findMany({ where: { ...whereBase, region: governorate }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } });
    if (!rows.length) {
      // Fallback: treat governorate as a parent city; return same as one item
      rows = await db.city.findMany({ where: { ...whereBase, name: governorate }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } });
    }
    res.json({ items: rows.map((c: any) => ({ id: c.id, name: c.name })) });
  } catch { res.status(500).json({ error: 'failed' }); }
});

// Geo: areas by city (name or id)
shop.get('/geo/areas', async (req, res) => {
  try {
    const byId = String(req.query.cityId || '').trim();
    const byName = String(req.query.city || '').trim();
    const byGov = String(req.query.governorate || '').trim();
    const countryCode = String(req.query.country || 'YE').toUpperCase();
    // Governorate shortcut: collect all areas for cities under this governorate
    if (byGov) {
      // Restrict by country if provided
      let country: any = null; try { country = await db.country.findFirst({ where: { OR: [{ code: countryCode }, { name: countryCode }] } }) } catch { }
      const whereCity: any = country ? { countryId: country.id, OR: [{ region: byGov }, { name: byGov }] } : { OR: [{ region: byGov }, { name: byGov }] };
      const cities = await db.city.findMany({ where: whereCity, select: { id: true } });
      if (!cities.length) return res.json({ items: [] });
      const ids = cities.map(c => c.id);
      const rows = await db.area.findMany({ where: { cityId: { in: ids } }, select: { id: true, name: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
      // Deduplicate by name, preserving first input order
      const seen = new Set<string>();
      const uniq: Array<{ id: string; name: string }> = [];
      for (const r of rows) { const key = String(r.name || ''); if (!seen.has(key)) { seen.add(key); uniq.push({ id: r.id, name: r.name }); } }
      return res.json({ items: uniq });
    }
    if (!byId && !byName) return res.json({ items: [] });
    let city: any = null;
    if (byId) {
      city = await db.city.findUnique({ where: { id: byId } });
    }
    if (!city && byName) {
      city = await db.city.findFirst({ where: { name: byName } });
    }
    if (!city) return res.json({ items: [] });
    const areas = await db.area.findMany({ where: { cityId: city.id }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } });
    res.json({ items: areas });
  } catch { res.status(500).json({ error: 'failed' }); }
});

shop.post('/addresses', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone, altPhone, country, province, city, street, details, postalCode, lat, lng, isDefault } = req.body || {};
    const id = Math.random().toString(36).slice(2)
    if (isDefault === true) {
      try { await db.$executeRawUnsafe('UPDATE "AddressBook" SET "isDefault"=FALSE WHERE "userId"=$1', userId) } catch { }
    }
    await db.$executeRawUnsafe('INSERT INTO "AddressBook" (id, "userId", "fullName", phone, "altPhone", country, state, city, street, details, "postalCode", lat, lng, "isDefault") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      id, userId, fullName || null, phone || null, altPhone || null, String(country || 'YE'), String(province || ''), String(city || ''), String(street || ''), details ? String(details) : null, String(postalCode || ''), (lat == null ? null : Number(lat)), (lng == null ? null : Number(lng)), isDefault === true)
    const row = await db.$queryRawUnsafe('SELECT id, "fullName", phone, "altPhone", country, state, city, street, details, "postalCode", lat, lng, "isDefault" FROM "AddressBook" WHERE id=$1', id) as any[]
    return res.json({ address: row?.[0] || null })
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

// ---------------- Cart (user + guest) ----------------
function getGuestSession(req: any, res: any): string {
  try {
    const name = 'guest_session';
    const cookies = (req.headers?.cookie || '').split(';').map((s: string) => s.trim());
    const m = cookies.find((c: string) => c.startsWith(name + '='));
    let sid = m ? decodeURIComponent(m.split('=')[1] || '') : '';
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      try { res.cookie(name, sid, { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 180 * 24 * 3600 * 1000 }); } catch { }
    }
    return sid;
  } catch { return Math.random().toString(36).slice(2); }
}

shop.get('/cart', async (req: any, res) => {
  try {
    let userId = (req as any)?.user?.userId;
    // Fallback: read token from Authorization or cookies (shop or admin) to determine user cart
    if (!userId) {
      try {
        const t = readTokenFromRequest(req);
        if (t) {
          const p = verifyJwt(String(t));
          if (p && p.userId) userId = String(p.userId);
        }
      } catch { }
    }
    if (userId) {
      // Merge any existing guest cart (by header/cookie session) into user cart on first fetch after login
      try { await mergeGuestIntoUserIfPresent(req, res, String(userId)); } catch { }
      const cart = await db.cart.findUnique({ where: { userId }, include: { items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } } } });
      if (!cart) return res.json({ cart: { items: [] } });
      return res.json({ cart });
    }
    // Guest cart
    const cookies = parseCookies(req);
    const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
    const g = sid ? await db.guestCart.findUnique({ where: { sessionId: sid }, include: { items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } } } }) : null;
    if (!g) return res.json({ cart: { items: [] } });
    return res.json({ cart: { id: g.id, items: g.items } });
  } catch { return res.status(500).json({ error: 'failed' }); }
});
shop.post('/cart/add', async (req: any, res) => {
  try {
    const { productId, quantity, attributes } = req.body || {};
    const qty = Math.max(1, Number(quantity || 1));
    if (!productId) return res.status(400).json({ error: 'productId_required' });
    // Validate product exists and active
    try {
      const p = await db.product.findFirst({ where: { id: String(productId), isActive: true }, select: { id: true } } as any);
      if (!p) return res.status(404).json({ error: 'product_not_found_or_inactive' });
    } catch {
      return res.status(500).json({ error: 'product_lookup_failed' });
    }
    // Resolve userId from middleware or Authorization/cookie token
    let userId: string | undefined = (req as any)?.user?.userId;
    if (!userId) {
      try {
        const header = (req?.headers?.authorization as string | undefined) || '';
        let tokenAuth = '';
        if (header.startsWith('Bearer ')) tokenAuth = header.slice(7);
        const cookieTok = (req?.cookies?.shop_auth_token as string | undefined) || '';
        const jwt = require('jsonwebtoken');
        for (const t of [tokenAuth, cookieTok]) { if (!t) continue; try { const pay: any = jwt.verify(t, process.env.JWT_SECRET || ''); if (pay?.userId) { userId = String(pay.userId); break; } } catch { } }
      } catch { }
    }
    if (userId) {
      const cart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {} } as any);
      const ex = await db.cartItem.findFirst({ where: { cartId: cart.id, productId: String(productId) } });
      if (ex) await db.cartItem.update({ where: { id: ex.id }, data: { quantity: ex.quantity + qty } });
      else await db.cartItem.create({ data: { cartId: cart.id, productId: String(productId), quantity: qty, attributes: attributes ? (attributes as any) : undefined } });
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
      return res.json({ ok: true });
    }
    const cookies = parseCookies(req);
    const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
    let g = sid ? await db.guestCart.findUnique({ where: { sessionId: sid } }) : null;
    if (!g) g = await db.guestCart.create({ data: { sessionId: sid } });
    const ex = await db.guestCartItem.findFirst({ where: { cartId: g.id, productId: String(productId) } });
    if (ex) await db.guestCartItem.update({ where: { id: ex.id }, data: { quantity: ex.quantity + qty } });
    else await db.guestCartItem.create({ data: { cartId: g.id, productId: String(productId), quantity: qty, attributes: attributes ? (attributes as any) : undefined } });
    try { await db.guestCart.update({ where: { id: g.id }, data: { updatedAt: new Date() } } as any) } catch { }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'failed' }); }
});
shop.post('/cart/update', async (req: any, res) => {
  try {
    const { productId, quantity } = req.body || {};
    const qty = Math.max(0, Number(quantity || 0));
    if (!productId) return res.status(400).json({ error: 'productId required' });
    // Resolve userId from middleware or token
    let userId: string | undefined = (req as any)?.user?.userId;
    if (!userId) {
      try {
        const header = (req?.headers?.authorization as string | undefined) || '';
        let tokenAuth = '';
        if (header.startsWith('Bearer ')) tokenAuth = header.slice(7);
        const cookieTok = (req?.cookies?.shop_auth_token as string | undefined) || '';
        const jwt = require('jsonwebtoken');
        for (const t of [tokenAuth, cookieTok]) { if (!t) continue; try { const pay: any = jwt.verify(t, process.env.JWT_SECRET || ''); if (pay?.userId) { userId = String(pay.userId); break; } } catch { } }
      } catch { }
    }
    if (userId) {
      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return res.json({ ok: true });
      const ex = await db.cartItem.findFirst({ where: { cartId: cart.id, productId: String(productId) } });
      if (!ex) return res.json({ ok: true });
      if (qty <= 0) await db.cartItem.delete({ where: { id: ex.id } });
      else await db.cartItem.update({ where: { id: ex.id }, data: { quantity: qty } });
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
      return res.json({ ok: true });
    }
    const cookies = parseCookies(req);
    const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
    const g = sid ? await db.guestCart.findUnique({ where: { sessionId: sid } }) : null;
    if (!g) return res.json({ ok: true });
    const ex = await db.guestCartItem.findFirst({ where: { cartId: g.id, productId: String(productId) } });
    if (!ex) return res.json({ ok: true });
    if (qty <= 0) await db.guestCartItem.delete({ where: { id: ex.id } });
    else await db.guestCartItem.update({ where: { id: ex.id }, data: { quantity: qty } });
    try { await db.guestCart.update({ where: { id: g.id }, data: { updatedAt: new Date() } } as any) } catch { }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'failed' }); }
});

shop.post('/cart/remove', async (req: any, res) => {
  try {
    // Resolve userId from middleware or token
    let userId: string | undefined = (req as any)?.user?.userId;
    if (!userId) {
      try {
        const header = (req?.headers?.authorization as string | undefined) || '';
        let tokenAuth = '';
        if (header.startsWith('Bearer ')) tokenAuth = header.slice(7);
        const cookieTok = (req?.cookies?.shop_auth_token as string | undefined) || '';
        const jwt = require('jsonwebtoken');
        for (const t of [tokenAuth, cookieTok]) { if (!t) continue; try { const pay: any = jwt.verify(t, process.env.JWT_SECRET || ''); if (pay?.userId) { userId = String(pay.userId); break; } } catch { } }
      } catch { }
    }
    const { productId, attributes } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId_required' });
    if (userId) {
      const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
      if (!cart) return res.json({ ok: true });
      // Prefer attribute-exact delete; fallback to delete all rows for productId if nothing matched
      try {
        if (attributes) {
          const r: any = await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId), attributes: { equals: attributes as any } } } as any);
          if (!r || Number(r.count || 0) === 0) {
            await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } });
          }
        } else {
          await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } });
        }
      } catch {
        // Fallback hard delete by productId
        try { await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: String(productId) } }); } catch { }
      }
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
    } else {
      // Do NOT create a new guest cart for remove; only operate on existing session cart
      const cookies = parseCookies(req);
      const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
      const g = sid ? await db.guestCart.findUnique({ where: { sessionId: sid }, select: { id: true } } as any) : null;
      if (g) {
        try {
          if (attributes) {
            const affected: any = await db.$executeRawUnsafe(
              'DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2 AND COALESCE("attributes"::jsonb, \'null\') = $3::jsonb',
              g.id, String(productId), JSON.stringify(attributes)
            );
            if (!affected || Number(affected) === 0) {
              await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2', g.id, String(productId));
            }
          } else {
            await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2', g.id, String(productId));
          }
        } catch {
          // Last resort: delete by productId
          try { await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1 AND "productId"=$2', g.id, String(productId)); } catch { }
        }
        try { await db.guestCart.update({ where: { id: g.id }, data: { updatedAt: new Date() } } as any) } catch { }
      }
    }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'remove_failed' }); }
});

shop.post('/cart/clear', async (req: any, res) => {
  try {
    const userId = (req as any)?.user?.userId;
    if (userId) {
      const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
      if (!cart) return res.json({ ok: true });
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
      try { await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } } as any) } catch { }
    } else {
      const { cartId } = await getOrCreateGuestCartId(req, res);
      await db.$executeRawUnsafe('DELETE FROM "GuestCartItem" WHERE "cartId"=$1', cartId);
      try { await db.guestCart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any) } catch { }
    }
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: 'clear_failed' }); }
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

// ===== Public GEO (Cities/Areas from Admin DB, read-only) =====
// GET /api/geo/governorates?country=YE
shop.get('/geo/governorates', async (req: any, res) => {
  try {
    const countryQ = String(req.query.country || 'YE').trim().toUpperCase();
    // Resolve country by code or name
    let country: any = null;
    try {
      country = await db.country.findFirst({
        where: {
          OR: [
            { code: countryQ },
            { name: { contains: countryQ, mode: 'insensitive' } },
            { name: { contains: 'اليمن', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch { }
    const whereCity: any = country ? { countryId: country.id } : {};
    const cities = await db.city.findMany({
      where: whereCity,
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, createdAt: true }
    });
    // Deduplicate by name; keep first (oldest)
    const seen = new Set<string>();
    const items = [] as Array<{ id: string; name: string }>;
    for (const c of cities) {
      const n = String(c?.name || '').trim();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      items.push({ id: String(c.id), name: n });
    }
    return res.json({ items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'geo_governorates_failed' });
  }
});

// GET /api/geo/areas?governorate=<name>&country=YE
shop.get('/geo/areas', async (req: any, res) => {
  try {
    const byCityId = String(req.query.cityId || '').trim();
    const gov = String(req.query.governorate || '').trim();
    if (!byCityId && !gov) return res.json({ items: [] });
    const countryQ = String(req.query.country || 'YE').trim().toUpperCase();
    // Resolve country
    let country: any = null;
    try {
      country = await db.country.findFirst({
        where: {
          OR: [
            { code: countryQ },
            { name: { contains: countryQ, mode: 'insensitive' } },
            { name: { contains: 'اليمن', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch { }
    // Resolve city
    let cityId: string | null = null;
    if (byCityId) {
      cityId = byCityId;
      // Optionally validate city belongs to country if provided
      try {
        const c = await db.city.findUnique({ where: { id: byCityId }, select: { id: true, countryId: true } });
        if (!c) return res.json({ items: [] });
        if (country && c.countryId !== country.id) {
          return res.json({ items: [] });
        }
      } catch { }
    } else if (gov) {
      const city = await db.city.findFirst({
        where: Object.assign(
          { name: { equals: gov } },
          country ? { countryId: country.id } : {}
        ),
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      });
      if (!city) return res.json({ items: [] });
      cityId = city.id;
    }
    if (!cityId) return res.json({ items: [] });
    const areas = await db.area.findMany({
      where: { cityId: cityId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true }
    });
    const items = areas.map(a => ({ id: String(a.id), name: String(a.name || '').trim() })).filter(a => a.name);
    return res.json({ items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'geo_areas_failed' });
  }
});
export default shop;

// Payments session (Stripe/HyperPay via integrations)
shop.post('/payments/session', requireAuth, async (req: any, res) => {
  try {
    const { amount, currency = 'SAR', method = 'CARD', returnUrl, cancelUrl, ref } = req.body || {}
    const integrations = await db.integration.findMany({ orderBy: { createdAt: 'desc' } })
    const cfg = integrations.reduce((acc: any, it: any) => Object.assign(acc, it.config || {}), {})
    if (cfg.provider === 'stripe' && cfg.secretKey) {
      const body = new URLSearchParams({
        'success_url': String(returnUrl || ''),
        'cancel_url': String(cancelUrl || ''),
        'mode': 'payment',
        'line_items[0][price_data][currency]': String(currency).toLowerCase(),
        'line_items[0][price_data][product_data][name]': 'Order',
        'line_items[0][price_data][unit_amount]': String(Math.round(Number(amount || 0) * 100)),
        'line_items[0][quantity]': '1',
        'metadata[ref]': String(ref || '')
      })
      const sr = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { 'Authorization': `Bearer ${cfg.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      const sj = await sr.json()
      if (sj && sj.url) return res.json({ redirectUrl: sj.url })
      return res.status(400).json({ error: 'stripe_session_failed', details: sj })
    }
    // HyperPay placeholder
    if (cfg.provider === 'hyperpay' && cfg.accessToken) {
      // Return a hosted payment page URL placeholder; real integration requires prepare checkoutId then redirect
      const url = String(returnUrl || '/pay/success')
      return res.json({ redirectUrl: url })
    }
    return res.status(400).json({ error: 'no_provider' })
  } catch (e: any) { res.status(500).json({ error: e.message || 'failed' }) }
})
// Stripe webhook (signature validation omitted for brevity)
shop.post('/webhooks/stripe', async (req: Request, res) => {
  try {
    const event: any = req.body
    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object
      // Mark order paid if metadata carries order id (optional); otherwise no-op
      // Implement custom mapping as needed
    }
    res.json({ received: true })
  } catch { res.status(200).end() }
})

// Coupons apply with rules
shop.post('/coupons/apply', requireAuth, async (req: any, res) => {
  try {
    const { code } = req.body || {}
    if (!code) return res.status(400).json({ error: 'code_required' })
    const codeUp = String(code).toUpperCase()
    const c = await db.coupon.findUnique({ where: { code: codeUp } })
    if (!c) return res.status(404).json({ error: 'not_found' })
    const now = Date.now()
    if (c.validFrom && new Date(c.validFrom).getTime() > now) return res.status(400).json({ error: 'not_started' })
    if (c.validUntil && new Date(c.validUntil).getTime() < now) return res.status(400).json({ error: 'expired' })
    // Load advanced rules from settings key coupon_rules:CODE
    const setting = await db.setting.findUnique({ where: { key: `coupon_rules:${codeUp}` } })
    const rules: any = (setting?.value as any) || {}
    if (rules && rules.enabled === false) return res.status(400).json({ error: 'disabled' })
    if (rules && rules.schedule) {
      const fromOk = !rules.schedule.from || new Date(rules.schedule.from).getTime() <= now
      const toOk = !rules.schedule.to || new Date(rules.schedule.to).getTime() >= now
      if (!(fromOk && toOk)) return res.status(400).json({ error: 'out_of_schedule' })
    }
    // Audience enforcement: deny early if not eligible (low-risk alignment with tRPC)
    try {
      const audRaw = (rules?.audience?.target ?? rules?.audience ?? '') as string;
      const aud = String(audRaw || '').toLowerCase().trim();
      const isAll = aud === '' || aud === 'all' || aud === 'everyone' || aud === '*' || aud.includes('الجميع');
      const isUsers = aud === 'users' || aud === 'registered' || aud === 'existing' || aud.includes('مسجل');
      const isNew = aud === 'new' || aud === 'new_user' || aud === 'new_users' || aud === 'first' || aud === 'first_order' || aud.includes('الجدد') || aud.includes('الجديدة');
      if (!isAll) {
        const u = (req as any).user;
        if (!u?.userId) return res.status(401).json({ error: 'unauthorized' });
        const user = await db.user.findUnique({ where: { id: String(u.userId) }, select: { createdAt: true } } as any);
        const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
        const ageMs = createdAt ? (Date.now() - createdAt.getTime()) : Number.MAX_SAFE_INTEGER;
        const NEW_WINDOW_DAYS = Number(process.env.COUPON_NEW_USER_WINDOW_DAYS || 30);
        const withinWindow = ageMs <= NEW_WINDOW_DAYS * 864e5;
        const orderCount = await db.order.count({ where: { userId: String(u.userId) } } as any);
        const isNewUser = withinWindow || (Number(orderCount || 0) === 0);
        if (isNew && !isNewUser) return res.status(400).json({ error: 'audience_new_only' });
        if (isUsers && createdAt && createdAt.getTime() > new Date(c.createdAt).getTime()) {
          return res.status(400).json({ error: 'audience_registered_before_only' });
        }
      }
    } catch { }
    // includes/excludes require cart context; defer to checkout validation
    res.json({ ok: true, coupon: { code: c.code, type: c.discountType, value: c.discountValue } })
  } catch (e: any) { res.status(500).json({ error: e.message || 'failed' }) }
})
// Gift cards apply (reuse coupon rules under a different namespace if present)
shop.post('/giftcards/apply', requireAuth, async (req: any, res) => {
  try {
    const { code } = req.body || {}
    if (!code) return res.status(400).json({ error: 'code_required' })
    const codeUp = String(code).toUpperCase()
    // Lookup setting giftcard:CODE for value
    const s = await db.setting.findUnique({ where: { key: `giftcard:${codeUp}` } })
    const gv: any = s?.value || null
    if (!gv || gv.enabled === false) return res.status(404).json({ error: 'not_found' })
    const value = Number(gv.amount || 0)
    if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'invalid_amount' })
    return res.json({ ok: true, giftcard: { code: codeUp, value } })
  } catch (e: any) { return res.status(500).json({ error: e.message || 'failed' }) }
})

// Public: Theme config for sites (web/mweb)
shop.get('/theme/config', async (req, res) => {
  try {
    const { db } = require('@repo/db');
    const site = String(req.query.site || 'web');
    const key = `theme:${site}:live`;
    const s = await db.setting.findUnique({ where: { key } });
    const theme = (s?.value as any) || {};
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ site, theme });
  } catch (e: any) { res.status(500).json({ error: e.message || 'theme_config_failed' }) }
})
// Public Facebook Catalog feed (secured by token from admin settings)
shop.get('/marketing/facebook/catalog.xml', async (req, res) => {
  try {
    const { db } = require('@repo/db');
    const site = String(req.query.site || 'web');
    const token = String(req.query.token || '');
    const key = `marketing:facebook:settings:${site}`;
    const s = await db.setting.findUnique({ where: { key } });
    const expected = (s?.value as any)?.feedToken || '';
    if (!expected || token !== expected) return res.status(403).send('forbidden');
    // Optional: category -> GPC mapping from settings
    let gpcMap: Record<string, number> = {};
    try { const sm = await db.setting.findUnique({ where: { key: `marketing:facebook:gpcMap:${site}` } }); if (sm?.value) gpcMap = sm.value as any } catch { }
    res.setHeader('Content-Type', 'application/xml');
    const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">', '<channel>', '<title>JEEEY Catalog</title>', '<link>https://jeeey.com</link>', '<description>Product feed</description>'];
    const perPage = 1000;
    let lastId: string | null = null;
    for (; ;) {
      const page = await db.product.findMany({ where: { isActive: true }, orderBy: { id: 'asc' }, take: perPage, skip: lastId ? 1 : 0, ...(lastId ? { cursor: { id: lastId } } : {}), include: { variants: true, category: { select: { name: true } }, colors: { include: { images: true } } } } as any);
      if (!page.length) break;
      for (const p of page) {
        const img = (p.images || [])[0] || '';
        const baseTitle = escapeXml(p.name)
        const baseLink = `https://jeeey.com/p?id=${p.id}`
        const baseDesc = escapeXml(String(p.description || '').slice(0, 5000))
        const catName = p.category?.name ? escapeXml(String(p.category.name)) : ''
        const norm = (s: any) => String(s || '').trim().toLowerCase()
        const guessGender = (): string | undefined => {
          const hay = `${p.name} ${(p.tags || []).join(' ')}`.toLowerCase()
          if (/نساء|حريمي|ladies|women|female/.test(hay)) return 'female'
          if (/رجال|رجالي|men|male/.test(hay)) return 'male'
          if (/أطفال|اولاد|بنات|kids|children|boys|girls/.test(hay)) return 'kids'
          if (/مولود|رضع|بيبي|infant|newborn|toddler/.test(hay)) return 'newborn'
          return undefined
        }
        const guessAge = (): string | undefined => {
          const hay = `${p.name} ${(p.tags || []).join(' ')}`.toLowerCase()
          if (/infant|newborn|مولود|رضع/.test(hay)) return 'newborn'
          if (/toddler|baby|بيبي/.test(hay)) return 'toddler'
          if (/kids|children|أطفال/.test(hay)) return 'kids'
          return 'adult'
        }
        const guessMaterial = (): string | undefined => {
          const t = (p.tags || []).map(norm)
          const hay = `${norm(p.name)} ${t.join(' ')}`
          if (/(قطن|cotton)/.test(hay)) return 'cotton'
          if (/(بوليستر|polyester)/.test(hay)) return 'polyester'
          if (/(صوف|wool)/.test(hay)) return 'wool'
          if (/(دينم|denim)/.test(hay)) return 'denim'
          if (/(جلد|leather)/.test(hay)) return 'leather'
          if (/(حرير|silk)/.test(hay)) return 'silk'
          if (/(كتان|linen)/.test(hay)) return 'linen'
          return undefined
        }
        const guessGpc = (): number | undefined => {
          // 1) exact mapping by category name/id if provided in settings
          try {
            if (p.category?.name && gpcMap[p.category.name]) return Number(gpcMap[p.category.name])
            if (gpcMap[p.id]) return Number(gpcMap[p.id])
          } catch { }
          const hay = `${norm(p.name)} ${norm(catName)} ${(p.tags || []).map(norm).join(' ')}`
          if (/(shoe|حذاء|جزمة|نعال|صندل)/.test(hay)) return 187 // Shoes
          if (/(حقيبة|شنطة|bag|handbag|backpack)/.test(hay)) return 118 // Handbags
          if (/(اكسسوار|accessor)/.test(hay)) return 4179 // Fashion Accessories
          if (/(ملابس|feminin|tee|t-shirt|قميص|فستان|بنطال|بنطلون|عباية|hood|هودي|بلوزة|تنورة|جاكيت|سروال|تيشيرت|تي شيرت)/.test(hay)) return 1604 // Apparel & Accessories > Clothing
          return 1604
        }
        const colorMap = new Map<string, string[]>();
        try {
          const cols: any[] = Array.isArray((p as any).colors) ? (p as any).colors : []
          for (const c of cols) {
            const key = norm(c.name)
            const arr: string[] = []
            if (c.primaryImageUrl) arr.push(String(c.primaryImageUrl))
            if (Array.isArray(c.images)) {
              for (const im of c.images) { if (im?.url) arr.push(String(im.url)) }
            }
            if (arr.length) colorMap.set(key, arr)
          }
        } catch { }
        // Helpers to sanitize variant value coming from attributes_map (may contain JSON/labels)
        const parseVariantValue = (raw: any): { valueText: string; color?: string; size?: string } => {
          try {
            if (raw && typeof raw === 'object') {
              const lbl = (raw as any).label || ''
              const color = (raw as any).color || undefined
              const size = (raw as any).size || undefined
              return { valueText: String(lbl || size || color || '').trim(), color: color ? String(color).trim() : undefined, size: size ? String(size).trim() : undefined }
            }
            const s = String(raw || '').trim()
            if (!s) return { valueText: '' }
            if (s.startsWith('{') && s.endsWith('}')) {
              try { const j = JSON.parse(s); return parseVariantValue(j) } catch { }
            }
            // e.g. "مقاسات بالأحرف:L|مقاسات بالأرقام:100" or "مقاسات بالأحرف:L"
            if (/مقاسات\s*بال/.test(s) || /size/i.test(s)) {
              const parts = s.split('|').map(x => x.trim())
              const sizes: string[] = []
              for (const p of parts) {
                const m = p.split(':', 2); const val = (m[1] || m[0] || '').trim(); if (val) sizes.push(val)
              }
              return { valueText: sizes.join(' / '), size: sizes.join(' / ') }
            }
            // otherwise treat as plain token (color or size)
            return { valueText: s }
          } catch { return { valueText: String(raw || '') } }
        }
        const pushCommon = (id: string, title: string, price: number, extra: string[] = [], mainImage?: string, extraImages?: string[]) => {
          xml.push('<item>')
          xml.push(`<id>${id}</id>`) // non-namespaced id
          xml.push(`<g:id>${id}</g:id>`)
          xml.push(`<title>${title}</title>`)
          xml.push(`<g:title>${title}</g:title>`)
          xml.push(`<link>${baseLink}</link>`)
          xml.push(`<g:link>${baseLink}</g:link>`)
          xml.push(`<g:price>${(price || 0).toFixed(2)} YER</g:price>`)
          const mainImg = mainImage || img
          xml.push(`<g:image_link>${escapeXml(mainImg)}</g:image_link>`)
          const allExtra = Array.from(new Set([...(extraImages || []), ...((p.images || []).slice(1, 10))]))
          for (const im of allExtra.slice(0, 9)) { xml.push(`<g:additional_image_link>${escapeXml(im)}</g:additional_image_link>`) }
          xml.push(`<g:availability>${p.isActive ? 'in stock' : 'out of stock'}</g:availability>`)
          if (p.brand) xml.push(`<g:brand>${escapeXml(p.brand)}</g:brand>`)
          if (p.sku) xml.push(`<g:mpn>${escapeXml(p.sku)}</g:mpn>`)
          if (baseDesc) xml.push(`<g:description>${baseDesc}</g:description>`)
          if (catName) xml.push(`<g:product_type>${catName}</g:product_type>`)
          const gpc = guessGpc(); if (gpc) xml.push(`<g:google_product_category>${gpc}</g:google_product_category>`)
          const mat = guessMaterial(); if (mat) xml.push(`<g:material>${mat}</g:material>`)
          const gen = guessGender(); if (gen) xml.push(`<g:gender>${gen}</g:gender>`)
          const age = guessAge(); if (age) xml.push(`<g:age_group>${age}</g:age_group>`)
          xml.push(`<g:condition>new</g:condition>`)
          for (const ex of extra) xml.push(ex)
          xml.push('</item>')
        }

        // If we have variants → emit each as an item with item_group_id
        if (Array.isArray(p.variants) && p.variants.length) {
          const sizeVars = p.variants.filter((vv: any) => { const n = norm(vv.name); return /size|مقاس/.test(n) })
          const colorVars = p.variants.filter((vv: any) => { const n = norm(vv.name); return /color|لون/.test(n) })
          // If we have sizes and colorMap images → generate matrix: size x colors
          if (sizeVars.length && colorMap.size) {
            for (const sv of sizeVars) {
              const vPrice = Number(sv.price != null ? sv.price : p.price || 0)
              const sizeVal = String(sv.value || '')
              for (const [ckey, imgsArr] of colorMap.entries()) {
                const vid = `${p.id}-${sv.id}-${ckey}`
                const vTitle = `${baseTitle} (${escapeXml(sizeVal)} / ${escapeXml(ckey)})`
                const extra: string[] = [`<g:item_group_id>${p.id}</g:item_group_id>`, `<g:size>${escapeXml(sizeVal)}</g:size>`, `<g:color>${escapeXml(ckey)}</g:color>`]
                pushCommon(vid, vTitle, vPrice, extra, imgsArr[0], imgsArr.slice(1, 10))
              }
            }
          } else if (colorVars.length && p.variants.length) {
            // Colors as variants; if we also have non-color variants (e.g., sizes) fall back to individual color items
            for (const cv of colorVars) {
              const ckey = norm(cv.value)
              const vPrice = Number(cv.price != null ? cv.price : p.price || 0)
              const extra: string[] = [`<g:item_group_id>${p.id}</g:item_group_id>`, `<g:color>${escapeXml(String(cv.value || ''))}</g:color>`]
              const imgsArr = colorMap.get(ckey) || []
              const vid = `${p.id}-${cv.id}`
              const vTitle = `${baseTitle} (${escapeXml(String(cv.value || ''))})`
              pushCommon(vid, vTitle, vPrice, extra, imgsArr[0], imgsArr.slice(1, 10))
            }
          } else {
            // Fallback: one item per variant as-is, but sanitize JSON-like values into plain color/size tokens
            for (const v of p.variants) {
              const vid = `${p.id}-${v.id}`
              const nameLc = norm(v.name)
              const parsed = parseVariantValue((v as any).value)
              let sizeLabel: string | undefined
              let colorLabel: string | undefined
              if (/size|مقاس/.test(nameLc)) sizeLabel = parsed.size || parsed.valueText
              if (/color|لون/.test(nameLc)) colorLabel = parsed.color || parsed.valueText
              // Title suffix "(size / color)" if present
              const suffixParts: string[] = []
              if (sizeLabel) suffixParts.push(sizeLabel)
              if (colorLabel) suffixParts.push(colorLabel)
              const suffix = suffixParts.length ? ` (${escapeXml(suffixParts.join(' / '))})` : ''
              const vTitle = `${baseTitle}${suffix}`
              const vPrice = Number(v.price != null ? v.price : p.price || 0)
              const extra: string[] = [`<g:item_group_id>${p.id}</g:item_group_id>`]
              let overrideMain: string | undefined; let extraImgs: string[] | undefined
              if (sizeLabel) extra.push(`<g:size>${escapeXml(sizeLabel)}</g:size>`)
              if (colorLabel) {
                extra.push(`<g:color>${escapeXml(colorLabel)}</g:color>`)
                const ckey = norm(colorLabel)
                if (colorMap.has(ckey)) {
                  const arr = colorMap.get(ckey)!
                  overrideMain = arr[0]
                  extraImgs = arr.slice(1, 10)
                }
              }
              pushCommon(vid, vTitle, vPrice, extra, overrideMain, extraImgs)
            }
          }
        } else {
          // Single-item product
          // Try attach first color name/images if any
          let overrideMain: string | undefined; let extraImgs: string[] | undefined; let extra: string[] = []
          try {
            const key = colorMap.size ? Array.from(colorMap.keys())[0] : ''
            if (key) {
              const arr = colorMap.get(key)!
              overrideMain = arr[0]; extraImgs = arr.slice(1, 10)
              extra.push(`<g:color>${escapeXml(key)}</g:color>`)
            }
          } catch { }
          pushCommon(String(p.id), baseTitle, Number(p.price || 0), extra, overrideMain, extraImgs)
        }
      }
      lastId = page[page.length - 1]?.id || null;
      if (page.length < perPage) break;
    }
    xml.push('</channel></rss>');
    res.send(xml.join(''));
  } catch (e: any) { res.status(500).json({ error: e?.message || 'coupons_public_failed' }) }
});

// Public: Recently viewed products (based on user history)
shop.get('/products/recent', async (req: any, res) => {
  try {
    // Identify user or session
    let userId: string | undefined;
    try {
      const { readTokenFromRequest, verifyJwt } = await import('../utils/jwt');
      const t = readTokenFromRequest(req);
      if (t) {
        const p = verifyJwt(String(t));
        if (p && p.userId) userId = String(p.userId);
      }
    } catch { }

    const sessionId = String(req.query.sessionId || req.headers['x-session-id'] || '').trim();
    if (!userId && !sessionId) return res.json({ items: [] });

    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // Filter by event name 'viewcontent' (lowercase as per track.ts)
    conditions.push(`name IN ('viewcontent', 'view_item', 'ViewContent')`);

    // Filter by user or session
    if (userId) {
      conditions.push(`("userId" = $${idx} OR (properties->>'userId') = $${idx})`);
      params.push(userId);
      idx++;
    } else {
      // Guest: rely on sessionId
      conditions.push(`(COALESCE("sessionId", properties->>'sessionId') = $${idx})`);
      params.push(sessionId);
      idx++;
    }

    const whereSql = conditions.join(' AND ');

    // Query distinct productIds from events, ordered by most recent
    const rows: any[] = await db.$queryRawUnsafe(`
      SELECT "productId", MAX("createdAt") as "lastViewed"
      FROM "Event"
      WHERE ${whereSql} AND "productId" IS NOT NULL
      GROUP BY "productId"
      ORDER BY "lastViewed" DESC
      LIMIT 20
    `, ...params);

    if (!rows.length) return res.json({ items: [] });

    const pids = rows.map(r => String(r.productId));

    // Fetch product details
    const products = await db.product.findMany({
      where: { id: { in: pids }, isActive: true },
      select: { id: true, name: true, price: true, images: true, brand: true }
    });

    // Map back to preserve order
    const map = new Map(products.map(p => [p.id, p]));
    const items = pids.map(id => {
      const p = map.get(id);
      if (!p) return null;
      return {
        id: p.id,
        title: p.name,
        price: Number(p.price),
        img: Array.isArray(p.images) ? p.images[0] : '',
        brand: p.brand
      };
    }).filter(Boolean);

    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'recent_failed' });
  }
});

// Public: trending products (top IDs) for mweb badges
shop.get('/trending/products', async (_req: any, res) => {
  try {
    // Public cache (short) to protect DB on hot paths
    try { res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300'); } catch { }
    // Rank by purchases + addToCart + a small weight to views in last 14 days
    const rows: any[] = await db.$queryRawUnsafe(`
      SELECT "productId" AS id,
             COALESCE(SUM("purchases"),0)*2
             + COALESCE(SUM("addToCart"),0)*1
             + COALESCE(SUM("views"),0)*0.2 AS score
      FROM "ProductAnalytics"
      WHERE "date" >= NOW() - INTERVAL '14 days'
      GROUP BY "productId"
      ORDER BY score DESC
      LIMIT 100
    `) as any[];
    const items = (rows || []).map(r => ({ id: String(r.id) }));
    res.json({ items });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'trending_failed' }) }
});

function escapeXml(s: string): string { return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' } as any)[c] || c) }

// Shipping quote (simple placeholder; replace with provider call if enabled)
shop.get('/shipping/quote', async (req, res) => {
  try {
    const method = String(req.query.method || 'std')
    // fallback defaults
    let price = method === 'fast' ? 30 : 18
    const subtotal = Number(req.query.subtotal || 0)
    // If DeliveryRate exists for city via zones, try to compute minimal price
    try {
      const city = String(req.query.city || '').trim()
      if (city) {
        // naive: pick lowest active rate
        const rates = await db.deliveryRate.findMany({ where: { isActive: true }, select: { baseFee: true, perKgFee: true, freeOverSubtotal: true } } as any)
        if (rates && rates.length) {
          // apply free-over rule when applicable
          const best = rates
            .map((r: any) => {
              const base = Number(r.baseFee || 0)
              const freeOver = Number(r.freeOverSubtotal || 0)
              return (freeOver > 0 && subtotal >= freeOver) ? 0 : base
            })
            .sort((a: number, b: number) => a - b)[0]
          price = Number(best ?? price)
        }
      }
    } catch { }
    res.json({ price })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Shipping methods list from DeliveryRate
shop.get('/shipping/methods', async (req, res) => {
  try {
    const city = String(req.query.city || '').trim()
    const state = String(req.query.state || '').trim()
    const area = String(req.query.area || '').trim()
    const country = String(req.query.country || '').trim().toUpperCase()
    const subtotal = Number(req.query.subtotal || 0)
    let items: Array<{ id: string; name: string; desc: string; price: number; offerTitle?: string; etaMinHours?: number; etaMaxHours?: number }> = []
    try {
      // Resolve applicable zoneIds from ShippingZone by matching area/city/country (case-insensitive)
      let zoneIds: string[] = []
      try {
        const zones: any[] = await db.shippingZone.findMany({ where: { isActive: true }, select: { id: true, countryCodes: true, cities: true, areas: true } } as any)
        const norm = (s: string) => String(s || '').trim().toLowerCase()
        const cCity = norm(city); const cState = norm(state); const cArea = norm(area); const cCountry = (country || '').toUpperCase()
        const arr = (v: any) => Array.isArray(v) ? v : []
        zoneIds = zones.filter((z: any) => {
          const countries: string[] = arr(z.countryCodes)
          const cities: string[] = arr(z.cities)
          const areas: string[] = arr(z.areas)
          // Priority: areas > cities > countries
          if (areas.length) {
            const A = areas.map(norm)
            // area can be matched to area explicitly, or sometimes UI sends area in city/state
            return (!!cArea && A.includes(cArea)) || (!!cCity && A.includes(cCity)) || (!!cState && A.includes(cState))
          }
          if (cities.length) {
            const C = cities.map(norm)
            return (!!cCity && C.includes(cCity)) || (!!cState && C.includes(cState))
          }
          if (countries.length) {
            const K = countries.map((x) => String(x).toUpperCase())
            return !!cCountry && K.includes(cCountry)
          }
          // No constraints → applies everywhere
          return true
        }).map((z: any) => String(z.id))
      } catch { }
      const where: any = zoneIds.length ? { isActive: true, zoneId: { in: zoneIds } } : { isActive: true }
      const rates = await db.deliveryRate.findMany({ where, select: { id: true, baseFee: true, etaMinHours: true, etaMaxHours: true, carrier: true, offerTitle: true, freeOverSubtotal: true, minSubtotal: true } } as any)
      items = (rates || []).map((r: any) => ({
        id: r.id,
        name: r.carrier || 'شحن',
        desc: r.offerTitle || (r.etaMinHours || r.etaMaxHours ? `توصيل خلال ${r.etaMinHours || r.etaMaxHours} - ${r.etaMaxHours || r.etaMinHours} ساعة` : ''),
        price: (() => {
          const base = Number(r.baseFee || 0)
          const freeOver = Number(r.freeOverSubtotal || 0)
          const minSub = Number(r.minSubtotal || 0)
          if (minSub > 0 && subtotal < minSub) return base // لا إخفاء، لكن لا ينطبق المجاني بعد
          if (freeOver > 0 && subtotal >= freeOver) return 0
          return base
        })(),
        offerTitle: r.offerTitle || null,
        etaMinHours: r.etaMinHours ?? null,
        etaMaxHours: r.etaMaxHours ?? null,
      }))
    } catch { }
    if (!items.length) {
      items = [
        { id: 'std', name: 'شحن عادي', desc: '4 - 9 أيام عمل', price: 18 },
        { id: 'fast', name: 'شحن سريع', desc: '2 - 6 أيام عمل', price: 30 }
      ]
    }
    res.json({ items })
  } catch { res.status(200).json({ items: [] }) }
})

// Payments methods from PaymentGateway
shop.get('/payments/methods', async (req: any, res) => {
  try {
    const list = await db.paymentGateway.findMany({ where: { isActive: true }, select: { id: true, name: true, provider: true, mode: true } } as any)
    // Deduplicate by provider/name and normalize COD id
    const itemsMap = new Map<string, any>()
    for (const g of (list || [])) {
      const key = `${String(g.provider || '').toLowerCase()}::${String(g.name || '').trim()}`
      if (!itemsMap.has(key)) itemsMap.set(key, { id: g.provider === 'cod' ? 'cod' : g.id, name: g.name, provider: g.provider, mode: g.mode })
    }
    const items = Array.from(itemsMap.values())
    // Add COD if configured in settings
    try {
      const s = await db.setting.findUnique({ where: { key: 'payments:cod' } });
      const enableCod = !s?.value || (s?.value as any)?.enabled !== false
      if (enableCod && !items.find((x: any) => x.provider === 'cod' || x.id === 'cod')) items.push({ id: 'cod', name: 'الدفع عند الاستلام', provider: 'cod', mode: 'LIVE' })
    } catch { }
    res.json({ items })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Public: current currency (base)
shop.get('/currency', async (_req: any, res) => {
  try {
    const base = await db.currency.findFirst({ where: { isBase: true }, orderBy: { updatedAt: 'desc' } } as any)
    if (!base) return res.json({ code: 'YER', symbol: 'ر.ي', precision: 2, rateToBase: 1 })
    res.json({ code: base.code, symbol: base.symbol, precision: base.precision, rateToBase: base.rateToBase })
  } catch { res.status(200).json({ code: 'YER', symbol: 'ر.ي', precision: 2, rateToBase: 1 }) }
})

// Points balance
shop.get('/points/balance', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    // Prefer new PointsLedger (CONFIRMED only)
    try {
      const rows = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } }) as any
      const sum = Number(rows?._sum?.points || 0)
      if (!Number.isNaN(sum)) return res.json({ points: sum })
    } catch { }
    // Legacy: PointLedger (raw table)
    try {
      const rows: any[] = await db.$queryRawUnsafe('SELECT COALESCE(SUM(points),0) as s FROM "PointLedger" WHERE "userId"=$1', userId) as any
      const sum = Number(rows?.[0]?.s || 0)
      if (!Number.isNaN(sum)) return res.json({ points: sum })
    } catch { }
    // Fallback to LoyaltyPoint sum
    try { const rows2: any[] = await db.$queryRawUnsafe('SELECT COALESCE(SUM(points),0) as s FROM "LoyaltyPoint" WHERE "userId"=$1', userId) as any; const sum = Number(rows2?.[0]?.s || 0); return res.json({ points: sum }) } catch { }
    res.json({ points: 0 })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Wallet balance (ledger-based)
shop.get('/wallet/balance', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    try {
      const rows = await db.walletLedger.aggregate({ _sum: { amount: true }, where: { userId, status: 'CONFIRMED' as any } }) as any
      const sum = Number(rows?._sum?.amount || 0)
      return res.json({ balance: Number.isNaN(sum) ? 0 : sum })
    } catch { }
    // Legacy placeholder fallback
    return res.json({ balance: 0 })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Checkout: apply wallet amount (server validation)
shop.post('/checkout/apply-wallet', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const subtotal = Math.max(0, Number(req.body?.subtotal || 0))
    const requested = Math.max(0, Number(req.body?.amount || 0))
    const agg: any = await db.walletLedger.aggregate({ _sum: { amount: true }, where: { userId, status: 'CONFIRMED' as any } })
    const balance = Number(agg?._sum?.amount || 0)
    const allowed = Math.max(0, Math.min(requested, balance, subtotal))
    res.json({ allowed })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Checkout: apply points (server validation and conversion)
shop.post('/checkout/apply-points', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const subtotal = Math.max(0, Number(req.body?.subtotal || 0))
    const requestedPts = Math.max(0, Math.floor(Number(req.body?.points || 0)))
    let pointValue = 0.01; try { const s = await db.setting.findUnique({ where: { key: 'points:settings' } }); pointValue = Number(((s?.value as any)?.pointValue) || 0.01) } catch { }
    const agg: any = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } })
    const balancePts = Number(agg?._sum?.points || 0)
    const allowedPts = Math.max(0, Math.min(requestedPts, balancePts))
    const amount = Math.max(0, Math.round((allowedPts * pointValue) * 100) / 100)
    const cappedAmount = Math.min(amount, subtotal)
    const finalPts = amount > 0 ? Math.min(allowedPts, Math.floor(cappedAmount / Math.max(0.0001, pointValue))) : 0
    res.json({ allowedPoints: finalPts, amount: cappedAmount })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Points ledger (self)
shop.get('/points/ledger', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const rows = await db.pointsLedger.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ rows })
  } catch { try { return res.json({ rows: [] }) } catch { return res.json({ rows: [] }) } }
})

// Rewards settings (public for mweb toggles)
shop.get('/policies/rewards/settings', async (_req: any, res) => {
  try {
    const s = await db.setting.findUnique({ where: { key: 'points:settings' } })
    const v: any = (s?.value as any) || {}
    res.json({ enabled: v.enabled !== false, pointValue: Number(v.pointValue || 0.01), expiryDays: Number(v.expiryDays || 0) })
  } catch { res.json({ enabled: true, pointValue: 0.01, expiryDays: 0 }) }
})

// Points meta (public): point value + public triggers/redemption
shop.get('/points/meta', async (_req: any, res) => {
  try {
    const s = await db.setting.findUnique({ where: { key: 'points:settings' } })
    const t = await db.setting.findUnique({ where: { key: 'points:triggers' } })
    const r = await db.setting.findUnique({ where: { key: 'points:redemption' } })
    const settings: any = (s?.value as any) || {}
    const triggers: any = (t?.value as any) || {}
    const redemption: any = (r?.value as any) || {}
    const pubTriggers = {
      purchase: triggers?.purchase || null,
      registration: triggers?.registration || null,
      dailyCheckIn: triggers?.dailyCheckIn || null,
      review: triggers?.review || null,
      share: triggers?.share || null,
      referral: triggers?.referral || null,
    }
    const pubRedemption = {
      tiers: Array.isArray(redemption?.tiers) ? redemption.tiers : [],
      minOrderAmount: Number(redemption?.minOrderAmount || 0)
    }
    res.json({ pointValue: Number(settings?.pointValue || 0.01), enabled: settings?.enabled !== false, triggers: pubTriggers, redemption: pubRedemption })
  } catch { res.status(200).json({ pointValue: 0.01, enabled: true, triggers: {}, redemption: { tiers: [], minOrderAmount: 0 } }) }
})

// Redeem points to wallet balance
shop.post('/points/redeem-to-wallet', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const pts = Math.floor(Number(req.body?.points || 0))
    if (!pts || pts <= 0) return res.status(400).json({ error: 'points_required' })
    // Anti-fraud: rate-limit redemptions per user (max 3/minute)
    try {
      const since = new Date(Date.now() - 60_000)
      const count = await db.pointsLedger.count({ where: { userId, reason: 'REDEEM_TO_WALLET' as any, createdAt: { gte: since as any } } })
      if (count >= 3) return res.status(429).json({ error: 'rate_limited' })
    } catch { }
    const s = await db.setting.findUnique({ where: { key: 'points:settings' } })
    const v: any = (s?.value as any) || {}
    const pointValue = Number(v.pointValue || 0.01)
    const amount = Math.max(0, Math.round((pts * pointValue) * 100) / 100)
    if (amount <= 0) return res.status(400).json({ error: 'point_value_zero' })
    // Ensure sufficient points
    const balAgg = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } }) as any
    const balance = Number(balAgg?._sum?.points || 0)
    if (balance < pts) return res.status(400).json({ error: 'insufficient_points' })
    // Post ledgers
    await db.pointsLedger.create({ data: { userId, points: -Math.abs(pts), status: 'CONFIRMED' as any, reason: 'REDEEM_TO_WALLET' } as any })
    await db.walletLedger.create({ data: { userId, amount: amount, status: 'CONFIRMED' as any, reason: 'POINTS_REDEEM' } as any })
    res.json({ ok: true, credited: amount })
  } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }) }
})

// Daily check-in: award once per day per user
shop.post('/points/checkin', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    // Load config
    let pointsPerCheckin = 0
    try {
      const t = await db.setting.findUnique({ where: { key: 'points:triggers' } })
      pointsPerCheckin = Number(((t?.value as any)?.dailyCheckIn?.points) || 0)
    } catch { }
    if (!pointsPerCheckin || pointsPerCheckin <= 0) return res.status(400).json({ error: 'disabled' })
    // Enforce once per day
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
    const existing = await db.pointsLedger.findFirst({ where: { userId, reason: 'DAILY_CHECKIN' as any, createdAt: { gte: start } }, orderBy: { createdAt: 'desc' } })
    if (existing) return res.status(400).json({ error: 'already_checked_in' })
    await db.pointsLedger.create({ data: { userId, points: Math.trunc(pointsPerCheckin), status: 'CONFIRMED' as any, trigger: 'daily_checkin', reason: 'DAILY_CHECKIN' } as any })
    const agg = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } }) as any
    const balance = Number(agg?._sum?.points || 0)
    res.json({ ok: true, balance })
  } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }) }
})
// Generic points events (review/share/like milestones)
shop.post('/points/event', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const { type, eventId, meta } = req.body || {}
    if (!type) return res.status(400).json({ error: 'type_required' })
    // Anti-fraud: require verified contact (email or phone) for earning via events
    try {
      const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } })
      if (!u || (!u.email && !u.phone)) return res.status(403).json({ error: 'verification_required' })
    } catch { }
    // Prevent duplicates via eventId when provided
    if (eventId) {
      try { const exists = await db.pointsLedger.findUnique({ where: { eventId: String(eventId) } }); if (exists) return res.json({ ok: true, duplicate: true }); } catch { }
    }
    const trig = await loadTriggers()
    if (trig?.enabled === false) return res.status(400).json({ error: 'disabled' })
    let pts = 0; let reason = 'EVENT'; let status: any = 'CONFIRMED'
    if (type === 'review') {
      const base = Math.trunc(Number((trig as any)?.review?.base || 0))
      const bonus = (meta?.hasPhoto && Number((trig as any)?.review?.withPhotoBonus || 0)) ? Math.trunc(Number((trig as any)?.review?.withPhotoBonus || 0)) : 0
      pts = Math.max(0, base + bonus)
      reason = 'REVIEW'
      const delay = (trig as any)?.confirmDelays?.review
      if (delay === 'approved' && !meta?.approved) status = 'PENDING'
    } else if (type === 'like_milestone') {
      const th = Number((trig as any)?.review?.likeThreshold?.count || 0)
      const bonus = Number((trig as any)?.review?.likeThreshold?.bonus || 0)
      if (th > 0 && Number(meta?.likes || 0) >= th) { pts = Math.trunc(Math.max(0, bonus)); reason = 'REVIEW_LIKES' }
    } else if (type === 'share') {
      const viewPts = Math.trunc(Number((trig as any)?.share?.view || 0))
      pts = Math.max(0, viewPts)
      reason = 'SHARE'
    } else {
      return res.status(400).json({ error: 'unsupported_type' })
    }
    pts = await applyCaps(userId, pts, trig)
    if (!pts) return res.json({ ok: true, points: 0 })
    await db.pointsLedger.create({ data: { userId, points: Math.trunc(pts), status: status as any, trigger: String(type), reason, eventId: eventId ? String(eventId) : null as any, meta: meta || null } as any })
    const agg = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } }) as any
    return res.json({ ok: true, balance: Number(agg?._sum?.points || 0) })
  } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }) }
})

// Wallet top-up (mock)
shop.post('/wallet/topup', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const amount = Math.max(0, Number(req.body?.amount || 0))
    if (!amount) return res.status(400).json({ error: 'amount_required' })
    await db.walletLedger.create({ data: { userId, amount, status: 'CONFIRMED' as any, reason: 'TOPUP' } as any })
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Referral: my code and link
shop.get('/referral/code', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    // Ensure Affiliate row with deterministic code
    const code = String(userId).slice(0, 8).toUpperCase()
    try { await db.$executeRawUnsafe('INSERT INTO "Affiliate" (id, code, "userId") VALUES ($1,$2,$3) ON CONFLICT (code) DO NOTHING', (require('crypto').randomUUID as () => string)(), code, userId) } catch { }
    const base = `${req.protocol}://${req.get('host')}`
    const link = `${base}/?ref=${encodeURIComponent(code)}`
    res.json({ code, link })
  } catch { res.status(500).json({ error: 'failed' }) }
})

// Referral: track click (public)
shop.post('/referral/click', async (req: any, res) => {
  try {
    const code = String(req.body?.code || '').toUpperCase()
    if (!code) return res.status(400).json({ error: 'code_required' })
    await db.$executeRawUnsafe('INSERT INTO "AffiliateClick" (id, code, ip, ua) VALUES ($1,$2,$3,$4)', (require('crypto').randomUUID as () => string)(), code, (req.ip || '').toString(), (req.headers['user-agent'] || '').toString());
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }) }
})
// Redeem points to a single-use coupon (self)
shop.post('/points/redeem', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId
    const pts = Math.floor(Number(req.body?.points || 0))
    if (!pts || pts <= 0) return res.status(400).json({ error: 'points_required' })
    // Load settings
    const s = await db.setting.findUnique({ where: { key: 'points:settings' } })
    const v: any = (s?.value as any) || {}
    const pointValue = Number(v.pointValue || 0.01)
    const amount = Math.max(0, Math.round((pts * pointValue) * 100) / 100)
    if (amount <= 0) return res.status(400).json({ error: 'point_value_zero' })
    // Ensure sufficient balance
    const balAgg = await db.pointsLedger.aggregate({ _sum: { points: true }, where: { userId, status: 'CONFIRMED' as any } }) as any
    const balance = Number(balAgg?._sum?.points || 0)
    if (balance < pts) return res.status(400).json({ error: 'insufficient_points' })
    // Create single-use coupon
    const now = new Date()
    const ends = new Date(Date.now() + (Number(v.couponValidityDays || 30) * 864e5))
    const code = `PTS-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${String(userId).slice(0, 4).toUpperCase()}`
    await db.coupon.create({ data: { code, discountType: 'FIXED' as any, discountValue: amount, minOrderAmount: null as any, maxUses: 1 as any, currentUses: 0, validFrom: now as any, validUntil: ends as any, isActive: true } as any })
    // Post negative ledger
    await db.pointsLedger.create({ data: { userId, points: -Math.abs(pts), status: 'CONFIRMED' as any, reason: 'REDEEM_TO_COUPON', meta: { code } } as any })
    return res.json({ ok: true, coupon: { code, type: 'FIXED', value: amount } })
  } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }) }
})
// Search suggestions
shop.get('/search/suggest', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ items: [] })
    const rows = await db.product.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true }, take: 10 })
    res.json({ items: rows.map(r => r.name) })
  } catch { res.status(500).json({ items: [] }) }
})