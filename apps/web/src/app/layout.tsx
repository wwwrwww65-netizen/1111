import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { Header } from "../components/Header";
import { FooterCompact } from "../components/FooterCompact";
import { MobileBottomNav } from "../components/MobileBottomNav";
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
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gsc = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className}>
        {gsc && (<meta name="google-site-verification" content={gsc} />)}
        {gtmId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `,
            }}
          />
        )}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} gtag('js', new Date());
        gtag('config', '${gaId}', { send_page_view: true });
      `,
              }}
            />
          </>
        )}
        <AppProviders>
          <Header />
          <div className="pb-16 md:pb-0">{children}</div>
          <FooterCompact />
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
