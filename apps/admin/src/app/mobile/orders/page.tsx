"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type OrderItem = { id: string; code: string; customerName: string; total: number; status: string; createdAt: string };

export default function MobileOrders(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ctrlRef = React.useRef<AbortController | null>(null);
  const [status, setStatus] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const fetchList = React.useCallback(async (query: string) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true); setError(null);
    try {
      const base = resolveApiBase();
      const url = new URL(base + '/api/admin/orders');
      if (query) url.searchParams.set('q', query);
      if (status) url.searchParams.set('status', status);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
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
  }, [q, status, from, to, fetchList]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>الطلبات</div>
        <FilterBar value={q} onChange={setQ}>
          <select className="select" value={status} onChange={e=> setStatus(e.target.value)}>
            <option value="">الكل</option>
            <option value="NEW">جديد</option>
            <option value="PROCESSING">قيد المعالجة</option>
            <option value="SHIPPED">تم الشحن</option>
            <option value="DELIVERED">تم التسليم</option>
            <option value="CANCELLED">ألغيت</option>
          </select>
          <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        </FilterBar>
      </div>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>إجراءات سريعة</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:8 }}>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>تحديث حالة طلب</div>
            <input className="input" placeholder="رقم الطلب" id="bulkOrderId" />
            <select className="select" id="bulkOrderStatus">
              <option value="PROCESSING">قيد المعالجة</option>
              <option value="SHIPPED">تم الشحن</option>
              <option value="DELIVERED">تم التسليم</option>
              <option value="CANCELLED">ألغيت</option>
            </select>
            <button className="btn btn-outline" onClick={async()=>{
              const orderId = (document.getElementById('bulkOrderId') as HTMLInputElement)?.value.trim();
              const st = (document.getElementById('bulkOrderStatus') as HTMLSelectElement)?.value;
              if(!orderId) return;
              await fetch(`${resolveApiBase()}/api/admin/status/change`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ entity:'order', id: orderId, action: st }) });
            }}>تحديث</button>
          </div>
        </div>
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

