import { Metadata } from 'next';
import ProductDetailClient from './client';

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// 1. SEO Data Fetcher - Best Practice (Next.js 14+ Metadata API)
async function getProductSeo(slugOrId: string): Promise<any> {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const decoded = decodeURIComponent(slugOrId);
  try {
    // Try slug first, then id - flexible lookup
    const res = await fetch(`${apiUrl}/api/seo/meta?type=product&slug=${encodeURIComponent(decoded)}`, {
      next: { revalidate: 60 } // ISR: Revalidate every 60 seconds
    });
    if (!res.ok) {
      // Fallback: Try by ID
      const resById = await fetch(`${apiUrl}/api/seo/meta?type=product&id=${encodeURIComponent(decoded)}`, {
        next: { revalidate: 60 }
      });
      if (!resById.ok) return null;
      return await resById.json();
    }
    return await res.json();
  } catch (e) {
    console.error('Product SEO fetch error:', e);
    return null;
  }
}

// 2. Product Data Fetcher (for fallbacks)
async function getProduct(slugOrId: string): Promise<any> {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const decoded = decodeURIComponent(slugOrId);
  try {
    const res = await fetch(`${apiUrl}/api/product/${encodeURIComponent(decoded)}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// 3. generateMetadata - Full SEO Implementation (Matching mweb Product.vue)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const seo = await getProductSeo(params.slug);
    const product = !seo ? await getProduct(params.slug) : null;

    // Fallback title
    const titleText = seo?.titleSeo || product?.name || 'المنتج - Jeeey';
    const descriptionText = seo?.metaDescription || product?.description || '';

    // Parse keywords
    let keywordsArray: string[] = [];
    if (seo?.keywords) {
      if (typeof seo.keywords === 'string') {
        keywordsArray = seo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      } else if (Array.isArray(seo.keywords)) {
        keywordsArray = seo.keywords;
      }
    }

    // Parse alternate links (for hreflang)
    let languages: Record<string, string> = {};
    if (seo?.alternateLinks) {
      try {
        languages = typeof seo.alternateLinks === 'string'
          ? JSON.parse(seo.alternateLinks)
          : seo.alternateLinks;
      } catch { }
    }

    // Open Graph data (matching mweb Product.vue)
    const ogData = seo?.ogTags || {};
    const ogTitle = ogData.title || titleText;
    const ogDescription = ogData.description || descriptionText;
    const ogImage = ogData.image || product?.images?.[0] || '';
    const ogUrl = ogData.url || seo?.canonicalUrl || `https://jeeey.com/p/${params.slug}`;
    // Next.js 14 Metadata API only supports: website, article, book, profile
    // Product-specific metadata is handled via JSON-LD structured data
    const ogType = 'website';
    const ogLocale = ogData.locale || 'ar_SA';

    // Twitter Card data (matching mweb Product.vue)
    const twData = seo?.twitterCard || {};
    const twCard = twData.card || 'summary_large_image';
    const twTitle = twData.title || ogTitle;
    const twDescription = twData.description || ogDescription;
    const twImage = twData.image || ogImage;
    const twSite = twData.site || seo?.twitterSite || undefined;
    const twCreator = twData.creator || seo?.twitterCreator || undefined;

    // Meta robots
    const robotsContent = seo?.metaRobots || 'index, follow';
    const shouldIndex = !robotsContent.includes('noindex');
    const shouldFollow = !robotsContent.includes('nofollow');

    return {
      title: titleText,
      description: descriptionText,
      keywords: keywordsArray.length > 0 ? keywordsArray.join(', ') : undefined,
      authors: seo?.author ? [{ name: seo.author }] : undefined,

      // Open Graph (Full implementation - matching mweb)
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [{ url: ogImage, alt: ogTitle }] : undefined,
        url: ogUrl,
        siteName: seo?.siteName || 'Jeeey',
        type: ogType as any,
        locale: ogLocale,
      },

      // Twitter Card (Full implementation - matching mweb)
      twitter: {
        card: twCard as any,
        title: twTitle,
        description: twDescription,
        images: twImage ? [twImage] : undefined,
        site: twSite,
        creator: twCreator,
      },

      // Robots
      robots: {
        index: shouldIndex,
        follow: shouldFollow,
        googleBot: {
          index: shouldIndex,
          follow: shouldFollow,
        }
      },

      // Alternates (Canonical + hreflang)
      alternates: {
        canonical: seo?.canonicalUrl || `https://jeeey.com/p/${params.slug}`,
        languages: Object.keys(languages).length > 0 ? languages : undefined,
      },

      // Other meta tags
      other: {
        ...(seo?.sitemapPriority ? { 'sitemap-priority': String(seo.sitemapPriority) } : {}),
        ...(seo?.sitemapFrequency ? { 'sitemap-frequency': seo.sitemapFrequency } : {}),
      }
    };
  } catch (error) {
    console.error(`Error generating metadata for product: ${params.slug}`, error);
    // Return minimal valid metadata to prevent 500
    return {
      title: 'المنتج - Jeeey',
      description: '',
    };
  }
}

// 4. Page Component
export default async function Page({ params }: Props) {
  try {
    const seo = await getProductSeo(params.slug);
    const product = await getProduct(params.slug);

    // JSON-LD Schema (from DB or generated fallback - matching mweb)
    let jsonLd: any = null;
    if (seo?.schema) {
      jsonLd = seo.schema;
    } else if (product) {
      // Fallback Schema Generator if DB Schema is missing
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description || seo?.metaDescription,
        "image": product.images?.[0] || product.image,
        "sku": product.sku || product.id,
        "brand": product.brand ? { "@type": "Brand", "name": product.brand } : undefined,
        "offers": {
          "@type": "Offer",
          "url": `https://jeeey.com/p/${params.slug}`,
          "priceCurrency": "QAR",
          "price": product.price,
          "availability": product.stockQuantity > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
        }
      };
    }

    const showProduct = !!product;

    return (
      <>
        {/* Debug Info (Hidden) - to help diagnose 500 errors if needed */}
        {/* <div style={{display:'none'}} data-slug={params.slug} data-has-product={showProduct}></div> */}

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

        {/* Product Detail Client Component */}
        {/* Only render client if we have a slug, otherwise handle error gracefuly */}
        <ProductDetailClient slug={params.slug} />
      </>
    );
  } catch (error) {
    console.error(`Error rendering product page for slug: ${params.slug}`, error);
    // Return a graceful fallback instead of 500
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">عذراً، حدث خطأ غير متوقع</h1>
        <p className="text-gray-600 mb-4">لا يمكن عرض هذا المنتج حالياً.</p>
        <a href="/" className="text-blue-600 hover:underline">العودة للرئيسية</a>
      </div>
    );
  }
}
