import { Router } from 'express';
import { db } from '../db/ensure';

const r = Router();

// -------- Categories CRUD --------
r.get('/categories', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const categories = await db.category.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ categories });
  } catch (e) { res.status(500).json({ error: 'Failed to list categories' }); }
});

r.get('/categories/tree', async (_req, res) => {
  try {
    const all = await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    const byId: Record<string, any> = Object.fromEntries(all.map((c: any) => [c.id, { ...c, children: [] as any[] }]));
    const roots: any[] = [];
    for (const c of all) {
      const node = byId[c.id];
      if (c.parentId && byId[c.parentId]) byId[c.parentId].children.push(node);
      else roots.push(node);
    }
    res.json({ tree: roots });
  } catch (e) { res.status(500).json({ error: 'Failed to build tree' }); }
});

r.post('/categories', async (req, res) => {
  try {
    const { name, description, image, parentId, slug, seoTitle, seoDescription, seoKeywords, translations, canonicalUrl, metaRobots, hiddenContent, ogTags, schema } = req.body || {};
    console.log('[DEBUG] POST /categories body:', JSON.stringify(req.body, null, 2));
    const created = await db.category.create({
      data: {
        name,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        slug: slug || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: Array.isArray(seoKeywords) ? seoKeywords : [],
        translations: translations || undefined,
        seo: {
          create: {
            canonicalUrl: canonicalUrl || null,
            metaRobots: metaRobots || 'index, follow',
            hiddenContent: hiddenContent || null,
            ogTags: ogTags || undefined,
            schema: schema || undefined
          }
        }
      }
    });
    res.json({ category: created });
  } catch (e: any) { res.status(500).send(e?.message || 'Failed to create'); }
});

r.patch('/categories/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, description, image, parentId, slug, seoTitle, seoDescription, seoKeywords, translations, canonicalUrl, metaRobots, hiddenContent, ogTags, schema } = req.body || {};
    console.log('[DEBUG] PATCH /categories body:', JSON.stringify(req.body, null, 2));
    const updated = await db.category.update({
      where: { id }, data: {
        name,
        description: description ?? undefined,
        image: image ?? undefined,
        parentId: parentId === null ? null : parentId ?? undefined,
        slug: slug ?? undefined,
        seoTitle: seoTitle ?? undefined,
        seoDescription: seoDescription ?? undefined,
        seoKeywords: Array.isArray(seoKeywords) ? seoKeywords : undefined,
        translations: translations ?? undefined,
        seo: {
          upsert: {
            create: {
              canonicalUrl: canonicalUrl || null,
              metaRobots: metaRobots || 'index, follow',
              hiddenContent: hiddenContent || null,
              ogTags: ogTags || undefined,
              schema: schema || undefined
            },
            update: {
              canonicalUrl: canonicalUrl ?? undefined,
              metaRobots: metaRobots ?? undefined,
              hiddenContent: hiddenContent ?? undefined,
              ogTags: ogTags ?? undefined,
              schema: schema ?? undefined
            }
          }
        }
      }
    });
    res.json({ category: updated });
  } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});

r.delete('/categories/:id', async (req, res) => {
  try { await db.category.delete({ where: { id: String(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(500).json({ error: 'Failed to delete' }); }
});

r.post('/categories/reorder', async (req, res) => {
  try {
    const { items } = req.body || { items: [] };
    for (const it of items || []) {
      await db.category.update({ where: { id: it.id }, data: { parentId: it.parentId || null, sortOrder: typeof it.sortOrder === 'number' ? it.sortOrder : 0 } });
    }
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to reorder' }); }
});

// -------- Products (minimal REST helpers for admin UI) --------
r.get('/products/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true, variants: true }
    });
    if (!product) return res.status(404).json({ error: 'not_found' });
    res.json(product);
  } catch (e) { res.status(500).json({ error: 'Failed to load product' }); }
});

r.post('/products/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id);
    const status = String((req.body || {}).status || '').toUpperCase();
    const isActive = status === 'PUBLISHED';
    const product = await db.product.update({ where: { id }, data: { isActive } });
    res.json({ ok: true, product });
  } catch (e) { res.status(500).json({ error: 'Failed to update status' }); }
});

// -------- Media upload (base64 passthrough/demo) --------
r.post('/media/upload', async (req, res) => {
  try {
    const { base64, filename, contentType } = req.body || {};
    if (typeof base64 === 'string' && base64.startsWith('data:')) return res.json({ url: base64, filename, contentType });
    if (typeof base64 === 'string') return res.json({ url: `data:${contentType || 'application/octet-stream'};base64,${base64.split(',').pop()}` });
    return res.status(400).json({ error: 'No data' });
  } catch { res.status(500).json({ error: 'Upload failed' }); }
});

