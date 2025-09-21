"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string };

const groups: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      { href: '/', label: 'الرئيسية' },
      { href: '/analytics', label: 'التحليلات' },
      { href: '/users', label: 'المستخدمون' },
      { href: '/vendors', label: 'الموردون' },
    ],
  },
  {
    title: 'الطلبات والمخزون',
    items: [
      { href: '/orders', label: 'الطلبات' },
      { href: '/products', label: 'المنتجات' },
      { href: '/categories', label: 'الفئات' },
          { href: '/attributes', label: 'السمات' },
      { href: '/inventory', label: 'المخزون' },
      { href: '/shipments', label: 'الشحن' },
      { href: '/drivers', label: 'السائقون' },
    ],
  },
  {
    title: 'مراحل التوصيل',
    items: [
      { href: '/logistics/pickup', label: 'من المورد إلى المستودع' },
      { href: '/logistics/warehouse', label: 'المعالجة في المستودع' },
      { href: '/logistics/delivery', label: 'التوصيل إلى العميل' },
    ],
  },
  {
    title: 'المالية',
    items: [
      { href: '/finance/pnl', label: 'تحليل الأرباح' },
      { href: '/finance/revenues', label: 'الإيرادات' },
      { href: '/finance/expenses', label: 'المصروفات' },
      { href: '/finance/cashflow', label: 'التدفقات' },
      { href: '/finance/gateways', label: 'بوابات الدفع' },
      { href: '/finance/invoices', label: 'الفواتير' },
      { href: '/finance/returns-impact', label: 'أثر المرتجعات' },
      { href: '/finance/suppliers-ledger', label: 'دفتر الموردين' },
      { href: '/payments', label: 'المدفوعات' },
      { href: '/pos', label: 'مشتريات (PO)' },
    ],
  },
  {
    title: 'الولاء و JEEEY Club',
    items: [
      { href: '/loyalty/points', label: 'النقاط' },
      { href: '/loyalty/points-log', label: 'سجل النقاط' },
      { href: '/loyalty', label: 'JEEEY Club' },
    ],
  },
  {
    title: 'التسويق والمحتوى',
    items: [
      { href: '/reviews', label: 'المراجعات' },
      { href: '/coupons', label: 'الكوبونات' },
      { href: '/promotions', label: 'العروض' },
      { href: '/cms', label: 'المحتوى (CMS)' },
      { href: '/media', label: 'الوسائط' },
      { href: '/notifications', label: 'الإشعارات' },
      { href: '/notifications/rules', label: 'قواعد الإشعارات' },
      { href: '/notifications/targeted', label: 'الإشعارات الموجهة' },
      { href: '/notifications/manual', label: 'إرسال يدوي' },
    ],
  },
  {
    title: 'الشركاء (Affiliates)',
    items: [
      { href: '/affiliates/dashboard', label: 'لوحة الشركاء' },
      { href: '/affiliates/list', label: 'قائمة الشركاء' },
      { href: '/affiliates/payouts', label: 'الدفعات' },
      { href: '/affiliates/settings', label: 'إعدادات الشركاء' },
    ],
  },
  {
    title: 'خدمة العملاء',
    items: [
      { href: '/tickets', label: 'التذاكر' },
      { href: '/returns', label: 'المرتجعات' },
      { href: '/rma/management', label: 'إدارة RMA' },
    ],
  },
  {
    title: 'أخرى',
    items: [
      { href: '/wallet/management', label: 'المحفظة' },
      { href: '/warehouses', label: 'المستودعات' },
      { href: '/trends/management', label: 'الاتجاهات' },
      { href: '/integrations', label: 'التكاملات' },
      { href: '/settings', label: 'الإعدادات' },
      { href: '/settings/rbac', label: 'الأدوار والصلاحيات' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { href: '/backups', label: 'النسخ الاحتياطية' },
      { href: '/audit-logs', label: 'سجلات التدقيق' },
      { href: '/2fa', label: 'التحقق بخطوتين (2FA)' },
    ],
  },
];

export function Sidebar(): JSX.Element {
  const pathname = usePathname() || '/';
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };
  return (
    <nav>
      {groups.map((g, idx) => (
        <div key={idx} style={{ marginBottom: 12 }}>
          {g.title && <div style={{ color: 'var(--sub)', fontSize: 12, padding: '6px 8px' }}>{g.title}</div>}
          <div style={{ display: 'grid', gap: 6 }}>
            {g.items.map((it) => (
              <a key={it.href} className={`nav-item ${isActive(it.href) ? 'active' : ''}`} href={it.href}>{it.label}</a>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

