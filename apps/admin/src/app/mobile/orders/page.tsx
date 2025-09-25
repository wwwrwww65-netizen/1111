"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type OrderItem = { id: string; code: string; customerName: string; total: number; status: string; createdAt: string };

export default function MobileOrders(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<OrderItem[]>([]);
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
      const url = new URL(base + '/api/admin/orders');
      if (query) url.searchParams.set('q', query);
      url.searchParams.set('limit', '20');
      const res = await fetch(url.toString(), { signal: ctrl.signal, headers: { 'accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : data);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError('تعذر جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(()=>{
    const t = setTimeout(()=> fetchList(q), 300);
    return ()=> clearTimeout(t);
  }, [q, fetchList]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>الطلبات</div>
        <input className="input" placeholder="بحث بالرقم أو الاسم" value={q} onChange={e=> setQ(e.target.value)} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="panel" style={{ color:'var(--sub)' }}>لا توجد طلبات</div>
      )}
      {!loading && !error && items.map((it)=> (
        <a key={it.id} className="panel" href={`/mobile/orders/${it.id}`} style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
            <div>
              <div style={{ fontWeight:700 }}>{it.code}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{it.customerName}</div>
            </div>
            <div style={{ textAlign:'end' }}>
              <div style={{ fontWeight:800 }}>{Math.round(it.total)} ر.س</div>
              <div style={{ fontSize:12, color:'var(--sub)' }}>{new Date(it.createdAt).toLocaleDateString('ar')}</div>
            </div>
          </div>
          <div style={{ marginTop:8 }}>
            <span className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{it.status}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

