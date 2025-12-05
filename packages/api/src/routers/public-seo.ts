import { Router } from 'express';
import { db } from '@repo/db';

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
    <loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/category/${escapeXml(slug)}</loc>
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
    <loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/products/${escapeXml(slug)}</loc>
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

        // Fetch base URL for canonicals
        const setting = await db.setting.findUnique({ where: { key: 'site_url' } });
        const baseUrl = (setting?.value as any)?.value || process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';

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
                        id: true,
                        name: true,
                        description: true,
                        images: true,
                        price: true,
                        sku: true,
                        brand: true,
                        isActive: true,
                        updatedAt: true,
                        variants: { select: { id: true, name: true, price: true, sku: true, stockQuantity: true } },
                        colors: { include: { images: true } },
                        seo: true
                    }
                });

                if (product) {
                    const productUrl = `${baseUrl}/p/${product.seo?.slug || product.id}`;
                    // Use first color image as primary if available, else product image
                    const primaryColor = product.colors.find(c => c.isPrimary) || product.colors[0];
                    const imageUrl = primaryColor?.primaryImageUrl || primaryColor?.images[0]?.url || product.images[0] || '';

                    // Generate Product Schema with Offers
                    const offers = product.variants.length > 0 ? product.variants.map(v => ({
                        "@type": "Offer",
                        "url": `${productUrl}?variant=${v.id}`,
                        "priceCurrency": "SAR",
                        "price": v.price || product.price,
                        "sku": v.sku || v.id,
                        "name": v.name,
                        "availability": v.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                        "itemCondition": "https://schema.org/NewCondition"
                    })) : [{
                        "@type": "Offer",
                        "url": productUrl,
                        "priceCurrency": "SAR",
                        "price": product.price,
                        "availability": product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                        "itemCondition": "https://schema.org/NewCondition"
                    }];

                    let schemaObj = {
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "name": product.seo?.seoTitle || product.name,
                        "image": [imageUrl, ...product.images].filter(Boolean),
                        "description": (product.seo?.seoDescription || product.description)?.substring(0, 160),
                        "sku": product.sku || product.id,
                        "brand": {
                            "@type": "Brand",
                            "name": product.brand || "JEEEY"
                        },
                        "offers": offers
                    };

                    if (product.seo?.schema && typeof product.seo.schema === 'object') {
                        schemaObj = { ...schemaObj, ...product.seo.schema };
                    }

                    seoData = {
                        titleSeo: product.seo?.seoTitle || product.name,
                        metaDescription: (product.seo?.seoDescription || product.description)?.substring(0, 160),
                        canonicalUrl: product.seo?.canonicalUrl || productUrl,
                        ogTags: product.seo?.ogTags || {
                            title: product.seo?.seoTitle || product.name,
                            description: (product.seo?.seoDescription || product.description)?.substring(0, 160),
                            image: imageUrl,
                            url: productUrl,
                            type: 'product'
                        },
                        twitterCard: {
                            title: product.seo?.seoTitle || product.name,
                            description: (product.seo?.seoDescription || product.description)?.substring(0, 160),
                            image: imageUrl,
                            card: 'summary_large_image'
                        },
                        schema: JSON.stringify(schemaObj),
                        hiddenContent: product.seo?.hiddenContent,
                        metaRobots: product.seo?.metaRobots || "index, follow"
                    };
                }
            }

            // 2. Check Category
            if (!seoData && (type === 'category' || slug)) {
                const category = await db.category.findUnique({
                    where: { slug: slug as string },
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        image: true,
                        description: true,
                        seoTitle: true,
                        seoDescription: true,
                        seoKeywords: true,
                        seo: true // CategorySeo relation
                    }
                });

                if (category) {
                    const categoryUrl = `${baseUrl}/c/${category.slug || category.id}`;

                    let schemaObj = {
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
