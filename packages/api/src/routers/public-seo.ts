import { Router } from 'express';
import { db } from '@repo/db';

export const publicSeoRouter = Router();

// 1. Robots.txt
publicSeoRouter.get('/robots.txt', async (req, res) => {
    try {
        const setting = await db.setting.findUnique({ where: { key: 'robots_txt' } });
        const content = (setting?.value as any)?.value || 'User-agent: *\nAllow: /';
        res.header('Content-Type', 'text/plain');
        res.send(content);
    } catch (e) {
        res.status(500).send('User-agent: *\nDisallow: /');
    }
});

// 2. Sitemap.xml
publicSeoRouter.get('/sitemap.xml', async (req, res) => {
    try {
        const setting = await db.setting.findUnique({ where: { key: 'site_url' } });
        const baseUrl = (setting?.value as any)?.value || process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';

        // Fetch pages and products
        const [pages, products] = await Promise.all([
            db.seoPage.findMany({ select: { slug: true, updatedAt: true } }),
            db.product.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } })
        ]);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Static Home
        xml += `
  <url>
    <loc>${baseUrl.replace(/\/$/, '')}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

        // SEO Pages
        for (const page of pages) {
            const cleanSlug = page.slug.startsWith('/') ? page.slug.slice(1) : page.slug;
            xml += `
  <url>
    <loc>${baseUrl.replace(/\/$/, '')}/${cleanSlug}</loc>
    <lastmod>${page.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }

        // Product Pages
        for (const product of products) {
            xml += `
  <url>
    <loc>${baseUrl.replace(/\/$/, '')}/p/${product.id}</loc>
    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
        }

        xml += `
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error generating sitemap');
    }
});

// 3. Public SEO Data (For Storefront Head)
publicSeoRouter.get('/seo/meta', async (req, res) => {
    try {
        const { slug, type, id } = req.query;

        let seoData: any = null;

        // A. Try fetching from SEO Pages first (Custom Overrides)
        if (slug && typeof slug === 'string') {
            const page = await db.seoPage.findUnique({
                where: { slug },
                select: {
                    titleSeo: true,
                    metaDescription: true,
                    canonicalUrl: true,
                    metaRobots: true,
                    ogTags: true,
                    twitterCard: true,
                    schema: true,
                    hiddenContent: true
                }
            });
            if (page) seoData = page;
        }

        // B. If not found, check based on type
        if (!seoData) {
            // 1. Check Product
            if (type === 'product' || id) {
                const productId = (id as string) || (slug as string);
                const product = await db.product.findFirst({
                    where: { OR: [{ id: productId }, { sku: productId }] },
                    select: {
                        name: true,
                        description: true,
                        images: true
                    }
                });

                if (product) {
                    // Use name and description directly (seoTitle/seoDescription will be added after db push)
                    seoData = {
                        titleSeo: product.name,
                        metaDescription: product.description?.substring(0, 160),
                        ogTags: {
                            title: product.name,
                            description: product.description?.substring(0, 160),
                            image: product.images[0] || ''
                        },
                        twitterCard: {
                            title: product.name,
                            description: product.description?.substring(0, 160),
                            image: product.images[0] || ''
                        }
                    };
                }
            }

            // 2. Check Category
            if (!seoData && (type === 'category' || slug)) {
                const category = await db.category.findUnique({
                    where: { slug: slug as string },
                    select: { name: true, image: true }
                });

                if (category) {
                    seoData = {
                        titleSeo: category.name,
                        metaDescription: `تصفح أفضل منتجات ${category.name} لدينا`,
                        ogTags: {
                            title: category.name,
                            description: `تسوق من قسم ${category.name}`,
                            image: category.image || ''
                        },
                        twitterCard: {
                            title: category.name,
                            description: `تسوق من قسم ${category.name}`,
                            image: category.image || ''
                        }
                    };
                }
            }
        }

        if (!seoData) return res.status(404).json({ error: 'Not found' });

        // C. Inject Site Name/Logo
        const settings = await db.setting.findMany({
            where: { key: { in: ['site_name', 'site_logo'] } }
        });
        const siteName = (settings.find(s => s.key === 'site_name')?.value as any)?.value || '';
        const siteLogo = (settings.find(s => s.key === 'site_logo')?.value as any)?.value;

        // D. Apply Title Separator Logic: "Page Title | Site Name"
        let finalTitle = seoData.titleSeo || '';
        if (siteName && !finalTitle.includes(siteName)) {
            finalTitle = `${finalTitle} | ${siteName}`;
        }

        res.json({
            ...seoData,
            titleSeo: finalTitle,
            siteName,
            siteLogo
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Check Redirects (For Storefront Middleware)
publicSeoRouter.get('/seo/redirect', async (req, res) => {
    try {
        const { slug } = req.query;
        if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Slug required' });

        // Check if redirect model exists, otherwise skip
        try {
            const redirect = await (db as any).redirect?.findUnique({
                where: { from: slug }
            });

            if (redirect && redirect.isActive) {
                return res.json({
                    found: true,
                    to: redirect.to,
                    code: redirect.code
                });
            }
        } catch (e) {
            // Redirect model doesn't exist yet, will be created after db push
            console.log('Redirect model not available yet');
        }

        res.json({ found: false });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Product XML Feed (Merchant Center / SEO)
publicSeoRouter.get('/feed/products.xml', async (req, res) => {
    try {
        const setting = await db.setting.findUnique({ where: { key: 'site_url' } });
        const baseUrl = (setting?.value as any)?.value || process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';

        const products = await db.product.findMany({
            where: { isActive: true },
            select: { id: true, name: true, description: true, price: true, images: true, updatedAt: true, sku: true }
        });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Product Feed</title>
<link>${baseUrl}</link>
<description>Product Feed</description>`;

        for (const p of products) {
            xml += `
<item>
<g:id>${p.id}</g:id>
<g:title>${p.name.replace(/&/g, '&amp;')}</g:title>
<g:description>${(p.description || '').replace(/&/g, '&amp;')}</g:description>
<g:link>${baseUrl}/p/${p.id}</g:link>
<g:image_link>${p.images[0] || ''}</g:image_link>
<g:price>${p.price} SAR</g:price>
<g:availability>in stock</g:availability>
</item>`;
        }

        xml += `
</channel>
</rss>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (e) {
        res.status(500).send('Error generating feed');
    }
});
