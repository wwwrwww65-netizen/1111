"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type Invoice = { number:string; orderId:string; customer:string; amount:number; status:string; dueDate?:string };
type Payment = { id:string; orderId?:string; method:string; amount:number; at:string };

export default function MobileFinance(): JSX.Element {
  const [tab, setTab] = React.useState<'invoices'|'payments'>('invoices');
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async ()=>{
    setLoading(true); setError(null);
    try{
      const base = resolveApiBase();
      const u = new URL(base + (tab==='invoices' ? '/api/admin/finance/invoices' : '/api/admin/finance/payments'));
      if (q.trim()) u.searchParams.set('q', q.trim());
      const r = await fetch(u.toString(), { headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setItems(tab==='invoices' ? (j.invoices||[]) : (j.payments||[]));
    }catch{ setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  }, [tab, q]);

  React.useEffect(()=>{ const t = setTimeout(load, 300); return ()=> clearTimeout(t); }, [load]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <button className={`btn btn-sm ${tab==='invoices'?'btn-active':''}`} onClick={()=> setTab('invoices')}>الفواتير</button>
          <button className={`btn btn-sm ${tab==='payments'?'btn-active':''}`} onClick={()=> setTab('payments')}>المدفوعات</button>
        </div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد بيانات</div>}
      {!loading && !error && tab==='invoices' && (items as Invoice[]).map((i)=> (
        <div key={i.number} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700 }}>فاتورة #{i.number}</div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>{i.customer}</div>
          </div>
          <div style={{ textAlign:'end' }}>
            <div style={{ fontWeight:800 }}>{Math.round(i.amount)} ر.س</div>
            <div className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{i.status}</div>
          </div>
        </div>
      ))}
      {!loading && !error && tab==='payments' && (items as Payment[]).map((p)=> (
        <div key={p.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700 }}>{p.method}</div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>{new Date(p.at).toLocaleString('ar')}</div>
          </div>
          <div style={{ fontWeight:800 }}>{Math.round(p.amount)} ر.س</div>
        </div>
      ))}
    </div>
  );
}

