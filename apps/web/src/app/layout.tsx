import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { Header } from "../components/Header";
import { FooterCompact } from "../components/FooterCompact";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { CookieConsent } from "../components/CookieConsent";
import { Tajawal } from "next/font/google";
import { PromoHost } from "../components/PromoHost";
import { ClientFaviconLoader } from "../components/ClientFaviconLoader";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "800"] });

// Shared fetcher logic
async function fetchSeoData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    // Fetch root seo meta
    const res = await fetch(`${apiUrl}/api/seo/meta?slug=/`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch { }
  return {};
}

// Dynamic Metadata
export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchSeoData();

  const siteName = data.siteName || 'Jeeey';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';
  const siteLogo = data.siteLogo || '';
  const description = data.metaDescription || 'Jeeey is your gateway to global shopping.';

  let googleVerification: string | undefined = data.googleVerification;
  let bingVerification: string | undefined;

  if (data.bingVerification) {
    const match = data.bingVerification.match(/content="([^"]+)"/);
    bingVerification = match ? match[1] : data.bingVerification;
  }

  const ogTags = data.ogTags || {};
  const twitterCard = data.twitterCard || {};

  // Parse robots
  const robotsTxt = data.metaRobots || "index, follow";
  const index = robotsTxt.includes('noindex') ? false : true;
  const follow = robotsTxt.includes('nofollow') ? false : true;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: data.titleSeo || siteName,
      template: `%s | ${siteName}`
    },
    description: description,
    icons: {
      icon: siteLogo || '/icon.png',
      shortcut: siteLogo || '/icon.png',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'ar_SA',
      url: '/',
      siteName: siteName,
      title: ogTags.title || data.titleSeo || siteName,
      description: ogTags.description || description,
      images: ogTags.image ? [{ url: ogTags.image }] : (siteLogo ? [{ url: siteLogo }] : []),
    },
    twitter: {
      card: twitterCard.card || 'summary_large_image',
      site: '@jeeey_com',
      title: twitterCard.title || data.titleSeo || siteName,
      description: twitterCard.description || description,
      images: twitterCard.image ? [twitterCard.image] : (siteLogo ? [siteLogo] : []),
    },
    robots: {
      index,
      follow,
    },
    verification: {
      ...(googleVerification ? { google: googleVerification } : {}),
      other: bingVerification ? { 'msvalidate.01': bingVerification } : undefined
    }
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: 'device-width',
  initialScale: 1,
};

// Disable HTML caching to ensure fresh design/styles are served
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const data = await fetchSeoData();

  const siteName = data.siteName || 'Jeeey';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';
  const siteLogo = data.siteLogo || `${siteUrl}/icon.png`;

  // Always use Organization schema for Global Layout
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": siteUrl,
    "logo": siteLogo,
    "sameAs": [
      "https://twitter.com/jeeey_com",
      "https://www.facebook.com/jeeeycom",
      "https://www.instagram.com/jeeeycom"
    ]
  };

  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppProviders>
          <ClientFaviconLoader />
          <Header />
          <div className="pb-16 md:pb-0">{children}</div>
          <FooterCompact />
          <MobileBottomNav />
        </AppProviders>
        <PromoHost />
        <CookieConsent />
      </body>
    </html>
  );
}
