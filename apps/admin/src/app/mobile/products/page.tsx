"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type ProductItem = { id:string; name:string; price?:number; status?:string };

export default function MobileProducts(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ctrlRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(async (query:string)=>{
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true); setError(null);
    try{
      const u = new URL(resolveApiBase() + '/api/admin/products');
      if (query) u.searchParams.set('q', query);
      u.searchParams.set('limit','20');
      const r = await fetch(u.toString(), { signal: ctrl.signal, headers:{ 'accept':'application/json' } });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setItems(Array.isArray(j?.items) ? j.items : j);
    }catch(e:any){ if(e?.name!=='AbortError') setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  },[]);

  React.useEffect(()=>{ const t = setTimeout(()=>{ try{ localStorage.setItem('m_products_q', q); }catch{} load(q); },300); return ()=> clearTimeout(t); }, [q, load]);
  React.useEffect(()=>{ try{ const s = localStorage.getItem('m_products_q'); if(s) setQ(s); }catch{} }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>المنتجات</div>
          <a className="btn" href="/mobile/products/new" style={{ textDecoration:'none', lineHeight:'40px' }}>+ جديد</a>
        </div>
        <div style={{ marginTop:8 }}>
          <FilterBar value={q} onChange={setQ} />
        </div>
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد منتجات</div>}
      {!loading && !error && items.map((p)=> (
        <a key={p.id} className="panel" href={`/mobile/products/${p.id}`} style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {typeof p.price==='number' && <div style={{ fontWeight:800 }}>{Math.round(p.price)} ر.س</div>}
              {p.status && <span className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{p.status}</span>}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

