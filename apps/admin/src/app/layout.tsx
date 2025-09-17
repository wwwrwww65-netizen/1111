import { AppProviders } from "./providers";
import '../app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>
          <div className="app-root">
            <header className="topbar">
              <div className="brand">JEEEY Admin</div>
              <div className="top-actions"></div>
            </header>
            <div className="shell">
              <aside className="sidebar open">
                <nav>
                  <a className="nav-item" href="/">الرئيسية</a>
                  <a className="nav-item" href="/orders">الطلبات</a>
                  <a className="nav-item" href="/products">المنتجات</a>
                  <a className="nav-item" href="/categories">الفئات</a>
                  <a className="nav-item" href="/inventory">المخزون</a>
                  <a className="nav-item" href="/shipments">الشحن</a>
                  <a className="nav-item" href="/drivers">السائقون</a>
                  <a className="nav-item" href="/reviews">المراجعات</a>
                  <a className="nav-item" href="/coupons">الكوبونات</a>
                  <a className="nav-item" href="/analytics">التحليلات</a>
                  <a className="nav-item" href="/users">المستخدمون</a>
                  <a className="nav-item" href="/vendors">الموردون</a>
                  <a className="nav-item" href="/settings">الإعدادات</a>
                </nav>
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