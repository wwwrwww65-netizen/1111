"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type LogItem = { id:string; title?:string; body?:string; channel?:string; at?:string };

export default function MobileNotifications(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<LogItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async ()=>{
    setLoading(true); setError(null);
    try{
      const u = new URL(`${resolveApiBase()}/api/admin/notifications/logs`);
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
        <div style={{ fontWeight:800, marginBottom:8 }}>سجل الإشعارات</div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد إشعارات</div>}
      {!loading && !error && items.map((it)=> (
        <div key={it.id} className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{it.title || it.channel || 'إشعار'}</div>
            {it.at && <div style={{ fontSize:12, color:'var(--sub)' }}>{new Date(it.at).toLocaleString('ar')}</div>}
          </div>
          {it.body && <div style={{ marginTop:6, color:'var(--sub)' }}>{it.body}</div>}
        </div>
      ))}
    </div>
  );
}

