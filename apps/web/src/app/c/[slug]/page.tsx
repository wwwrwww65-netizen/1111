import { Metadata } from 'next';
import CategoryClientPage from './client';

type Props = {
    params: { slug: string };
};

// 1. Unified SEO Fetcher (Best Practice - connects to Admin Panel SEO Engine)
async function getSeoMetadata(slug: string) {
    const validApi = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000';
    const decoded = decodeURIComponent(slug);
    // Fixed: Send just the slug, not /c/ prefix - API handles path internally
    try {
        const res = await fetch(`${validApi}/api/seo/meta?type=category&slug=${encodeURIComponent(decoded)}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('Metadata fetch error:', e);
        return null;
    }
}

// 2. Data Fetcher for Page Content (Category Info Only)
async function getCategory(slug: string): Promise<any> {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000';
    try {
        const decodedSlug = decodeURIComponent(slug); // Try decoding first to match DB if stored with spaces
        const res = await fetch(`${apiUrl}/api/category/${encodeURIComponent(decodedSlug)}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.category || null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const decodedSlug = decodeURIComponent(params.slug);
    const seo = await getSeoMetadata(decodedSlug);
    // Fallback info if SEO API fails but Category API works
    const cat = !seo ? await getCategory(decodedSlug) : null;

    // Construct title
    // Priority: 1. SEO API (Best) -> 2. Category Name (Safe Fallback)
    // We intentionally skip `cat.seo.seoTitle` because it may contain legacy/malformed data (like long descriptions)
    let titleText = seo?.titleSeo;
    if (!titleText && cat) titleText = cat.name;
    if (!titleText) titleText = decodedSlug;

    // Construct description
    const descriptionText = seo?.metaDescription || cat?.seo?.seoDescription || '';

    // Parse keywords (can be string or array)
    let keywordsArray: string[] = [];
    if (seo?.keywords) {
        if (typeof seo.keywords === 'string') {
            keywordsArray = seo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
        } else if (Array.isArray(seo.keywords)) {
            keywordsArray = seo.keywords;
        }
    }

    // Parse alternate links
    let languages = {};
    if (seo?.alternateLinks) {
        try {
            languages = typeof seo.alternateLinks === 'string' ? JSON.parse(seo.alternateLinks) : seo.alternateLinks;
        } catch { }
    }

    // Extract Open Graph data (matching mweb implementation)
    const ogData = seo?.ogTags || {};
    const ogTitle = ogData.title || titleText;
    const ogDescription = ogData.description || descriptionText;
    const ogImage = ogData.image || cat?.image || '';
    const ogUrl = ogData.url || seo?.canonicalUrl || `https://jeeey.com/c/${params.slug}`;
    const ogType = ogData.type || 'website';
    const ogLocale = ogData.locale || 'ar_SA';

    // Extract Twitter Card data (matching mweb implementation)
    const twData = seo?.twitterCard || {};
    const twCard = twData.card || 'summary_large_image';
    const twTitle = twData.title || ogTitle; // Fallback to OG title like mweb
    const twDescription = twData.description || ogDescription; // Fallback to OG description
    const twImage = twData.image || ogImage; // Fallback to OG image
    const twSite = twData.site || seo?.twitterSite || undefined;
    const twCreator = twData.creator || seo?.twitterCreator || undefined;

    return {
        title: titleText,
        description: descriptionText,
        keywords: keywordsArray.length > 0 ? keywordsArray.join(', ') : undefined,
        authors: seo?.author ? [{ name: seo.author }] : undefined,
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            images: ogImage ? [{ url: ogImage, alt: ogTitle }] : undefined,
            url: ogUrl,
            siteName: seo?.siteName || 'Jeeey',
            type: ogType as any,
            locale: ogLocale,
        },
        twitter: {
            card: twCard as any,
            title: twTitle,
            description: twDescription,
            images: twImage ? [twImage] : undefined,
            site: twSite,
            creator: twCreator,
        },
        robots: {
            index: seo?.metaRobots ? !seo.metaRobots.includes('noindex') : true,
            follow: seo?.metaRobots ? !seo.metaRobots.includes('nofollow') : true,
            googleBot: {
                index: seo?.metaRobots ? !seo.metaRobots.includes('noindex') : true,
                follow: seo?.metaRobots ? !seo.metaRobots.includes('nofollow') : true,
            }
        },
        alternates: {
            canonical: seo?.canonicalUrl || `https://jeeey.com/c/${params.slug}`,
            languages: Object.keys(languages).length > 0 ? languages : undefined,
        },
        other: {
            ...(seo?.sitemapPriority ? { 'sitemap-priority': String(seo.sitemapPriority) } : {}),
            ...(seo?.sitemapFrequency ? { 'sitemap-frequency': seo.sitemapFrequency } : {}),
        }
    };
}

export default async function Page({ params }: Props) {
    const decodedSlug = decodeURIComponent(params.slug);
    const cat = await getCategory(decodedSlug);
    const seo = await getSeoMetadata(decodedSlug);

    if (!cat) return <div className="p-20 text-center text-gray-500">الفئة غير موجودة</div>;

    // Inject JSON-LD Schema
    const jsonLd = seo?.schema || cat.seo?.schema || null;

    // Merge SEO data into category object for client to use (e.g. for Description display)
    if (seo) {
        cat.seo = { ...cat.seo, ...seo, seoTitle: seo.titleSeo, seoDescription: seo.metaDescription };
    }

    return (
        <>
            {/* Hidden SEO Content */}
            {seo?.hiddenContent && (
                <div
                    id="seo-hidden-content"
                    style={{ display: 'none', visibility: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: seo.hiddenContent }}
                />
            )}

            {/* JSON-LD Schema */}
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd) }}
                />
            )}

            {/* Pass the fully enriched category object to the client */}
            <CategoryClientPage category={cat} />
        </>
    );
}
