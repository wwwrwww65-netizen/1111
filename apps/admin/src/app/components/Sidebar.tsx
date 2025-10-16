"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string };

const groups: Array<{ title?: string; items: NavItem[] }> = [
  {
    title: 'التصميم والمظهر',
    items: [
      { href: '/design/theme', label: 'المظهر العام' },
      { href: '/design/branding', label: 'الشعارات والأيقونات' },
      { href: '/design/navigation', label: 'التنقل والشرائط' },
      { href: '/design/home', label: 'الصفحة الرئيسية' },
    ],
  },
  {
    items: [
      { href: '/', label: 'الرئيسية' },
    ],
  },
  {
    title: 'الطلبات',
    items: [
      { href: '/orders', label: 'الطلبات' },
    ],
  },
  {
    title: 'المستخدمون',
    items: [
      { href: '/users', label: 'المستخدمون' },
    ],
  },
  {
    title: 'الكتالوج',
    items: [
      { href: '/products', label: 'المنتجات' },
      { href: '/categories', label: 'الفئات' },
      { href: '/attributes', label: 'السمات' },
      { href: '/catalog/pdp-settings', label: 'إعدادات صفحة المنتج' },
      { href: '/catalog/variants-matrix', label: 'مصفوفة المتغيرات' },
      { href: '/catalog/pdp-meta', label: 'بيانات PDP (شارات/مقاس/عارضة)' },
    ],
  },
  {
    title: 'المخزون',
    items: [
      { href: '/inventory', label: 'المخزون' },
      { href: '/warehouses', label: 'المستودعات' },
    ],
  },
  {
    title: 'اللوجستيات',
    items: [
      { href: '/logistics/pickup', label: 'من المورد إلى المستودع' },
      { href: '/logistics/warehouse', label: 'المعالجة في المستودع' },
      { href: '/logistics/delivery', label: 'التوصيل إلى العميل' },
      { href: '/shipments', label: 'الشحنات' },
      { href: '/drivers', label: 'السائقون' },
      { href: '/carriers', label: 'الناقلون' },
    ],
  },
  {
    title: 'المشتريات والموردون',
    items: [
      { href: '/vendors', label: 'الموردون' },
      { href: '/pos', label: 'مشتريات (PO)' },
    ],
  },
  {
    title: 'المالية',
    items: [
      { href: '/finance', label: 'لوحة المالية' },
      { href: '/finance/revenues', label: 'الإيرادات' },
      { href: '/finance/expenses', label: 'المصروفات' },
      { href: '/finance/cashflow', label: 'التدفقات النقدية' },
      { href: '/finance/invoices', label: 'الفواتير' },
      { href: '/finance/suppliers-ledger', label: 'دفتر الموردين' },
      { href: '/finance/pnl', label: 'تحليل الأرباح (P&L)' },
      { href: '/finance/returns-impact', label: 'أثر المرتجعات' },
      { href: '/payments', label: 'المدفوعات' },
      { href: '/currencies', label: 'العملات' },
      { href: '/finance/gateways', label: 'بوابات الدفع' },
      { href: '/wallet/management', label: 'المحافظ' },
    ],
  },
  {
    title: 'التسويق',
    items: [
      { href: '/coupons', label: 'الكوبونات' },
      { href: '/promotions', label: 'العروض' },
      { href: '/trends/management', label: 'الاتجاهات' },
      { href: '/marketing/facebook', label: 'تسويق فيسبوك' },
      { href: '/recommendations/rules', label: 'قواعد التوصيات' },
    ],
  },
  {
    title: 'المحتوى والوسائط (CMS)',
    items: [
      { href: '/cms', label: 'المحتوى (CMS)' },
      { href: '/media', label: 'الوسائط' },
      { href: '/cms/size-guides', label: 'دلائل المقاسات' },
      { href: '/cms/qa', label: 'أسئلة وأجوبة' },
      { href: '/cms/photos', label: 'صور العملاء' },
    ],
  },
  {
    title: 'المراجعات',
    items: [
      { href: '/reviews', label: 'المراجعات' },
      { href: '/reviews/moderation', label: 'إدارة المراجعات' },
    ],
  },
  {
    title: 'الولاء و JEEEY Club',
    items: [
      { href: '/loyalty', label: 'JEEEY Club' },
      { href: '/loyalty/points', label: 'النقاط' },
      { href: '/loyalty/points-log', label: 'سجل النقاط' },
      { href: '/badges', label: 'الشارات' },
      { href: '/subscriptions', label: 'الاشتراكات' },
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
    title: 'التقارير والتحليلات',
    items: [
      { href: '/analytics', label: 'التحليلات' },
      { href: '/system/analytics', label: 'إحصاءات النظام' },
    ],
  },
  {
    title: 'الإشعارات',
    items: [
      { href: '/notifications', label: 'الإشعارات' },
      { href: '/notifications/rules', label: 'قواعد الإشعارات' },
      { href: '/notifications/targeted', label: 'إشعارات موجهة' },
      { href: '/notifications/manual', label: 'إرسال يدوي' },
    ],
  },
  {
    title: 'التكاملات',
    items: [
      { href: '/integrations', label: 'التكاملات' },
      { href: '/integrations/tracking', label: 'تتبع وتحليلات' },
      { href: '/integrations/login', label: 'تكامل تسجيل الدخول' },
      { href: '/integrations/meta', label: 'تكامل ميتا' },
      { href: '/integrations/whatsapp-send', label: 'إرسال واتساب تجريبي' },
      { href: '/integrations/ai', label: 'تكاملات الذكاء الاصطناعي' },
    ],
  },
  {
    title: 'الإعدادات',
    items: [
      { href: '/settings', label: 'الإعدادات' },
      { href: '/settings/seo-product', label: 'SEO المنتجات (افتراضات)' },
    ],
  },
  {
    title: 'الصلاحيات والتدقيق',
    items: [
      { href: '/settings/rbac', label: 'الأدوار والصلاحيات' },
      { href: '/audit-logs', label: 'سجلات التدقيق' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { href: '/backups', label: 'النسخ الاحتياطية' },
      { href: '/2fa', label: 'التحقق بخطوتين (2FA)' },
      { href: '/system/shipping-zones', label: 'مناطق الشحن' },
      { href: '/system/shipping-rates', label: 'أسعار التوصيل' },
      { href: '/system/geo/countries', label: 'الدول' },
      { href: '/system/geo/cities', label: 'المحافظات/المدن' },
      { href: '/system/geo/areas', label: 'المناطق/الأحياء' },
      { href: '/system/payment-methods', label: 'طرق الدفع' },
      { href: '/system/carts', label: 'سلال التسوق' },
      { href: '/system/monitoring', label: 'المراقبة' },
      { href: '/system/consent', label: 'الموافقة (Consent)' },
    ],
  },
];

export function Sidebar(): JSX.Element {
  const pathname = usePathname() || '/';
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };
  const [open, setOpen] = React.useState<Record<number, boolean>>({});
  React.useEffect(() => {
    const initial: Record<number, boolean> = {};
    groups.forEach((g, idx) => {
      if (!g.title) { initial[idx] = true; return; }
      if (g.title === 'التصميم والمظهر') { initial[idx] = true; return; }
      const anyActive = (g.items || []).some(it => isActive(it.href));
      initial[idx] = anyActive;
    });
    setOpen(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const toggle = (idx: number) => setOpen(s => ({ ...s, [idx]: !s[idx] }));
  return (
    <nav>
      {groups.map((g, idx) => {
        const isGroupOpen = open[idx] ?? !g.title; // groups بدون عنوان تبقى مفتوحة
        return (
          <div key={idx} style={{ marginBottom: 12 }}>
            {g.title ? (
              <button onClick={() => toggle(idx)}
                className="group-title"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  cursor: 'pointer'
                }}>
                <span>{g.title}</span>
                <span aria-hidden="true">{isGroupOpen ? '▾' : '▸'}</span>
              </button>
            ) : (
              <div style={{ padding: '6px 8px' }}></div>
            )}
            {isGroupOpen && (
              <div style={{ display: 'grid', gap: 6 }}>
                {g.items.map((it) => (
                  <a key={it.href} className={`nav-item ${isActive(it.href) ? 'active' : ''}`} href={it.href}>{it.label}</a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

