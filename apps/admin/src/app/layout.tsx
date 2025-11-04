import { AppProviders } from "./providers";
export const dynamic = 'force-dynamic';
import { AppShell } from "./components/AppShell";
import '../app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{__html:`(function(){try{var ua=(navigator.userAgent||'').toLowerCase();var isM=/(android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini)/.test(ua);var forced=(localStorage.getItem('admin_force_desktop')==='1');if(!forced && isM && !location.pathname.startsWith('/mobile')){var map=[['^/$','/mobile'],['^/orders','/mobile/orders'],['^/products','/mobile/products'],['^/vendors','/mobile/vendors'],['^/users','/mobile/users'],['^/categories','/mobile/categories'],['^/inventory','/mobile/inventory'],['^/warehouses','/mobile/logistics/warehouse'],['^/logistics/pickup','/mobile/logistics/pickup'],['^/logistics/warehouse','/mobile/logistics/warehouse'],['^/logistics/delivery','/mobile/logistics/delivery'],['^/drivers','/mobile/drivers'],['^/carriers','/mobile/carriers'],['^/shipments','/mobile/shipments'],['^/finance','/mobile/finance'],['^/notifications','/mobile/notifications'],['^/coupons','/mobile/coupons'],['^/audit-logs','/mobile/audit-logs'],['^/settings/rbac','/mobile/settings/rbac']];for(var i=0;i<map.length;i++){var re=new RegExp(map[i][0]);if(re.test(location.pathname)){var target=location.pathname.replace(re,map[i][1]);if(target!==location.pathname){location.replace(target);return;}}}}}catch(e){}})();`}} />
        <script dangerouslySetInnerHTML={{ __html: `window.__admin_loaded_at = Date.now();` }} />
        <script dangerouslySetInnerHTML={{ __html: `if(process.env.NODE_ENV==='production' && 'serviceWorker' in navigator){try{navigator.serviceWorker.register('/sw.js');}catch(e){}}` }} />
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}