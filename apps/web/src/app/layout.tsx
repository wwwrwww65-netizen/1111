import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "منصة التجارة الإلكترونية",
  description: "تجربة تسوق حديثة.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
