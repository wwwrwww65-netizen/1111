"use client";
import { trpc } from "../providers";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
export const dynamic = 'force-dynamic';

export default function AdminProducts(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(12);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [total, setTotal] = React.useState<number|null>(0);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [nextCursor, setNextCursor] = React.useState<{id:string; createdAt:string}|null>(null);
  const q = trpc;
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1600); };
  const [bulkStatus, setBulkStatus] = React.useState<'PUBLISHED'|'ARCHIVED'|'DISABLED'>('PUBLISHED');
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const ctlRef = React.useRef<AbortController|null>(null);
  const normalizeImageSrc = React.useCallback((src?: string): string | undefined => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src)) return src;
    const s = src.startsWith('/') ? src : `/${src}`;
    // If it's an uploads path, prefer app-local rewrite to backend
    if (s.startsWith('/uploads/')) return s;
    return s;
  }, []);
  function isAbortError(err: unknown): boolean {
    const e = err as any;
    return e?.name === 'AbortError' || e?.code === 20;
  }

  function CategoryTreeDropdown({ value, onChange }:{ value: string; onChange:(id:string)=>void }): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [tree, setTree] = React.useState<any[]>([]);
    const [filter, setFilter] = React.useState('');
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const containerRef = React.useRef<HTMLDivElement|null>(null);

    React.useEffect(()=>{
      function onDocMouseDown(e: MouseEvent){
        const el = containerRef.current;
        const t = e.target as any;
        if (open && el && t && !el.contains(t)) setOpen(false);
      }
      document.addEventListener('mousedown', onDocMouseDown);
      return ()=> document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);

    async function loadTree(){
      if (tree.length || loading) return;
      try{
        setLoading(true);
        const r = await fetch(`/api/admin/categories/tree`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
        const j = await r.json().catch(()=>({}));
        setTree(Array.isArray(j?.tree)? j.tree : []);
      } finally { setLoading(false); }
    }
    function filtered(nodes: any[], q: string): any[] {
      const t = String(q||'').trim().toLowerCase();
      if (!t) return nodes;
      const matchNode = (n:any): boolean => String(n?.name||'').toLowerCase().includes(t);
      const dfs = (arr:any[]): any[] => {
        const out:any[] = [];
        for (const n of (arr as any[] || [])){
          const kids = Array.isArray((n as any).children)? (n as any).children : [];
          const fk = dfs(kids);
          if (matchNode(n) || fk.length){
            out.push({ ...(n as any), children: fk });
          }
        }
        return out;
      };
      return dfs(nodes);
    }
    function toggleExpand(id: string){
      setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }
    function Node({ node, depth }:{ node:any; depth:number }): JSX.Element {
      const kids = Array.isArray(node.children)? node.children : [];
      const hasKids = kids.length>0;
      const isOpen = !!expanded[node.id];
      return (
        <div onMouseDown={(e)=> e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:8, paddingInlineStart: 6 + depth*14, borderBottom:'1px solid #0f1320' }}>
            <input type="radio" name="cat-filter" checked={value===node.id} onChange={()=>{ onChange(node.id); }} />
            <div style={{ flex:1 }}>{node.name}</div>
            {hasKids ? (
              <button type="button" className="icon-btn" aria-expanded={isOpen} onClick={()=> toggleExpand(node.id)} style={{ transition:'transform .15s ease', transform: isOpen? 'rotate(180deg)':'rotate(0deg)' }}>▾</button>
            ) : <span style={{ width:18 }} />}
          </div>
          {hasKids && isOpen && kids.map((k:any)=> (<Node key={k.id} node={k} depth={depth+1} />))}
        </div>
      );
    }

    const shown = React.useMemo(()=> filtered(tree, filter), [tree, filter]);
    const label = React.useMemo(()=> {
      if (!value) return 'اختر فئة (فلتر)';
      const findName = (nodes:any[]): string|undefined => {
        for (const n of nodes){
          if (n.id===value) return n.name;
          const kids = Array.isArray(n.children)? n.children: [];
          const v = findName(kids); if (v) return v;
        }
        return undefined;
      };
      return findName(tree) || 'فئة محددة';
    }, [value, tree]);

    return (
      <div ref={containerRef} style={{ position:'relative' }}>
        <button type="button" className="select" onClick={()=>{ setOpen(v=>!v); if (!open) loadTree(); }} style={{ width:'100%', textAlign:'start' }}>{label}</button>
        {open && (
          <div className="panel" onMouseDown={(e)=> e.stopPropagation()} style={{ position:'absolute', insetInlineStart:0, insetBlockStart:'calc(100% + 6px)', zIndex:50, width:'min(420px, 96vw)', maxHeight:320, overflow:'auto', border:'1px solid #1c2333', borderRadius:10, padding:8, background:'#0b0e14', boxShadow:'0 8px 24px rgba(0,0,0,.35)' }}>
            <div style={{ position:'sticky', top:0, background:'#0b0e14', display:'flex', gap:8, marginBottom:8, alignItems:'center', paddingBottom:8 }}>
              <input value={filter} onChange={(e)=> setFilter(e.target.value)} placeholder="بحث" className="input" />
              <button type="button" className="btn btn-outline" onClick={()=> setFilter('')}>مسح</button>
              <button type="button" className="btn btn-outline" onClick={()=>{ onChange(''); setOpen(false); }}>الكل</button>
            </div>
            {loading ? (<div className="skeleton" style={{ height:120 }} />) : (
              <div>
                {shown.length ? shown.map((n:any)=> (<Node key={n.id} node={n} depth={0} />)) : (<div style={{ color:'#94a3b8', padding:8 }}>لا توجد نتائج</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // No URL/state syncing or counts in the simple list view
  async function load(){
    if (ctlRef.current) { try { ctlRef.current.abort(); } catch {} }
    const ctl = new AbortController(); ctlRef.current = ctl;
    const url = new URL(`/api/admin/products`, window.location.origin);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    if (search) url.searchParams.set('search', search);
    if (status) url.searchParams.set('status', status);
    if (categoryId) url.searchParams.set('categoryId', categoryId);
    // request lean payload for faster first paint
    url.searchParams.set('suggest','1');
    if (nextCursor && page>1) { url.searchParams.set('afterId', nextCursor.id); url.searchParams.set('afterCreated', nextCursor.createdAt); }
    try {
      const res = await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() }, signal: ctl.signal });
      const j = await res.json();
      if (ctl.signal.aborted) return;
      setRows(j.products||[]);
      setTotal(j.pagination?.total?? null);
      setHasMore(Boolean(j.pagination?.hasMore));
      setNextCursor(j.pagination?.nextCursor||null);
    } catch (err) {
      if (isAbortError(err)) return; // ignore cancels
      // Optional: surface a lightweight error indicator without crashing the page
      // console.error('products load error', err);
    }
  }
  React.useEffect(()=>{ load(); return ()=> { try { ctlRef.current?.abort(); } catch {} } }, [page, status, categoryId]);
  React.useEffect(()=>{
    const t = setTimeout(()=>{ setPage(1); load(); }, 300);
    return ()=> clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const createProduct = q.admin.createProduct.useMutation();
  const createVariants = typeof q.admin.createProductVariants?.useMutation === 'function'
    ? q.admin.createProductVariants.useMutation()
    : undefined as any;

  const totalPages = Math.max(1, Math.ceil(total/limit));

  function activeBadge(isActive: boolean): string {
    return isActive ? 'badge ok' : 'badge err';
  }

  async function applyProductStatus(id: string, status: 'PUBLISHED'|'ARCHIVED'|'DISABLED') {
    try {
      const r = await fetch(`/api/admin/products/${id}/status`, {
        method: 'POST',
        headers: { 'content-type':'application/json', ...authHeaders() },
        credentials:'include',
        body: JSON.stringify({ status })
      });
      if (!r.ok) throw new Error('status failed');
      await load();
      showToast('تم تحديث الحالة');
    } catch {
      showToast('فشل تحديث الحالة');
    }
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h1 style={{ margin:0 }}>إدارة المنتجات</h1>
        <a href="/products/new" className="btn">إضافة منتج</a>
      </div>

      {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
      <div className="toolbar" style={{ marginBottom:12 }}>
        <div className="search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/sku" className="input" /></div>
        <div style={{ minWidth: 260 }}>
          <CategoryTreeDropdown value={categoryId} onChange={(id)=>{ setCategoryId(id); setPage(1); }} />
        </div>
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} className="select">
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="archived">مؤرشف</option>
        </select>
        <div className="actions">
          <button onClick={()=>{ setPage(1); load(); }} className="btn btn-outline">بحث</button>
          <div style={{ display:'inline-flex', gap:8, alignItems:'center', marginInlineStart:8 }}>
            <select className="select" value={bulkStatus} onChange={(e)=> setBulkStatus(e.target.value as any)}>
              <option value="PUBLISHED">نشر</option>
              <option value="ARCHIVED">أرشفة</option>
              <option value="DISABLED">إيقاف</option>
            </select>
            <button className="btn" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]);
              if (!ids.length) return;
              for (const id of ids) { await applyProductStatus(id, bulkStatus); }
              setSelected({}); setAllChecked(false); await load(); showToast('تم تحديث حالة العناصر المحددة');
            }}>تغيير حالة المحدد</button>
          </div>
          <button className="btn" onClick={async ()=>{
            const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
            for (const id of ids) { await applyProductStatus(id, 'PUBLISHED'); }
            setSelected({}); setAllChecked(false); await load(); showToast('تم نشر العناصر المحددة');
          }}>نشر المحدد</button>
          <button className="btn btn-outline" onClick={async ()=>{
            const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
            for (const id of ids) { await applyProductStatus(id, 'ARCHIVED'); }
            setSelected({}); setAllChecked(false); await load(); showToast('تمت أرشفة العناصر المحددة');
          }}>أرشفة المحدد</button>
          <button className="btn danger" onClick={async ()=>{
          const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
          const r = await fetch(`/api/admin/products/bulk-delete`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids }) });
          if (r.ok) { setSelected({}); setAllChecked(false); await load(); showToast('تم حذف العناصر المحددة'); }
          else {
            try { const j = await r.json(); alert(j?.error||'فشل حذف العناصر'); } catch { alert('فشل حذف العناصر'); }
          }
        }}>حذف المحدد</button>
        </div>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(p=> [p.id, v]))); }} /></th>
              {/* <th style={{minWidth:160}}>ID</th> */}
              <th style={{minWidth:120}}>صورة</th>
              <th style={{minWidth:220}}>الاسم</th>
              <th style={{minWidth:160}}>SKU/التباينات</th>
              <th style={{minWidth:120}}>سعر البيع</th>
              <th style={{minWidth:120}}>المخزون</th>
              <th style={{minWidth:140}}>الحالة</th>
              <th style={{minWidth:180}}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p: any) => {
              const totalStock = (p.variants||[]).reduce((acc:number,v:any)=> acc + (v.stockQuantity||0), 0) + (p.stockQuantity||0);
              return (
                <tr key={p.id} style={{ height:72 }}>
                  <td><input type="checkbox" checked={!!selected[p.id]} onChange={()=> setSelected(s=> ({...s, [p.id]: !s[p.id]}))} /></td>
                  {/* <td>{p.id.slice(0,6)}</td> */}
                  <td>{p.images?.[0] ? <img src={normalizeImageSrc(p.images[0])} alt={p.name} width={64} height={64} style={{ width:64, height:64, objectFit:'cover', borderRadius:6 }} onError={(e)=>{ const t=e.currentTarget; t.onerror=null; t.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; }} /> : '-'}</td>
                  <td><div className="line-2" style={{maxWidth:420}}>{p.name}</div></td>
                  <td>{p.sku || (p.variants?.length ? `${p.variants.length} variants` : '-')}</td>
                  <td>{p.price}</td>
                  <td>{totalStock}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span className={activeBadge(!!p.isActive)}>{p.isActive ? 'active' : 'archived'}</span>
                      <select className="select" defaultValue={p.isActive ? 'PUBLISHED' : 'ARCHIVED'} onChange={(e)=> applyProductStatus(p.id, e.target.value as any)}>
                        <option value="PUBLISHED">نشر</option>
                        <option value="ARCHIVED">مؤرشف</option>
                        <option value="DISABLED">متوقف</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <a href={`/products/${p.id}`} className="btn btn-md" style={{ marginInlineEnd:6 }}>عرض</a>
                    <a href={`/products/new?id=${p.id}`} className="btn btn-md btn-outline" style={{ marginInlineEnd:6 }}>تعديل</a>
                    <button onClick={async ()=>{ const r=await fetch(`/api/admin/products/${p.id}`, { method:'DELETE', credentials:'include' }); if (r.ok){ showToast('تم الحذف'); } await load(); }} className="btn btn-md">حذف</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop:12, display:'flex', alignItems:'center', gap:8 }}>
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="icon-btn">السابق</button>
        {total!=null ? (
          <span style={{ color:'var(--sub)' }}>{page} / {Math.max(1, Math.ceil((total||0)/limit))}</span>
        ) : (
          <span style={{ color:'var(--sub)' }}>{hasMore? '...' : 'نهاية'}</span>
        )}
        <button disabled={total!=null ? (page>=Math.max(1, Math.ceil((total||0)/limit))) : !hasMore} onClick={()=> setPage(p=> p+1)} className="icon-btn">التالي</button>
      </div>
    </main>
  );
}