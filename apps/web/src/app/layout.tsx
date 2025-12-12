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

// Dynamic Metadata
export async function generateMetadata(): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  let siteName = 'Jeeey';
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';
  let siteLogo = '';

  let googleVerification: string | undefined;
  let bingVerification: string | undefined;

  try {
    // We can fetch from root SEO meta to get siteName/siteLogo
    const res = await fetch(`${apiUrl}/api/seo/meta?slug=/`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.siteName) siteName = data.siteName;
      if (data.siteLogo) siteLogo = data.siteLogo;
      if (data.googleVerification) googleVerification = data.googleVerification;
      if (data.bingVerification) {
        // Bing often is full tag, but Next.js expects just the code in 'verification.other' or 'verification.bing' if it's just code.
        // If it's a full tag, we might need to parse or put in 'other'.
        // For now, let's assume if it contains 'content=', we extract it, else use as is.
        const match = data.bingVerification.match(/content="([^"]+)"/);
        bingVerification = match ? match[1] : data.bingVerification;
      }
    }
  } catch { }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteName} - Global Shopping`,
      template: `%s | ${siteName}`
    },
    description: 'Jeeey is your gateway to global shopping.',
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
    },
    twitter: {
      card: 'summary_large_image',
      site: '@jeeey_com',
    },
    robots: {
      index: true,
      follow: true,
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

// Shared data fetcher for layout usage
async function getSeoSettings() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/seo/meta?slug=/`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch { }
  return {};
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const settings = await getSeoSettings();
  const siteName = settings.siteName || 'Jeeey';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';
  const siteLogo = settings.siteLogo || `${siteUrl}/icon.png`;

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
