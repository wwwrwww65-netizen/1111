"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

type AppShellProps = { children: React.ReactNode };

const NAV_ITEMS: Array<{ href: string; label: string; icon?: string }> = [
  { href: '/', label: 'لوحة' },
  { href: '/products', label: 'المنتجات' },
  { href: '/categories', label: 'التصنيفات' },
  { href: '/orders', label: 'الطلبات' },
  { href: '/shipments', label: 'الشحنات' },
  { href: '/drivers', label: 'السائقون' },
  { href: '/carriers', label: 'المزوّدون' },
  { href: '/users', label: 'المستخدمون' },
  { href: '/vendors', label: 'المورّدون' },
  { href: '/inventory', label: 'المخزون' },
  { href: '/payments', label: 'المدفوعات' },
  { href: '/returns', label: 'المرتجعات' },
  { href: '/coupons', label: 'الكوبونات' },
  { href: '/analytics', label: 'الإحصاءات' },
  { href: '/tickets', label: 'الدعم' },
  { href: '/cms', label: 'CMS' },
  { href: '/media', label: 'الوسائط' },
  { href: '/attributes', label: 'السمات' },
  { href: '/integrations', label: 'التكاملات' },
  { href: '/audit-logs', label: 'سجلّ التدقيق' },
  { href: '/settings', label: 'الإعدادات' },
  { href: '/backups', label: 'النسخ الاحتياطي' },
];

export function AppShell({ children }: AppShellProps): JSX.Element {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_sidebar_open');
      if (raw != null) setSidebarOpen(raw === '1');
    } catch {}
  }, []);
  React.useEffect(() => {
    try { localStorage.setItem('admin_sidebar_open', sidebarOpen ? '1' : '0'); } catch {}
  }, [sidebarOpen]);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <div className="app-root">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setSidebarOpen(v => !v)} aria-label="toggle sidebar">☰</button>
        <div className="brand">jeeey • Admin</div>
        <div className="top-actions">
          <div className="search">
            <input placeholder="بحث سريع…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          </div>
          <div className="user">
            <a href="/login" className="user-pill">الحساب</a>
          </div>
        </div>
      </header>
      <div className="shell">
        <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
          <nav>
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href} className={isActive(item.href) ? 'nav-item active' : 'nav-item'}>
                <span className="label">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>
        <main className="content">
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;

