import { Metadata } from 'next';
import ProductDetailClient from './client';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getProductSeo(idOrSlug: string): Promise<any> {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    // Explicitly ask for product meta by ID/Slug using the new API logic
    const res = await fetch(`${apiUrl}/api/seo/meta?type=product&id=${encodeURIComponent(idOrSlug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const seo = await getProductSeo(params.id);

  if (!seo) {
    return {
      title: 'Product - Jeeey',
    };
  }

  return {
    title: seo.titleSeo || 'Product - Jeeey',
    description: seo.metaDescription,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    robots: {
      index: seo.metaRobots?.includes('index'),
      follow: seo.metaRobots?.includes('follow'),
    },
    openGraph: seo.ogTags ? seo.ogTags : undefined,
    twitter: seo.twitterCard,
    other: {
      'active-hidden': seo.hiddenContent,
    }
  };
}


export default async function Page({ params }: Props) {
  const seo = await getProductSeo(params.id);

  let jsonLd = null;
  if (seo && seo.schema) {
    jsonLd = seo.schema;
  } else if (seo) {
    // Fallback JSON-LD generation if schema is missing from DB but we have product info
    // Note: seo object might override or be minimal, so this is best effort.
    // Ideally backend returns the specific schema.
  }

  return (
    <>
      {/* JSON-LD for SEO Rich Snippets */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient id={params.id} />
    </>
  );
}
