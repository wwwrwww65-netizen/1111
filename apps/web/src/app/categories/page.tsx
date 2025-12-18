import { Metadata } from 'next';

// Shared data fetcher to enable request deduping
async function getSeoMetadata() {
  const validApi = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
  try {
    const res = await fetch(`${validApi}/api/seo/meta?type=page&slug=/categories`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Metadata fetch error:', e);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata();
  const titleText = seo?.titleSeo || 'التصنيفات';
  const descriptionText = seo?.metaDescription || 'تسوق حسب التصنيف - اكتشف أفضل العروض والمنتجات المميزة';

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
  const ogImage = ogData.image || 'https://jeeey.com/images/og-default.jpg';
  const ogUrl = ogData.url || seo?.canonicalUrl || 'https://jeeey.com/categories';

  // Extract Twitter Card data
  const twData = seo?.twitterCard || {};
  const twCard = twData.card || 'summary_large_image';
  const twTitle = twData.title || titleText;
  const twDescription = twData.description || descriptionText;
  const twImage = twData.image || ogImage;

  return {
    title: titleText,
    description: descriptionText,
    applicationName: seo?.siteName || 'Jeeey',
    keywords: keywordsArray.length > 0 ? keywordsArray.join(', ') : undefined,
    authors: seo?.author ? [{ name: seo.author }] : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [{ url: ogImage }] : undefined,
      url: ogUrl,
      siteName: seo?.siteName || 'Jeeey',
      locale: 'ar_SA',
      type: 'website',
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
      canonical: seo?.canonicalUrl || 'https://jeeey.com/categories',
      languages: Object.keys(languages).length > 0 ? languages : undefined,
    },
    other: {
      ...(seo?.sitemapPriority ? { 'sitemap-priority': String(seo.sitemapPriority) } : {}),
      ...(seo?.sitemapFrequency ? { 'sitemap-frequency': seo.sitemapFrequency } : {}),
      ...(seo?.bingVerification ? { 'bing-site-verification': seo.bingVerification } : {}),
      ...(seo?.googleVerification ? { 'google-site-verification': seo.googleVerification } : {}),
    }
  };
}

async function getCategories() {
  const validApi = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
  try {
    const res = await fetch(`${validApi}/api/categories/all`, {
      next: { revalidate: 0 },
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error(`[CategoriesPage] Fetch failed: ${res.status}`);
      return [];
    }
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (e: any) {
    console.error('[CategoriesPage] Network/Fetch error:', e);
    return [];
  }
}

export default async function CategoriesPage() {
  const categoriesRaw = await getCategories();
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const seo = await getSeoMetadata(); // Reuse for schema injection

  return (
    <main className="min-h-screen p-0 bg-gray-50">
      {/* Hidden SEO Content */}
      {seo?.hiddenContent && (
        <div
          id="seo-hidden-content"
          style={{ display: 'none', visibility: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: seo.hiddenContent }}
        />
      )}

      {/* Inject Advanced JSON-LD Schema if present */}
      {seo?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: typeof seo.schema === 'string' ? seo.schema : JSON.stringify(seo.schema) }}
        />
      )}

      {/* Hero */}
      <section className="relative w-full h-40 md:h-48 bg-gradient-to-r from-[#800020] to-[#a01135] text-white flex items-center shadow-md">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">التصنيفات</h1>
          <p className="opacity-90 text-sm md:text-base font-light">تصفح جميع الأقسام والمنتجات المميزة</p>
        </div>
      </section>

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">لا توجد تصنيفات حالياً.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {categories.map((c: any) => (
              <li key={c.id} className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100">
                <a href={`/c/${c.slug || c.id}`} className="block h-full flex flex-col">
                  <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={c.image || "https://placehold.co/600x600/f3f4f6/a01135?text=Jeeey"}
                      alt={c.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <div className="p-4 bg-white flex-1 flex flex-col justify-center text-center">
                    <h2 className="font-semibold text-gray-900 group-hover:text-[#800020] transition-colors line-clamp-2">
                      {c.name}
                    </h2>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}