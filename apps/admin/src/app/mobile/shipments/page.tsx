"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type Shipment = { id:string; carrier?:string; status?:string; tracking?:string };

export default function MobileShipments(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async ()=>{
    setLoading(true); setError(null);
    try{
      const u = new URL(`${resolveApiBase()}/api/admin/shipments`);
      if (q.trim()) u.searchParams.set('q', q.trim());
      const r = await fetch(u.toString(), { headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setItems(j.shipments||j.items||[]);
    }catch{ setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  }, [q]);

  React.useEffect(()=>{ const t = setTimeout(load, 300); return ()=> clearTimeout(t); }, [load]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>الشحنات</div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد شحنات</div>}
      {!loading && !error && items.map((s)=> (
        <div key={s.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700 }}>{s.tracking || s.id}</div>
            <div style={{ fontSize:12, color:'var(--sub)' }}>{s.carrier || '—'}</div>
          </div>
          {s.status && <span className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{s.status}</span>}
        </div>
      ))}
    </div>
  );
}

