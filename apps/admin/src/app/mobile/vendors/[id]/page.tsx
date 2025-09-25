"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBase } from '../../../lib/apiBase';

export default function MobileVendorDetail(): JSX.Element {
  const params = useParams();
  const id = String(params?.id || '');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(()=>{
    let alive = true;
    (async()=>{
      try{
        const res = await fetch(`${resolveApiBase()}/api/admin/vendors/${id}`, { headers:{ 'accept':'application/json' } });
        if(!res.ok) throw new Error('HTTP '+res.status);
        const j = await res.json();
        if(alive) setData(j);
      }catch(e){ if(alive) setError('تعذر جلب البيانات'); }
      finally{ if(alive) setLoading(false); }
    })();
    return ()=>{ alive=false; };
  }, [id]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <button className="icon-btn" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/vendors')}>رجوع</button>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && data && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:800 }}>{data.name}</div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>المنتجات: {data.productsCount ?? '—'}</div>
          </div>
          <div style={{ marginTop:12, display:'grid', gap:8 }}>
            <a className="btn" href={`/mobile/vendors/${id}?tab=orders`}>عرض الطلبات</a>
            <a className="btn btn-outline" href={`/mobile/vendors/${id}?tab=products`}>عرض المنتجات</a>
          </div>
        </div>
      )}
    </div>
  );
}

