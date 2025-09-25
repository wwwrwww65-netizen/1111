"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';
import { CategoriesTree } from './tree';

type CategoryItem = { id:string; name:string; parentId?:string|null };

export default function MobileCategories(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ctrlRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(async (query:string)=>{
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true); setError(null);
    try{
      const base = resolveApiBase();
      const u = new URL(base + '/api/admin/categories');
      if (query) u.searchParams.set('search', query);
      const r = await fetch(u.toString(), { signal: ctrl.signal, headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setItems(Array.isArray(j?.categories) ? j.categories : j);
    }catch(e:any){ if(e?.name!=='AbortError') setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  },[]);

  React.useEffect(()=>{ const t = setTimeout(()=>{ try{ localStorage.setItem('m_categories_q', q); }catch{} load(q); },300); return ()=> clearTimeout(t); }, [q, load]);
  React.useEffect(()=>{ try{ const s = localStorage.getItem('m_categories_q'); if(s) setQ(s); }catch{} }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>الفئات</div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      <CategoriesTree />
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد فئات</div>}
      {!loading && !error && items.map((c)=> (
        <div key={c.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{c.name}</div>
          {c.parentId && <div style={{ color:'var(--sub)', fontSize:12 }}>فرعية</div>}
        </div>
      ))}
    </div>
  );
}

