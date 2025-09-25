"use client";
import React from 'react';
import Link from 'next/link';
import { Sidebar } from "../components/Sidebar";
import { usePathname } from 'next/navigation';

export default function MobileLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const tabs = [
    { href: '/mobile', label: 'الرئيسية' },
    { href: '/mobile/orders', label: 'الطلبات' },
    { href: '/mobile/vendors', label: 'البائعون' },
    { href: '/mobile/settings', label: 'الإعدادات' },
  ];
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return (
    <div className="mobile-shell">
      <header className="mobile-appbar" role="banner" aria-label="الشريط العلوي">
        <button className="icon-btn" aria-label="فتح القائمة" onClick={()=> setDrawerOpen(true)}>☰</button>
        <div className="brand">jeeey</div>
        <div className="actions">
          <Link href="/search" className="icon-btn" aria-label="بحث">بحث</Link>
        </div>
      </header>
      {drawerOpen && (
        <>
          <aside className="sidebar drawer is-open" role="dialog" aria-modal="true" aria-label="قائمة التنقل">
            {/* SidebarMobile: map desktop hrefs to /mobile */}
            <nav>
              <a className="nav-item" href="/mobile">الرئيسية</a>
              <a className="nav-item" href="/mobile/orders">الطلبات</a>
              <a className="nav-item" href="/mobile/products">المنتجات</a>
              <a className="nav-item" href="/mobile/categories">الفئات</a>
              <a className="nav-item" href="/mobile/vendors">الموردون</a>
              <a className="nav-item" href="/mobile/users">المستخدمون</a>
              <a className="nav-item" href="/mobile/inventory">المخزون</a>
              <a className="nav-item" href="/mobile/finance">المالية</a>
              <a className="nav-item" href="/mobile/notifications">الإشعارات</a>
              <a className="nav-item" href="/mobile/logistics/pickup">لوجستيات: الاستلام</a>
              <a className="nav-item" href="/mobile/logistics/warehouse">لوجستيات: المستودع</a>
              <a className="nav-item" href="/mobile/logistics/delivery">لوجستيات: التوصيل</a>
              <a className="nav-item" href="/mobile/drivers">السائقون</a>
              <a className="nav-item" href="/mobile/carriers">الشركات الناقلة</a>
              <a className="nav-item" href="/mobile/shipments">الشحنات</a>
              <a className="nav-item" href="/mobile/coupons">الكوبونات</a>
              <a className="nav-item" href="/mobile/audit-logs">سجل التدقيق</a>
              <a className="nav-item" href="/mobile/settings/rbac">الأدوار والصلاحيات</a>
            </nav>
          </aside>
          <div className="overlay" onClick={()=> setDrawerOpen(false)} aria-hidden={!drawerOpen} />
        </>
      )}
      <main className="mobile-content" role="main">
        {children}
      </main>
      <nav className="mobile-bottom-nav" role="navigation" aria-label="التنقل السفلي">
        {tabs.map(t => {
          const active = pathname === t.href;
          return (
            <Link key={t.href} href={t.href} className={`mobile-tab ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span className="lbl">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