// -------- Finance summary (simple aggregates) --------
r.get('/finance/summary', async (_req, res) => {
  try {
    const paid = await db.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } });
    const expenses = await db.expense.aggregate({ _sum: { amount: true } });
    const revenue = paid._sum.amount || 0;
    const expense = expenses._sum.amount || 0;
    const profit = revenue - expense;
    const cash = revenue - expense; // simplistic
    res.json({ revenue, expenses: expense, profit, cash });
  } catch { res.status(500).json({ error: 'Failed to summarize' }); }
});

// -------- Invoices & Payments (minimal) --------
r.get('/finance/invoices', async (_req, res) => {
  try {
    const orders = await db.order.findMany({ include: { payment: true, user: true }, take: 50, orderBy: { createdAt: 'desc' } });
    const invoices = orders.map((o: any) => ({ number: o.id.slice(0, 8), orderId: o.id, customer: o.userId, amount: o.total, status: o.payment?.status === 'COMPLETED' ? 'COMPLETED' : 'DUE', dueDate: o.createdAt }));
    res.json({ invoices });
  } catch { res.status(500).json({ error: 'Failed to list invoices' }); }
});

r.get('/finance/payments', async (_req, res) => {
  try {
    const ps = await db.payment.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
    const payments = ps.map((p: any) => ({ id: p.id, orderId: p.orderId, ref: p.stripeId, method: p.method, amount: p.amount, at: p.createdAt, note: '' }));
    res.json({ payments });
  } catch { res.status(500).json({ error: 'Failed to list payments' }); }
});

r.post('/finance/payments', async (req, res) => {
  try {
    const { orderId, amount } = req.body || {};
    let { method } = req.body || {};
    if (!orderId || !amount) return res.status(400).json({ error: 'orderId, amount required' });
    // Normalize method to Prisma enum
    const m = String(method || '').toUpperCase();
    const map: Record<string, string> = { 'CASH': 'CASH_ON_DELIVERY', 'COD': 'CASH_ON_DELIVERY', 'CASH_ON_DELIVERY': 'CASH_ON_DELIVERY', 'STRIPE': 'STRIPE', 'PAYPAL': 'PAYPAL' };
    const normalized = (map[m] || 'CASH_ON_DELIVERY') as any;
    const p = await db.payment.upsert({ where: { orderId }, update: { amount, method: normalized, status: 'COMPLETED' }, create: { orderId, amount, method: normalized, status: 'COMPLETED', currency: 'USD' } });
    res.json({ payment: p });
  } catch { res.status(500).json({ error: 'Failed to create payment' }); }
});

// -------- Notifications (logs) --------
r.get('/notifications/logs', async (_req, res) => {
  try {
    const logs = await db.$queryRawUnsafe('SELECT id, channel, target, title, body, status, error, "createdAt" FROM "NotificationLog" ORDER BY "createdAt" DESC LIMIT 200');
    res.json({ logs });
  } catch { res.status(500).json({ error: 'Failed to load logs' }); }
});
r.post('/notifications/manual', async (req, res) => {
  try {
    const { title, body, channel, scheduleAt, segment } = req.body || {};
    const id = (require('crypto').randomUUID as () => string)();
    await db.$executeRawUnsafe('INSERT INTO "NotificationLog" (id, channel, target, title, body, status) VALUES ($1,$2,$3,$4,$5,$6)', id, channel || 'EMAIL', segment || null, title || '', body || '', scheduleAt ? 'QUEUED' : 'SENT');
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to enqueue' }); }
});
r.get('/notifications/rules', async (_req, res) => { res.json({ rules: [] }); });
r.post('/notifications/rules', async (_req, res) => { res.json({ ok: true }); });

// -------- Drivers WS support (ping last seen / location) --------
r.post('/drivers/ping', async (req, res) => {
  try {
    const { driverId, name, phone, lat, lng, status } = req.body || {};
    if (!driverId) return res.status(400).json({ error: 'driverId required' });
    const d = await db.driver.upsert({
      where: { id: driverId }, update: {
        name: name ?? undefined,
        phone: phone ?? undefined,
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        status: status ?? undefined,
        lastSeenAt: new Date(),
      }, create: {
        id: driverId, name: name || 'Driver', phone: phone || null,
        isActive: true, status: status || 'AVAILABLE', lat: lat || null, lng: lng || null,
      }
    });
    res.json({ driver: d });
  } catch { res.status(500).json({ error: 'Failed to ping' }); }
});

// -------- Logistics legs (pickup/warehouse/delivery) --------
r.get('/logistics/legs', async (req, res) => {
  try {
    const legType = String(req.query.type || ''), status = String(req.query.status || '');
    const where: any = {};
    if (legType) where.legType = legType;
    if (status) where.status = status;
    const legs = await db.shipmentLeg.findMany({ where, take: 200, orderBy: { createdAt: 'desc' } });
    res.json({ legs });
  } catch { res.status(500).json({ error: 'Failed to list legs' }); }
});

r.post('/logistics/legs', async (req, res) => {
  try {
    const { orderId, poId, legType, driverId, status } = req.body || {};
    if (!legType) return res.status(400).json({ error: 'legType required' });
    const leg = await db.shipmentLeg.create({ data: { orderId: orderId || null, poId: poId || null, legType, driverId: driverId || null, status: status || 'SCHEDULED' } });
    res.json({ leg });
  } catch { res.status(500).json({ error: 'Failed to create leg' }); }
});

r.post('/logistics/legs/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { status, driverId } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status required' });
    const leg = await db.shipmentLeg.update({ where: { id }, data: { status, driverId: driverId ?? undefined } });
    res.json({ leg });
  } catch { res.status(500).json({ error: 'Failed to update status' }); }
});

