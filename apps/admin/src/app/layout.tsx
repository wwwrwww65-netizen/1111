import { AppProviders } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>
          <nav style={{display:'flex',gap:'12px',padding:'12px',borderBottom:'1px solid #eee'}}>
            <a href="/">لوحة</a>
            <a href="/products">المنتجات</a>
            <a href="/orders">الطلبات</a>
            <a href="/users">المستخدمون</a>
            <a href="/coupons">الكوبونات</a>
            <a href="/inventory">المخزون</a>
            <a href="/reviews">المراجعات</a>
            <a href="/payments">المدفوعات</a>
            <a href="/analytics">الإحصاءات</a>
            <a href="/notifications">الإشعارات</a>
            <a href="/settings">الإعدادات</a>
          </nav>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}