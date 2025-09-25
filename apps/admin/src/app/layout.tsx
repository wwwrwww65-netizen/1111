import { AppProviders } from "./providers";
export const dynamic = 'force-dynamic';
import { AppShell } from "./components/AppShell";
import '../app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{__html:`(function(){try{var ua=(navigator.userAgent||'').toLowerCase();var isM=/(android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini)/.test(ua);var forced=(localStorage.getItem('admin_force_desktop')==='1');if(!forced && isM && location.pathname==='/' ){location.replace('/mobile');}}catch(e){}})();`}} />
        <script dangerouslySetInnerHTML={{ __html: `window.__admin_loaded_at = Date.now();` }} />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){try{navigator.serviceWorker.register('/sw.js');}catch(e){}}` }} />
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}