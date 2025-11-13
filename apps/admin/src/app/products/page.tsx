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

  // Initialize from URL on first mount
  React.useEffect(()=>{
    try{
      const params = new URLSearchParams(location.search);
      const pPage = parseInt(params.get('page')||'') || 1;
      const pSearch = params.get('search') || '';
      const pStatus = params.get('status') || '';
      const pCat = params.get('categoryId') || '';
      setPage(pPage);
      setSearch(pSearch);
      setStatus(pStatus);
      setCategoryId(pCat);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Sync state to URL
  React.useEffect(()=>{
    try{
      const params = new URLSearchParams();
      if (page>1) params.set('page', String(page));
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (categoryId) params.set('categoryId', categoryId);
      const qs = params.toString();
      const next = qs? `?${qs}` : location.pathname;
      window.history.replaceState(null, '', next);
    } catch {}
  }, [page, search, status, categoryId]);

  // Status counts per current filters
  const [countAll, setCountAll] = React.useState<number|undefined>(undefined);
  const [countPublished, setCountPublished] = React.useState<number|undefined>(undefined);
  const [countArchived, setCountArchived] = React.useState<number|undefined>(undefined);
  async function loadCounts(){
    try{
      const mk = async (st?: 'active'|'archived') => {
        const url = new URL(`/api/admin/products`, window.location.origin);
        url.searchParams.set('page','1');
        url.searchParams.set('limit','1');
        if (search) url.searchParams.set('search', search);
        if (categoryId) url.searchParams.set('categoryId', categoryId);
        if (st) url.searchParams.set('status', st);
        const r = await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
        const j = await r.json().catch(()=>({}));
        const t = Number(j?.pagination?.total||0);
        return Number.isFinite(t) ? t : 0;
      };
      const [all, pub, arc] = await Promise.all([mk(undefined), mk('active'), mk('archived')]);
      setCountAll(all); setCountPublished(pub); setCountArchived(arc);
    } catch {
      setCountAll(undefined); setCountPublished(undefined); setCountArchived(undefined);
    }
  }
  async function load(){
    if (ctlRef.current) { try { ctlRef.current.abort(); } catch {} }
    const ctl = new AbortController(); ctlRef.current = ctl;
    const url = new URL(`/api/admin/products`, window.location.origin);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    if (search) url.searchParams.set('search', search);
    if (status) url.searchParams.set('status', status);
    if (categoryId) url.searchParams.set('categoryId', categoryId);
    // include category info; avoid suggest mode here
    try {
      const res = await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() }, signal: ctl.signal });
      const j = await res.json();
      if (ctl.signal.aborted) return;
      setRows(j.products||[]);
      setTotal(j.pagination?.total?? null);
      setHasMore(false);
      setNextCursor(null);
    } catch (err) {
      if (isAbortError(err)) return; // ignore cancels
      // Optional: surface a lightweight error indicator without crashing the page
      // console.error('products load error', err);
    }
  }
  React.useEffect(()=>{ load(); loadCounts(); return ()=> { try { ctlRef.current?.abort(); } catch {} } }, [page, status, categoryId]);
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
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} className="select">
          <option value="">الكل{countAll!=null? ` (${countAll})`: ''}</option>
          <option value="active">منشور{countPublished!=null? ` (${countPublished})`: ''}</option>
          <option value="archived">مؤرشف{countArchived!=null? ` (${countArchived})`: ''}</option>
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
              <th style={{minWidth:160}}>الفئة</th>
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
                  <td>{p?.category?.name || '—'}</td>
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
                    <a href={`${(process.env.NEXT_PUBLIC_MWEB_ORIGIN || 'https://m.jeeey.com')}/p?id=${encodeURIComponent(p.id)}`} target="_blank" rel="noopener noreferrer" className="btn btn-md" style={{ marginInlineEnd:6 }}>عرض</a>
                    <a href={`/products/new?id=${p.id}&backPage=${encodeURIComponent(String(page))}&backStatus=${encodeURIComponent(status)}&backSearch=${encodeURIComponent(search)}&backCategoryId=${encodeURIComponent(categoryId)}`} className="btn btn-md btn-outline" style={{ marginInlineEnd:6 }}>تعديل</a>
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