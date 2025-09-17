import { AppProviders } from "./providers";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import { AccountMenu } from "./components/AccountMenu";
import '../app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>
          <div className="app-root">
            <header className="topbar" style={{background:'linear-gradient(90deg,#0f1420,#101939)',color:'#e2e8f0',borderBottom:'1px solid #1c2333'}}>
              <div className="brand">jeeey</div>
              <div className="top-actions" style={{display:'flex',alignItems:'center',gap:12}}>
                <ThemeToggle />
                <AccountMenu />
              </div>
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