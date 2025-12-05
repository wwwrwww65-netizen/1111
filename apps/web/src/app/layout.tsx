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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com'),
  title: {
    default: 'Jeeey - Global Shopping | تسوق عالمي',
    template: '%s | Jeeey'
  },
  description: 'Jeeey is your gateway to global shopping. Fashion, Tech, Home and more. تسوق من أرقى العلامات التجارية العالمية في مكان واحد.',
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: '/',
    siteName: 'Jeeey',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Jeeey Global Shopping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@jeeey_com',
    creator: '@jeeey_com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification_token',
    yandex: 'yandex_verification',
  },
};

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
