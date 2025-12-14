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
    if (filename && filename.startsWith('google') && filename.endsWith('.html')) {
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

// Proxy route for images (CORS bypass for canvas)
publicSeoRouter.get('/media/proxy', async (req, res) => {
    try {
        const targetUrl = String(req.query.url);
        if (!targetUrl || !targetUrl.startsWith('http')) {
            return res.status(400).send('Invalid URL');
        }

        const response = await fetch(targetUrl);
        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image');
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (e) {
        console.error('Proxy Error:', e);
        res.status(500).send('Proxy Error');
    }
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
            db.seoPage.findMany({ select: { slug: true, updatedAt: true, sitemapPriority: true, sitemapFrequency: true } as any }),
            db.product.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true, seo: { select: { slug: true, sitemapPriority: true, sitemapFrequency: true } } } as any }),
            db.category.findMany({ select: { id: true, slug: true, updatedAt: true, seo: { select: { sitemapPriority: true, sitemapFrequency: true } } } as any })
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
        for (const page of (pages as any[])) {
            const slug = String(page.slug || '');
            const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;
            const updatedAt = page.updatedAt ? new Date(page.updatedAt) : new Date();
            xml += `
<url>
<loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/${escapeXml(cleanSlug)}</loc>
<lastmod>${updatedAt.toISOString().split('T')[0]}</lastmod>
<changefreq>${(page as any).sitemapFrequency || 'weekly'}</changefreq>
<priority>${(page as any).sitemapPriority || 0.8}</priority>
</url>`;
        }

        // Categories
        for (const cat of (categories as any[])) {
            const slug = cat.slug || cat.id;
            const updatedAt = cat.updatedAt ? new Date(cat.updatedAt) : new Date();
            xml += `
<url>
<loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/c/${escapeXml(slug)}</loc>
<lastmod>${updatedAt.toISOString().split('T')[0]}</lastmod>
<changefreq>${(cat.seo as any)?.sitemapFrequency || 'weekly'}</changefreq>
<priority>${(cat.seo as any)?.sitemapPriority || 0.8}</priority>
</url>`;
        }

        // Product Pages
        for (const product of (products as any[])) {
            const slug = product.seo?.slug || product.id;
            const updatedAt = product.updatedAt ? new Date(product.updatedAt) : new Date();
            xml += `
<url>
<loc>${escapeXml(baseUrl.replace(/\/$/, ''))}/p/${escapeXml(slug)}</loc>
<lastmod>${updatedAt.toISOString().split('T')[0]}</lastmod>
<changefreq>${(product.seo as any)?.sitemapFrequency || 'daily'}</changefreq>
<priority>${(product.seo as any)?.sitemapPriority || 0.9}</priority>
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

    // Fetch Global Settings
    const settings = await db.setting.findMany({ where: { key: { in: ['site_url', 'site_name', 'site_logo', 'twitter_site', 'google_verification', 'bing_verification'] } } });
    const getSetting = (key: string) => (settings.find(s => s.key === key)?.value as any)?.value;

    const baseUrl = getSetting('site_url') || process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';
    const siteName = getSetting('site_name') || 'جي jeeey'; // Default per user request
    const siteLogo = getSetting('site_logo') || '';
    const twitterSite = getSetting('twitter_site') || '@jeeey_com';
    let googleVerification = getSetting('google_verification') || '';
    let bingVerification = getSetting('bing_verification') || '';

    // Sanitize: If user pasted full <meta ... content="..."> tag, extract content
    if (googleVerification.includes('<meta')) {
        const match = googleVerification.match(/content=["']([^"']+)["']/);
        if (match) googleVerification = match[1];
    }
    // Bing often uses full tag in Next.js 'verification.other' but let's be consistent. 
    // Actually Next.js layout.tsx logic handles bing separation manually in my previous code,
    // but cleaning it here standardizes the API response.
    // However, if I clean it here, the public-seo.ts SSR injector (which expects full tag for Bing?) might break?
    // In public-seo.ts: `bingVerification ? bingVerification : ''`. It treats bing as full tag.
    // In layout.tsx: `other: bingVerification ? { 'msvalidate.01': bingVerification } : undefined`. It treats as CODE.
    // I should generate the CODE here. And invoke correct tag in SSR.

    // Let's resolve to CODE (hash) here.
    if (bingVerification.includes('<meta')) {
        const match = bingVerification.match(/content=["']([^"']+)["']/);
        if (match) bingVerification = match[1];
    }

    // Helper: Clean slug from possible URL parts (if passed via url param)
    let exactSlug = slug;
    let exactId = id;

    if (url && typeof url === 'string') {
        const pMatch = url.match(/\/p\/([^\/\?]+)/) || url.match(/\/products\/([^\/\?]+)/);
        if (pMatch) exactSlug = pMatch[1];
        const cMatch = url.match(/\/c\/([^\/\?]+)/) || url.match(/\/category\/([^\/\?]+)/);
        if (cMatch) exactSlug = cMatch[1];
        // Handle Root
        if (url === '/' || url === '') exactSlug = '/';
    }

    const lookupId = exactId || exactSlug || (slug as string);

    // A. Try fetching from SEO Pages first (covers Root '/' and system pages)
    if (!type || type === 'page' || lookupId === '/') {
        if (lookupId) {
            const page = await db.seoPage.findUnique({
                where: { slug: lookupId },
                select: {
                    titleSeo: true,
                    metaDescription: true,
                    focusKeyword: true,  // Added - was missing
                    canonicalUrl: true,
                    metaRobots: true,
                    ogTags: true,        // Added - was missing!
                    twitterCard: true,
                    schema: true,
                    hiddenContent: true,
                    author: true,
                    sitemapPriority: true,
                    sitemapFrequency: true,
                    alternateLinks: true
                } as any
            });
            if (page) {
                // Format response consistently
                const pageUrl = lookupId === '/' ? baseUrl : `${baseUrl}${lookupId.startsWith('/') ? '' : '/'}${lookupId}`;

                // Build OG tags from stored data or defaults
                const ogFromDb = page.ogTags && typeof page.ogTags === 'object' && Object.keys(page.ogTags).length > 0
                    ? page.ogTags
                    : null;

                // Build Twitter card from stored data or defaults
                const twFromDb = page.twitterCard && typeof page.twitterCard === 'object' && Object.keys(page.twitterCard).length > 0
                    ? page.twitterCard
                    : null;

                seoData = {
                    ...page,
                    // Include keywords from focusKeyword
                    keywords: page.focusKeyword || '',
                    // OG Tags: use stored or build defaults
                    ogTags: ogFromDb || {
                        title: page.titleSeo || siteName,
                        description: page.metaDescription || '',
                        url: page.canonicalUrl || pageUrl,
                        type: 'website'
                    },
                    // Twitter Card: use stored or build defaults
                    twitterCard: twFromDb || {
                        title: page.titleSeo || siteName,
                        description: page.metaDescription || '',
                        card: 'summary_large_image'
                    },
                    // Schema: use stored or generate default for homepage
                    schema: page.schema && Object.keys(page.schema).length > 0
                        ? JSON.stringify(page.schema)
                        : (lookupId === '/' ? JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": siteName,
                            "url": baseUrl,
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": `${baseUrl}/search?q={search_term_string}`,
                                "query-input": "required name=search_term_string"
                            }
                        }) : '')
                };
            }
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

                const defaultOg = {
                    title: p.seo?.seoTitle || p.name,
                    description: (p.seo?.seoDescription || p.description)?.substring(0, 160),
                    image: imageUrl,
                    url: productUrl,
                    type: 'product'
                };
                const finalOg = p.seo?.ogTags && typeof p.seo.ogTags === 'object'
                    ? { ...defaultOg, ...p.seo.ogTags }
                    : defaultOg;

                const defaultTw = {
                    title: p.seo?.seoTitle || p.name,
                    description: (p.seo?.seoDescription || p.description)?.substring(0, 160),
                    image: imageUrl,
                    card: 'summary_large_image'
                };
                const finalTw = p.seo && (p.seo as any).twitterCard && typeof (p.seo as any).twitterCard === 'object'
                    ? { ...defaultTw, ...(p.seo as any).twitterCard }
                    : defaultTw;

                seoData = {
                    titleSeo: p.seo?.seoTitle || p.name,
                    metaDescription: (p.seo?.seoDescription || p.description)?.substring(0, 160),
                    // Include keywords from ProductSeo
                    keywords: Array.isArray((p.seo as any)?.seoKeywords)
                        ? (p.seo as any).seoKeywords.join(', ')
                        : '',
                    canonicalUrl: p.seo?.canonicalUrl || productUrl,
                    ogTags: finalOg,
                    twitterCard: finalTw,
                    schema: JSON.stringify(schemaObj),
                    hiddenContent: p.seo?.hiddenContent,
                    metaRobots: p.seo?.metaRobots || "index, follow",
                    // Advanced SEO 
                    author: (p.seo as any)?.author,
                    alternateLinks: (p.seo as any)?.alternateLinks,
                    sitemapPriority: (p.seo as any)?.sitemapPriority,
                    sitemapFrequency: (p.seo as any)?.sitemapFrequency,

                    // Extended data for SSR
                    productData: {
                        price: p.variants?.[0]?.price || p.price,
                        currency: 'SAR',
                        availability: p.isActive && (p.variants.every(v => v.stockQuantity > 0) || !p.variants.length) ? 'instock' : 'oos',
                        brand: p.brand || "Jeeey",
                        sku: p.sku || p.id
                    }
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
                    // Include keywords from Category table
                    keywords: Array.isArray(category.seoKeywords) ? category.seoKeywords.join(', ') : '',
                    canonicalUrl: category.seo?.canonicalUrl || categoryUrl,
                    // Use ogTags from DB if available, else build defaults
                    ogTags: category.seo?.ogTags && Object.keys(category.seo.ogTags).length > 0
                        ? category.seo.ogTags
                        : {
                            title: category.seoTitle || category.name,
                            description: category.seoDescription || category.description || `تسوق من قسم ${category.name}`,
                            image: category.image || '',
                            url: categoryUrl,
                            type: 'website'
                        },
                    // Use twitterCard from DB if available, else build defaults
                    twitterCard: category.seo?.twitterCard && Object.keys(category.seo.twitterCard).length > 0
                        ? category.seo.twitterCard
                        : {
                            title: category.seoTitle || category.name,
                            description: category.seoDescription || category.description || `تسوق من قسم ${category.name}`,
                            image: category.image || '',
                            card: 'summary_large_image'
                        },
                    // Use schema from DB if available, else use generated
                    schema: category.seo?.schema && Object.keys(category.seo.schema).length > 0
                        ? JSON.stringify(category.seo.schema)
                        : JSON.stringify(schemaObj),
                    hiddenContent: category.seo?.hiddenContent,
                    metaRobots: category.seo?.metaRobots || "index, follow",
                    // Advanced SEO from CategorySeo
                    author: (category.seo as any)?.author,
                    alternateLinks: (category.seo as any)?.alternateLinks,
                    sitemapPriority: (category.seo as any)?.sitemapPriority,
                    sitemapFrequency: (category.seo as any)?.sitemapFrequency
                };
            }
        }
    }

    if (!seoData) return null;

    // D. Apply Title Separator
    let finalTitle = seoData.titleSeo || '';
    if (siteName && !finalTitle.includes(siteName) && !finalTitle.includes('|')) {
        finalTitle = `${finalTitle} | ${siteName}`;
    }

    return { ...seoData, titleSeo: finalTitle, siteName, siteLogo, googleVerification, bingVerification };
}

// 3. Public SEO Data (JSON)
publicSeoRouter.get('/seo/meta', async (req, res) => {
    try {
        const { slug, type, id, url } = req.query;
        // Fix for encoded root slug if passed as %2F
        const decodedSlug = slug ? decodeURIComponent(slug as string) : slug;
        const data = await resolveSeoData({ slug: decodedSlug as string, type: type as string, id: id as string, url: url as string });
        if (!data) return res.status(404).json({ error: 'Not found' });
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 4. SSR Handlers for Shared Links
async function handleSsr(req: any, res: any, forcedType?: string) {
    try {
        let slug = req.params.slug;
        // Handle Root Request
        if (req.path === '/' && !slug) {
            slug = '/';
        }

        const meta = await resolveSeoData({ slug, type: forcedType, url: req.originalUrl || req.url });

        // Read HTML - robust check for multiple CWD contexts (root vs packages/api)
        const roots = [
            process.cwd(), // Root (prod)
            path.resolve(process.cwd(), '../../'), // Dev (if in packages/api)
            path.resolve(process.cwd(), '../..')
        ];

        // Find first valid index.html
        let htmlPath = '';
        for (const r of roots) {
            const pDist = path.join(r, 'apps/mweb/dist/index.html');
            const pDev = path.join(r, 'apps/mweb/index.html');
            if (fs.existsSync(pDist)) { htmlPath = pDist; break; }
            if (fs.existsSync(pDev)) { htmlPath = pDev; break; }
        }

        if (!fs.existsSync(htmlPath)) return res.status(404).send('Not found');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        if (meta) {
            const { titleSeo, metaDescription, ogTags, twitterCard, canonicalUrl, schema, metaRobots, productData, siteName, googleVerification, bingVerification } = meta;

            // 1. Strip existing default tags to avoid duplicates
            html = html.replace(/<title>.*?<\/title>/gi, '');
            html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/gi, '');
            html = html.replace(/<meta\s+property=["']og:.*?["']\s+content=["'].*?["']\s*\/?>/gi, '');
            html = html.replace(/<meta\s+name=["']twitter:.*?["']\s+content=["'].*?["']\s*\/?>/gi, '');
            html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/gi, '');

            // 2. Construct new SEO Block
            const seoBlock = [
                `<title>${titleSeo || siteName || 'Jeeey'}</title>`,
                `<meta name="description" content="${(metaDescription || '').replace(/"/g, '&quot;')}" />`,
                `<link rel="canonical" href="${canonicalUrl || 'https://jeeey.com'}" />`,
                metaRobots ? `<meta name="robots" content="${metaRobots}" />` : '',
                googleVerification ? `<meta name="google-site-verification" content="${googleVerification}" />` : '',
                bingVerification ? bingVerification : '',
                meta.author ? `<meta name="author" content="${meta.author.replace(/"/g, '&quot;')}" />` : '',
                // Hreflang
                // Hreflang
                meta.alternateLinks ? Object.entries(meta.alternateLinks).map(([lang, url]) =>
                    `<link rel="alternate" hreflang="${lang}" href="${url}" />`
                ).join('\n') : '',

                // Open Graph
                `<meta property="og:type" content="${ogTags?.type || 'website'}" />`,
                `<meta property="og:site_name" content="${siteName || 'Jeeey'}" />`,
                `<meta property="og:title" content="${(ogTags?.title || titleSeo || '').replace(/"/g, '&quot;')}" />`,
                `<meta property="og:description" content="${(ogTags?.description || metaDescription || '').replace(/"/g, '&quot;')}" />`,
                `<meta property="og:image" content="${ogTags?.image || ''}" />`,
                `<meta property="og:url" content="${ogTags?.url || canonicalUrl || ''}" />`,

                // Twitter
                `<meta name="twitter:card" content="${twitterCard?.card || 'summary_large_image'}" />`,
                `<meta name="twitter:title" content="${(twitterCard?.title || titleSeo || '').replace(/"/g, '&quot;')}" />`,
                `<meta name="twitter:description" content="${(twitterCard?.description || metaDescription || '').replace(/"/g, '&quot;')}" />`,
                `<meta name="twitter:image" content="${twitterCard?.image || ogTags?.image || ''}" />`,

                // Schema
                schema ? `<script type="application/ld+json">${schema}</script>` : '',

                // Product Rich Data (Facebook/Pinterest/WhatsApp)
                (productData ? [
                    `<meta property="product:price:amount" content="${productData.price}" />`,
                    `<meta property="product:price:currency" content="${productData.currency}" />`,
                    `<meta property="product:availability" content="${productData.availability}" />`,
                    `<meta property="product:brand" content="${(productData.brand || '').replace(/"/g, '&quot;')}" />`,
                    `<meta property="product:retailer_item_id" content="${productData.sku}" />`
                ].join('\n    ') : '')
            ].filter(Boolean).join('\n    ');

            // 3. Inject HEAD tags
            html = html.replace('</head>', `${seoBlock}\n  </head>`);

            // 4. Inject Hidden Content body
            if (meta.hiddenContent) {
                html = html.replace('</body>', `<div id="seo-hidden-content" style="display:none;visibility:hidden;">${meta.hiddenContent}</div>\n</body>`);
            }
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (e) {
        console.error(e);
        res.status(500).send('SSR Error');
    }
}

// Handler for Root
publicSeoRouter.get('/', (req, res) => handleSsr(req, res, 'page'));

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