// -------- Orders visibility across stages --------
r.get('/orders/visibility/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const order = await db.order.findUnique({ where: { id }, include: { payment: true, items: true } });
    const legs = await db.shipmentLeg.findMany({ where: { OR: [{ orderId: id }, { poId: id }] }, orderBy: { createdAt: 'asc' } });
    const packages = await db.package.findMany({ where: { orderId: id }, orderBy: { createdAt: 'asc' } }).catch(() => [] as any[]);
    res.json({ order, legs, packages });
  } catch { res.status(500).json({ error: 'Failed to resolve visibility' }); }
});

// -------- Trends / Badges / Subscriptions (minimal stubs) --------
r.get('/trends', async (_req, res) => { res.json({ trends: [] }); });
r.post('/trends', async (_req, res) => { res.json({ ok: true }); });
r.post('/trends/:id/run', async (_req, res) => { res.json({ ok: true }); });

r.get('/badges', async (_req, res) => { res.json({ badges: [] }); });
r.post('/badges', async (_req, res) => { res.json({ ok: true }); });

r.get('/subscriptions', async (_req, res) => { res.json({ subscriptions: [] }); });
r.post('/subscriptions', async (_req, res) => { res.json({ ok: true }); });

// -------- Affiliates (list/payouts/settings) --------
r.get('/affiliates/list', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    // No dedicated model yet: derive basic list from users with role USER and count orders
    const users = await db.user.findMany({ select: { id: true, email: true } });
    const orders = await db.order.groupBy({ by: ['userId'], _count: { _all: true }, _sum: { total: true } });
    const byUser: Record<string, any> = Object.fromEntries(orders.map((o: any) => [o.userId || '', o]));
    const affiliates = users
      .map((u) => ({ id: u.id, email: u.email, visits: 0, sales: byUser[u.id]?._count?._all || 0, commission: Math.round(((byUser[u.id]?._sum?.total || 0) * 0.05) * 100) / 100, payouts: 0, status: 'ACTIVE' }))
      .filter((a) => (q ? a.email.toLowerCase().includes(q) : true));
    res.json({ affiliates });
  } catch { res.status(500).json({ error: 'Failed to list affiliates' }); }
});

r.get('/affiliates/payouts', async (_req, res) => {
  try {
    // Stub payouts from payments grouped monthly
    const payments = await db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    const payouts = payments.map((p: any) => ({ id: p.id, email: 'affiliate@example.com', period: `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`, amount: Math.round((p.amount * 0.05) * 100) / 100, status: p.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING' }));
    res.json({ payouts });
  } catch { res.status(500).json({ error: 'Failed to list payouts' }); }
});

r.get('/affiliates/settings', async (_req, res) => {
  try {
    const s = await db.setting.findUnique({ where: { key: 'affiliates.settings' } });
    res.json({ settings: s?.value || { enabled: true, cookieDays: 30, baseRate: 5 } });
  } catch { res.status(500).json({ error: 'Failed to load settings' }); }
});

r.post('/affiliates/settings', async (req, res) => {
  try {
    const { enabled, cookieDays, baseRate } = req.body || {};
    const s = await db.setting.upsert({ where: { key: 'affiliates.settings' }, update: { value: { enabled: !!enabled, cookieDays: Number(cookieDays || 0), baseRate: Number(baseRate || 0) } }, create: { key: 'affiliates.settings', value: { enabled: !!enabled, cookieDays: Number(cookieDays || 0), baseRate: Number(baseRate || 0) } } });
    res.json({ settings: s.value });
  } catch { res.status(500).json({ error: 'Failed to save settings' }); }
});

// -------- Analytics KPIs --------
r.get('/analytics', async (_req, res) => {
  try {
    const users = await db.user.count();
    const orders = await db.order.count();
    const revenueAgg = await db.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } });
    res.json({ kpis: { users, orders, revenue: revenueAgg._sum.amount || 0 } });
  } catch { res.status(500).json({ error: 'Failed to compute analytics' }); }
});


