import { Router } from 'express';
import { db } from '@repo/db';

const seoRouter = Router();

// Middleware to ensure admin access
seoRouter.use((req: any, res, next) => {
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
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
    const body = req.body;
    const { id, slug, ...data } = body; // Extract ID if present

    if (!slug) return res.status(400).json({ error: 'Slug is required' });

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
          // Check if redirect model exists (will be created after db push)
          if ((db as any).redirect) {
            await (db as any).redirect.create({
              data: {
                from: existingPage.slug,
                to: slug,
                code: 301
              }
            });
          } else {
            console.log('Redirect model not available yet (will be created after db push)');
          }
        } catch (err) {
          console.warn('Redirect creation failed (maybe already exists or model not ready):', err);
        }
      }

      // Update
      page = await db.seoPage.update({
        where: { id: existingPage.id },
        data: { slug, ...data }
      });
    } else {
      // Create new
      page = await db.seoPage.create({
        data: { slug, ...data }
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

// Analyze SEO
seoRouter.post('/analyze', async (req, res) => {
  const { titleSeo, metaDescription, focusKeyword, slug } = req.body;

  const issues: string[] = [];
  let score = 100;

  if (!titleSeo || titleSeo.length < 10) {
    issues.push('العنوان قصير جداً');
    score -= 10;
  } else if (titleSeo.length > 70) {
    issues.push('العنوان طويل جداً (أكثر من 70 حرف)');
    score -= 5;
  }

  if (!metaDescription || metaDescription.length < 50) {
    issues.push('الوصف قصير جداً');
    score -= 10;
  } else if (metaDescription.length > 160) {
    issues.push('الوصف طويل جداً (أكثر من 160 حرف)');
    score -= 5;
  }
  if (focusKeyword) {
    const keywords = focusKeyword.split(/[,،]/).map((k: string) => k.trim()).filter(Boolean);
    const primaryKeyword = keywords[0];

    if (primaryKeyword) {
      if (!titleSeo?.includes(primaryKeyword)) {
        issues.push(`الكلمة المفتاحية الرئيسية (${primaryKeyword}) غير موجودة في العنوان`);
        score -= 20;
      }
      if (!metaDescription?.includes(primaryKeyword)) {
        issues.push(`الكلمة المفتاحية الرئيسية (${primaryKeyword}) غير موجودة في الوصف`);
        score -= 20;
      }

      // Slug check with decoding and normalization
      const normalizedSlug = decodeURIComponent(slug || '').toLowerCase();
      const normalizedKeyword = primaryKeyword.toLowerCase();
      const keywordWithDashes = normalizedKeyword.replace(/\s+/g, '-');

      if (!normalizedSlug.includes(normalizedKeyword) && !normalizedSlug.includes(keywordWithDashes)) {
        issues.push(`الكلمة المفتاحية الرئيسية (${primaryKeyword}) غير موجودة في الرابط`);
        score -= 10;
      }
    }
  } else {
    issues.push('لم يتم تحديد كلمة مفتاحية');
    score -= 10;
  }

  res.json({ ok: true, score, issues });
});

export default seoRouter;
