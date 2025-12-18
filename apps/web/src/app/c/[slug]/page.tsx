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

    // Parse alternate links
    let languages = {};
    if (seo?.alternateLinks) {
        try { languages = typeof seo.alternateLinks === 'string' ? JSON.parse(seo.alternateLinks) : seo.alternateLinks; } catch { }
    }

    return {
        title: titleText,
        description: seo?.metaDescription || cat?.seo?.seoDescription,
        keywords: seo?.keywords,
        authors: seo?.author ? [{ name: seo.author }] : undefined,
        openGraph: seo?.ogTags ? {
            title: seo.ogTags.title || titleText,
            description: seo.ogTags.description || seo.metaDescription,
            images: seo.ogTags.image ? [{ url: seo.ogTags.image }] : undefined,
            url: seo.ogTags.url || seo.canonicalUrl,
            siteName: seo.siteName || 'Jeeey',
            type: 'website',
            locale: 'ar_SA',
        } : undefined,
        twitter: seo?.twitterCard ? {
            card: 'summary_large_image',
            title: seo.twitterCard.title || titleText,
            description: seo.twitterCard.description || seo.metaDescription,
            images: seo.twitterCard.image ? [seo.twitterCard.image] : undefined,
        } : undefined,
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
