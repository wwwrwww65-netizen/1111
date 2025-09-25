"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';

type WarehouseItem = { id:string; status:string; packageId?:string };

export default function MobileWarehouse(): JSX.Element {
  const [items, setItems] = React.useState<WarehouseItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(()=>{ (async()=>{
    setLoading(true); setErr(null);
    try{
      const url = `${resolveApiBase()}/api/admin/logistics/warehouse/list`;
      const j = await (await fetch(url, { headers:{ 'accept':'application/json' }, credentials:'include' })).json();
      setItems(j.items || []);
    }catch{ setErr('تعذر الجلب'); }
    finally{ setLoading(false); }
  })(); }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel" style={{ fontWeight:700 }}>المستودع</div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {err && <div className="panel" style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد عناصر</div>}
      {!loading && !err && items.map((it)=> (
        <div key={it.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{it.id}</div>
          <div className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{it.status}</div>
        </div>
      ))}
    </div>
  );
}

