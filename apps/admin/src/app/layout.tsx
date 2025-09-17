import { AppProviders } from "./providers";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import '../app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>
          <div className="app-root">
            <header className="topbar">
              <div className="brand">JEEEY Admin</div>
              <div className="top-actions"><ThemeToggle /></div>
            </header>
            <div className="shell">
              <aside className="sidebar open">
                <Sidebar />
              </aside>
              <main className="content container">
                {children}
              </main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}