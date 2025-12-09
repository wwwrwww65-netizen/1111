import { Router } from 'express';
import { db } from '@repo/db';
import path from 'path';
import fs from 'fs';

export const publicSeoRouter = Router();

// Middleware to ensure admin access
// (Skip for public routes)

// Google Verification File
publicSeoRouter.get('/:filename', async (req, res, next) => {
    const { filename } = req.params;
    if (filename.startsWith('google') && filename.endsWith('.html')) {
        try {
            const setting = await db.setting.findUnique({ where: { key: 'google_html_file' } });
            if (setting && (setting.value as any).name === filename) {
                res.header('Content-Type', 'text/html');
                return res.send((setting.value as any).content);
            }
        } catch { }
    }
    next();
});

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

// Helper to escape XML special chars
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}

// 2. Sitemap.xml
publicSeoRouter.get('/sitemap.xml', async (req, res) => {
    try {
        const setting = await db.setting.findUnique({ where: { key: 'site_url' } });
        const baseUrl = (setting?.value as any)?.value || process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';

        // Fetch pages and products
        const [pages, products, categories] = await Promise.all([
            db.seoPage.findMany({ select: { slug: true, updatedAt: true } }),
            db.product.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true, seo: { select: { slug: true } } } }),
            db.category.findMany({ select: { id: true, slug: true, updatedAt: true } })
        ]);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Static Home
        xml += `
  <url>
    <loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

        // SEO Pages
        for (const page of pages) {
            const cleanSlug = page.slug.startsWith('/') ? page.slug.slice(1) : page.slug;
            xml += `
  <url>
    <loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/${escapeXml(cleanSlug)}</loc>
    <lastmod>${(page.updatedAt || new Date()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }

        // Categories
        for (const cat of categories) {
            const slug = cat.slug || cat.id;
            xml += `
  <url>
    <loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/c/${escapeXml(slug)}</loc>
    <lastmod>${cat.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }

        // Product Pages
        for (const product of products) {
            const slug = product.seo?.slug || product.id;
            xml += `
  <url>
    <loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/p/${escapeXml(slug)}</loc>
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

// Helper: Resolve SEO Data (Refactored for reuse in SSR)
async function resolveSeoData(params: { slug?: string, type?: string, id?: string, url?: string }) {
    const { slug, type, id, url } = params;
    let seoData: any = null;

    // Fetch base URL for canonicals
    const setting = await db.setting.findUnique({ where: { key: 'site_url' } });
    const baseUrl = (setting?.value as any)?.value || process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';

    // Helper: Clean slug from possible URL parts (if passed via url param)
    let exactSlug = slug;
    let exactId = id;

    if (url && typeof url === 'string') {
        // Try to extract slug from /p/slug or /products/slug
        const pMatch = url.match(/\/p\/([^\/\?]+)/) || url.match(/\/products\/([^\/\?]+)/);
        if (pMatch) exactSlug = pMatch[1];

        const cMatch = url.match(/\/c\/([^\/\?]+)/) || url.match(/\/category\/([^\/\?]+)/);
        if (cMatch) exactSlug = cMatch[1];
    }

    const lookupId = exactId || exactSlug || (slug as string);

    // A. Try fetching from SEO Pages first
    if (!type || type === 'page') {
        if (lookupId) {
            const page = await db.seoPage.findUnique({
                where: { slug: lookupId },
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
    }

    // B. If not found, check based on type
    if (!seoData) {
        // 1. Check Product
        if (type === 'product' || id || (url && (url as string).includes('/p/'))) {
            let product = await db.product.findUnique({
                where: { id: lookupId },
                select: {
                    id: true, name: true, description: true, images: true, price: true, sku: true, brand: true, isActive: true, updatedAt: true,
                    variants: { select: { id: true, name: true, price: true, sku: true, stockQuantity: true } },
                    colors: { include: { images: true } },
                    seo: true
                }
            });

            if (!product && lookupId) {
                product = await db.product.findFirst({
                    where: { OR: [{ seo: { slug: lookupId } }, { sku: lookupId }] },
                    select: {
                        id: true, name: true, description: true, images: true, price: true, sku: true, brand: true, isActive: true, updatedAt: true,
                        variants: { select: { id: true, name: true, price: true, sku: true, stockQuantity: true } },
                        colors: { include: { images: true } },
                        seo: true
                    }
                });
            }

            if (product) {
                const p = product;
                const productUrl = `${baseUrl}/p/${p.seo?.slug || p.id}`;
                const primaryColor = p.colors.find(c => c.isPrimary) || p.colors[0];
                const imageUrl = primaryColor?.primaryImageUrl || primaryColor?.images[0]?.url || p.images[0] || '';

                const offers = p.variants.length > 0 ? p.variants.map(v => ({
                    "@type": "Offer",
                    "url": `${productUrl}?variant=${v.id}`,
                    "priceCurrency": "SAR",
                    "price": v.price || p.price,
                    "sku": v.sku || v.id,
                    "name": v.name,
                    "availability": v.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "itemCondition": "https://schema.org/NewCondition"
                })) : [{
                    "@type": "Offer",
                    "url": productUrl,
                    "priceCurrency": "SAR",
                    "price": p.price,
                    "availability": p.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "itemCondition": "https://schema.org/NewCondition"
                }];

                let schemaObj: any = {
                    "@context": "https://schema.org/",
                    "@type": "Product",
                    "name": p.seo?.seoTitle || p.name,
                    "image": [imageUrl, ...p.images].filter(Boolean),
                    "description": (p.seo?.seoDescription || p.description)?.substring(0, 160),
                    "sku": p.sku || p.id,
                    "brand": { "@type": "Brand", "name": p.brand || "JEEEY" },
                    "offers": offers
                };

                if (p.seo?.schema && typeof p.seo.schema === 'object') {
                    schemaObj = { ...schemaObj, ...p.seo.schema };
                }

                seoData = {
                    titleSeo: p.seo?.seoTitle || p.name,
                    metaDescription: (p.seo?.seoDescription || p.description)?.substring(0, 160),
                    canonicalUrl: p.seo?.canonicalUrl || productUrl,
                    ogTags: p.seo?.ogTags || {
                        title: p.seo?.seoTitle || p.name,
                        description: (p.seo?.seoDescription || p.description)?.substring(0, 160),
                        image: imageUrl,
                        url: productUrl,
                        type: 'product'
                    },
                    twitterCard: {
                        title: p.seo?.seoTitle || p.name,
                        description: (p.seo?.seoDescription || p.description)?.substring(0, 160),
                        image: imageUrl,
                        card: 'summary_large_image'
                    },
                    schema: JSON.stringify(schemaObj),
                    hiddenContent: p.seo?.hiddenContent,
                    metaRobots: p.seo?.metaRobots || "index, follow"
                };
            }
        }

        // 2. Check Category
        if (!seoData && (type === 'category' || slug || (url && (url as string).includes('/c/')))) {
            let category = await db.category.findUnique({
                where: { id: lookupId },
                select: { id: true, slug: true, name: true, image: true, description: true, seoTitle: true, seoDescription: true, seoKeywords: true, seo: true }
            });

            if (!category && lookupId) {
                category = await db.category.findUnique({
                    where: { slug: lookupId },
                    select: { id: true, slug: true, name: true, image: true, description: true, seoTitle: true, seoDescription: true, seoKeywords: true, seo: true }
                });
            }

            if (category) {
                const categoryUrl = `${baseUrl}/c/${category.slug || category.id}`;
                let schemaObj: any = {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": category.seoTitle || category.name,
                    "description": category.seoDescription || category.description || `تسوق من قسم ${category.name}`,
                    "url": categoryUrl,
                    "image": category.image
                };
                if (category.seo?.schema && typeof category.seo.schema === 'object') {
                    schemaObj = { ...schemaObj, ...category.seo.schema };
                }

                seoData = {
                    titleSeo: category.seoTitle || category.name,
                    metaDescription: category.seoDescription || category.description || `تصفح أفضل منتجات ${category.name} لدينا`,
                    canonicalUrl: category.seo?.canonicalUrl || categoryUrl,
                    ogTags: category.seo?.ogTags || {
                        title: category.seoTitle || category.name,
                        description: category.seoDescription || category.description || `تسوق من قسم ${category.name}`,
                        image: category.image || '',
                        url: categoryUrl,
                        type: 'website'
                    },
                    twitterCard: {
                        title: category.seoTitle || category.name,
                        description: category.seoDescription || category.description || `تسوق من قسم ${category.name}`,
                        image: category.image || '',
                        card: 'summary_large_image'
                    },
                    schema: JSON.stringify(schemaObj),
                    hiddenContent: category.seo?.hiddenContent,
                    metaRobots: category.seo?.metaRobots || "index, follow"
                };
            }
        }
    }

    if (!seoData) return null;

    // C. Inject Site Name/Logo
    const settings = await db.setting.findMany({ where: { key: { in: ['site_name', 'site_logo'] } } });
    const siteName = (settings.find(s => s.key === 'site_name')?.value as any)?.value || '';
    const siteLogo = (settings.find(s => s.key === 'site_logo')?.value as any)?.value;

    // D. Apply Title Separator
    let finalTitle = seoData.titleSeo || '';
    if (siteName && !finalTitle.includes(siteName)) {
        finalTitle = `${finalTitle} | ${siteName}`;
    }

    return { ...seoData, titleSeo: finalTitle, siteName, siteLogo };
}

// 3. Public SEO Data (JSON)
publicSeoRouter.get('/seo/meta', async (req, res) => {
    try {
        const { slug, type, id, url } = req.query;
        const data = await resolveSeoData({ slug: slug as string, type: type as string, id: id as string, url: url as string });
        if (!data) return res.status(404).json({ error: 'Not found' });
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 4. SSR Handlers for Shared Links
async function handleSsr(req: any, res: any, forcedType?: string) {
    try {
        const slug = req.params.slug;
        const meta = await resolveSeoData({ slug, type: forcedType, url: req.originalUrl || req.url });

        // Read HTML - Robust Path Resolution
        const candidates = [
            path.resolve(process.cwd(), '../../apps/mweb/dist/index.html'), // Local / Monorepo
            path.resolve(process.cwd(), '../mweb/dist/index.html'),
            path.resolve(process.cwd(), 'public/index.html'),
            '/var/www/mweb/dist/index.html', // Common Prod
            '/var/www/html/dist/index.html',
            '/app/apps/mweb/dist/index.html' // Docker
        ];

        let htmlPath = '';
        for (const c of candidates) {
            if (fs.existsSync(c)) {
                htmlPath = c;
                break;
            }
        }

        if (!htmlPath) {
            console.error('SSR Error: index.html not found in candidates:', candidates);
            // Fallback: Generate valid minimal HTML with SEO tags so sharing works even if app shell is missing
            if (meta) {
                const { titleSeo, metaDescription, ogTags, twitterCard } = meta;
                const img = ogTags?.image || twitterCard?.image || '';
                const desc = ogTags?.description || metaDescription || '';
                const title = ogTags?.title || titleSeo || 'Jeeey';

                const fallbackHtml = `<!doctype html>
<html><head>
<meta charset="utf-8"><title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="twitter:card" content="summary_large_image">
</head><body>
<script>window.location.href = '/'; // Client redirect to home if shell missing
</script></body></html>`;
                res.setHeader('Content-Type', 'text/html');
                return res.send(fallbackHtml);
            }
            return res.status(404).send('Not found');
        }

        let html = fs.readFileSync(htmlPath, 'utf-8');

        if (meta) {
            // Inject SEO Meta
            const { titleSeo, metaDescription, ogTags, twitterCard } = meta;
            // Replacements
            html = html.replace(/<title>.*?<\/title>/, `<title>${titleSeo || 'Jeeey'}</title>`);
            if (metaDescription) html = html.replace(/<meta name="description" content=".*?"/i, `<meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}"`);

            // OG Tags
            if (ogTags) {
                if (ogTags.title) html = html.replace(/<meta property="og:title" content=".*?"/i, `<meta property="og:title" content="${ogTags.title.replace(/"/g, '&quot;')}"`);
                if (ogTags.description) html = html.replace(/<meta property="og:description" content=".*?"/i, `<meta property="og:description" content="${ogTags.description.replace(/"/g, '&quot;')}"`);
                if (ogTags.image) html = html.replace(/<meta property="og:image" content=".*?"/i, `<meta property="og:image" content="${ogTags.image.replace(/"/g, '&quot;')}"`);
                if (ogTags.url) html = html.replace(/<meta property="og:url" content=".*?"/i, `<meta property="og:url" content="${ogTags.url.replace(/"/g, '&quot;')}"`);
            } else {
                // Fallback if no ogTags object but we have top level fields
                html = html.replace(/<meta property="og:title" content=".*?"/i, `<meta property="og:title" content="${(titleSeo || '').replace(/"/g, '&quot;')}"`);
                html = html.replace(/<meta property="og:image" content=".*?"/i, `<meta property="og:image" content="${(twitterCard?.image || '').replace(/"/g, '&quot;')}"`);
            }
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (e) {
        console.error(e);
        res.status(500).send('SSR Error');
    }
}

publicSeoRouter.get('/p/:slug', (req, res) => handleSsr(req, res, 'product'));
publicSeoRouter.get('/product/:slug', (req, res) => handleSsr(req, res, 'product'));
publicSeoRouter.get('/c/:slug', (req, res) => handleSsr(req, res, 'category'));
publicSeoRouter.get('/category/:slug', (req, res) => handleSsr(req, res, 'category'));

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
            select: { id: true, name: true, description: true, price: true, images: true, updatedAt: true, sku: true, seo: { select: { slug: true } } }
        });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Product Feed</title>
<link>${baseUrl}</link>
<description>Product Feed</description>`;

        for (const p of products) {
            const slug = p.seo?.slug || p.id;
            xml += `
<item>
<g:id>${p.id}</g:id>
<g:title>${p.name.replace(/&/g, '&amp;')}</g:title>
<g:description>${(p.description || '').replace(/&/g, '&amp;')}</g:description>
<g:link>${baseUrl}/p/${slug}</g:link>
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
