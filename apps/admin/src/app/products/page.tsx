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
  const hydratedFromUrl = React.useRef<boolean>(false);
  const ready = React.useRef<boolean>(false);
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

  // Category filter dropdown — unified UI like create page (single-select for listing)
  function CategoryFilterDropdown({ value, onChange }:{ value: string; onChange:(id:string)=>void }): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [tree, setTree] = React.useState<any[]>([]);
    const [filter, setFilter] = React.useState('');
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const panelRef = React.useRef<HTMLDivElement|null>(null);

    React.useEffect(()=>{
      function onEsc(e: KeyboardEvent){
        if (!open) return;
        if (e.key === 'Escape') setOpen(false);
      }
      document.addEventListener('keydown', onEsc as any, true);
      return ()=> document.removeEventListener('keydown', onEsc as any, true);
    }, [open]);

    async function loadTree(){
      if (tree.length || loading) return;
      try{
        setLoading(true);
        const r = await fetch(`/api/admin/categories/tree`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
        const j = await r.json().catch(()=>({}));
        setTree(Array.isArray(j?.tree) ? j.tree : []);
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
      try {
        const p = panelRef.current;
        const top = p?.scrollTop || 0;
        requestAnimationFrame(()=> { try { if (panelRef.current) panelRef.current.scrollTop = top; } catch {} });
      } catch {}
    }

    function Node({ node, depth }:{ node:any; depth:number }): JSX.Element {
      const kids = Array.isArray(node.children)? node.children : [];
      const hasKids = kids.length>0;
      const isOpen = !!filter || !!expanded[node.id];
      return (
        <div onMouseDown={(e)=> e.stopPropagation()}>
          <div
            onClick={(e)=> {
              const tag = (e.target as HTMLElement).tagName.toLowerCase();
              if (tag === 'input' || tag === 'button' || tag === 'svg' || tag === 'path') return;
              if (hasKids) { toggleExpand(node.id); return; }
              onChange(value===node.id? '' : node.id); setOpen(false);
            }}
            style={{ display:'flex', alignItems:'center', gap:12, padding:8, paddingInlineStart: 6 + depth*14, borderBottom:'1px solid #0f1320', cursor: hasKids? 'pointer':'pointer' }}>
            {/* Leading chevron like create-page */}
            {hasKids ? (
              <span role="button" aria-label={isOpen? 'طيّ':'توسيع'} onClick={(e)=>{ e.stopPropagation(); toggleExpand(node.id); }} style={{ width:20, height:20, display:'grid', placeItems:'center' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" style={{ transition:'transform .15s ease', transform: isOpen? 'rotate(180deg)':'rotate(0deg)' }} aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            ) : (<span style={{ width:20 }} />)}
            <input type="radio" name="cat-filter" checked={value===node.id} onChange={()=>{ onChange(value===node.id? '' : node.id); setOpen(false); }} />
            <div style={{ flex:1 }}>{node.name}</div>
            <span style={{ width:18 }} />
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
      <div style={{ position:'relative' }}>
        <button type="button" className="select" onClick={()=>{ if (!open) { setOpen(true); loadTree(); } }} aria-haspopup="listbox" aria-expanded={open} style={{ width:'100%', textAlign:'start' }}>
          {label}
        </button>
        {open && (
          <>
            <div style={{ position:'fixed', inset:0, zIndex:59, background:'transparent' }} onMouseDown={()=> setOpen(false)} />
            <div
              ref={panelRef}
              className="panel"
              role="listbox"
              style={{ position:'absolute', insetInlineStart:0, insetBlockStart:'calc(100% + 6px)', zIndex:60, width:'min(560px, 96vw)', maxHeight:420, overflow:'auto', border:'1px solid #1c2333', borderRadius:10, padding:8, background:'#0b0e14', boxShadow:'0 8px 24px rgba(0,0,0,.35)' }}
              onPointerDown={(e)=> e.stopPropagation()}
              onMouseDown={(e)=> e.stopPropagation()}
              onClick={(e)=> e.stopPropagation()}
            >
              <div style={{ position:'sticky', top:0, background:'#0b0e14', display:'flex', gap:8, marginBottom:8, alignItems:'center', paddingBottom:8 }}>
                <input value={filter} onChange={(e)=> setFilter(e.target.value)} placeholder="بحث عن تصنيف" className="input" />
                <button type="button" className="btn btn-outline" onClick={()=> setFilter('')}>مسح</button>
                <div style={{ marginInlineStart:'auto', display:'flex', gap:8 }}>
                  <button type="button" className="btn btn-outline" onClick={()=> setOpen(false)}>إغلاق</button>
                  <button type="button" className="btn btn-outline" onClick={()=>{ onChange(''); setOpen(false); }}>الكل</button>
                </div>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height:140 }} />
              ) : (
                <div>
                  {shown.length ? shown.map((n:any)=> (<Node key={n.id} node={n} depth={0} />)) : (<div style={{ color:'#94a3b8', padding:8 }}>لا توجد نتائج</div>)}
                </div>
              )}
            </div>
          </>
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
    // request full payload to include category and total counts
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
  React.useEffect(()=>{
    if (!ready.current) return;
    load();
    return ()=> { try { ctlRef.current?.abort(); } catch {} };
  }, [page, status, categoryId]);
  // Hydrate listing state from URL on first mount (so returning from edit preserves page/filters)
  React.useEffect(()=>{
    try{
      const sp = new URLSearchParams(window.location.search||'');
      const p = Number(sp.get('page')||'0'); if (p>0) setPage(p);
      const st = String(sp.get('status')||''); if (st) setStatus(st);
      const qv = String(sp.get('search')||''); if (qv) setSearch(qv);
      const cat = String(sp.get('categoryId')||''); if (cat) setCategoryId(cat);
      hydratedFromUrl.current = true;
      // Mark ready after applying URL state; the [page,status,categoryId] effect will run.
      setTimeout(()=> { ready.current = true; load(); }, 0);
    }catch{}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(()=>{
    const t = setTimeout(()=>{
      if (hydratedFromUrl.current) {
        // Skip page reset once after URL hydration
        hydratedFromUrl.current = false;
        if (ready.current) load();
        return;
      }
      setPage(1); if (ready.current) load();
    }, 300);
    return ()=> clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Keep URL in sync with current table state (deep-linkable and to preserve filters on return)
  React.useEffect(()=>{
    try{
      if (typeof window === 'undefined') return;
      const sp = new URLSearchParams(window.location.search||'');
      if (page>0) sp.set('page', String(page)); else sp.delete('page');
      if (status) sp.set('status', status); else sp.delete('status');
      if (search) sp.set('search', search); else sp.delete('search');
      if (categoryId) sp.set('categoryId', categoryId); else sp.delete('categoryId');
      const qs = sp.toString();
      const href = qs ? `/products?${qs}` : '/products';
      window.history.replaceState(null, '', href);
    }catch{}
  }, [page, status, search, categoryId]);
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

  // Status counts for quick insight
  const [countActive, setCountActive] = React.useState<number|null>(null);
  const [countArchived, setCountArchived] = React.useState<number|null>(null);
  React.useEffect(()=>{
    (async ()=>{
      try{
        const base = new URL(`/api/admin/products`, window.location.origin);
        base.searchParams.set('limit','1');
        // Active
        const u1 = new URL(base.toString()); u1.searchParams.set('status','active');
        const r1 = await fetch(u1.toString(), { credentials:'include', headers:{ ...authHeaders() }, cache:'no-store' });
        const j1 = await r1.json().catch(()=>({}));
        setCountActive(Number(j1?.pagination?.total ?? 0));
        // Archived
        const u2 = new URL(base.toString()); u2.searchParams.set('status','archived');
        const r2 = await fetch(u2.toString(), { credentials:'include', headers:{ ...authHeaders() }, cache:'no-store' });
        const j2 = await r2.json().catch(()=>({}));
        setCountArchived(Number(j2?.pagination?.total ?? 0));
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function storeProductUrl(id: string): string {
    try {
      // Build public mweb URL, replacing admin subdomain with m.
      const origin = typeof window!=='undefined' ? window.location.origin : '';
      let base = '';
      if (origin && /\/\/admin\./i.test(origin)) {
        base = origin.replace('//admin.', '//m.');
      } else if (origin && /\/\/www\./i.test(origin)) {
        // fallback to same root if running on www admin proxy
        base = origin.replace('//www.', '//m.');
      } else if (origin) {
        base = origin;
      } else {
        base = 'https://m.jeeey.com';
      }
      return `${base}/p?id=${encodeURIComponent(id)}`;
    } catch {
      return `https://m.jeeey.com/p?id=${id}`;
    }
  }
  function editUrlWithBack(id?: string): string {
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    params.set('backPage', String(page));
    if (status) params.set('backStatus', status);
    if (search) params.set('backSearch', search);
    if (categoryId) params.set('backCategoryId', categoryId);
    const qs = params.toString();
    return qs ? `/products/new?${qs}` : '/products/new';
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h1 style={{ margin:0 }}>إدارة المنتجات</h1>
        <a href={editUrlWithBack()} className="btn">إضافة منتج</a>
      </div>

      {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
      <div className="toolbar" style={{ marginBottom:12 }}>
        <div className="search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/sku" className="input" /></div>
        <div style={{ minWidth: 260 }}>
          <CategoryFilterDropdown value={categoryId} onChange={(id)=>{ setCategoryId(id); setPage(1); }} />
        </div>
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} className="select">
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="archived">مؤرشف</option>
        </select>
        <div style={{ color:'var(--sub)', fontSize:12, minWidth:120, textAlign:'center' }}>
          {status==='' && total!=null ? <>العدد: {total}</> : null}
          {status==='active' && countActive!=null ? <>المنشورة: {countActive}</> : null}
          {status==='archived' && countArchived!=null ? <>المؤرشفة: {countArchived}</> : null}
        </div>
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
              <th style={{minWidth:160}}>الفئة</th>
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
                  <td>{p.category?.name || '-'}</td>
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
                    <a href={storeProductUrl(p.id)} target="_blank" rel="noopener" className="btn btn-md" style={{ marginInlineEnd:6 }}>عرض</a>
                    <a href={editUrlWithBack(p.id)} className="btn btn-md btn-outline" style={{ marginInlineEnd:6 }}>تعديل</a>
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