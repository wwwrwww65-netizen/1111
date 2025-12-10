import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { Header } from "../components/Header";
import { FooterCompact } from "../components/FooterCompact";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { CookieConsent } from "../components/CookieConsent";
import { Tajawal } from "next/font/google";
import { PromoHost } from "../components/PromoHost";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "800"] });

// Dynamic Metadata
export async function generateMetadata(): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  let siteName = 'Jeeey';
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com';
  let siteLogo = '';

  try {
    // We can fetch from root SEO meta to get siteName/siteLogo
    const res = await fetch(`${apiUrl}/api/seo/meta?slug=/`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.siteName) siteName = data.siteName;
      if (data.siteLogo) siteLogo = data.siteLogo;
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
      icon: siteLogo || '/favicon.ico',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className} suppressHydrationWarning>
        <AppProviders>
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
