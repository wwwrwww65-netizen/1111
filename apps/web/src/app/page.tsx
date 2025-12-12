import { Metadata } from 'next';
import HomeClient from './client';

export const dynamic = 'force-dynamic';

async function getSeoData() {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  try {
    const res = await fetch(`${apiUrl}/api/seo/meta?slug=/`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoData();
  if (!seo) return {};

  return {
    title: seo.titleSeo,
    description: seo.metaDescription,
    icons: {
      icon: seo.siteLogo || '/favicon.ico',
    },
    alternates: {
      canonical: seo.canonicalUrl,
    },
    robots: seo.metaRobots,
    openGraph: {
      ...seo.ogTags,
      siteName: seo.siteName || 'Jeeey',
      images: seo.ogTags?.image ? [{ url: seo.ogTags.image }] : undefined,
    },
    twitter: seo.twitterCard ? seo.twitterCard : undefined,
    other: {
      'active-hidden': seo.hiddenContent,
    }
  };
}

export default async function Page() {
  const seo = await getSeoData();
  const jsonLd = seo?.schema ? seo.schema : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }} // Provide string directly since API returns JSON string
        />
      )}
      <HomeClient />
    </>
  );
}
