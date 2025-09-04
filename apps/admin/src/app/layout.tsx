import { AppProviders } from "./providers";
import { cookies } from 'next/headers';
import '../app/globals.css';
import AppShell from '../components/AppShell';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const hasAuth = cookies().has('auth_token');
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>
          {hasAuth ? (
            <AppShell>
              {children}
            </AppShell>
          ) : (
            <main className="content" style={{padding:24}}>
              {children}
            </main>
          )}
        </AppProviders>
      </body>
    </html>
  );
}