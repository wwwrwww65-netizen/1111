import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { Header } from "../components/Header";
import { FooterCompact } from "../components/FooterCompact";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { CookieConsent } from "../components/CookieConsent";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400","500","700","800"] });

export const metadata: Metadata = {
  title: "Jeeey | موضة نساء على الإنترنت | تسوق الفساتين والأحذية والحقائب",
  description:
    "اكتشف أحدث صيحات الموضة النسائية. تسوق فساتين، أحذية، حقائب، وإكسسوارات محدثة أسبوعياً.",
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
        <CookieConsent />
      </body>
    </html>
  );
}
