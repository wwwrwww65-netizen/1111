import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
    params: { slug: string[] };
};

async function getPageSeo(slugPath: string[]): Promise<any> {
    const slug = slugPath ? slugPath.join('/') : '';
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    try {
        // Fetch meta specifically for type=page (covers custom SEO pages)
        const res = await fetch(`${apiUrl}/api/seo/meta?type=page&slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.titleSeo) return data;
        return null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const seo = await getPageSeo(params.slug);
    if (!seo) {
        return {
            title: 'Page Not Found',
        };
    }

    return {
        title: seo.titleSeo,
        description: seo.metaDescription,
        alternates: {
            canonical: seo.canonicalUrl,
        },
        robots: {
            index: seo.metaRobots?.includes('index'),
            follow: seo.metaRobots?.includes('follow'),
        },
        openGraph: seo.ogTags,
        twitter: seo.twitterCard,
        other: {
            'active-hidden': seo.hiddenContent,
        }
    };
}

export default async function GenericSeoPage({ params }: Props) {
    const seo = await getPageSeo(params.slug);

    // If no SEO data found for this slug, return 404
    if (!seo) {
        notFound();
    }

    return (
        <main className="container mx-auto px-4 py-12 min-h-[60vh]">
            <article className="prose lg:prose-xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#800020]">{seo.titleSeo}</h1>

                {/* 
                   Render hiddenContent (often used for SEO articles) or fall back to description. 
                   Warning: This renders HTML from the DB. Ensure DB content is trusted or sanitized earlier.
                */}
                {(seo.hiddenContent || seo.metaDescription) && (
                    <div dangerouslySetInnerHTML={{ __html: seo.hiddenContent || `<p>${seo.metaDescription}</p>` }} />
                )}
            </article>
        </main>
    );
}
