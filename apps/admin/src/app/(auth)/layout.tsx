import React from "react";
import { AppProviders } from "../providers";

export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body style={{background:'#0b0e14',color:'#e2e8f0',fontFamily:'system-ui,Segoe UI,Roboto,Arial,sans-serif'}}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

