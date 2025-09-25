"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';

type PickupItem = { id:string; vendorId?:string; status:string; eta?:string };

export default function MobilePickup(): JSX.Element {
  const [items, setItems] = React.useState<PickupItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(()=>{ (async()=>{
    setLoading(true); setErr(null);
    try{
      const url = `${resolveApiBase()}/api/admin/logistics/pickup/list`;
      const j = await (await fetch(url, { headers:{ 'accept':'application/json' }, credentials:'include' })).json();
      setItems(j.pickups || j.items || []);
    }catch{ setErr('تعذر الجلب'); }
    finally{ setLoading(false); }
  })(); }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel" style={{ fontWeight:700 }}>استلام من المورد</div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {err && <div className="panel" style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد مهام</div>}
      {!loading && !err && items.map((it)=> (
        <div key={it.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700 }}>{it.id}</div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>المورد: {it.vendorId || '—'}</div>
          </div>
          <div style={{ textAlign:'end' }}>
            <div className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{it.status}</div>
            {it.eta && <div style={{ fontSize:12, color:'var(--sub)', marginTop:4 }}>ETA: {it.eta}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

