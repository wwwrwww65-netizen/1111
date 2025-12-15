import { Router } from 'express';
import { db } from '@repo/db';
import { readAdminTokenFromRequest } from '../utils/jwt';
import { verifyToken } from '../middleware/auth';

const seoRouter = Router();

// Middleware to ensure admin access (compatible with cookie-based auth from admin panel)
seoRouter.use((req: any, res, next) => {
  try {
    // Try to read token from Authorization header or cookie
    let token = readAdminTokenFromRequest(req);

    // If no token, check for auth_token cookie (same-site admin panel)
    if (!token) {
      const raw = (req.headers['cookie'] as string | undefined) || '';
      const m = /(?:^|; )auth_token=([^;]+)/.exec(raw);
      if (m) {
        token = m[1];
      }
    }

    if (!token) {
      return res.status(403).json({ error: 'Forbidden: No token provided' });
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user = payload;
    next();
  } catch (e: any) {
    return res.status(403).json({ error: 'Forbidden: ' + (e.message || 'Invalid token') });
  }
});

// List SEO Pages
seoRouter.get('/pages', async (req, res) => {
  try {
    // Ensure system pages exist
    const systemPages = [
      { slug: '/', titleSeo: 'الرئيسية', metaDescription: 'الصفحة الرئيسية للمتجر' },
      { slug: '/cart', titleSeo: 'سلة التسوق', metaDescription: 'سلة المشتريات' },
      { slug: '/categories', titleSeo: 'التصنيفات', metaDescription: 'جميع تصنيفات المتجر' },
      { slug: '/products', titleSeo: 'المنتجات', metaDescription: 'تصفح جميع المنتجات' },
      { slug: '/account', titleSeo: 'حسابي', metaDescription: 'إدارة حسابك الشخصي' },
    ];

    for (const p of systemPages) {
      const exists = await db.seoPage.findUnique({ where: { slug: p.slug } });
      if (!exists) {
        await db.seoPage.create({
          data: {
            slug: p.slug,
            titleSeo: p.titleSeo,
            metaDescription: p.metaDescription,
            focusKeyword: ''
          }
        });
      }
    }

    const pages = await db.seoPage.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json({ ok: true, pages });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get SEO Page by Slug (encoded)
seoRouter.get('/pages/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const decodedSlug = decodeURIComponent(slug);
    const page = await db.seoPage.findUnique({ where: { slug: decodedSlug } });
    res.json({ ok: true, page });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Upsert SEO Page with Auto-Redirect
seoRouter.post('/pages', async (req, res) => {
  try {
    const body = req.body || {};
    // Explicitly destructure only allowed fields to prevent Prisma "Unknown arg" errors
    const {
      id,
      slug,
      titleSeo,
      metaDescription,
      focusKeyword,
      canonicalUrl,
      metaRobots,
      hiddenContent,
      ogTags,
      twitterCard,
      schema,
      // New fields
      sitemapPriority,
      sitemapFrequency,
      author,
      alternateLinks
    } = body;

    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    // Validate/Format JSON fields
    const safeSchema = schema ? (typeof schema === 'string' ? JSON.parse(schema) : schema) : undefined;
    const safeOg = ogTags ? (typeof ogTags === 'string' ? JSON.parse(ogTags) : ogTags) : undefined;
    const safeTw = twitterCard ? (typeof twitterCard === 'string' ? JSON.parse(twitterCard) : twitterCard) : undefined;
    const safeAlt = alternateLinks ? (typeof alternateLinks === 'string' ? JSON.parse(alternateLinks) : alternateLinks) : undefined;

    const dataPayload = {
      titleSeo,
      metaDescription,
      focusKeyword,
      canonicalUrl,
      metaRobots,
      hiddenContent,
      ogTags: safeOg,
      twitterCard: safeTw,
      schema: safeSchema,
      // New fields casting
      sitemapPriority: typeof sitemapPriority === 'number' ? sitemapPriority : (sitemapPriority ? parseFloat(sitemapPriority) : undefined),
      sitemapFrequency: sitemapFrequency || undefined,
      author: author || undefined,
      alternateLinks: safeAlt,
      updatedAt: new Date()
    };

    let page;

    // Check if we are updating an existing page (by ID or Slug)
    const existingPage = id
      ? await db.seoPage.findUnique({ where: { id } })
      : await db.seoPage.findUnique({ where: { slug } });

    if (existingPage) {
      // If slug has changed, create a redirect
      if (existingPage.slug !== slug) {
        console.log(`Creating redirect from ${existingPage.slug} to ${slug}`);
        try {
          if ((db as any).redirect) {
            await (db as any).redirect.create({
              data: {
                from: existingPage.slug,
                to: slug,
                code: 301
              }
            });
          }
        } catch (err) { }
      }

      // Update
      page = await db.seoPage.update({
        where: { id: existingPage.id },
        data: { slug, ...dataPayload }
      });
    } else {
      // Create new
      page = await db.seoPage.create({
        data: { slug, ...dataPayload }
      });
    }

    res.json({ ok: true, page });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Delete SEO Page
seoRouter.delete('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.seoPage.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Analyze SEO (Advanced)
seoRouter.post('/analyze', async (req, res) => {
  const { titleSeo, metaDescription, focusKeyword, slug } = req.body;

  const issues: string[] = [];
  let score = 100;

  const title = String(titleSeo || '').trim();
  if (title.length < 30) { issues.push('العنوان قصير جداً (يفضل أكثر من 30 حرف)'); score -= 10; }
  if (title.length > 60) { issues.push('العنوان طويل جداً (يفضل أقل من 60 حرف)'); score -= 5; }

  const desc = String(metaDescription || '').trim();
  if (desc.length < 120) { issues.push('الوصف قصير جداً (يفضل أكثر من 120 حرف)'); score -= 10; }
  if (desc.length > 160) { issues.push('الوصف طويل جداً (يفضل أقل من 160 حرف)'); score -= 5; }

  if (!title) { issues.push('العنوان مفقود'); score -= 20; }
  if (!desc) { issues.push('الوصف مفقود'); score -= 20; }

  if (focusKeyword) {
    const keywords = focusKeyword.split(/[,،]/).map((k: string) => k.trim()).filter(Boolean);
    const primaryKeyword = keywords[0];

    if (primaryKeyword) {
      if (!title.includes(primaryKeyword)) {
        issues.push(`الكلمة المفتاحية الرئيسية (${primaryKeyword}) غير موجودة في العنوان`);
        score -= 20;
      }
      if (!desc.includes(primaryKeyword)) {
        issues.push(`الكلمة المفتاحية الرئيسية (${primaryKeyword}) غير موجودة في الوصف`);
        score -= 20;
      }

      // Slug check with decoding and normalization
      const normalizedSlug = decodeURIComponent(slug || '').toLowerCase();
      const normalizedKeyword = primaryKeyword.toLowerCase();
      const keywordWithDashes = normalizedKeyword.replace(/\s+/g, '-');

      if (normalizedSlug !== '/' && !normalizedSlug.includes(normalizedKeyword) && !normalizedSlug.includes(keywordWithDashes)) {
        issues.push(`الكلمة المفتاحية الرئيسية (${primaryKeyword}) غير موجودة في الرابط`);
        score -= 10;
      }
    }
  } else {
    issues.push('لم يتم تحديد كلمة مفتاحية');
    score -= 10;
  }

  res.json({ ok: true, score: Math.max(0, score), issues });
});

export default seoRouter;
