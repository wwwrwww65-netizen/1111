import { AppProviders } from "./providers";
export const dynamic = 'force-dynamic';
import { AppShell } from "./components/AppShell";
import '../app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <script dangerouslySetInnerHTML={{ __html: `window.__admin_loaded_at = Date.now();` }} />
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}