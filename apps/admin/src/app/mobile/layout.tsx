"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const tabs = [
    { href: '/mobile', label: 'الرئيسية' },
    { href: '/mobile/orders', label: 'الطلبات' },
    { href: '/mobile/vendors', label: 'البائعون' },
    { href: '/mobile/settings', label: 'الإعدادات' },
  ];
  return (
    <div className="mobile-shell">
      <header className="mobile-appbar" role="banner" aria-label="الشريط العلوي">
        <div className="brand">jeeey</div>
        <div className="actions">
          <Link href="/search" className="icon-btn" aria-label="بحث">بحث</Link>
        </div>
      </header>
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

