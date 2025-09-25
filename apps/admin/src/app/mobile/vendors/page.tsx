"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type VendorItem = { id:string; name:string; rating?:number; productsCount?:number };

export default function MobileVendors(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<VendorItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ctrlRef = React.useRef<AbortController | null>(null);

  const fetchList = React.useCallback(async (query: string) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true); setError(null);
    try {
      const base = resolveApiBase();
      const url = new URL(base + '/api/admin/vendors');
      if (query) url.searchParams.set('q', query);
      url.searchParams.set('limit', '20');
      const res = await fetch(url.toString(), { signal: ctrl.signal, headers: { 'accept': 'application/json' }, credentials:'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : data);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError('تعذر جلب البيانات');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(()=>{ const t = setTimeout(()=> fetchList(q), 300); return ()=> clearTimeout(t); }, [q, fetchList]);
  React.useEffect(()=>{ try { const s = localStorage.getItem('m_vendors_q'); if (s) setQ(s); } catch {} }, []);
  React.useEffect(()=>{ try { localStorage.setItem('m_vendors_q', q); } catch {} }, [q]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>البائعون</div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا يوجد بائعون</div>}
      {!loading && !error && items.map((v)=> (
        <a key={v.id} className="panel" href={`/mobile/vendors/${v.id}`} style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{v.name}</div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>المنتجات: {v.productsCount ?? '—'}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