// -------- SEO Page Management --------
r.get('/seo/pages', async (req, res) => {
  try {
    const pages = await db.seoPage.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json({ pages });
  } catch (e) { res.status(500).json({ error: 'Failed to list seo pages' }); }
});

r.get('/seo/pages/:id', async (req, res) => {
  try {
    const page = await db.seoPage.findUnique({ where: { id: req.params.id } });
    if (!page) return res.status(404).json({ error: 'not_found' });
    res.json(page);
  } catch (e) { res.status(500).json({ error: 'Failed to get seo page' }); }
});

r.post('/seo/pages', async (req, res) => {
  try {
    const { slug, titleSeo, metaDescription, focusKeyword, canonicalUrl, metaRobots, ogTags, twitterCard, schema, hiddenContent, breadcrumbs } = req.body || {};

    // Check duplication
    const existing = await db.seoPage.findUnique({ where: { slug: slug } });
    if (existing) return res.status(400).json({ error: 'slug_exists' });

    const page = await db.seoPage.create({
      data: {
        slug,
        titleSeo,
        metaDescription,
        focusKeyword,
        canonicalUrl,
        metaRobots,
        hiddenContent,
        ogTags: ogTags || undefined,
        twitterCard: twitterCard || undefined,
        schema: schema ? JSON.parse(typeof schema === 'string' ? schema : JSON.stringify(schema)) : undefined,
      }
    });
    res.json(page);
  } catch (e: any) { res.status(500).json({ error: e.message || 'Failed to create seo page' }); }
});

r.put('/seo/pages/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { slug, titleSeo, metaDescription, focusKeyword, canonicalUrl, metaRobots, ogTags, twitterCard, schema, hiddenContent } = req.body || {};

    const page = await db.seoPage.update({
      where: { id },
      data: {
        slug,
        titleSeo,
        metaDescription,
        focusKeyword,
        canonicalUrl,
        metaRobots,
        hiddenContent,
        ogTags: ogTags || undefined,
        twitterCard: twitterCard || undefined,
        schema: schema ? JSON.parse(typeof schema === 'string' ? schema : JSON.stringify(schema)) : undefined,
        updatedAt: new Date()
      }
    });
    res.json(page);
  } catch (e: any) { res.status(500).json({ error: e.message || 'Failed to update seo page' }); }
});

r.delete('/seo/pages/:id', async (req, res) => {
  try {
    await db.seoPage.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete seo page' }); }
});

// -------- SEO Analysis --------
r.post('/seo/analyze', async (req, res) => {
  try {
    const { titleSeo, metaDescription, focusKeyword, slug } = req.body || {};
    const issues: string[] = [];
    let score = 100;

    const title = String(titleSeo || '').trim();
    if (title.length < 30) { issues.push('العنوان قصير جداً (يفضل أكثر من 30 حرف)'); score -= 10; }
    if (title.length > 60) { issues.push('العنوان طويل جداً (يفضل أقل من 60 حرف)'); score -= 5; }

    const desc = String(metaDescription || '').trim();
    if (desc.length < 120) { issues.push('الوصف قصير جداً (يفضل أكثر من 120 حرف)'); score -= 10; }
    if (desc.length > 160) { issues.push('الوصف طويل جداً (يفضل أقل من 160 حرف)'); score -= 5; }

    const kw = String(focusKeyword || '').trim().split(',')[0];
    if (kw && !title.includes(kw)) { issues.push(`الكلمة المفتاحية "${kw}" غير موجودة في العنوان`); score -= 15; }
    if (kw && !desc.includes(kw)) { issues.push(`الكلمة المفتاحية "${kw}" غير موجودة في الوصف`); score -= 10; }
    if (kw && slug && !slug.includes(kw) && slug !== '/') { issues.push(`الكلمة المفتاحية "${kw}" غير موجودة في الرابط`); score -= 5; }

    if (!title) { issues.push('العنوان مفقود'); score -= 20; }
    if (!desc) { issues.push('الوصف مفقود'); score -= 20; }

    res.json({ ok: true, score: Math.max(0, score), issues });
  } catch (e) { res.status(500).json({ error: 'Analysis failed' }); }
});

export const adminExtra = r;

