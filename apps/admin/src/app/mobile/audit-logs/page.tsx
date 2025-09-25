"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type Audit = { id:string; at:string; actor?:string; entity?:string; action?:string; details?:any };

export default function MobileAuditLogs(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Audit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async ()=>{
    setLoading(true); setError(null);
    try{
      const u = new URL(`${resolveApiBase()}/api/admin/audit-logs`);
      if (q.trim()) u.searchParams.set('q', q.trim());
      const r = await fetch(u.toString(), { headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setItems(j.logs||j.items||[]);
    }catch{ setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  }, [q]);

  React.useEffect(()=>{ const t = setTimeout(load, 300); return ()=> clearTimeout(t); }, [load]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>سجل التدقيق</div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا يوجد سجلات</div>}
      {!loading && !error && items.map((a)=> (
        <div key={a.id} className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{a.entity || '—'} • {a.action || '—'}</div>
            <div style={{ fontSize:12, color:'var(--sub)' }}>{new Date(a.at).toLocaleString('ar')}</div>
          </div>
          {a.actor && <div style={{ color:'var(--sub)', marginTop:4 }}>بواسطة: {a.actor}</div>}
        </div>
      ))}
    </div>
  );
}

