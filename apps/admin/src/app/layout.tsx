import { AppProviders } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const isLogin = path === '/login';
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('auth_token='));
    if (!isLogin && !hasToken) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?next=${next}`);
    }
  }
  return (
    <html lang="ar" dir="rtl">
      <body style={{background:'#0b0e14',color:'#e2e8f0',fontFamily:'system-ui,Segoe UI,Roboto,Arial,sans-serif'}}>
        <AppProviders>
          <div style={{display:'grid',gridTemplateColumns:'220px 1fr',minHeight:'100vh'}}>
            <aside style={{background:'#0f1420',borderInlineEnd:'1px solid #1c2333',padding:'16px',position:'sticky',top:0,height:'100vh'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,fontWeight:800,letterSpacing:1}}>جي jeeey • Admin</div>
              <nav style={{display:'grid',gap:8}}>
                {[
                  {href:'/',label:'لوحة'},
                  {href:'/products',label:'المنتجات'},
                  {href:'/orders',label:'الطلبات'},
                  {href:'/users',label:'المستخدمون'},
                  {href:'/coupons',label:'الكوبونات'},
                  {href:'/inventory',label:'المخزون'},
                  {href:'/returns',label:'المرتجعات'},
                  {href:'/loyalty',label:'الولاء'},
                  {href:'/payments',label:'المدفوعات'},
                  {href:'/analytics',label:'الإحصاءات'},
                  {href:'/tickets',label:'الدعم'},
                  {href:'/cms',label:'CMS'},
                  {href:'/media',label:'الوسائط'},
                  {href:'/vendors',label:'المورّدون'},
                  {href:'/attributes',label:'السمات'},
                  {href:'/integrations',label:'التكاملات'},
                  {href:'/2fa',label:'2FA'},
                  {href:'/audit-logs',label:'سجلّ التدقيق'},
                  {href:'/settings',label:'الإعدادات'},
                  {href:'/backups',label:'النسخ الاحتياطي'},
                ].map((item)=> (
                  <a key={item.href} href={item.href} style={{padding:'10px 12px',borderRadius:8,background:'#101828',border:'1px solid #1f2937',color:'#e2e8f0',textDecoration:'none'}}>{item.label}</a>
                ))}
              </nav>
            </aside>
            <main style={{padding:24}}>
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}