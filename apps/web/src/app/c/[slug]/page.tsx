import { Metadata } from 'next';
import CategoryClientPage from './client';

type Props = {
    params: { slug: string };
};

async function getCategory(slug: string): Promise<any> {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    try {
        const res = await fetch(`${apiUrl}/api/category/${encodeURIComponent(slug)}`, { cache: 'no-store' }); // Use the new endpoint
        if (!res.ok) return null;
        const json = await res.json();
        return json.category || null;
    } catch {
        return null;
    }
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const cat = await getCategory(params.slug);

    if (!cat || !cat.seo) {
        return {
            title: cat ? cat.name : 'Category - Jeeey',
        };
    }
    const seo = cat.seo;

    return {
        title: seo.seoTitle || cat.name,
        description: seo.seoDescription,
        alternates: {
            canonical: seo.canonicalUrl,
        },
        robots: seo.metaRobots,
        openGraph: seo.ogTags ? seo.ogTags : undefined,
        other: {
            'active-hidden': seo.hiddenContent,
        }
    };
}


export default async function Page({ params }: Props) {
    const cat = await getCategory(params.slug);
    if (!cat) return <div className="p-8 text-center">Category not found</div>;

    const jsonLd = cat.seo?.schema ? cat.seo.schema : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <CategoryClientPage category={cat} />
        </>
    );
}

