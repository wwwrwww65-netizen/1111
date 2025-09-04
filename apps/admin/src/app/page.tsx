import React from 'react';

export const dynamic = 'force-dynamic';

export default function AdminHome(): JSX.Element {
  const [kpis, setKpis] = React.useState<{users?:number;orders?:number;revenue?:number}>({});
  const [busy, setBusy] = React.useState(false);
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
  React.useEffect(()=>{
    (async ()=>{
      try{ setBusy(true);
        const r = await fetch(`${apiBase}/api/admin/analytics`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
        const j = await r.json(); if (r.ok) setKpis(j.kpis||{});
      } finally { setBusy(false); }
    })();
  },[apiBase]);
  return (
    <div className="grid cols-3">
      <div className="card"><div style={{color:'var(--sub)'}}>المستخدمون</div><div style={{fontSize:28,fontWeight:800}}>{kpis.users ?? (busy?'…':'-')}</div></div>
      <div className="card"><div style={{color:'var(--sub)'}}>الطلبات</div><div style={{fontSize:28,fontWeight:800}}>{kpis.orders ?? (busy?'…':'-')}</div></div>
      <div className="card"><div style={{color:'var(--sub)'}}>الإيرادات</div><div style={{fontSize:28,fontWeight:800}}>{typeof kpis.revenue==='number'? kpis.revenue.toLocaleString() : (busy?'…':'-')}</div></div>
      <div className="panel" style={{gridColumn:'1 / -1'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0}}>النشاط الأخير</h3>
          <a href="/analytics" className="btn">عرض التفاصيل</a>
        </div>
        <div style={{color:'var(--sub)'}}>سجلات موجزة للطلبات، المستخدمين، والمدفوعات (تخصيص لاحقاً).</div>
      </div>
    </div>
  );
}