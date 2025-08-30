import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { Header } from "../components/Header";
import { FooterCompact } from "../components/FooterCompact";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>
          <Header />
          {children}
          <FooterCompact />
        </AppProviders>
      </body>
    </html>
  );
}
