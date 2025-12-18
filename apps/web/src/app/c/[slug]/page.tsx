import { Metadata } from 'next';
import CategoryClientPage from './client';

type Props = {
    params: { slug: string };
};

// 1. Unified SEO Fetcher (Best Practice - connects to Admin Panel SEO Engine)
async function getSeoMetadata(slug: string) {
    const validApi = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
    const decoded = decodeURIComponent(slug);
    // Note: type=product_category tells the system to look up category SEO logic
    try {
        const res = await fetch(`${validApi}/api/seo/meta?type=category&slug=/c/${encodeURIComponent(decoded)}`, {
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
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
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
    let titleText = seo?.titleSeo;
    if (!titleText && cat) titleText = cat.seo?.seoTitle || cat.name;
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

    // Extract Open Graph data
    const ogData = seo?.ogTags || {};
    const ogTitle = ogData.title || titleText;
    const ogDescription = ogData.description || descriptionText;
    const ogImage = ogData.image || cat?.image || '';
    const ogUrl = ogData.url || seo?.canonicalUrl || `https://jeeey.com/c/${params.slug}`;

    // Extract Twitter Card data
    const twData = seo?.twitterCard || {};
    const twCard = twData.card || 'summary_large_image';
    const twTitle = twData.title || titleText;
    const twDescription = twData.description || descriptionText;
    const twImage = twData.image || ogImage;

    return {
        title: titleText,
        description: descriptionText,
        keywords: keywordsArray.length > 0 ? keywordsArray.join(', ') : undefined,
        authors: seo?.author ? [{ name: seo.author }] : undefined,
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            images: ogImage ? [{ url: ogImage }] : undefined,
            url: ogUrl,
            siteName: seo?.siteName || 'Jeeey',
            type: 'website',
            locale: 'ar_SA',
        },
        twitter: {
            card: twCard as any,
            title: twTitle,
            description: twDescription,
            images: twImage ? [twImage] : undefined,
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
