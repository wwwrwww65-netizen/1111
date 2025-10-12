"use client";
import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';

type AppShellProps = { children: React.ReactNode };

type NavGroup = {
  label: string;
  href?: string;
  children?: Array<{ href: string; label: string }>
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'روابط سريعة',
    children: [
      { href: '/notifications', label: 'الإشعارات' },
      { href: '/finance/revenues', label: 'المالية' },
      { href: '/loyalty/points', label: 'الولاء' },
    ],
  },
  { label: 'لوحة', href: '/' },
  { label: 'المنتجات', href: '/products' },
  { label: 'التصنيفات', href: '/categories' },
  { label: 'الطلبات', href: '/orders' },
  { label: 'الشحنات', href: '/shipments' },
  { label: 'السائقون', href: '/drivers' },
  { label: 'المزوّدون', href: '/carriers' },
  { label: 'المستخدمون', href: '/users' },
  { label: 'المورّدون', href: '/vendors' },
  { label: 'المخزون', href: '/inventory' },
  { label: 'المدفوعات', href: '/payments' },
  { label: 'المرتجعات', href: '/returns' },
  { label: 'الكوبونات', href: '/coupons' },
  { label: 'الإحصاءات', href: '/analytics' },
  { label: 'الدعم', href: '/tickets' },
  { label: 'CMS', href: '/cms' },
  { label: 'الوسائط', href: '/media' },
  { label: 'السمات', href: '/attributes' },
  { label: 'التكاملات', href: '/integrations' },
  { label: 'سجلّ التدقيق', href: '/audit-logs' },
  { label: 'الإشعارات', href: '/notifications' },
  { label: 'المالية', href: '/finance/revenues' },
  { label: 'الولاء', href: '/loyalty/points' },
  { label: 'الإعدادات', href: '/settings' },
  { label: 'النسخ الاحتياطي', href: '/backups' },
  {
    label: 'المالية (Finance)',
    children: [
      { href: '/finance/revenues', label: 'إدارة المداخيل' },
      { href: '/finance/expenses', label: 'المصروفات' },
      { href: '/finance/cashflow', label: 'التدفق النقدي' },
      { href: '/finance/pnl', label: 'قوائم الدخل / P&L' },
      { href: '/finance/invoices', label: 'الفواتير والمدفوعات' },
      { href: '/finance/returns-impact', label: 'المرجعات - الأثر المالي' },
      { href: '/finance/gateways', label: 'بوابات الدفع وسجلاتها' },
      { href: '/finance/suppliers-ledger', label: 'حسابات الموردين' },
    ],
  },
  {
    label: 'الولاء والاشتراكات',
    children: [
      { href: '/loyalty/points', label: 'إدارة النقاط' },
      { href: '/loyalty/points-log', label: 'سجل معاملات النقاط' },
      { href: '/loyalty/badges', label: 'إدارة الشارات' },
      { href: '/loyalty/badges-log', label: 'سجل الشارات' },
      { href: '/loyalty/subscriptions', label: 'Jeeey Club — الاشتراكات' },
      { href: '/loyalty/dashboard', label: 'لوحة الولاء' },
    ],
  },
  {
    label: 'برنامج العمولة (Affiliates)',
    children: [
      { href: '/affiliates/settings', label: 'إعدادات البرنامج' },
      { href: '/affiliates/list', label: 'إدارة المسوّقين' },
      { href: '/affiliates/dashboard', label: 'لوحة المسوّق' },
      { href: '/affiliates/payouts', label: 'تقارير المدفوعات' },
    ],
  },
  {
    label: 'العروض والحملات',
    children: [
      { href: '/promotions/coupons', label: 'إدارة الكوبونات' },
      { href: '/promotions/campaigns', label: 'حملات الترويج' },
      { href: '/promotions/popups', label: 'Popups & Banners' },
      { href: '/promotions/reports', label: 'تقارير الحملات' },
    ],
  },
  { label: 'المحفظة', children: [{ href: '/wallet/management', label: 'إدارة المحفظة' }] },
  { label: 'الترندات', children: [{ href: '/trends/management', label: 'إدارة الترندات' }] },
  { label: 'المراجعات', children: [{ href: '/reviews/moderation', label: 'إدارة التعليقات' }] },
  { label: 'المرتجعات RMA', children: [{ href: '/rma/management', label: 'إدارة المرتجعات' }] },
  { label: 'المستودعات', href: '/warehouses' },
  { label: 'أوامر الشراء (POs)', href: '/pos' },
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
      <header className="topbar" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', direction:'rtl' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, gridColumn:3, justifySelf:'start' }}>
          <button className="icon-btn" onClick={() => setSidebarOpen(v => !v)} aria-label="toggle sidebar">☰</button>
          <div className="brand">jeeey • Admin</div>
        </div>
        <div className="search" style={{ gridColumn:2 }}>
          <input placeholder="بحث سريع…" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <div className="top-actions" style={{ display:'flex', alignItems:'center', gap:12, gridColumn:1, justifySelf:'end' }}>
          {/* يسار الهيدر في RTL: ضع عناصر التحكم هنا */}
          <a href="/login" className="btn btn-sm btn-outline">الحساب</a>
          <button className="btn btn-sm btn-outline" onClick={()=>{
            try{ const cur=document.documentElement.getAttribute('lang')||'ar'; const next=cur==='ar'?'en':'ar'; document.documentElement.setAttribute('lang', next);}catch{}
          }}>AR</button>
          <ThemeToggle />
        </div>
      </header>
      <div className="shell" style={{ direction:'ltr', gridTemplateColumns: '1fr var(--sidebar-w)', marginTop:'var(--appbar-h)' }}>
        <main className="content" style={{ direction:'rtl' }}>
          <div className="container">
            {children}
          </div>
        </main>
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'} desktop`} style={{ position:'sticky', top:0 }}>
          <nav>
            {NAV_GROUPS.map((g, idx) => {
              const hasChildren = Array.isArray(g.children) && g.children.length > 0;
              if (!hasChildren && g.href) {
                return (
                  <a key={g.label+idx} href={g.href} className={isActive(g.href) ? 'nav-item active' : 'nav-item'}>
                    <span className="label">{g.label}</span>
                  </a>
                );
              }
              return (
                <div key={g.label+idx} className={'nav-item'}>
                  <div className="group-title w-full text-right">{g.label}</div>
                  <div className={'mt-2'}>
                    <div className="grid gap-1">
                      {(g.children||[]).map(ch => (
                        <a key={ch.href} href={ch.href} className={isActive(ch.href) ? 'nav-item active' : 'nav-item'}>
                          <span className="label">{ch.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default AppShell;

