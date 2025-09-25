"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBase } from '../../../lib/apiBase';

export default function MobileOrderDetail(): JSX.Element {
  const params = useParams();
  const id = String(params?.id || '');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(()=>{
    let alive = true;
    (async()=>{
      try{
        const res = await fetch(`${resolveApiBase()}/api/admin/orders/${id}`, { headers:{ 'accept':'application/json' } });
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
      <button className="icon-btn" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/orders')}>رجوع</button>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && data && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:800, marginBottom:4 }}>{data.code}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{data.customerName}</div>
            </div>
            <div style={{ textAlign:'end' }}>
              <div style={{ fontWeight:800 }}>{Math.round(data.total)} ر.س</div>
              <div style={{ fontSize:12, color:'var(--sub)' }}>{new Date(data.createdAt).toLocaleString('ar')}</div>
            </div>
          </div>
          <div style={{ marginTop:12, display:'grid', gap:8 }}>
            <button className="btn">تحديث الحالة</button>
            <button className="btn btn-outline">اتصال بالعميل</button>
          </div>
        </div>
      )}
    </div>
  );
}

