import { Metadata } from 'next';
import ProductDetailClient from './client';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getProductSeo(idOrSlug: string): Promise<any> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    // Fetch from updated public SEO endpoint
    // NOTE: /api/seo/meta expects `url`. Since we don't know the exact full path from just ID here easily without hardcoding,
    // we can assume /product/:slug. The logic in /seo/meta parses this.
    const res = await fetch(`${apiUrl}/api/seo/meta?url=/product/${encodeURIComponent(idOrSlug)}&slug=${encodeURIComponent(idOrSlug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.meta || null;
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
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    robots: seo.robots,
    openGraph: seo.ogTags ? seo.ogTags : undefined,
    other: {
      'active-hidden': seo.hiddenContent,
    }
  };
}

export default function Page({ params }: Props) {
  return <ProductDetailClient id={params.id} />;
}